from rest_framework.response import Response
from rest_framework import status
from .base_views import AmenityBaseAPIView
from ..Amenities_models import AmenityBooking
from ..serializers.amenity_serializers import AmenityBookingSerializer
from ..services.amenity_service import create_booking, update_booking_status, cancel_booking
from django.core.exceptions import ValidationError as DjangoValidationError
from apt_proj.Apt_Common.utils import has_perm

class BookingListCreateAPIView(AmenityBaseAPIView):
    def get(self, request):
        if has_perm(request.user, 'community.amenities.approve'):
            bookings = AmenityBooking.objects.all().order_by('-created_at')
        else:
            bookings = AmenityBooking.objects.filter(user=request.user).order_by('-created_at')
        return Response(AmenityBookingSerializer(bookings, many=True).data)

    def post(self, request):
        serializer = AmenityBookingSerializer(data=request.data)
        if serializer.is_valid():
            amenity = serializer.validated_data['amenity']
            start_time = serializer.validated_data['start_time']
            end_time = serializer.validated_data['end_time']
            purpose = serializer.validated_data['purpose']
            try:
                booking = create_booking(request.user, amenity, start_time, end_time, purpose)
                return Response(AmenityBookingSerializer(booking).data, status=status.HTTP_201_CREATED)
            except DjangoValidationError as e:
                return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookingApproveAPIView(AmenityBaseAPIView):
    def post(self, request, pk):
        if not has_perm(request.user, 'community.amenities.approve'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        booking = self.get_booking(pk)
        try:
            updated = update_booking_status(booking, AmenityBooking.Status.APPROVED, request.user)
            return Response(AmenityBookingSerializer(updated).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

class BookingRejectAPIView(AmenityBaseAPIView):
    def post(self, request, pk):
        if not has_perm(request.user, 'community.amenities.approve'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        booking = self.get_booking(pk)
        try:
            updated = update_booking_status(booking, AmenityBooking.Status.REJECTED, request.user)
            return Response(AmenityBookingSerializer(updated).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

class BookingCancelAPIView(AmenityBaseAPIView):
    def post(self, request, pk):
        booking = self.get_booking(pk)
        try:
            updated = cancel_booking(booking, request.user)
            return Response(AmenityBookingSerializer(updated).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
