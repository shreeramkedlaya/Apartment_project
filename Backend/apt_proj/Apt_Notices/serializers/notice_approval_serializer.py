from rest_framework import serializers
from ..Notices_models import NoticeApproval

class NoticeApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoticeApproval
        fields = '__all__'
        read_only_fields = ['requested_by', 'requested_at', 'decision_by', 'decision_at']

    def validate(self, data):
        status = data.get('status', getattr(self.instance, 'status', None))
        rejection_reason = data.get('rejection_reason', getattr(self.instance, 'rejection_reason', None))

        if status == NoticeApproval.Status.REJECTED:
            if not rejection_reason or not str(rejection_reason).strip():
                raise serializers.ValidationError({
                    "rejection_reason": "A reason must be provided when rejecting a notice."
                })
        return data
