from rest_framework.response import Response
from rest_framework import status
from .base_views import AmenityBaseAPIView
from ..Amenities_models import AmenityBooking
from ..serializers.amenity_serializers import AmenityBookingSerializer
from ..services.amenity_service import create_booking, update_booking_status, cancel_booking
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from apt_proj.Apt_Common.utils import has_perm

class BookingListCreateAPIView(AmenityBaseAPIView):
    def get(self, request):
        if has_perm(request.user, 'community.amenities.approve'):
            bookings = AmenityBooking.objects.all()
        else:
            bookings = AmenityBooking.objects.filter(user=request.user)
            
        status_filter = request.query_params.get('status')
        if status_filter:
            if status_filter.lower() == 'pending':
                bookings = bookings.filter(status=AmenityBooking.Status.PENDING)
            elif status_filter.lower() == 'processed':
                bookings = bookings.exclude(status=AmenityBooking.Status.PENDING)
            else:
                bookings = bookings.filter(status__iexact=status_filter)
                
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            bookings = bookings.filter(
                Q(purpose__icontains=search) |
                Q(amenity__name__icontains=search) |
                Q(user__username__icontains=search)
            )
            
        sort_by = request.query_params.get('sort_by', '-created_at')
        bookings = bookings.order_by(sort_by)
        
        from apt_proj.pagination import StatsPagination
        paginator = StatsPagination()
        paginated_bookings = paginator.paginate_queryset(bookings, request, view=self)
        
        return paginator.get_paginated_response(AmenityBookingSerializer(paginated_bookings, many=True).data)

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
        with transaction.atomic():
            booking = self.get_booking(pk, for_update=True)
            try:
                updated = update_booking_status(booking, AmenityBooking.Status.CONFIRMED, request.user)
                return Response(AmenityBookingSerializer(updated).data)
            except DjangoValidationError as e:
                return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

class BookingRejectAPIView(AmenityBaseAPIView):
    def post(self, request, pk):
        if not has_perm(request.user, 'community.amenities.approve'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            booking = self.get_booking(pk, for_update=True)
            try:
                updated = update_booking_status(booking, AmenityBooking.Status.REJECTED, request.user)
                return Response(AmenityBookingSerializer(updated).data)
            except DjangoValidationError as e:
                return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

class BookingCancelAPIView(AmenityBaseAPIView):
    def post(self, request, pk):
        with transaction.atomic():
            booking = self.get_booking(pk, for_update=True)
            try:
                updated = cancel_booking(booking, request.user)
                return Response(AmenityBookingSerializer(updated).data)
            except DjangoValidationError as e:
                return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
