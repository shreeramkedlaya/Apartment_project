from django.urls import path
from .views.storage_views import AuthorizedUploadView
from .views.media_download_view import MediaDownloadView

urlpatterns = [
    path('authorize-upload/', AuthorizedUploadView.as_view(), name='authorize_upload'),
    path('media/<int:media_id>/download/', MediaDownloadView.as_view(), name='media_download'),
]