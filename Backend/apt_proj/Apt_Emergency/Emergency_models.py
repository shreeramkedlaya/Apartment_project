from django.db import models
from django.conf import settings
from apt_proj.Apt_Common.models import TimeStampedModel

class EmergencyContact(TimeStampedModel):
    class Category(models.TextChoices):
        GATE_SECURITY = 'GATE_SECURITY', 'Gate Security'
        FACILITY_MGMT = 'FACILITY_MGMT', 'Facility Management'
        AMBULANCE_MEDICAL = 'AMBULANCE_MEDICAL', 'Ambulance & Medical'
        POLICE = 'POLICE', 'Police Station'
        FIRE_STATION = 'FIRE_STATION', 'Fire Station'
        DISASTER_MGMT = 'DISASTER_MGMT', 'Disaster Management'
        UTILITY_EMERGENCY = 'UTILITY_EMERGENCY', 'Electricity & Water'
        OTHER = 'OTHER', 'Other'

    name = models.CharField(max_length=150)
    category = models.CharField(
        max_length=50,
        choices=Category.choices,
        default=Category.OTHER
    )
    phone_number = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    # Hybrid JSON for flexible attributes (is_hotline, display_order, alternate_number, email, description)
    contact_metadata = models.JSONField(default=dict, blank=True)
   
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_emergencycontact"'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()}) - {self.phone_number}"

class EmergencyBroadcast(TimeStampedModel):
    class Severity(models.TextChoices):
        CRITICAL = 'CRITICAL', 'Critical (Life / Property Threat)'
        HIGH = 'HIGH', 'High (Urgent Attention Required)'
        WARNING = 'WARNING', 'Warning (Precautionary)'
        INFO = 'INFO', 'Informational'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        RESOLVED = 'RESOLVED', 'Resolved'

    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.CRITICAL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_broadcasts'
    )

    # Hybrid JSON for flexible metadata (category, resolution {resolved_by_id, resolved_at, note})
    broadcast_metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_emergencybroadcast"'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"[{self.severity}] {self.title} - {self.status}"