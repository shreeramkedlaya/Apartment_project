from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..Issue_models import Issue, IssueTimeline, IssueCategory, IssueAttachment

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Add a name field for convenience on the frontend
        ret['name'] = f"{instance.first_name} {instance.last_name}".strip() or instance.username
        return ret

class IssueCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueCategory
        fields = '__all__'

class IssueAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueAttachment
        fields = ['id', 'file', 'created_at']

class IssueSerializer(serializers.ModelSerializer):
    created_by_detail = UserSimpleSerializer(source='created_by', read_only=True)
    assigned_to_detail = UserSimpleSerializer(source='assigned_to', read_only=True)
    timeline = serializers.SerializerMethodField()
    
    def get_timeline(self, obj):
        if hasattr(obj, 'timeline_record'):
            return obj.timeline_record.history
        return []
        
    attachments = IssueAttachmentSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Issue
        fields = '__all__'
        read_only_fields = ['created_by']
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['created_by'] = ret.pop('created_by_detail')
        ret['assigned_to'] = ret.pop('assigned_to_detail')
        if ret.get('category_name'):
            # Frontend currently expects category as a string, but since we are sending objects, let's just provide category_name
            pass 
        
        # Unpack issue_metadata so the frontend gets flat_number, etc at the top level
        metadata = getattr(instance, 'issue_metadata', {})
        if metadata:
            for k, v in metadata.items():
                if k not in ret:
                    ret[k] = v
                    
        return ret

class IssueListSerializer(IssueSerializer):
    """
    Lightweight serializer for list views.
    Omits the heavy issue_metadata JSON payload and timeline to keep the API fast.
    """
    class Meta(IssueSerializer.Meta):
        fields = ['id', 'title', 'category', 'category_name', 'priority', 'status', 'created_by', 'assigned_to', 'created_at', 'updated_at']

    def to_representation(self, instance):
        # Bypass IssueSerializer's heavy to_representation
        ret = serializers.ModelSerializer.to_representation(self, instance)
        
        # Populate the detail fields if they exist in the lightweight serializer (we may need to map created_by)
        if hasattr(instance, 'created_by') and instance.created_by:
            ret['created_by'] = UserSimpleSerializer(instance.created_by).data
        if hasattr(instance, 'assigned_to') and instance.assigned_to:
            ret['assigned_to'] = UserSimpleSerializer(instance.assigned_to).data
            
        metadata = instance.issue_metadata or {}
        ret['resolution_notes'] = metadata.get('resolution_notes', None)
        return ret
