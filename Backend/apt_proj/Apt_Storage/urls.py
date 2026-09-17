from django.urls import path
from .views.storage_views import AuthorizedUploadView

urlpatterns = [
    path('authorize-upload/', AuthorizedUploadView.as_view(), name='authorize_upload'),
]