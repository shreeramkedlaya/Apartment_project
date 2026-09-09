from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class TimeStampedModel(models.Model):
    """Abstract base that adds created_at / updated_at to any model."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        app_label = 'apt_proj'

class IssueCategory(TimeStampedModel):
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_issuecategory"'
        ordering = ['name']
        
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Issue(TimeStampedModel):
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_issue"'
        
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Category is now dynamic
    category = models.ForeignKey(IssueCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='issues')
    
    # Priority & Status
    priority = models.CharField(
        max_length=20,
        choices=[
            ('Low', 'Low'),
            ('Medium', 'Medium'),
            ('High', 'High'),
        ],
        default='Medium'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('Open', 'Open'),
            ('Assigned', 'Assigned'),
            ('In Progress', 'In Progress'),
            ('Resolved', 'Resolved'),
            ('Closed', 'Closed'),
        ],
        default='Open'
    )
    
    # Non-essential/polymorphic metadata stored in JSON
    # e.g., is_flat_specific, flat_number, common_area, mobile_number, resolution_notes
    issue_metadata = models.JSONField(default=dict, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_issues')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_issues')

    def __str__(self):
        return f"Issue #{self.id}: {self.title}"

class IssueTimeline(TimeStampedModel):
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_issuetimeline"'
        ordering = ['created_at']
        
    issue = models.OneToOneField(Issue, on_delete=models.CASCADE, related_name='timeline_record')
    history = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"Timeline for Issue #{self.issue.id}"

class IssueAttachment(TimeStampedModel):
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_issueattachment"'
        ordering = ['created_at']
        
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='issues/attachments/')
    
    def __str__(self):
        return f"Attachment for Issue #{self.issue.id}"

