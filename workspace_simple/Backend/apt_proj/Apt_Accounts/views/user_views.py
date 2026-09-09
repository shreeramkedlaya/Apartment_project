import json
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.conf import settings
from apt_proj.pagination import StatsPagination

from ..Accounts_models import Role, UserProfile
from ..serializers.user_serializers import UserSerializer

User = get_user_model()

class AssignRoleView(APIView):
    """
    POST /accounts/users/<user_id>/assign-role/
    Body: { "role_id": <int> | null }
    """
    permission_classes = [AllowAny]

    def get_object(self, user_id):
        return get_object_or_404(User, pk=user_id)

    def post(self, request, user_id):
        if request.user and request.user.is_authenticated and str(request.user.id) == str(user_id):
            return Response({"error": "You cannot change your own role."}, status=403)

        user = self.get_object(user_id)
        role_id = request.data.get('role_id')

        if not hasattr(user, 'profile'):
            return Response({"error": "User profile not found."}, status=404)

        if role_id is None:
            # Unassign role
            user.profile.role = None
            user.profile.save()
            return Response({"status": "role_unassigned"})

        role = get_object_or_404(Role, pk=role_id)
        user.profile.role = role
        user.profile.save()
        return Response({"status": "role_assigned"})


class UserAPIView(APIView):
    """
    GET /accounts/users/          → List all users with their assigned role info
    GET /accounts/users/<pk>/     → Get single user detail
    PUT /accounts/users/<pk>/     → Update user name, phone, role, status, password
    """
    permission_classes = [AllowAny]

    def get_object(self, pk):
        return get_object_or_404(
            User.objects.select_related('profile', 'profile__role', 'profile__flat', 'profile__flat__block'),
            pk=pk
        )

    def get(self, request, pk=None):
        if pk is not None:
            user = self.get_object(pk)
            serializer = UserSerializer(user)
            return Response(serializer.data)

        users = User.objects.select_related('profile', 'profile__role', 'profile__flat', 'profile__flat__block').all()

        search = request.GET.get('search', '').strip()
        if search:
            users = users.filter(
                Q(username__icontains=search) | 
                Q(first_name__icontains=search) |
                Q(profile__phone_number__icontains=search)
            )

        sort_by = request.GET.get('sort', '-date_joined')
        valid_sort_fields = ['username', '-username', 'first_name', '-first_name', 'profile__phone_number', '-profile__phone_number', 'profile__role__name', '-profile__role__name', 'date_joined', '-date_joined']
        if sort_by in valid_sort_fields:
            users = users.order_by(sort_by)
        else:
            users = users.order_by('-date_joined')

        paginator = StatsPagination()
        paginator.stats = {
            "total_users": User.objects.count(),
            "role_assigned": UserProfile.objects.filter(role__isnull=False).exclude(user__is_superuser=True).count(),
            "no_role": UserProfile.objects.filter(role__isnull=True).exclude(user__is_superuser=True).count(),
            "super_admins": User.objects.filter(is_superuser=True).count(),
        }

        page = paginator.paginate_queryset(users, request)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = UserSerializer(users, many=True)
        return Response({"stats": paginator.stats, "results": serializer.data})

    def put(self, request, pk=None):
        if pk is None:
            return Response({"error": "User ID is required."}, status=400)
        user = self.get_object(pk)
        data = request.data

        # 1. Update Name (first_name)
        if 'name' in data:
            user.first_name = data.get('name', '').strip()

        # 2. Update Status (is_active)
        if 'is_active' in data:
            if request.user and request.user.is_authenticated and str(request.user.id) == str(pk):
                return Response({"error": "You cannot change your own active status."}, status=403)
            user.is_active = bool(data.get('is_active'))

        # 3. Update Password if provided
        password = data.get('password')
        if password and str(password).strip():
            user.set_password(str(password).strip())

        user.save()

        # 4. Profile updates
        profile = getattr(user, 'profile', None)
        if profile:
            # Phone number
            if 'phone_number' in data:
                phone = data.get('phone_number')
                phone = phone.strip() if phone else None
                if phone:
                    existing = UserProfile.objects.filter(phone_number=phone).exclude(pk=profile.pk).first()
                    if existing:
                        return Response({"error": "Phone number is already associated with another user."}, status=400)
                profile.phone_number = phone

            # Role
            if 'role_id' in data:
                if request.user and request.user.is_authenticated and str(request.user.id) == str(pk):
                    return Response({"error": "You cannot change your own role."}, status=403)
                
                role_id = data.get('role_id')
                if role_id is None or role_id == '' or role_id == 0 or str(role_id).lower() == 'resident':
                    profile.role = None
                else:
                    role = Role.objects.filter(pk=role_id).first()
                    if not role:
                        return Response({"error": f"Role with id {role_id} not found."}, status=400)
                    profile.role = role

            profile.save()

        # Return updated serialized user
        updated_user = self.get_object(pk)
        serializer = UserSerializer(updated_user)
        return Response(serializer.data, status=200)

    def patch(self, request, pk=None):
        ids = request.data.get('ids')
        if not ids and pk:
            ids = [pk]
            
        if not ids:
            return Response({"error": "No User IDs provided."}, status=400)
            
        # Prevent self-modification
        if request.user and request.user.is_authenticated and str(request.user.id) in [str(i) for i in ids]:
            return Response({"error": "You cannot change your own active status."}, status=403)
            
        if 'is_active' in request.data:
            is_active = bool(request.data.get('is_active'))
            User.objects.filter(id__in=ids, is_superuser=False).update(is_active=is_active)
            return Response({"message": f"Successfully updated {len(ids)} user(s)."}, status=200)
            
        return Response({"error": "No valid fields provided for bulk update."}, status=400)

    def delete(self, request, pk=None):
        ids = request.data.get('ids')
        if not ids and pk:
            ids = [pk]
            
        if not ids:
            return Response({"error": "No User IDs provided."}, status=400)
            
        # Prevent self-deletion
        if request.user and request.user.is_authenticated and str(request.user.id) in [str(i) for i in ids]:
            return Response({"error": "You cannot delete your own account."}, status=403)
            
        deleted, _ = User.objects.filter(id__in=ids, is_superuser=False).delete()
        return Response({"message": f"Successfully deleted {deleted} user(s)."}, status=200)


