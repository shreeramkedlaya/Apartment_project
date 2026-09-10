from rest_framework import serializers
from ..Notices_models import NoticeAcknowledgement

class NoticeAcknowledgementSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoticeAcknowledgement
        fields = '__all__'
        read_only_fields = ['notice', 'user', 'reminder_count', 'last_reminder_time', 'acknowledgement_time']
