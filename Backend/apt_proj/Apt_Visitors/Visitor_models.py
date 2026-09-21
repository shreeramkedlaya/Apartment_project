from django.db import models
from django.conf import settings
from apt_proj.Apt_Accounts.Accounts_models import Flat
from apt_proj.Apt_Common.models import TimeStampedModel

class VisitorLog(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        DENIED = 'DENIED', 'Denied'
        CHECKED_OUT = 'CHECKED_OUT', 'Checked Out'
        
    flat = models.ForeignKey(Flat, on_delete=models.CASCADE, related_name='visitor_logs')
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, models.SET_NULL, null=True, related_name = 'logged_visitors')

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_APPROVAL)


    # json structure
    # details: stored dynamic visitor like {'name': 'abc', 'purpose': 'abc', 'phone': '999'}

    details = models.JSONField(default=dict, blank=True)

    # timeline: tracks events [{"event": "Requested", "timestamp": "..."}, ...]
    timeline = models.JSONField(default=list, blank=True)

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_visitor_log"'
        ordering = ['-created_at']

    def __str__(self):
        visitor_name = self.details.get('name', 'Unknown Visitor')
        return f"{visitor_name} to {self.flat.flat_number} ({self.status})"