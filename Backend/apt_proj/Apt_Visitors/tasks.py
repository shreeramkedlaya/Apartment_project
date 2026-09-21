from celery import shared_task
from django.utils import timezone
from apt_proj.Apt_Visitors.Visitor_models import VisitorLog
from apt_proj.Apt_Visitors.services.visitor_service import append_to_timeline, notify_residents_of_visitor
import logging

logger = logging.getLogger(__name__)

@shared_task
def auto_approve_visitor(log_id):
    """
    Checks if the VisitorLog is still PENDING_APPROVAL after 30 seconds.
    If so, auto-approves it and appends to the timeline.
    """
    try:
        log = VisitorLog.objects.get(id=log_id)
        if log.status == VisitorLog.Status.PENDING_APPROVAL:
            log.status = VisitorLog.Status.APPROVED

            append_to_timeline(log, "Auto-approved after timeout", note="Timeout Exceeded")
            log.save(update_fields=["status", "timeline", 'updated_at'])
            logger.info(f"VisitorLog {log_id} auto-approved due to timeout.")

            visitor_name = log.details.get('name', 'A visitor')
            notify_residents_of_visitor(
                log=log,
                title="Visitor Auto-Approved",
                body=f"Your visitor '{visitor_name}' was automatically approved to enter after the 30-second timeout.",
                event_type="visitor_approved"
            )

    except VisitorLog.DoesNotExist:
        pass