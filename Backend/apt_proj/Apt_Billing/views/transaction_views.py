from rest_framework.response import Response
from rest_framework import status
from .base_views import BillingBaseAPIView
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

        # Get invoice using our DRY helper (this handles 404 cleanly)
        invoice = self.get_invoice(invoice_id, for_update=True)

        # Basic validation
        if invoice.status == 'Paid':
            return Response({'error': 'Invoice is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        # Call the service layer to process the payment and update invoice status
        txn = process_payment(
            invoice=invoice,
            amount=amount,
            payment_method=payment_method,
            reference_id=reference_id,
            paid_by_user=request.user
        )

        serializer = TransactionSerializer(txn)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
