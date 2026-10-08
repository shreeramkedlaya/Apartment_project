import logging
from typing import Any, Dict, List, Optional

from celery import shared_task
from django.conf import settings
from firebase_admin import messaging

from .models import DeviceToken

logger = logging.getLogger(__name__)
INVALID_TOKEN_KEYWORDS = [
    "UNREGISTERED",
    "INVALID_ARGUMENT",
    "NOT_FOUND",
    "INVALID_REGISTRATION",
]

@shared_task
def check_slas_and_escalate():
    """
    Checks for issues in 'Open' or 'Acknowledged' state that are older than 24 hours.
    Escalates them to High priority and triggers a notification to managers.
    """
    import uuid
    from django.contrib.auth import get_user_model
    from datetime import timedelta
    from django.utils import timezone
    from apt_proj.Apt_Issues.Issue_models import Issue, IssueTimeline
    from django.db import transaction

    User = get_user_model()
    sla_threshold = timezone.now() - timedelta(hours=24)

    # Use select_related to avoid N+1 query for IssueTimeline
    issues = Issue.objects.select_related('timeline_record').filter(
        created_at__lt=sla_threshold,
        status__in=['Open', 'Acknowledged'],
    ).only('id', 'title', 'issue_metadata', 'priority', 'timeline_record__history')

    escalated_count = 0
    issues_to_update = []
    timelines_to_update = []
    
    with transaction.atomic():
        for issue in issues:
            metadata = issue.issue_metadata or {}
            if metadata.get('is_escalated'):
                continue
            
            # escalate issue
            metadata['is_escalated'] = True
            issue.issue_metadata = metadata
            issue.priority = 'High'
            issue.updated_at = timezone.now()
            issues_to_update.append(issue)

            # log timeline
            try:
                timeline = issue.timeline_record
            except IssueTimeline.DoesNotExist:
                timeline = IssueTimeline(issue=issue)
                
            event = {
                "id": str(uuid.uuid4()),
                "status_from": None,
                "status_to": None,
                "comment": "SLA breached (24h). Issue automatically escalated to High priority.",
                "created_at": timezone.now().isoformat(),
                "updated_by": {"id": "system", "name": "System"}
            }
            timeline.history.append(event)
            timelines_to_update.append(timeline)

            escalated_count += 1

        if issues_to_update:
            Issue.objects.bulk_update(issues_to_update, ['issue_metadata', 'priority', 'updated_at'])
            
            # For timelines, bulk_update if they exist, bulk_create if new.
            # But Django's bulk_update requires PKs, so let's separate them.
            existing_timelines = [t for t in timelines_to_update if t.pk]
            new_timelines = [t for t in timelines_to_update if not t.pk]
            
            if existing_timelines:
                IssueTimeline.objects.bulk_update(existing_timelines, ['history'])
            if new_timelines:
                IssueTimeline.objects.bulk_create(new_timelines)

    if escalated_count > 0:
        # notify admins/managers
        try:
            manager_ids = list(User.objects.filter(
                profile__role__name__in=['admin','manager']
            ).values_list('id',flat=True))

            if manager_ids:
                for issue in issues_to_update:
                    send_notification_task.delay(
                        title=f"🚨 SLA Breach: {issue.title}",
                        body=f"Issue #{issue.id} has breached the 24h SLA.",
                        data={"event_type": "issue_updated", "issue_id": issue.id},
                        user_ids=manager_ids
                    )
        except Exception as e:
            logger.error(f"Failed to send escalation notification: {e}")
            
        logger.info(f"Escalated {escalated_count} issues due to SLA breach.")
        
    return {"escalated_count": escalated_count}

        
    
def _build_fcm_message(token: str, title: str, body: str, data: Dict[str, Any]):
    return messaging.Message(
        token=token,
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in data.items()},
    )


def _cleanup_invalid_token(token: str, error_text: str) -> None:
    if any(keyword in error_text for keyword in INVALID_TOKEN_KEYWORDS):
        DeviceToken.objects.filter(token=token).delete()


def _send_batch(
    tokens: List[str], title: str, body: str, data: Dict[str, Any]
) -> Dict[str, int]:
    if not tokens:
        return {"success": 0, "failed": 0}

    messages = [_build_fcm_message(token, title, body, data) for token in tokens]
    response = messaging.send_each(messages)

    success = 0
    failed = 0

    for token, resp in zip(tokens, response.responses):
        if resp.success:
            success += 1
            continue

        failed += 1
        error_text = str(resp.exception)
        logger.warning(
            "fcm_send_failed",
            extra={"token": token, "error": error_text},
        )
        _cleanup_invalid_token(token, error_text)

    return {"success": success, "failed": failed}


