from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from apt_proj.Apt_Visitors.Visitor_models import VisitorLog
from apt_proj.Apt_Visitors.serializers.visitor_serializers import VisitorLogSerializer
from apt_proj.Apt_Visitors.tasks import auto_approve_visitor
from apt_proj.Apt_Visitors.services.visitor_service import append_to_timeline, notify_residents_of_visitor

class VisitorLogAPIView(APIView):
    def get(self, request):
        user = request.user
        role = getattr(user, 'role', 'resident')
        if role in ['Security', 'Admin', 'Management']:
            # Guards see all logs for today
            today = timezone.now().date()
            logs = VisitorLog.objects.filter(created_at__date=today)
        else:
            # Residents see logs for their flat
            if hasattr(user, 'flat') and user.flat:
                logs = VisitorLog.objects.filter(flat=user.flat)
            else:
                logs = VisitorLog.objects.none()
                
        serializer = VisitorLogSerializer(logs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = VisitorLogSerializer(data=request.data)
        if serializer.is_valid():
            log = serializer.save(logged_by=request.user)
            
            # Append creation to timeline
            append_to_timeline(log, "Requested", by_name=request.user.name)
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
    def get_object(self, pk):
        try:
            return VisitorLog.objects.get(pk=pk)
        except VisitorLog.DoesNotExist:
            return None

class VisitorApprovalAPIView(BaseVisitorAPIView):
    def post(self, request, pk):
        log = self.get_object(pk)
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
        else:
            log.status = VisitorLog.Status.DENIED
            event_name = "Denied"
            
        append_to_timeline(log, event_name, by_name=request.user.name)
            
        log.save()
        serializer = VisitorLogSerializer(log)
        return Response(serializer.data)


class VisitorCheckOutAPIView(BaseVisitorAPIView):
    def post(self, request, pk):
        log = self.get_object(pk)
        if not log:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if log.status != VisitorLog.Status.APPROVED:
            return Response({"error": "Visitor is not checked in"}, status=status.HTTP_400_BAD_REQUEST)
            
        log.status = VisitorLog.Status.CHECKED_OUT
        
        append_to_timeline(log, "Checked Out", by_name=request.user.name)
        
        log.save()
        
        serializer = VisitorLogSerializer(log)
        return Response(serializer.data)
