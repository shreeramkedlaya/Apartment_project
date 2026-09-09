from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    
    # Inject user object
    profile = getattr(user, 'profile', None)
    flat_str = f"{profile.flat.block.name} - {profile.flat.number}" if (profile and profile.flat) else ''
    
    # Determine role name
    if user.is_superuser:
        role_name = "Super Admin"
    elif profile and profile.role:
        role_name = profile.role.name
        # Check if user has any extra permissions beyond their role
        role_tabs = set(profile.role.permission_tabs) if profile.role.permission_tabs else set()
        user_tabs = set(profile.permission_tabs) if profile.permission_tabs else set()
        if user_tabs - role_tabs:
            role_name += " (Modified)"
    else:
        role_name = "Resident"

    user_data = {
        "id": user.id,
        "name": user.first_name or user.username,
        "email": user.email or "",
        "role": role_name,
        "phone_number": profile.phone_number if profile else '',
        "flat_number": flat_str,
    }
            
    # Inject minimal claims directly into the token payload
    # Removed permission_tabs to keep the token thin
    refresh['user_data'] = user_data
            
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
