def has_perm(user, perm_id):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    try:
        return perm_id in user.profile.get_effective_permissions()
    except Exception:
        return False