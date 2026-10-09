from django.urls import path
from .views.invoice_views import InvoiceListCreateAPIView, InvoiceDetailAPIView
from .views.transaction_views import TransactionCreateAPIView

urlpatterns = [
    path('invoices/', InvoiceListCreateAPIView.as_view(), name='invoice-list-create'),
    path('invoices/<int:pk>/', InvoiceDetailAPIView.as_view(), name='invoice-detail'),
    path('transactions/', TransactionCreateAPIView.as_view(), name='transaction-create'),
]
