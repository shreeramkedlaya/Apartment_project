from decimal import Decimal
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction
from django.db.models import Sum
from .base_views import BillingBaseAPIView
from ..Billing_models import Invoice, Transaction
from ..serializers.billing_serializers import TransactionSerializer
from ..services.billing_service import process_payment

class TransactionCreateAPIView(BillingBaseAPIView):
    def post(self, request):
        invoice_id = request.data.get('invoice_id')
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method')
        reference_id = request.data.get('reference_id', '')

        if not all([invoice_id, amount, payment_method]):
            return Response(
                {'error': 'invoice_id, amount, and payment_method are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= Decimal('0.00'):
                return Response(
                    {'error': 'Payment amount must be greater than zero.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception:
            return Response(
                {'error': 'Invalid payment amount.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with db_transaction.atomic():
            # Get invoice using our DRY helper with lock inside the transaction block
            invoice = self.get_invoice(invoice_id, for_update=True)

            # Basic validation
            if invoice.status == Invoice.Status.PAID:
                return Response({'error': 'Invoice is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

            # Sum existing successful transactions
            existing_paid = Transaction.objects.filter(
                invoice=invoice,
                status=Transaction.Status.SUCCESS
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            remaining_balance = invoice.total_amount - existing_paid
            if remaining_balance <= Decimal('0.00'):
                invoice.status = Invoice.Status.PAID
                invoice.save(update_fields=['status'])
                return Response({'error': 'Invoice is already fully paid.'}, status=status.HTTP_400_BAD_REQUEST)

            if amount_decimal > remaining_balance:
                return Response(
                    {'error': f'Payment amount ({amount_decimal}) exceeds remaining balance ({remaining_balance}).'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Call the service layer to process the payment and update invoice status
            txn = process_payment(
                invoice=invoice,
                amount=amount_decimal,
                payment_method=payment_method,
                reference_id=reference_id,
                paid_by_user=request.user
            )

        serializer = TransactionSerializer(txn)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
