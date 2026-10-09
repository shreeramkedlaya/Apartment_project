from datetime import timedelta
from django.utils import timezone
from ..Billing_models import Invoice, Transaction

def generate_invoice(flat_id, category, title, line_items, billed_to_id=None, description=""):
    total = sum(float(item.get('amount',0)) for item in line_items)

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
    from django.db import transaction as db_transaction
    
    with db_transaction.atomic():
        txn = Transaction.objects.create(
            invoice=invoice,
            amount=amount,
            payment_method=payment_method,
            reference_id=reference_id,
            status=Transaction.Status.SUCCESS,
            paid_by=paid_by_user
        )
        
        # Determine if invoice is fully paid
        # Currently assuming the amount matches the total_amount for simplicity.
        # In a real scenario we would aggregate all SUCCESS transactions against the invoice.
        invoice.status = Invoice.Status.PAID
        invoice.save(update_fields=['status'])
        
        return txn