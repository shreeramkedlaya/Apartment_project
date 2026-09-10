from django.db import models
from django.conf import settings


class DeviceToken(models.Model):
    """Device registry: maps users to push tokens and opt-in state."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_tokens",
        null=True,
        blank=True,
    )
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(
        max_length=10,
        choices=[("android", "Android"), ("ios", "iOS"), ("web", "Web")],
        default="android",
    )
    notifications_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = '"apt_data"."apt_proj_devicetoken"'