class PermissionsTreeView(APIView):
    """
    GET /accounts/permissions/tree/  → Return the full permissions.json tree
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            json_path = os.path.join(settings.BASE_DIR, 'permissions.json')
            with open(json_path, 'r') as f:
                tree = json.load(f)
            return Response(tree)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class UserPermissionManagerView(APIView):
    """
    GET  /accounts/users/<pk>/permissions/
         Returns role_tabs (from role), user_tabs (per-user override), and
         effective_tabs (the merged union that ends up in the JWT).

    PUT  /accounts/users/<pk>/permissions/
         Saves the per-user override tab list. The effective permissions on
         next login will be Role tabs UNION these user_tabs.

         Special actions via body:
           { "action": "reset" }  → clears user_tabs (reverts to role-only)
           { "user_tabs": [...] } → replaces user_tabs with the given list
    """
    permission_classes = [AllowAny]

    def get_object(self, pk):
        return get_object_or_404(User, pk=pk)

    def get(self, request, pk):
        user = self.get_object(pk)
        if not hasattr(user, 'profile'):
            return Response({
                "role_tabs": [],
                "user_tabs": [],
                "effective_tabs": [],
            })

        profile = user.profile
        role_tabs = list(profile.role.permission_tabs) if profile.role else []
        user_tabs = list(profile.permission_tabs or [])
        effective_tabs = profile.get_effective_permissions()

        return Response({
            "role_tabs": role_tabs,
            "user_tabs": user_tabs,
            "effective_tabs": effective_tabs,
        })

    def put(self, request, pk):
        if request.user and request.user.is_authenticated and str(request.user.id) == str(pk):
            return Response({"error": "You cannot modify your own access permissions."}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object(pk)

        # Ensure the profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, permission_tabs=[])
            user.refresh_from_db()

        profile = user.profile

        # Handle "reset to role default" action
        action = request.data.get('action')
        if action == 'reset':
            profile.permission_tabs = []
            profile.save()
            role_tabs = list(profile.role.permission_tabs) if profile.role else []
            return Response({
                "status": "reset",
                "role_tabs": role_tabs,
                "user_tabs": [],
                "effective_tabs": profile.get_effective_permissions(),
            })

        # Handle explicit user_tabs update
        user_tabs = request.data.get('user_tabs')
        if user_tabs is None:
            return Response({"error": "Provide 'user_tabs' (list) or 'action: reset'."}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(user_tabs, list):
            return Response({"error": "'user_tabs' must be an array of permission ID strings."}, status=status.HTTP_400_BAD_REQUEST)

        profile.permission_tabs = list(set(user_tabs))  # deduplicate
        profile.save()

        return Response({
            "status": "updated",
            "role_tabs": list(profile.role.permission_tabs) if profile.role else [],
            "user_tabs": profile.permission_tabs,
            "effective_tabs": profile.get_effective_permissions(),
        })
