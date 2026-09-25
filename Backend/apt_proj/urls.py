from django.urls import path, include

urlpatterns = [
    path("accounts/", include("apt_proj.Apt_Accounts.urls")),
    path("issues/", include("apt_proj.Apt_Issues.urls")),
    path("notices/", include("apt_proj.Apt_Notices.urls")),
    path("dashboard/", include("apt_proj.Apt_Dashboard.urls")),
    path("settings/", include('apt_proj.Apt_Settings.urls')),
    path('storage/',include('apt_proj.Apt_Storage.urls')),
    path('visitors/',include('apt_proj.Apt_Visitors.urls')),
    path('amenities/', include('apt_proj.Apt_Amenities.urls')),
    path('emergency/', include('apt_proj.Apt_Emergency.urls'))
]
