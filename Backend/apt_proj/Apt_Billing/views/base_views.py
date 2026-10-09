from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from ..Billing_models import Invoice, Transaction

class BillingBaseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_invoice(self, pk, for_update=False):
        qs = Invoice.objects
        if for_update:
            qs = qs.select_for_update()
        return get_object_or_404(qs, pk=pk)

    def get_transaction(self, pk):
        return get_object_or_404(Transaction, pk=pk)
