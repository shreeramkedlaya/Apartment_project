from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apt_proj.Apt_Emergency.views.base_views import BaseAPIView
from apt_proj.Apt_Emergency.Emergency_models import EmergencyContact, EmergencyBroadcast
from apt_proj.Apt_Emergency.serializers.emergency_serializers import EmergencyBroadcastSerializer, EmergencyContactSerializer
from apt_proj.Apt_Emergency.services.emergency_service import EmergencyService

class EmergencyContactListCreateView(BaseAPIView):
    permission_classes = [IsAuthenticated]
    model = EmergencyContact

    def get(self, request):
        contacts = EmergencyContact.objects.filter(is_active=True)
        serializer = EmergencyContactSerializer(contacts, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = EmergencyContactSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmergencyContactDetailView(BaseAPIView):
    permission_classes = [IsAuthenticated]
    model = EmergencyContact

    def get(self, request, pk):
        contact = self.get_object(pk)
        serializer = EmergencyContactSerializer(contact)
        return Response(serializer.data)
    
    def put(self, request, pk):
        contact = self.get_object(pk)
        serializer = EmergencyContactSerializer(contact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        contact = self.get_object(pk)
        contact.is_active = False
        contact.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class EmergencyBroadcastListCreateView(BaseAPIView):
    permission_classes = [IsAuthenticated]
    model = EmergencyBroadcast

    def get(self, request):
        broadcasts = EmergencyBroadcast.objects.all()
        serializer = EmergencyBroadcastSerializer(broadcasts, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EmergencyBroadcastSerializer(data=request.data)
        if serializer.is_valid():
            broadcast = serializer.save(sent_by=request.user)
            # Dispatch real-time WebSocket + FCM Push
            EmergencyService.dispatch_broadcast(broadcast)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmergencyBroadcastResolveView(BaseAPIView):
    permission_classes = [IsAuthenticated]
    model = EmergencyBroadcast

    def post(self, request, pk):
        broadcast = self.get_object(pk)
        
        if broadcast.status == EmergencyBroadcast.Status.RESOLVED:
            return Response({"detail": "Already resolved."}, status=status.HTTP_400_BAD_REQUEST)
            
        resolution_note = request.data.get('resolution_note', '')
        
        # Mark resolved and dispatch WebSocket + FCM Push
        resolved_broadcast = EmergencyService.resolve_broadcast(
            broadcast_obj=broadcast, 
            user=request.user, 
            resolution_note=resolution_note
        )
        
        serializer = EmergencyBroadcastSerializer(resolved_broadcast)
        return Response(serializer.data)