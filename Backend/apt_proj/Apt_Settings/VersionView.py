from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

class VersionView(APIView):
    def get(self, request):
        return Response(
            {
                "version": settings.VERSION,
                "main_version": settings.MAIN_VERSION,
                "sub_version": settings.SUB_VERSION,
            },
            status=status.HTTP_200_OK,
        )