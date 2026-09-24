from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from ..Notices_models import Notice

class NoticeBaseAPIView(APIView):
    """ Base class providing the get_object helper """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Notice, pk=pk)