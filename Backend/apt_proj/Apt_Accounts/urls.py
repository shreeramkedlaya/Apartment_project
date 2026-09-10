from django.urls import path
from .views.auth_views import SignupView, SetMPINView, LoginView, ForgotMPINView, MeView
from .views.role_views import RoleAPIView
from .views.user_views import UserAPIView, UserPermissionManagerView, AssignRoleView, PermissionsTreeView
from .views.block_views import BlocksView

urlpatterns = [
    # Core Data Endpoints
    path("blocks/", BlocksView.as_view(), name="blocks_list"),

    # Auth Endpoints
    path("auth/signup/", SignupView.as_view(), name="auth_signup"),
    path("auth/set-mpin/", SetMPINView.as_view(), name="auth_set_mpin"),
    path("auth/login/", LoginView.as_view(), name="auth_login"),
    path("auth/forgot-mpin/", ForgotMPINView.as_view(), name="auth_forgot_mpin"),
    path("auth/me/", MeView.as_view(), name="auth_me"),

    # Admin — Role Management
    path("roles/", RoleAPIView.as_view(), name="role_list"),
    path("roles/<int:pk>/", RoleAPIView.as_view(), name="role_detail"),

    # Admin — User Management
    path("users/", UserAPIView.as_view(), name="user_list"),
    path("users/<int:pk>/", UserAPIView.as_view(), name="user_detail"),
    path("users/<int:pk>/permissions/", UserPermissionManagerView.as_view(), name="user_permissions"),
    path("users/<int:user_id>/assign-role/", AssignRoleView.as_view(), name="user_assign_role"),

    # Permissions Tree (used by Role form)
    path("permissions/tree/", PermissionsTreeView.as_view(), name="permissions_tree"),
]
