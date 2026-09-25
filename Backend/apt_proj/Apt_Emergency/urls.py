from django.urls import path
from apt_proj.Apt_Emergency.views import emergency_views

urlpatterns = [
    path('contacts/', emergency_views.EmergencyContactListCreateView.as_view(), name='contact-list-create'),
    path('contacts/<int:pk>/', emergency_views.EmergencyContactDetailView.as_view(), name='contact-detail'),
    
    path('broadcasts/', emergency_views.EmergencyBroadcastListCreateView.as_view(), name='broadcast-list-create'),
    path('broadcasts/<int:pk>/resolve/', emergency_views.EmergencyBroadcastResolveView.as_view(), name='broadcast-resolve'),
]
