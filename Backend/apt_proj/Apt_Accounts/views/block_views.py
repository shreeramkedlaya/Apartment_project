from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.cache import cache
from ..Accounts_models import Block

class BlocksView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        data = cache.get('blocks_api_data')
        if data is None:
            blocks = Block.objects.all().prefetch_related('flats')
            data = []
            for b in blocks:
                data.append({
                    "id": b.id,
                    "name": b.name,
                    "flats": [{"id": f.id, "number": f.number} for f in b.flats.all()]
                })
            # Cache for 24 hours
            cache.set('blocks_api_data', data, 60 * 60 * 24)
        return Response(data)
