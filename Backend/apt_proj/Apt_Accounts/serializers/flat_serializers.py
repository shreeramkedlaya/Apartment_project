from rest_framework import serializers
from ..Accounts_models import Flat

class FlatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flat
        fields = ['id', 'flat_number']