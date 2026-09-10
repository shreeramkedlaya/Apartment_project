from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
from apt_proj.pagination import StatsPagination

from ..Issue_models import IssueCategory
from ..serializers.issue_serializers import IssueCategorySerializer

class IssueCategoryAPIView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        return get_object_or_404(IssueCategory, pk=pk)

    def get(self, request, pk=None):
        if pk is not None:
            category = self.get_object(pk)
            serializer = IssueCategorySerializer(category)
            return Response(serializer.data)

        categories = IssueCategory.objects.all()

        search = request.GET.get('search', '').strip()
        if search:
            categories = categories.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )

        sort_by = request.GET.get('sort', 'name')
        valid_sort_fields = ['name', '-name', 'description', '-description']
        if sort_by in valid_sort_fields:
            categories = categories.order_by(sort_by)

        paginator = StatsPagination()
        paginator.page_size = 10

        paginator.stats = {
            "total": IssueCategory.objects.count(),
            "active": IssueCategory.objects.filter(is_active=True).count(),
            "inactive": IssueCategory.objects.filter(is_active=False).count(),
        }

        page = paginator.paginate_queryset(categories, request)
        if page is not None:
            serializer = IssueCategorySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = IssueCategorySerializer(categories, many=True)
        return Response({"stats": paginator.stats, "results": serializer.data})

    def post(self, request):
        serializer = IssueCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if pk is None:
            return Response({"error": "Category ID is required."}, status=400)
        category = self.get_object(pk)
        serializer = IssueCategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        if pk is None:
            return Response({"error": "Category ID is required."}, status=400)
        category = self.get_object(pk)
        serializer = IssueCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if pk is None:
            return Response({"error": "Category ID is required."}, status=400)
        category = self.get_object(pk)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
