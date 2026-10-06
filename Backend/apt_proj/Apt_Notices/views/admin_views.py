from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from ..Notices_models import Notice
from ..serializers.notice_serializer import NoticeSerializer
from ..services import notice_service
from apt_proj.Apt_Common.utils import has_perm
from .base_views import NoticeBaseAPIView

class NoticeListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not has_perm(request.user, 'community.notices.view'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        notices = Notice.objects.all()

        # Backend Column Filters
        status_param = request.query_params.get('status')
        if status_param:
            notices = notices.filter(status__iexact=status_param)

        category_param = request.query_params.get('category')
        if category_param:
            notices = notices.filter(category__iexact=category_param)

        priority_param = request.query_params.get('priority')
        if priority_param:
            notices = notices.filter(priority__iexact=priority_param)

        # Backend Search
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            notices = notices.filter(
                Q(title__icontains=search) | Q(content__icontains=search) | Q(created_by__username__icontains=search)
            )

        # Backend Sorting
        sort_param = request.query_params.get('sort')
        if sort_param:
            sort_field = sort_param.lstrip('-')
            valid_fields = {'title', 'category', 'priority', 'status', 'publish_date', 'created_at', 'valid_until'}
            if sort_field in valid_fields:
                notices = notices.order_by(sort_param)
            else:
                notices = notices.order_by('-created_at')
        else:
            notices = notices.order_by('-created_at')

        serializer = NoticeSerializer(notices, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not has_perm(request.user, 'community.notices.add'):
            return Response(status=status.HTTP_403_FORBIDDEN)


        serializer = NoticeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user if request.user.is_authenticated else None
            # Extract media_tokens instead of multipart attachments
            media_tokens = request.data.get('media_tokens', None)
            
            notice = notice_service.create_notice(
                data=serializer.validated_data,
                user=user,
                media_tokens=media_tokens
            )
            return Response(NoticeSerializer(notice, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NoticeDetailAPIView(NoticeBaseAPIView):
    def get(self, request, pk):
        if not has_perm(request.user, 'community.notices.view'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        serializer = NoticeSerializer(notice, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        if not has_perm(request.user, 'community.notices.edit'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        serializer = NoticeSerializer(notice, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            try:
                updated_notice = notice_service.update_notice(
                    notice=notice,
                    data=serializer.validated_data,
                    user=request.user if request.user.is_authenticated else None
                )
                return Response(NoticeSerializer(updated_notice, context={'request': request}).data)
            except DjangoValidationError as e:
                return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Alias patch to put since put already handles partial=True
    patch = put

    def delete(self, request, pk):
        if not has_perm(request.user, 'community.notices.delete'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        try:
            notice_service.delete_notice(notice, request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

class NoticePublishAPIView(NoticeBaseAPIView):
    def post(self, request, pk):
        if not has_perm(request.user, 'community.notices.approve'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        try:
            published_notice = notice_service.publish_notice(
                notice=notice,
                user=request.user if request.user.is_authenticated else None
            )
            return Response(NoticeSerializer(published_notice, context={'request': request}).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

class NoticeCancelAPIView(NoticeBaseAPIView):
    def post(self, request, pk):
        if not has_perm(request.user, 'community.notices.cancel'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        try:
            cancelled_notice = notice_service.cancel_notice(
                notice=notice,
                user=request.user if request.user.is_authenticated else None
            )
            return Response(NoticeSerializer(cancelled_notice, context={'request': request}).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
