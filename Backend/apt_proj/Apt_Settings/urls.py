from django.urls import path, include
from .VersionView import VersionView

urlpatterns = [
    path("version/", VersionView.as_view(),name='version_view')
]