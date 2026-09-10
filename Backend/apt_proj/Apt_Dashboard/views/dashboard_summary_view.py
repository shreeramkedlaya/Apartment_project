from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apt_proj.Apt_Notices.Notices_models import Notice
from apt_proj.Apt_Issues.Issue_models import Issue
from apt_proj.Apt_Notices.serializers.notice_serializer import NoticeSerializer
from apt_proj.Apt_Notices.services.targeting_service import is_user_targeted
from django.db.models import Q
from django.utils import timezone
import holidays

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Fetch relevant notices (Published, valid, targeted)
        all_published_notices = Notice.objects.filter(
            status=Notice.Status.PUBLISHED,
        ).order_by('-publish_date', '-created_at')

        # Filter active and targeted
        now = timezone.now()
        active_notices = []
        for n in all_published_notices:
            if n.valid_until and n.valid_until < now:
                continue
            if is_user_targeted(user, n.target_audience):
                active_notices.append(n)

        # Separate out the top 3 high priority for Hero Carousel
        # E.g. Critical first, then recent ones
        active_notices.sort(key=lambda x: (x.priority == 'Critical', x.publish_date or x.created_at), reverse=True)
        
        hero_notices = active_notices[:3]
        hero_serialized = NoticeSerializer(hero_notices, many=True, context={'request': request}).data

        # Metrics
        unread_notices = sum(1 for n in active_notices if n.requires_acknowledgement and not n.acknowledgements.filter(user=user, status='Acknowledged').exists())
        open_issues = Issue.objects.filter(reported_by=user, status__in=['Open', 'Assigned', 'In Progress']).count()
        total_issues = Issue.objects.filter(reported_by=user).count()
        
        metrics = {
            "fee_due": "4,500", # Mocked for now since Billing isn't implemented
            "unread_notices": unread_notices,
            "open_issues": open_issues,
            "total_issues": total_issues
        }

        # Holidays
        year = now.year
        in_holidays = holidays.India(years=year) 
        upcoming_holidays = []
        for d, name in sorted(in_holidays.items()):
            if d >= now.date():
                upcoming_holidays.append({
                    "date": d.isoformat(),
                    "name": name,
                    "type": "Public Holiday"
                })
        
        # Add internal events to holidays list
        internal_events = [n for n in active_notices if n.category in [Notice.Category.EVENT, Notice.Category.HOLIDAY]]
        for event in internal_events:
            event_date = (event.publish_date or event.created_at).date()
            upcoming_holidays.append({
                "date": event_date.isoformat(),
                "name": event.title,
                "type": "Community Event"
            })
            
        upcoming_holidays.sort(key=lambda x: x["date"])
        
        # Recent Activity 
        recent_activity = [
            {"title": "New Notice Published", "description": n.title, "time": (n.publish_date or n.created_at).isoformat()} for n in active_notices[:3]
        ]

        return Response({
            "status": "success",
            "data": {
                "hero_carousel": hero_serialized,
                "metrics": metrics,
                "upcoming_holidays": upcoming_holidays[:5], 
                "recent_activity": recent_activity
            }
        })
