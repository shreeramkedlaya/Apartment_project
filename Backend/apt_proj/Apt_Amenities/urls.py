from django.urls import path
from .views.amenity_views import AmenityListAPIView
from .views.booking_views import (
    BookingListCreateAPIView, 
    BookingApproveAPIView, 
    BookingRejectAPIView,
    BookingCancelAPIView
)

urlpatterns = [
    path('', AmenityListAPIView.as_view(), name='amenity-list'),
    path('bookings/', BookingListCreateAPIView.as_view(), name='booking-list-create'),
    path('bookings/<int:pk>/approve/', BookingApproveAPIView.as_view(), name='booking-approve'),
    path('bookings/<int:pk>/reject/', BookingRejectAPIView.as_view(), name='booking-reject'),
    path('bookings/<int:pk>/cancel/', BookingCancelAPIView.as_view(), name='booking-cancel'),
]
