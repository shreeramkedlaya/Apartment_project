from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apt_proj.Apt_Emergency.views.base_views import BaseAPIView
from apt_proj.Apt_Emergency.Emergency_models import EmergencyContact, EmergencyBroadcast
from apt_proj.Apt_Emergency.serializers.emergency_serializers import EmergencyBroadcastSerializer, EmergencyContactSerializer
from apt_proj.Apt_Emergency.services.emergency_service import EmergencyService
from apt_proj.Apt_Common.utils import has_perm
from apt_proj.pagination import StatsPagination
from django.db.models import Q

class EmergencyContactListCreateView(BaseAPIView):
    permission_classes = [IsAuthenticated]
    model = EmergencyContact

    def get(self, request):
        contacts = EmergencyContact.objects.filter(is_active=True)
        
        search = request.query_params.get('search')
        if search:
            contacts = contacts.filter(
                Q(name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(category__icontains=search)
            )
            
        sort_by = request.query_params.get('sort_by', 'name')
        contacts = contacts.order_by(sort_by)
        
        paginator = StatsPagination()
        paginated_contacts = paginator.paginate_queryset(contacts, request, view=self)
        serializer = EmergencyContactSerializer(paginated_contacts, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        if not has_perm(request.user, 'emergency.add_contact'):
            return Response(status=status.HTTP_403_FORBIDDEN)
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
        if not has_perm(request.user, 'emergency.add_contact'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        contact = self.get_object(pk)
        serializer = EmergencyContactSerializer(contact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        if not has_perm(request.user, 'emergency.delete_contact'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        contact = self.get_object(pk)
        contact.is_active = False
        contact.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class EmergencyBroadcastListCreateView(BaseAPIView):
    permission_classes = [IsAuthenticated]
    model = EmergencyBroadcast

    def get(self, request):
        broadcasts = EmergencyBroadcast.objects.all()
        
        search = request.query_params.get('search')
        if search:
            broadcasts = broadcasts.filter(
                Q(title__icontains=search) |
                Q(message__icontains=search) |
                Q(severity__icontains=search) |
                Q(status__icontains=search)
            )
            
        sort_by = request.query_params.get('sort_by', '-created_at')
        broadcasts = broadcasts.order_by(sort_by)
        
        paginator = StatsPagination()
        paginated_broadcasts = paginator.paginate_queryset(broadcasts, request, view=self)
        serializer = EmergencyBroadcastSerializer(paginated_broadcasts, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        if not has_perm(request.user, 'emergency.manage_broadcasts'):
            return Response(status=status.HTTP_403_FORBIDDEN)
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
        if not has_perm(request.user, 'emergency.manage_broadcasts'):
            return Response(status=status.HTTP_403_FORBIDDEN)
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