from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StatsPagination(PageNumberPagination):
    """
    Custom pagination class that allows injecting a 'stats' object
    alongside the standard paginated 'results'.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def __init__(self):
        self.stats = None

    def get_paginated_response(self, data):
        response_data = {
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
        }
        
        # Inject stats if provided
        if self.stats is not None:
            response_data['stats'] = self.stats
            
        response_data['results'] = data
        return Response(response_data)
