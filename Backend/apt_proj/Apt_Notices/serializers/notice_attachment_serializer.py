import os
from rest_framework import serializers
from ..Notices_models import NoticeAttachment

ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']

class NoticeAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoticeAttachment
        fields = '__all__'
        read_only_fields = ['uploaded_at', 'file_type']

    def validate_file(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(f"Unsupported file extension {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        return value
