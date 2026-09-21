from django.urls import path
from .views.visitor_views import VisitorLogAPIView, VisitorApprovalAPIView, VisitorCheckOutAPIView

urlpatterns = [
    path('', VisitorLogAPIView.as_view(), name='visitor_logs'),
    path('<int:pk>/approve/', VisitorApprovalAPIView.as_view(), name='visitor_approve'),
    path('<int:pk>/checkout/', VisitorCheckOutAPIView.as_view(), name='visitor_checkout'),
]
