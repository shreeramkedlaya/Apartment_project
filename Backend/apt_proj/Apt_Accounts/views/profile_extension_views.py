from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..Accounts_models import CoResident, Vehicle, PersonalEmergencyContact
from ..serializers.user_serializers import CoResidentSerializer, VehicleSerializer, PersonalEmergencyContactSerializer

class BaseProfileExtensionAPIView(APIView):
    """Base class for profile extensions that belong to a user's profile."""
    permission_classes = [IsAuthenticated]
    model = None
    serializer_class = None

    def get(self, request, pk=None):
        if not hasattr(request.user, 'profile'):
            return Response([], status=200)
            
        if pk:
            obj = get_object_or_404(self.model, pk=pk, profile=request.user.profile)
            serializer = self.serializer_class(obj)
            return Response(serializer.data)
            
        objs = self.model.objects.filter(profile=request.user.profile)
        serializer = self.serializer_class(objs, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not hasattr(request.user, 'profile'):
            return Response({"error": "User profile not found"}, status=400)
            
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=request.user.profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(self.model, pk=pk, profile=request.user.profile)
        serializer = self.serializer_class(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(self.model, pk=pk, profile=request.user.profile)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CoResidentAPIView(BaseProfileExtensionAPIView):
    model = CoResident
    serializer_class = CoResidentSerializer

class VehicleAPIView(BaseProfileExtensionAPIView):
    model = Vehicle
    serializer_class = VehicleSerializer

class PersonalEmergencyContactAPIView(BaseProfileExtensionAPIView):
    model = PersonalEmergencyContact
    serializer_class = PersonalEmergencyContactSerializer
