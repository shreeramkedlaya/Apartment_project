from django.db import models
from django.contrib.auth import get_user_model
from apt_proj.Apt_Common.models import TimeStampedModel
from apt_proj.Apt_Accounts.Accounts_models import Flat

User = get_user_model()

class Invoice(TimeStampedModel):
    class Category(models.TextChoices):
        MAINTENANCE = 'Maintenance', 'Maintenance'
        EVENT = 'Event', 'Event'
        PENALTY = 'Penalty', 'Penalty'
        AMENITY = 'Amenity', 'Amenity'
    
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        PAID = 'Paid', 'Paid'
        OVERDUE = 'Overdue', 'Overdue'
        CANCELLED = 'Cancelled', 'Cancelled'

    
    flat = models.ForeignKey(Flat, on_delete=models.CASCADE, related_name='invoices')
    billed_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='invoices')
    category = models.CharField(max_length=50, choices=Category.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    line_items = models.JSONField(default=list)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    due_date = models.DateTimeField()
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."invoices"'
        indexes = [
            models.Index(fields=['status', '-created_at'], name='invoices_status_created_idx'),
        ]

    def __str__(self):
        return f"{self.title} - {self.flat.number}"

class Transaction(TimeStampedModel):
    class PaymentMethod(models.TextChoices):
        UPI = 'UPI', 'UPI'
        BANK_TRANSFER = 'Bank Transfer', 'Bank Transfer'
        CASH = 'Cash', 'Cash'
        CARD = 'Card', 'Card'

    class Status(models.TextChoices):
        SUCCESS = 'Success', 'Success'
        FAILED = 'Failed', 'Failed'
        PENDING = 'Pending', 'Pending'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PaymentMethod.choices)
    reference_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    paid_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transactions')

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."transactions"'

    def __str__(self):
        return f"{self.amount} for {self.invoice.title}"