def is_user_targeted(user, target_audience):
    """
    Evaluates if the user matches the target_audience JSON rule.
    Returns False if target_audience is empty or invalid.
    """
    if not target_audience or not isinstance(target_audience, list):
        return False
    
    # Extract live attributes
    try:
        profile = user.profile
    except Exception:
        return False # No profile, no targeting

    user_role = profile.role.name if profile.role else None
    user_block = profile.flat.block.name if (profile.flat and hasattr(profile.flat, 'block') and profile.flat.block) else None
    user_flat = f"{user_block} - {profile.flat.number}" if (profile.flat and user_block) else None

    # OR between groups
    for group in target_audience:
        if not isinstance(group, dict) or not group:
            continue
            
        # AND within group
        match_all = True
        for key, value in group.items():
            if key == 'role':
                if user_role != value:
                    match_all = False
                    break
            elif key == 'block':
                if user_block != value:
                    match_all = False
                    break
            elif key == 'flat':
                if user_flat != value:
                    match_all = False
                    break
            else:
                # Unknown key strictly invalidates this group match (as per spec)
                match_all = False
                break
                
        if match_all:
            return True

    return False

def get_targeted_notices_for_user(user, notices_queryset):
    """
    Filters the notices_queryset by applying is_user_targeted to each notice.
    Prioritizes correctness over DB-efficiency for Phase 4.
    """
    matching_notices = []
    for notice in notices_queryset:
        if is_user_targeted(user, notice.target_audience):
            matching_notices.append(notice.id)
            
    return notices_queryset.filter(id__in=matching_notices)

def resolve_target_users(notice):
    """
    Returns a list of User IDs that match the notice targeting rule.
    """
    from django.contrib.auth.models import User
    active_users = User.objects.filter(is_active=True).select_related('profile', 'profile__role', 'profile__flat', 'profile__flat__block')
    
    targeted_ids = []
    for user in active_users:
        if is_user_targeted(user, notice.target_audience):
            targeted_ids.append(user.id)
            
    return targeted_ids