def _send_notifications(
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    user_ids: Optional[List[int]] = None,
    all_users: bool = False,
) -> Dict[str, int]:
    if user_ids is not None and not isinstance(user_ids, list):
        raise ValueError("user_ids must be a list of user IDs")

    payload_data = data or {}
    if not user_ids and not all_users:
        all_users = True

    token_qs = (
        DeviceToken.objects.filter(notifications_enabled=True)
        if all_users
        else DeviceToken.objects.filter(
            user_id__in=user_ids,
            notifications_enabled=True,
        )
    )
    tokens = list(dict.fromkeys(token_qs.values_list("token", flat=True)))

    result = {"success": 0, "failed": 0}
    batch_size = getattr(settings, "FCM_BATCH_SIZE", 500)
    for offset in range(0, len(tokens), batch_size):
        batch_tokens = tokens[offset : offset + batch_size]
        batch_result = _send_batch(batch_tokens, title, body, payload_data)
        result["success"] += batch_result["success"]
        result["failed"] += batch_result["failed"]

    logger.info(
        "fcm_send_summary",
        extra={
            "total": result["success"] + result["failed"],
            "success": result["success"],
            "failed": result["failed"],
            "all_users": all_users,
            "user_ids": user_ids or [],
        },
    )
    return result


@shared_task
def send_notification_task(
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    user_ids: Optional[List[int]] = None,
    all_users: bool = False,
) -> Dict[str, int]:
    # 1. FCM Delivery
    fcm_result = _send_notifications(
        title=title,
        body=body,
        data=data,
        user_ids=user_ids,
        all_users=all_users,
    )
    
    # 2. WebSocket Delivery
    try:
        import asyncio
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        ws_payload = {
            "type": "send_notification",  # Handled by consumer's send_notification method
            "data": {
                "title": title,
                "body": body,
                "payload": data
            }
        }
        
        async def _dispatch():
            if all_users:
                await channel_layer.group_send("broadcast", ws_payload)
            else:
                await asyncio.gather(*[
                    channel_layer.group_send(f"user_{uid}",ws_payload)
                    for uid in (user_ids or [])
                ])
        async_to_sync(_dispatch)()
    except Exception as e:
        logger.warning(f"Failed to dispatch WebSockets: {e}")
        
    return fcm_result

@shared_task
def cleanup_stale_device_tokens():
    """
    Deletes any DeviceToken whose updated_at timestamp is older than 60 days.
    This resolves the 'Zombie Token' problem.
    """
    from datetime import timedelta
    from django.utils import timezone
    from .models import DeviceToken
    
    stale_date = timezone.now() - timedelta(days=60)
    deleted, _ = DeviceToken.objects.filter(updated_at__lt=stale_date).delete()
    logger.info(f"Cleaned up {deleted} stale device tokens.")
    return {"deleted": deleted}

@shared_task
def process_scheduled_notices():
    """
    Finds notices that are SCHEDULED and ready to be PUBLISHED,
    publishes them, and triggers their push notifications.
    """
    from django.db import transaction
    from django.utils import timezone
    from apt_proj.Apt_Notices.Notices_models import Notice
    from apt_proj.Apt_Notices.services.notice_service import _trigger_publish_events
    
    now = timezone.now()
    published_notices = []
    with transaction.atomic():
        # Evaluate queryset inside transaction with row-level locks
        scheduled_notices = list(
            Notice.objects.select_for_update(skip_locked=True).filter(
                status=Notice.Status.SCHEDULED,
                publish_date__lte=now
            )
        )
        for notice in scheduled_notices:
            notice.status = Notice.Status.PUBLISHED
            if not notice.publish_date:
                notice.publish_date = now
            notice.save(update_fields=['status', 'publish_date', 'updated_at'])
            published_notices.append(notice)
    # Trigger publish events (FCM, acks, WebSockets) after transaction commits
    for notice in published_notices:
        try:
            _trigger_publish_events(notice)
        except Exception as e:
            logger.error(f"Failed to trigger publish events for notice {notice.id}: {e}")
    published_count = len(published_notices)
    if published_count > 0:
        logger.info(f"Published {published_count} scheduled notices.")
    return {"published": published_count}