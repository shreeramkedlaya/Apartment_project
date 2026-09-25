import logging
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apt_proj.Apt_Notifications.tasks import send_notification_task

logger = logging.getLogger(__name__)


class EmergencyService:

    @staticmethod
    def dispatch_broadcast(broadcast_obj):
        # extract category from metadata
        category = (broadcast_obj.broadcast_metadata or {}).get('category', 'SECURITY_ALERT')


        # 1. FCM Push Notifications
        try:
            # prepare notification payload
            send_notification_task.delay(
                title=f"🚨 EMERGENCY: {broadcast_obj.title}",
                body=broadcast_obj.message[:200],
                data={
                    "event_type": "emergency_broadcast",
                    "broadcast_id": str(broadcast_obj.id),
                    "severity": broadcast_obj.severity,
                    "category": category,
                    "title": broadcast_obj.title,
                    "message": broadcast_obj.message,
                    "created_at": broadcast_obj.created_at.isoformat()
                },
                all_users=True
            )
        except Exception as e:
            logger.error(f'FCM push failed: {e}', exc_info=True)

    @staticmethod
    def resolve_broadcast(broadcast_obj, user, resolution_note=""):
        metadata = broadcast_obj.broadcast_metadata or {}
        
        # Record resolution data into metadata
        metadata['resolution'] = {
            'resolved_by_id': user.id,
            'resolved_at': timezone.now().isoformat(),
            'note': resolution_note
        }
        
        broadcast_obj.status = broadcast_obj.Status.RESOLVED
        broadcast_obj.broadcast_metadata = metadata
        broadcast_obj.save(update_fields=['status', 'broadcast_metadata', 'updated_at'])

        try:
            send_notification_task.delay(
                title=f"✅ Emergency Resolved: {broadcast_obj.title}",
                body=resolution_note or "The emergency has been resolved by management.",
                data={
                    "event_type": "emergency_resolved",
                    "broadcast_id": str(broadcast_obj.id),
                    "title": broadcast_obj.title
                },
                all_users=True
            )
        except Exception as e:
            logger.error(f"Failed to dispatch resolution notification: {e}", exc_info=True)

        return broadcast_obj