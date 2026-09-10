from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from ..Notices_models import Notice
from ..serializers.notice_approval_serializer import NoticeApprovalSerializer
from ..services import notice_service

class NoticeApproveAPIView(APIView):
    def get_object(self, pk):
        return get_object_or_404(Notice, pk=pk)

    def post(self, request, pk):
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
    def get_object(self, pk):
        return get_object_or_404(Notice, pk=pk)

    def post(self, request, pk):
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
