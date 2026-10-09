from rest_framework import serializers
from ..Billing_models import Invoice, Transaction

class TransactionSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.CharField(source='paid_by.get_full_name', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    flat_number = serializers.CharField(source='flat.flat_number', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
