from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from ..Notices_models import Notice
from apt_proj.Apt_Storage.serializers.media_serializer import MediaSerializer, enrich_media_with_signed_urls


from .notice_acknowledgement_serializer import NoticeAcknowledgementSerializer

class NoticeListSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        notices = super().to_representation(data)
        return enrich_media_with_signed_urls(notices, 'media')

class NoticeSerializer(serializers.ModelSerializer):
    media = MediaSerializer(many=True, read_only=True)
    acknowledgements = NoticeAcknowledgementSerializer(many=True, read_only=True)

    class Meta:
        model = Notice
        list_serializer_class = NoticeListSerializer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not self.parent or not isinstance(self.parent, serializers.ListSerializer):
            enrich_media_with_signed_urls([ret], 'media')
        return ret

    created_by = serializers.CharField(source='created_by.username', read_only=True)
    is_editable = serializers.SerializerMethodField()
    user_has_acknowledged = serializers.SerializerMethodField()
    user_acknowledgement_status = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()
    can_acknowledge = serializers.SerializerMethodField()

    def get_is_editable(self, obj):
        return timezone.now() <= (obj.created_at + timedelta(minutes=15))

    def get_is_author(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.created_by_id == request.user.id

    def get_can_acknowledge(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if not obj.requires_acknowledgement or obj.status != Notice.Status.PUBLISHED:
            return False
        if obj.created_by_id == request.user.id:
            return False
        from ..services.targeting_service import is_user_targeted
        return is_user_targeted(request.user, obj.target_audience)

    def get_user_acknowledgement_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        ack = obj.acknowledgements.filter(user=request.user).first()
        return ack.status if ack else None

    def get_user_has_acknowledged(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.acknowledgements.filter(
            user=request.user, 
            status__in=['Acknowledged', 'Declined']
        ).exists()

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
                    "valid_until": "The expiration date must be after the publish date."
                })
        
        if acknowledge_by:
            if acknowledge_by <= timezone.now():
                raise serializers.ValidationError({
                    "acknowledge_by": "The acknowledgement deadline must be set in the future."
                })

        return data