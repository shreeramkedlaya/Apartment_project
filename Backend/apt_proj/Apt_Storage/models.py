from django.db import models
from django.conf import settings

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

    object_path = models.CharField(max_length=512, unique=True, help_text="Full path in Supabase bucket")
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=128)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    
    bucket = models.CharField(max_length=64, help_text="APP-DEV or APP-PROD")
    is_public = models.BooleanField(default=False)
    
    proof_token = models.CharField(max_length=255, null=True, blank=True, help_text="Cryptographic proof of authorized upload")
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_media'
    )

    def __str__(self):
        return f"{self.original_filename} ({self.object_path})"
