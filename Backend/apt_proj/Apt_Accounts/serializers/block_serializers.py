from rest_framework import serializers
from ..Accounts_models import Block, Flat
from .flat_serializers import FlatSerializer

class BlockSerializer(serializers.ModelSerializer):
    flats = FlatSerializer(many=True, read_only=True)

    class Meta:
        model = Block
        fields = ['id', 'name', 'flats']
