from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from ..Notices_models import Notice, NoticeApproval, NoticeAcknowledgement, NoticeAttachment

def _trigger_publish_events(notice):
    """
    Helper to trigger FCM delivery task.
    """
    from .targeting_service import resolve_target_users
    try:
        from apt_proj.Apt_Notifications.tasks import send_notification_task
        user_ids = resolve_target_users(notice)
        
        send_notification_task.delay(
            title=notice.title,
            body=notice.content[:100],  # excerpt
            data={
                "notice_id": str(notice.id), 
                "type": "NOTICE",
                "priority": notice.priority
            },
            user_ids=user_ids,
            all_users=False
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to trigger FCM: {e}")

def create_notice(data, user, attachments=None):
    """
    Creates a Draft notice and binds attachments.
    """
    data['status'] = Notice.Status.DRAFT
    data['created_by'] = user
    notice = Notice.objects.create(**data)

    if attachments:
        for file_data in attachments:
            NoticeAttachment.objects.create(
                notice=notice,
                file=file_data.get('file'),
                file_type=file_data.get('file_type', '')
            )
    return notice

def update_notice(notice, data, user):
    """
    Enforces the 15-minute lock rule. Updates allowed fields if within window.
    """
    # 15 minute lock rule checking against created_at
    time_since_creation = timezone.now() - notice.created_at
    if time_since_creation > timedelta(minutes=15):
        raise ValidationError("Notice is completely locked 15 minutes after creation.")
    
    # Update fields
    for key, value in data.items():
        setattr(notice, key, value)
    
    notice.save()
    return notice

def publish_notice(notice, user):
    """
    Transitions notice to PUBLISHED or SCHEDULED.
    """
    if notice.status not in [Notice.Status.DRAFT, Notice.Status.SCHEDULED]:
        raise ValidationError("Only Draft or Scheduled notices can be published.")

    # Permissions check assumes decorator or view-level enforcement, but logic dictates state change:

    if notice.publish_date and notice.publish_date > timezone.now():
        notice.status = Notice.Status.SCHEDULED
    else:
        notice.status = Notice.Status.PUBLISHED
        if not notice.publish_date:
            notice.publish_date = timezone.now()
        
        # Trigger FCM notification delivery flow
        from django.db import transaction
        transaction.on_commit(lambda n=notice: _trigger_publish_events(n))
    
    notice.save()
    return notice

def cancel_notice(notice, user):
    """
    Cancels a scheduled or published notice.
    """
    if notice.status in [Notice.Status.EXPIRED, Notice.Status.CANCELLED]:
        raise ValidationError("Notice is already expired or cancelled.")
    
    notice.status = Notice.Status.CANCELLED
    notice.save()
    return notice

def approve_notice(notice, user):
    """
    Marks a pending publication request as approved and transitions out of Draft.
    """
    approval = notice.approvals.filter(status=NoticeApproval.Status.PENDING).last()
    if not approval:
        raise ValidationError("No pending approval request found for this notice.")

    approval.status = NoticeApproval.Status.APPROVED
    approval.decision_by = user
    approval.decision_at = timezone.now()
    approval.save()

    return notice

def reject_notice(notice, user, reason):
    """
    Rejects a pending publication request and keeps notice as Draft.
    """
    if not reason or not reason.strip():
        raise ValidationError("Rejection reason is required.")

    approval = notice.approvals.filter(status=NoticeApproval.Status.PENDING).last()
    if not approval:
        raise ValidationError("No pending approval request found for this notice.")

    approval.status = NoticeApproval.Status.REJECTED
    approval.decision_by = user
    approval.decision_at = timezone.now()
    approval.rejection_reason = reason
    approval.save()

    return notice

def acknowledge_notice(notice, user):
    """
    Marks the given notice as acknowledged by the user.
    """
    if not notice.requires_acknowledgement:
        raise ValidationError("This notice does not require acknowledgement.")

    ack, created = NoticeAcknowledgement.objects.get_or_create(
        notice=notice, 
        user=user,
        defaults={'status': NoticeAcknowledgement.Status.PENDING}
    )

    if ack.status == NoticeAcknowledgement.Status.ACKNOWLEDGED:
        raise ValidationError("Notice already acknowledged.")

    ack.status = NoticeAcknowledgement.Status.ACKNOWLEDGED
    ack.acknowledgement_time = timezone.now()
    ack.save()
    return ack
