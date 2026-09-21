from django.utils import timezone
from apt_proj.Apt_Notifications.tasks import send_notification_task

def append_to_timeline(log, event_name, by_name="System", note=None):
    """
    Appends an event to the VisitorLog timeline following the Hybrid JSON architecture.
    Does NOT call log.save(). The caller must save the 'timeline' field.
    """
    event = {
        "event": event_name,
        "timestamp": timezone.now().isoformat(),
        "by": by_name
    }
    if note:
        event["note"] = note
    log.timeline.append(event)


def notify_residents_of_visitor(log, title, body, event_type="visitor_event"):
    """
    Finds all residents of the target flat and pushes an FCM/WebSocket notification to them.
    """
    resident_user_ids = list(log.flat.residents.values_list('user_id', flat=True))
    if resident_user_ids:
        send_notification_task.delay(
            title=title,
            body=body,
            data={"event_type": event_type, "visitor_id": log.id},
            user_ids=resident_user_ids
        )
