from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
from apt_proj.pagination import StatsPagination

from ..Accounts_models import Role, UserProfile
from ..serializers.role_serializers import RoleSerializer, RoleDetailSerializer
from ..services.permission_service import load_all_permission_ids

class RoleAPIView(APIView):
    """
    GET    /accounts/roles/         → List all roles with stats
    POST   /accounts/roles/         → Create a new role
    GET    /accounts/roles/<pk>/    → Get single role (detail with permission_tabs)
    PUT    /accounts/roles/<pk>/    → Update role
    DELETE /accounts/roles/<pk>/    → Delete role
    """
    permission_classes = [AllowAny]  # Tighten to IsAuthenticated in production

    def get_object(self, pk):
        return get_object_or_404(Role, pk=pk)

    def get(self, request, pk=None):
        if pk is not None:
            role = self.get_object(pk)
            serializer = RoleDetailSerializer(role)
            return Response(serializer.data)

        roles = Role.objects.all()

        search = request.GET.get('search', '').strip()
        if search:
            roles = roles.filter(
                Q(name__icontains=search) | 
                Q(code__icontains=search) |
                Q(description__icontains=search)
            )

        sort_by = request.GET.get('sort', '-created_at')
        valid_sort_fields = ['name', '-name', 'code', '-code', 'status', '-status', 'user_count', '-user_count', 'created_at', '-created_at']
        if sort_by in valid_sort_fields:
            roles = roles.order_by(sort_by)
        else:
            roles = roles.order_by('-created_at')

        # Pagination & Stats
        paginator = StatsPagination()
        all_ids = load_all_permission_ids()
        total_users = UserProfile.objects.filter(role__isnull=False).count()

        paginator.stats = {
            "total_roles": Role.objects.count(),
            "active_roles": Role.objects.filter(status='active').count(),
            "inactive_roles": Role.objects.filter(status='inactive').count(),
            "total_system_permissions": len(all_ids),
            "users_with_roles": total_users
        }

        page = paginator.paginate_queryset(roles, request)
        serializer = RoleSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = RoleDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        role = self.get_object(pk)
        serializer = RoleDetailSerializer(role, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        role = self.get_object(pk)
        
        # Don't delete Super Admin role
        if role.id == 1 or role.name.lower() == 'super admin':
            return Response(
                {"error": "Cannot delete the Super Admin role."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
