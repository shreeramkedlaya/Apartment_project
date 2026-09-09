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
        
        # Broadcast to each targeted user's group
        if all_users:
            # We don't have a global group yet, but if we did we could broadcast there.
            pass
        else:
            for uid in user_ids:
                async_to_sync(channel_layer.group_send)(f"user_{uid}", ws_payload)
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
    from django.utils import timezone
    from apt_proj.Apt_Notices.Notices_models import Notice
    from apt_proj.Apt_Notices.services.notice_service import _trigger_publish_events
    
    now = timezone.now()
    scheduled_notices = Notice.objects.filter(
        status=Notice.Status.SCHEDULED,
        publish_date__lte=now
    )
    
    published_count = 0
    for notice in scheduled_notices:
        notice.status = Notice.Status.PUBLISHED
        # If the notice was just scheduled without a publish_date (shouldn't happen), set it
        if not notice.publish_date:
            notice.publish_date = now
        notice.save()
        _trigger_publish_events(notice)
        published_count += 1
        
    if published_count > 0:
        logger.info(f"Published {published_count} scheduled notices.")
        
    return {"published": published_count}