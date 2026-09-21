from rest_framework import serializers
from apt_proj.Apt_Visitors.Visitor_models import VisitorLog
from apt_proj.Apt_Accounts.serializers.flat_serializers import FlatSerializer

class VisitorLogSerializer(serializers.ModelSerializer):
    flat_details = FlatSerializer(source='flat', read_only=True)
    logged_by_name = serializers.CharField(source='logged_by.name', read_only=True)

    class Meta:
        model = VisitorLog
        fields = ['id', 'flat', 'flat_details', 'logged_by', 'logged_by_name',
            'status', 'details', 'timeline', 'created_at', 'updated_at']
        read_only_fields = ['logged_by', 'status', 'timeline']