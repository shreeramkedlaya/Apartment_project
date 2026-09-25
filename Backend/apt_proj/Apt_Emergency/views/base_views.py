from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from django.core.exceptions import ObjectDoesNotExist

class BaseAPIView(APIView):
    """
    Base APIView that enforces the project's backend guidelines for the DRY get_object pattern.
    Classes inheriting from this must define the `model` attribute.
    """
    model = None

    def get_object(self, pk):
        if self.model is None:
            raise NotImplementedError("You must define the `model` attribute on the class.")
        try:
            return self.model.objects.get(pk=pk)
        except ObjectDoesNotExist:
            raise NotFound(detail="Not found.")
