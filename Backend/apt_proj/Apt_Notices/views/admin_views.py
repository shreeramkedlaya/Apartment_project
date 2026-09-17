from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from ..Notices_models import Notice
from ..serializers.notice_serializer import NoticeSerializer
from ..services import notice_service

def has_perm(user, perm_id):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    try:
        return perm_id in user.profile.get_effective_permissions()
    except Exception:
        return False

class NoticeBaseAPIView(APIView):
    """Base class providing the get_object helper as per backend_guidelines.md."""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Notice, pk=pk)

class NoticeListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not has_perm(request.user, 'community.notices.view'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notices = Notice.objects.all().order_by('-created_at')
        serializer = NoticeSerializer(notices, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not has_perm(request.user, 'community.notices.add'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = NoticeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user if request.user.is_authenticated else None
            attachments_data = request.data.get('attachments', None)
            
            notice = notice_service.create_notice(
                data=serializer.validated_data,
                user=user,
                attachments=attachments_data
            )
            return Response(NoticeSerializer(notice).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NoticeDetailAPIView(NoticeBaseAPIView):
    def get(self, request, pk):
        if not has_perm(request.user, 'community.notices.view'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        serializer = NoticeSerializer(notice)
        return Response(serializer.data)

    def put(self, request, pk):
        if not has_perm(request.user, 'community.notices.edit'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        serializer = NoticeSerializer(notice, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_notice = notice_service.update_notice(
                    notice=notice,
                    data=serializer.validated_data,
                    user=request.user if request.user.is_authenticated else None
                )
                return Response(NoticeSerializer(updated_notice).data)
            except DjangoValidationError as e:
                return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            return Response(NoticeSerializer(published_notice).data)
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
            return Response(NoticeSerializer(cancelled_notice).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
