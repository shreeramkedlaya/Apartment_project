from rest_framework import serializers
from ..Accounts_models import Block, Flat

class FlatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flat
        fields = ['id', 'number']

class BlockSerializer(serializers.ModelSerializer):
    flats = FlatSerializer(many=True, read_only=True)

    class Meta:
        model = Block
        fields = ['id', 'name', 'flats']
