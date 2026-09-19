from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import transaction
from apt_proj.pagination import StatsPagination
from django.contrib.auth import get_user_model
from apt_proj.Apt_Notifications.tasks import send_notification_task
import logging

from ..Issue_models import Issue, IssueTimeline
from ..serializers.issue_serializers import IssueSerializer, IssueListSerializer
from ..services.issue_service import pack_metadata, is_valid_transition, handle_media_tokens, update_issue_timeline

class IssueAPIView(APIView):
    permission_classes = [IsAuthenticated] 

    def get_queryset(self, request):
        user = request.user
        role = getattr(user, 'role', 'resident')
        if role in ['admin', 'manager'] or user.is_staff:
            return Issue.objects.all().order_by('-created_at')
            
        return Issue.objects.filter(created_by=user).order_by('-created_at')

    def get_object(self, request, pk):
        queryset = self.get_queryset(request)
        return get_object_or_404(queryset, pk=pk)

    def get(self, request, pk=None):
        if pk:
            issue = self.get_object(request, pk)
            serializer = IssueSerializer(issue)
            return Response(serializer.data)
        else:
            issues = self.get_queryset(request)

            search = request.GET.get('search', '').strip()
            if search:
                issues = issues.filter(
                    Q(title__icontains=search) | 
                    Q(description__icontains=search) |
                    Q(issue_code__icontains=search) |
                    Q(category__name__icontains=search)
                )

            sort_by = request.GET.get('sort', '-created_at')
            valid_sort_fields = ['title', '-title', 'status', '-status', 'priority', '-priority', 'created_at', '-created_at', 'category__name', '-category__name']
            if sort_by in valid_sort_fields:
                issues = issues.order_by(sort_by)
            else:
                issues = issues.order_by('-created_at')

            paginator = StatsPagination()
            
            # Use original queryset for accurate stats ignoring search filters
            from django.db.models import Count
            base_qs = self.get_queryset(request)
            status_counts = dict(base_qs.values_list('status').annotate(count=Count('id')))
            paginator.stats = {
                "total": base_qs.count(),
                "open": status_counts.get('open',0),
                "assigned": status_counts.get('assigned',0),
                "in_progress": status_counts.get('in_progress',0),
                "resolved": status_counts.get('resolved',0),
                "closed": status_counts.get('closed',0),
            }

            page = paginator.paginate_queryset(issues, request)
            if page is not None:
                serializer = IssueListSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            serializer = IssueListSerializer(issues, many=True)
            response_data = {"results": serializer.data}
            response_data.update(paginator.stats)
            return Response(response_data)

    @transaction.atomic
    def post(self, request):
        data = pack_metadata(request.data)
        serializer = IssueSerializer(data=data)
        if serializer.is_valid():
            user = request.user if request.user.is_authenticated else None

            issue = serializer.save(created_by=user)
            timeline = IssueTimeline.objects.create(issue=issue, history=[])

            media_tokens = request.data.get('media_tokens',[])
            handle_media_tokens(issue, media_tokens, user, timeline.id,None)

            # Notify Admins/Managers
            try:
                User = get_user_model()
                manager_ids = list(User.objects.filter(
                    profile__role__name__in=['admin','manager']
                ).values_list('id', flat=True))
                
                if manager_ids:
                    creator_name = user.first_name or user.username if user else "Resident"
                    send_notification_task.delay(
                        title="New Helpdesk Request",
                        body=f"New request '{issue.title}' raised by {creator_name}.",
                        data={"event_type": "issue_created", "issue_id": issue.id},
                        user_ids=manager_ids
                    )
            except Exception as e:
                logging.error(f"Failed to send creation notification: {e}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, pk):
        issue = self.get_object(request, pk)
        old_status = issue.status
        data = pack_metadata(request.data, issue.issue_metadata)
        
        # State machine validation
        new_status_requested = data.get('status')
        if new_status_requested and not is_valid_transition(old_status, new_status_requested):
            return Response({"error": f"Invalid status transition from {old_status} to {new_status_requested}"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = IssueSerializer(issue, data=data)
        if serializer.is_valid():
            updated_issue = serializer.save()
            new_status = updated_issue.status
            resolution_notes = updated_issue.issue_metadata.get('resolution_notes')
            
            timeline_id = None
            event_id = None
            
            if old_status != new_status or resolution_notes:
                user = request.user if request.user.is_authenticated else None
                timeline, event_id = update_issue_timeline(updated_issue, user, old_status, new_status, resolution_notes)
                timeline_id = timeline.id
                
                # Notify Creator
                if old_status != new_status and updated_issue.created_by:
                    try:
                        send_notification_task.delay(
                            title="Request Status Updated",
                            body=f"Your request '{updated_issue.title}' is now {new_status}.",
                            data={"event_type": "issue_updated", "issue_id": updated_issue.id},
                            user_ids=[updated_issue.created_by.id]
                        )
                    except Exception as e:
                        logging.error(f"Failed to send update notification: {e}")
            
            media_tokens = request.data.get('media_tokens',[])
            handle_media_tokens(
                updated_issue,media_tokens,
                request.user if request.user.is_authenticated else None,
                timeline_id, event_id)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def patch(self, request, pk):
        issue = self.get_object(request, pk)
        old_status = issue.status
        data = pack_metadata(request.data, issue.issue_metadata)
        
        # State machine validation
        new_status_requested = data.get('status')
        if new_status_requested and not is_valid_transition(old_status, new_status_requested):
            return Response({"error": f"Invalid status transition from {old_status} to {new_status_requested}"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = IssueSerializer(issue, data=data, partial=True)
        if serializer.is_valid():
            updated_issue = serializer.save()
            new_status = updated_issue.status
            resolution_notes = updated_issue.issue_metadata.get('resolution_notes')
            
            timeline_id = None
            event_id = None
            
            if old_status != new_status or resolution_notes:
                user = request.user if request.user.is_authenticated else None
                timeline, event_id = update_issue_timeline(updated_issue, user, old_status, new_status, resolution_notes)
                timeline_id = timeline.id
                
                # Notify Creator
                if old_status != new_status and updated_issue.created_by:
                    try:
                        send_notification_task.delay(
                            title="Request Status Updated",
                            body=f"Your request '{updated_issue.title}' is now {new_status}.",
                            data={"event_type": "issue_updated", "issue_id": updated_issue.id},
                            user_ids=[updated_issue.created_by.id]
                        )
                    except Exception as e:
                        logging.error(f"Failed to send update notification: {e}")
            
            media_tokens = request.data.get('media_tokens',[])
            handle_media_tokens(
                updated_issue,media_tokens,
                request.user if request.user.is_authenticated else None,
                timeline_id, event_id)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        issue = self.get_object(request, pk)
        issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
