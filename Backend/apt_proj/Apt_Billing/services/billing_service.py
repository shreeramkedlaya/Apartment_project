from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db.models import Sum
from ..Billing_models import Invoice, Transaction

def generate_invoice(flat_id, category, title, line_items, billed_to_id=None, description=""):
    total = sum(Decimal(str(item.get('amount', 0))) for item in line_items)

    due_date = timezone.now() + timedelta(days=15) if category == Invoice.Category.MAINTENANCE else timezone.now() + timedelta(days=7)

    return Invoice.objects.create(
        flat_id=flat_id,
        billed_to_id=billed_to_id,
        category=category,
        title=title,
        description=description,
        line_items=line_items,
        total_amount=total,
        due_date=due_date
    )

def process_payment(invoice, amount, payment_method, reference_id, paid_by_user=None):
    amount_dec = Decimal(str(amount))
    
    with db_transaction.atomic():
        txn = Transaction.objects.create(
            invoice=invoice,
            amount=amount_dec,
            payment_method=payment_method,
            reference_id=reference_id,
            status=Transaction.Status.SUCCESS,
            paid_by=paid_by_user
        )
        
        # Determine if invoice is fully paid across all SUCCESS transactions
        total_paid = Transaction.objects.filter(
            invoice=invoice,
            status=Transaction.Status.SUCCESS
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if total_paid >= invoice.total_amount:
            invoice.status = Invoice.Status.PAID
            invoice.save(update_fields=['status'])
        
        return txn