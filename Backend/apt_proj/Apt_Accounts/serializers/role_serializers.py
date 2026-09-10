from rest_framework import serializers
from ..Accounts_models import Role

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'code', 'description', 'status', 'user_count', 'created_at']

class RoleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'code', 'description', 'status', 'user_count', 'created_at', 'permission_tabs']
