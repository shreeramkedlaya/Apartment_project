from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from ..Amenities_models import Amenity, AmenityBooking

class AmenityBaseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_amenity(self, pk):
        return get_object_or_404(Amenity, pk=pk)
    
    def get_booking(self, pk):
        return get_object_or_404(AmenityBooking, pk=pk)