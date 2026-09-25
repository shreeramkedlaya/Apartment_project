from django.core.exceptions import ValidationError
from django.db.models import Q
from ..Amenities_models import AmenityBooking
from apt_proj.Apt_Notifications.tasks import send_notification_task

def create_booking(user, amenity, start_time, end_time, purpose):
    # prevent creating a booking if the timeslot overlaps with an APPROVED/CONFIRMED booking
    overlapping = AmenityBooking.objects.filter(
        amenity=amenity,
        status=AmenityBooking.Status.CONFIRMED,
        start_time__lt=end_time,
        end_time__gt=start_time
    ).exists()

    if overlapping:
        raise ValidationError("The selected timeslot overlaps with an existing booking")
    booking = AmenityBooking.objects.create(
        user=user,
        amenity=amenity,
        start_time=start_time,
        end_time=end_time,
        purpose=purpose,
        status = AmenityBooking.Status.PENDING
    )
    return booking

def update_booking_status(booking, new_status, manager):
    if booking.status == new_status: return booking

    # check overlap before approving - catches race conditions for 2 pending bookings

    if new_status == AmenityBooking.Status.CONFIRMED:
        overlapping = AmenityBooking.objects.filter(
            amenity=booking.amenity,
            status=AmenityBooking.Status.CONFIRMED,
            start_time__lt=booking.end_time,
            end_time__gt=booking.start_time
        ).exclude(id=booking.id).exists()

        if overlapping:
            raise ValidationError("Overlapping booking exists - cannot approve")

    booking.status = new_status
    booking.save(update_fields = ['status', 'updated_at'])

    # send notification
    if new_status in [AmenityBooking.Status.CONFIRMED, AmenityBooking.Status.REJECTED]:
        send_notification_task.delay(
            title=f"Amenity Booking {new_status.title()}",
            body=f"Your booking for {booking.amenity.name} has been {new_status.lower()}.",
            data={"event_type": "booking_updated", "booking_id": booking.id},
            user_ids=[booking.user.id],
            all_users=False
        )
    return booking

def cancel_booking(booking, user):
    if booking.user != user and not(hasattr(user, 'profile') and user.profile.role.name in ['admin', 'manager']):
        raise ValidationError("You can only cancel your own bookings")
    
    if booking.status in [AmenityBooking.Status.REJECTED, AmenityBooking.Status.CANCELLED]:
        raise ValidationError("Booking is already rejected or cancelled.")

    booking.status = AmenityBooking.Status.CANCELLED
    booking.save(update_fields = ['status', 'updated_at'])
    return booking