from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        app_label = 'apt_proj'

class Media(TimeStampedModel):
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_media"'

    class UploadStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        UPLOADED = 'UPLOADED', 'Uploaded'
        FAILED = 'FAILED', 'Failed'

    object_path = models.CharField(max_length=512, unique=True, help_text="Full path in Supabase bucket")
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=128)
    file_size = models.BigIntegerField(help_text="File size in bytes")

    upload_status = models.CharField(
        max_length=16,
        choices=UploadStatus.choices,
        default=UploadStatus.PENDING
    )
    
    bucket = models.CharField(max_length=64, help_text="APP-DEV or APP-PROD")
    is_public = models.BooleanField(default=False)
    
    proof_token = models.CharField(max_length=255, null=True, blank=True, help_text="Cryptographic proof of authorized upload")
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_media'
    )

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    obj_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'obj_id')

    def __str__(self):
        return f"{self.original_filename} ({self.object_path})"
