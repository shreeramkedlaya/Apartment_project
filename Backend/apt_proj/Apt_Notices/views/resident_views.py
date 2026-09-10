from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from ..Notices_models import Notice
from ..serializers.notice_serializer import NoticeSerializer
from ..serializers.notice_acknowledgement_serializer import NoticeAcknowledgementSerializer
from ..services import notice_service
from ..services.targeting_service import get_targeted_notices_for_user

class ResidentNoticeListAPIView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
            
        notices = Notice.objects.filter(status=Notice.Status.PUBLISHED).order_by('-publish_date')
        targeted_notices = get_targeted_notices_for_user(request.user, notices)
        
        serializer = NoticeSerializer(targeted_notices, many=True)
        return Response(serializer.data)

class NoticeAcknowledgeAPIView(APIView):
    def get_object(self, pk):
        return get_object_or_404(Notice, pk=pk)

    def post(self, request, pk):
        notice = self.get_object(pk)
        try:
            ack = notice_service.acknowledge_notice(
                notice=notice,
                user=request.user if request.user.is_authenticated else None
            )
            return Response(NoticeAcknowledgementSerializer(ack).data)
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
