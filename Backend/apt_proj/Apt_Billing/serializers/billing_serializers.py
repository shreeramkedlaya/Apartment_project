from rest_framework import serializers
from ..Billing_models import Invoice, Transaction

class TransactionSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.CharField(source='paid_by.get_full_name', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    flat_number = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'

    def get_flat_number(self, obj):
        if obj.flat:
            if hasattr(obj.flat, 'block') and obj.flat.block:
                return f"{obj.flat.block.name} - {obj.flat.number}"
            return str(obj.flat.number)
        return ''
