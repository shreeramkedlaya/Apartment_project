from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from ..Notices_models import Notice

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at', 'created_by']

    created_by = serializers.CharField(source='created_by.username', read_only=True)
    is_editable = serializers.SerializerMethodField()
    user_has_acknowledged = serializers.SerializerMethodField()

    def get_is_editable(self, obj):
        return timezone.now() <= (obj.created_at + timedelta(minutes=15))

    def get_user_has_acknowledged(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.acknowledgements.filter(user=request.user, status='Acknowledged').exists()

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        return value

    def validate_target_audience(self, value):
        if not value or not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("Target audience cannot be empty.")
            
        allowed_keys = {'role', 'block', 'flat'}
        for group in value:
            if not isinstance(group, dict):
                raise serializers.ValidationError("Target audience must be a list of objects.")
            if not group:
                raise serializers.ValidationError("Target group cannot be empty.")
            for key in group.keys():
                if key not in allowed_keys:
                    raise serializers.ValidationError(f"Invalid targeting key: '{key}'. Allowed keys are: role, block, flat.")
        return value

    def validate(self, data):
        # We need to access both provided data and existing instance data (for partial updates)
        publish_date = data.get('publish_date', getattr(self.instance, 'publish_date', None))
        valid_until = data.get('valid_until', getattr(self.instance, 'valid_until', None))
        acknowledge_by = data.get('acknowledge_by', getattr(self.instance, 'acknowledge_by', None))

        if valid_until and publish_date:
            if valid_until <= publish_date:
                raise serializers.ValidationError({
                    "valid_until": "valid_until must be strictly greater than publish_date."
                })
        
        if acknowledge_by:
            if acknowledge_by <= timezone.now():
                raise serializers.ValidationError({
                    "acknowledge_by": "acknowledge_by must be strictly in the future."
                })

        return data
