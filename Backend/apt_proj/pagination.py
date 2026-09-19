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
            'total': self.page.paginator.count,
            'has_more': self.get_next_link() is not None,
        }
        
        # Inject stats if provided
        if self.stats is not None:
            response_data.update(self.stats)
            
        response_data['results'] = data
        return Response(response_data)
