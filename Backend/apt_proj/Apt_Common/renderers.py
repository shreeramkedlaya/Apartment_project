from rest_framework.renderers import JSONRenderer

class StandardizedJSONRenderer(JSONRenderer):
    """
    Wraps all successful DRF JSON responses in:
    {
      "status": "success",
      "data": <original_data>
    }
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        # Determine status code
        status_code = 200
        if renderer_context and 'response' in renderer_context:
            status_code = renderer_context['response'].status_code

        # If data is already wrapped (like in exception handler), return as is
        if isinstance(data, dict) and 'status' in data and data['status'] in ('success', 'error'):
            return super().render(data, accepted_media_type, renderer_context)

        # Wrap it
        if status_code >= 400:
            wrapped_data = {
                "status": "error",
                "error": data
            }
        else:
            wrapped_data = {
                "status": "ok",
                "data": data
            }

        return super().render(wrapped_data, accepted_media_type, renderer_context)
