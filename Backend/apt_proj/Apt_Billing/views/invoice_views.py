from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from .base_views import BillingBaseAPIView
from ..Billing_models import Invoice
from ..serializers.billing_serializers import InvoiceSerializer
from ..services.billing_service import generate_invoice

class InvoiceListCreateAPIView(BillingBaseAPIView):
    def get(self, request):
        invoices = Invoice.objects.select_related('flat__block', 'billed_to').prefetch_related('transactions__paid_by')
        
        # Filtering for Manager Dashboard / Resident View
        status_param = request.query_params.get('status')
        if status_param:
            invoices = invoices.filter(status__iexact=status_param)
            
        category_param = request.query_params.get('category')
        if category_param:
            invoices = invoices.filter(category__iexact=category_param)
            
        flat_id_param = request.query_params.get('flat_id')
        if flat_id_param:
            invoices = invoices.filter(flat_id=flat_id_param)
            
        invoices = invoices.order_by('-created_at')
        
        # Pagination support (compatible with DataTable server mode)
        if request.query_params.get('page'):
            from apt_proj.pagination import StatsPagination
            paginator = StatsPagination()

            # Aggregate stats across all invoices for the summary bar
            stats_agg = Invoice.objects.aggregate(
                total=Count('id'),
                paid=Count('id', filter=Q(status=Invoice.Status.PAID)),
                pending=Count('id', filter=Q(status=Invoice.Status.PENDING)),
                overdue=Count('id', filter=Q(status=Invoice.Status.OVERDUE)),
            )
            paginator.stats = {'stats': stats_agg}

            paginated_invoices = paginator.paginate_queryset(invoices, request, view=self)
            serializer = InvoiceSerializer(paginated_invoices, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    def post(self, request):
        flat_id = request.data.get('flat_id')
        billed_to_id = request.data.get('billed_to_id')
        category = request.data.get('category', Invoice.Category.MAINTENANCE)
        title = request.data.get('title', 'Maintenance Dues')
        description = request.data.get('description', '')
        line_items = request.data.get('line_items', [])

        if not flat_id or not line_items:
            return Response({'error': 'flat_id and line_items are required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        invoice = generate_invoice(
            flat_id=flat_id,
            category=category,
            title=title,
            line_items=line_items,
            billed_to_id=billed_to_id,
            description=description
        )
        
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class InvoiceDetailAPIView(BillingBaseAPIView):
    def get(self, request, pk):
        invoice = self.get_invoice(pk)
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)
