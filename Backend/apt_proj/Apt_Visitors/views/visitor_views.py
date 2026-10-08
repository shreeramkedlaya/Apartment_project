from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from apt_proj.Apt_Visitors.Visitor_models import VisitorLog
from apt_proj.Apt_Visitors.serializers.visitor_serializers import VisitorLogSerializer
from apt_proj.Apt_Visitors.tasks import auto_approve_visitor
from apt_proj.Apt_Visitors.services.visitor_service import append_to_timeline, notify_residents_of_visitor

class VisitorLogAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        role_name = profile.role.name if profile and profile.role else 'resident'
        
        # Base QuerySet
        if role_name in ['Security', 'Admin', 'Management']:
            logs = VisitorLog.objects.all()
        else:
            if profile and profile.flat:
                logs = VisitorLog.objects.filter(flat=profile.flat)
            else:
                logs = VisitorLog.objects.none()
                
        # Filtering
        status_filter = request.query_params.get('status')
        if status_filter:
            logs = logs.filter(status=status_filter)
            
        date_filter = request.query_params.get('date')
        if date_filter:
            logs = logs.filter(created_at__date=date_filter)
        elif role_name in ['Security', 'Admin', 'Management'] and not request.query_params.get('all'):
            # Default for guards is today unless 'all' is requested
            today = timezone.now().date()
            logs = logs.filter(created_at__date=today)
            
        # Search
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            logs = logs.filter(
                Q(details__name__icontains=search) |
                Q(details__phone__icontains=search) |
                Q(flat__number__icontains=search)
            )
            
        # Sorting
        sort_by = request.query_params.get('sort_by', '-created_at')
        logs = logs.order_by(sort_by)
        
        # Pagination
        from apt_proj.pagination import StatsPagination
        paginator = StatsPagination()
        paginated_logs = paginator.paginate_queryset(logs, request, view=self)
        
        serializer = VisitorLogSerializer(paginated_logs, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = VisitorLogSerializer(data=request.data)
        if serializer.is_valid():
            log = serializer.save(logged_by=request.user)
            
            # Append creation to timeline
            append_to_timeline(log, "Requested", by_name=request.user.username)
            log.save(update_fields=['timeline'])
            
            # Queue auto-approval for 30 seconds from now
            auto_approve_visitor.apply_async(args=[log.id], countdown=30)
            
            # Notify residents
            visitor_name = log.details.get('name', 'A visitor')
            notify_residents_of_visitor(
                log=log,
                title="Visitor Request",
                body=f"{visitor_name} is at the gate. Approve or deny?",
                event_type="visitor_requested"
            )
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BaseVisitorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, for_update=False):
        try:
            qs = VisitorLog.objects
            if for_update:
                qs = qs.select_for_update()
            return qs.get(pk=pk)
        except VisitorLog.DoesNotExist:
            return None

class VisitorApprovalAPIView(BaseVisitorAPIView):
    def post(self, request, pk):
        with transaction.atomic():
            log = self.get_object(pk, for_update=True)
            if not log:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
                
            action = request.data.get('action')
            if action not in ['APPROVE', 'REJECT']:
                return Response({"error": "Invalid action, must be APPROVE or REJECT"}, status=status.HTTP_400_BAD_REQUEST)
                
            if log.status != VisitorLog.Status.PENDING_APPROVAL:
                return Response({"error": "Log is not pending approval"}, status=status.HTTP_400_BAD_REQUEST)
                
            if action == 'APPROVE':
                log.status = VisitorLog.Status.APPROVED
                event_name = "Approved"
                notify_event = "VISITOR_APPROVED"
            else:
                log.status = VisitorLog.Status.DENIED
                event_name = "Denied"
                notify_event = "VISITOR_DENIED"
                
            append_to_timeline(log, event_name, by_name=request.user.username)
            log.save()
            
            visitor_name = log.details.get('name', 'A visitor')
            notify_residents_of_visitor(
                log=log,
                title=f"Visitor {event_name}",
                body=f"The visitor request for {visitor_name} was {event_name.lower()}.",
                event_type=notify_event
            )
            
        serializer = VisitorLogSerializer(log)
        return Response(serializer.data)


class VisitorCheckOutAPIView(BaseVisitorAPIView):
    def post(self, request, pk):
        with transaction.atomic():
            log = self.get_object(pk, for_update=True)
            if not log:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
                
            if log.status != VisitorLog.Status.APPROVED:
                return Response({"error": "Visitor is not checked in"}, status=status.HTTP_400_BAD_REQUEST)
                
            log.status = VisitorLog.Status.CHECKED_OUT
            
            append_to_timeline(log, "Checked Out", by_name=request.user.username)
            
            log.save()
            
        serializer = VisitorLogSerializer(log)
        return Response(serializer.data)
