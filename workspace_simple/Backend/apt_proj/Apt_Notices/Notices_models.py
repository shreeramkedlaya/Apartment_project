from django.db import models
from django.contrib.auth.models import User

class Notice(models.Model):
    class Category(models.TextChoices):
        WATER = 'Water'
        ELECTRICITY = 'Electricity'
        MAINTENANCE = 'Maintenance'
        SECURITY = 'Security'
        FACILITY = 'Facility'
        FINANCE = 'Finance'
        COMMUNITY = 'Community'
        EMERGENCY = 'Emergency'
        GENERAL = 'General'
        EVENT = 'Event'
        HOLIDAY = 'Holiday'

    class Priority(models.TextChoices):
        LOW = 'Low'
        MEDIUM = 'Medium'
        CRITICAL = 'Critical'

    class Status(models.TextChoices):
        DRAFT = 'Draft'
        SCHEDULED = 'Scheduled'
        PUBLISHED = 'Published'
        EXPIRED = 'Expired'
        CANCELLED = 'Cancelled'

    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=50, choices=Category.choices)
    priority = models.CharField(max_length=50, choices=Priority.choices)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    target_audience = models.JSONField(default=list)
    publish_date = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    requires_acknowledgement = models.BooleanField(default=False)
    acknowledge_by = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_notices')

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_notice"'

    def __str__(self):
        return self.title

class NoticeAttachment(models.Model):
    notice = models.ForeignKey(Notice, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='notices/')
    file_type = models.CharField(max_length=50)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_noticeattachment"'

    def __str__(self):
        return f"{self.notice.title} Attachment"

class NoticeApproval(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending'
        APPROVED = 'Approved'
        REJECTED = 'Rejected'

    notice = models.ForeignKey(Notice, on_delete=models.CASCADE, related_name='approvals')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notice_approval_requests')
    requested_at = models.DateTimeField(auto_now_add=True)
    decision_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notice_approval_decisions')
    decision_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_noticeapproval"'

    def __str__(self):
        return f"Approval for {self.notice.title} - {self.status}"

class NoticeAcknowledgement(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending'
        ACKNOWLEDGED = 'Acknowledged'

    notice = models.ForeignKey(Notice, on_delete=models.CASCADE, related_name='acknowledgements')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notice_acknowledgements')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reminder_count = models.IntegerField(default=0)
    last_reminder_time = models.DateTimeField(null=True, blank=True)
    acknowledgement_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_noticeacknowledgement"'
        unique_together = ('notice', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.notice.title} ({self.status})"
