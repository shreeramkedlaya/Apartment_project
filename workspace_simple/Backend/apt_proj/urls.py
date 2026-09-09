from django.urls import path, include

urlpatterns = [
    path("accounts/", include("apt_proj.Apt_Accounts.urls")),
    path("issues/", include("apt_proj.Apt_Issues.urls")),
    path("notices/", include("apt_proj.Apt_Notices.urls")),
]
