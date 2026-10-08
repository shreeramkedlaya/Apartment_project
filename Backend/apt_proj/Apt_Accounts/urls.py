from django.urls import path, include
from .views.auth_views import SignupView, SetMPINView, LoginView, ForgotMPINView, MeView
from .views.role_views import RoleAPIView
from .views.user_views import UserAPIView, UserPermissionManagerView, AssignRoleView, PermissionsTreeView
from .views.block_views import BlocksView
from .views import profile_extension_views

auth_patterns = [
    path("signup/", SignupView.as_view(), name="auth_signup"),
    path("set-mpin/", SetMPINView.as_view(), name="auth_set_mpin"),
    path("login/", LoginView.as_view(), name="auth_login"),
    path("forgot-mpin/", ForgotMPINView.as_view(), name="auth_forgot_mpin"),
    path("me/", MeView.as_view(), name="auth_me"),
]

me_patterns = [
    path("co-residents/", profile_extension_views.CoResidentAPIView.as_view(), name="me_coresidents_list"),
    path("co-residents/<int:pk>/", profile_extension_views.CoResidentAPIView.as_view(), name="me_coresidents_detail"),
    path("vehicles/", profile_extension_views.VehicleAPIView.as_view(), name="me_vehicles_list"),
    path("vehicles/<int:pk>/", profile_extension_views.VehicleAPIView.as_view(), name="me_vehicles_detail"),
    path("emergency-contacts/", profile_extension_views.PersonalEmergencyContactAPIView.as_view(), name="me_emergency_contacts_list"),
    path("emergency-contacts/<int:pk>/", profile_extension_views.PersonalEmergencyContactAPIView.as_view(), name="me_emergency_contacts_detail"),
]

role_patterns = [
    path("", RoleAPIView.as_view(), name="role_list"),
    path("<int:pk>/", RoleAPIView.as_view(), name="role_detail"),
]

user_patterns = [
    path("", UserAPIView.as_view(), name="user_list"),
    path("<int:pk>/", UserAPIView.as_view(), name="user_detail"),
    path("<int:pk>/permissions/", UserPermissionManagerView.as_view(), name="user_permissions"),
    path("<int:user_id>/assign-role/", AssignRoleView.as_view(), name="user_assign_role"),
]

urlpatterns = [
    path("blocks/", BlocksView.as_view(), name="blocks_list"),
    path("auth/", include(auth_patterns)),
    path("me/", include(me_patterns)),
    path("roles/", include(role_patterns)),
    path("users/", include(user_patterns)),
    path("permissions/tree/", PermissionsTreeView.as_view(), name="permissions_tree"),
]
