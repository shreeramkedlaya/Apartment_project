from rest_framework.views import exception_handler

def standardized_exception_handler(exc, context):
    """
    Overrides the default exception handler to fit the standardized format:
    {
      "status": "error",
      "error": <error_detail>
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Wrap the original error data
        custom_data = {
            "status": "error",
            "error": response.data
        }
        response.data = custom_data

    return response
