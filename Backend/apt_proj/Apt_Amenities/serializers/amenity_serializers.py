from rest_framework import serializers
from ..Amenities_models import Amenity, AmenityBooking
from django.utils import timezone

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = '__all__'

class AmenityBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmenityBooking
        fields = '__all__'
        read_only_fields = ['status', 'user']

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        
        if data['start_time'] < timezone.now():
            raise serializers.ValidationError({"start_time": "Start time cannot be in the past."})
        
        return data
