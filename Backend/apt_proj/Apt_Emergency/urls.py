from django.urls import path, include
from apt_proj.Apt_Emergency.views import emergency_views

contact_patterns = [
    path('', emergency_views.EmergencyContactListCreateView.as_view(), name='contact-list-create'),
    path('<int:pk>/', emergency_views.EmergencyContactDetailView.as_view(), name='contact-detail'),
]

broadcast_patterns = [
    path('', emergency_views.EmergencyBroadcastListCreateView.as_view(), name='broadcast-list-create'),
    path('<int:pk>/resolve/', emergency_views.EmergencyBroadcastResolveView.as_view(), name='broadcast-resolve'),
]

urlpatterns = [
    path('contacts/', include(contact_patterns)),
    path('broadcasts/', include(broadcast_patterns)),
]
