import uuid
from django.utils import timezone
from apt_proj.Apt_Common.BackgroundRunner import run_in_background
from apt_proj.Apt_Notifications.tasks import send_notification_task
from ..Issue_models import Issue, IssueTimeline, IssueAttachment

def pack_metadata(data, existing_metadata=None):
    metadata = existing_metadata.copy() if existing_metadata else {}
    keys_to_pack = ['is_flat_specific', 'flat_number', 'common_area', 'mobile_number', 'resolution_notes']
    mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
    for key in keys_to_pack:
        if key in mutable_data:
            metadata[key] = mutable_data.pop(key)
    if metadata:
        mutable_data['issue_metadata'] = metadata
    return mutable_data

def is_valid_transition(old_status, new_status):
    if not new_status or old_status == new_status:
        return True
    valid_map = {
        'Open': ['Assigned', 'Closed'],
        'Assigned': ['In Progress', 'Resolved'],
        'In Progress': ['Resolved'],
        'Resolved': ['Closed'],
        'Closed': []
    }
    return new_status in valid_map.get(old_status, [])

def handle_attachments_bg(files_data, issue_id, timeline_id, event_id):
    # Background task logic to save attachments and update timeline event
    issue = Issue.objects.get(id=issue_id)
    attachment_ids = []
    for file_obj in files_data:
        att = IssueAttachment.objects.create(issue=issue, file=file_obj)
        attachment_ids.append(att.id)
        
    if timeline_id and event_id and attachment_ids:
        timeline = IssueTimeline.objects.get(id=timeline_id)
        for event in timeline.history:
            if event.get('id') == event_id:
                event['attachment_ids'] = attachment_ids
                break
        timeline.save(update_fields=['history', 'updated_at'])

def handle_attachments(request, issue, timeline_id=None, event_id=None):
    attachments = request.FILES.getlist('attachments')
    if not attachments:
        return
    run_in_background(handle_attachments_bg, attachments, issue.id, timeline_id, event_id)

def notify_status_change(issue, old_status, new_status):
    user_ids = []
    if issue.created_by:
        user_ids.append(issue.created_by.id)
    if issue.assigned_to:
        user_ids.append(issue.assigned_to.id)
        
    # Deduplicate
    user_ids = list(set(user_ids))
    if not user_ids:
        return
        
    send_notification_task.delay(
        title="Issue Status Updated",
        body=f"Issue #{issue.id} ('{issue.title}') has been updated to {new_status}.",
        data={
            "event_type": "issue_updated",
            "issue_id": issue.id,
            "status_from": old_status,
            "status_to": new_status
        },
        user_ids=user_ids,
        all_users=False
    )

def update_issue_timeline(issue, user, old_status, new_status, resolution_notes):
    timeline, created = IssueTimeline.objects.get_or_create(issue=issue)
    event_id = str(uuid.uuid4())
    event = {
        "id": event_id,
        "status_from": old_status if old_status != new_status else None,
        "status_to": new_status if old_status != new_status else None,
        "comment": resolution_notes if resolution_notes else None,
        "created_at": timezone.now().isoformat(),
        "updated_by": {
            "id": user.id, 
            "name": f"{user.first_name} {user.last_name}".strip() or user.username
        } if user else None
    }
    timeline.history.append(event)
    timeline.save(update_fields=['history', 'updated_at'])
    
    if old_status != new_status:
        notify_status_change(issue, old_status, new_status)
        
    return timeline, event_id
