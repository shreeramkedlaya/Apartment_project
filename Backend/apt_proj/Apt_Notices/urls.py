from django.urls import path
from .views.admin_views import (
    NoticeListCreateAPIView, 
    NoticeDetailAPIView, 
    NoticePublishAPIView, 
    NoticeCancelAPIView
)
from .views.approval_views import NoticeApproveAPIView, NoticeRejectAPIView
from .views.resident_views import ResidentNoticeListAPIView, NoticeAcknowledgeAPIView

urlpatterns = [
    # Admin/Manager Endpoints
    path('', NoticeListCreateAPIView.as_view(), name='notice-list-create'),
    path('<int:pk>/', NoticeDetailAPIView.as_view(), name='notice-detail'),
    path('<int:pk>/publish/', NoticePublishAPIView.as_view(), name='notice-publish'),
    path('<int:pk>/cancel/', NoticeCancelAPIView.as_view(), name='notice-cancel'),

    # Approval Endpoints
    path('<int:pk>/approve/', NoticeApproveAPIView.as_view(), name='notice-approve'),
    path('<int:pk>/reject/', NoticeRejectAPIView.as_view(), name='notice-reject'),

    # Resident Endpoints
    path('my-notices/', ResidentNoticeListAPIView.as_view(), name='my-notices-list'),
    path('<int:pk>/acknowledge/', NoticeAcknowledgeAPIView.as_view(), name='notice-acknowledge'),
]
