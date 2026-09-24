from rest_framework.response import Response
from rest_framework import status
from .base_views import AmenityBaseAPIView
from ..Amenities_models import Amenity
from ..serializers.amenity_serializers import AmenitySerializer
from apt_proj.Apt_Common.utils import has_perm

class AmenityListAPIView(AmenityBaseAPIView):
    def get(self, request):
        amenities = Amenity.objects.filter(is_active=True)
        return Response(AmenitySerializer(amenities, many=True).data)

    def post(self, request):
        if not has_perm(request.user, 'community.amenities.add'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = AmenitySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)