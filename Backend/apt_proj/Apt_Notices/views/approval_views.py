from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from ..Notices_models import Notice
from ..serializers.notice_approval_serializer import NoticeApprovalSerializer
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

class NoticeApproveAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk):
        return get_object_or_404(Notice, pk=pk)

    def post(self, request, pk):
        if not has_perm(request.user, 'community.notices.approve'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        try:
            approved_notice = notice_service.approve_notice(
                notice=notice,
                user=request.user if request.user.is_authenticated else None
            )
            from ..serializers.notice_serializer import NoticeSerializer
            return Response(NoticeSerializer(approved_notice).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

class NoticeRejectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Notice, pk=pk)

    def post(self, request, pk):
        if not has_perm(request.user, 'community.notices.approve'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        notice = self.get_object(pk)
        serializer = NoticeApprovalSerializer(data=request.data)
        
        if serializer.is_valid():
            reason = serializer.validated_data.get('rejection_reason')
            try:
                rejected_notice = notice_service.reject_notice(
                    notice=notice,
                    user=request.user if request.user.is_authenticated else None,
                    reason=reason
                )
                from ..serializers.notice_serializer import NoticeSerializer
                return Response(NoticeSerializer(rejected_notice).data)
            except DjangoValidationError as e:
                return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
