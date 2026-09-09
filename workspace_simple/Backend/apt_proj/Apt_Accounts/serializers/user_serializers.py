from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..Accounts_models import UserProfile, Role, Flat

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    flat_number = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'name', 'username', 'email', 'role', 'phone_number', 'flat_number']
        
    def get_role(self, obj):
        if obj.is_superuser:
            return "Super Admin"
        if hasattr(obj, 'profile') and obj.profile.role:
            role_name = obj.profile.role.name
            role_tabs = set(obj.profile.role.permission_tabs) if obj.profile.role.permission_tabs else set()
            user_tabs = set(obj.profile.permission_tabs) if obj.profile.permission_tabs else set()
            if user_tabs - role_tabs:
                role_name += " (Modified)"
            return role_name
        return "Resident"
        
    def get_phone_number(self, obj):
        return obj.profile.phone_number if hasattr(obj, 'profile') else ''
        
    def get_flat_number(self, obj):
        if hasattr(obj, 'profile') and obj.profile.flat:
            return f"{obj.profile.flat.block.name} - {obj.profile.flat.number}"
        return ''
        
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class UserDetailSerializer(UserSerializer):
    permission_tabs = serializers.SerializerMethodField()
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['permission_tabs']
        
    def get_permission_tabs(self, obj):
        if obj.is_superuser:
            return "All"
        if hasattr(obj, 'profile'):
            return obj.profile.get_effective_permissions()
        return []
