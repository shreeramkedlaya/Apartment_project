from django.db import models
from django.conf import settings
from apt_proj.Apt_Common.models import TimeStampedModel

class Amenity(TimeStampedModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    rules = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_amenity"'

    def __str__(self):
        return self.name

class AmenityBooking(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        REJECTED = 'rejected', 'Rejected'
        CANCELLED = 'cancelled', 'Cancelled'

    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    purpose = models.TextField(max_length=255)


    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_amenitybooking"'

    def __str__(self):
        return f"{self.amenity.name} booked by {self.user.username}"

    