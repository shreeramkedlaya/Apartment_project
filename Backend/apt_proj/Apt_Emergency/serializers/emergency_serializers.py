from rest_framework import serializers
from apt_proj.Apt_Emergency.Emergency_models import EmergencyContact, EmergencyBroadcast
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username','email','full_name']
    
    def get_full_name(self,obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

class EmergencyContactSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    # Virtual fields for JSON
    is_emergency_hotline = serializers.BooleanField(required=False, write_only=True)
    display_order = serializers.IntegerField(required=False, write_only=True)
    alternate_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    description = serializers.CharField(required=False, allow_blank=True, write_only=True)
    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'name', 'category', 'category_display', 'phone_number', 'is_active',
            'contact_metadata', 'created_at', 'updated_at',
            # Write-only virtuals
            'is_emergency_hotline', 'display_order', 'alternate_number', 'email', 'description'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'category_display']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        metadata = instance.contact_metadata or {}
        # Expose metadata as top-level fields
        data['is_emergency_hotline'] = metadata.get('is_hotline', False)
        data['display_order'] = metadata.get('display_order', 0)
        data['alternate_number'] = metadata.get('alternate_number', '')
        data['email'] = metadata.get('email', '')
        data['description'] = metadata.get('description', '')
        return data
    def _update_metadata(self, validated_data, instance_meta=None):
        meta = dict(instance_meta) if instance_meta else {}
        
        # Pull virtual fields from validated data
        if 'is_emergency_hotline' in validated_data:
            meta['is_hotline'] = validated_data.pop('is_emergency_hotline')
        if 'display_order' in validated_data:
            meta['display_order'] = validated_data.pop('display_order')
        if 'alternate_number' in validated_data:
            meta['alternate_number'] = validated_data.pop('alternate_number')
        if 'email' in validated_data:
            meta['email'] = validated_data.pop('email')
        if 'description' in validated_data:
            meta['description'] = validated_data.pop('description')
            
        if 'contact_metadata' in validated_data:
            meta.update(validated_data.pop('contact_metadata'))
            
        return meta
    def create(self, validated_data):
        validated_data['contact_metadata'] = self._update_metadata(validated_data)
        return super().create(validated_data)
    def update(self, instance, validated_data):
        validated_data['contact_metadata'] = self._update_metadata(validated_data, instance.contact_metadata)
        return super().update(instance, validated_data)


class EmergencyBroadcastSerializer(serializers.ModelSerializer):
    sent_by = UserMiniSerializer(read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Virtual fields for JSON
    category = serializers.CharField(required=False, allow_blank=True, write_only=True)
    resolution_note = serializers.CharField(required=False, allow_blank=True, write_only=True)
    class Meta:
        model = EmergencyBroadcast
        fields = [
            'id', 'title', 'message', 'severity', 'severity_display', 'status', 'status_display',
            'sent_by', 'broadcast_metadata', 'created_at', 'updated_at',
            # Write-only virtuals
            'category', 'resolution_note'
        ]
        read_only_fields = ['id', 'status', 'sent_by', 'created_at', 'updated_at', 'severity_display', 'status_display']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        metadata = instance.broadcast_metadata or {}
        
        data['category'] = metadata.get('category', 'SECURITY_ALERT')
        # Generate friendly display name for category
        cat_choices = dict(EmergencyContact.Category.choices) # Re-using category labels
        data['category_display'] = cat_choices.get(data['category'], data['category'])
        # Resolve properties mapping
        resolution = metadata.get('resolution', {})
        if resolution:
            data['resolved_at'] = resolution.get('resolved_at')
            data['resolution_note'] = resolution.get('note')
            if 'resolved_by_id' in resolution:
                try:
                    u = User.objects.get(id=resolution['resolved_by_id'])
                    data['resolved_by'] = UserMiniSerializer(u).data
                except User.DoesNotExist:
                    data['resolved_by'] = None
        else:
            data['resolved_at'] = None
            data['resolution_note'] = ''
            data['resolved_by'] = None
        return data
        
    def create(self, validated_data):
        meta = validated_data.pop('broadcast_metadata', {})
        if 'category' in validated_data:
            meta['category'] = validated_data.pop('category')
            
        validated_data['broadcast_metadata'] = meta
        return super().create(validated_data)