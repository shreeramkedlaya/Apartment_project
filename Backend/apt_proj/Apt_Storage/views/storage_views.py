from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from apt_proj.Apt_Storage.services.storage_service import StorageService
from apt_proj.Apt_Storage.exceptions import StorageException

class AuthorizedUploadView(APIView):
    """
    POST /storage/authorize-upload/
    Validates the client's intent to upload a file and returns a secure object path, 
    a presigned upload URL, and a cryptographic proof_token.
    """
    permission_classes=[IsAuthenticated]

    def post(self, request,*args, **kwargs):
        orig_filename = request.data.get('original_filename')
        mime_type = request.data.get('mime_type')
        file_size = request.data.get('file_size')
        is_public = request.data.get('is_public', False)

        if not all([orig_filename,mime_type,file_size]):
            raise ValidationError('Missing required fields: original_filename, mime_type, file_size.')
        try:
            file_size = int(file_size)
        except ValueError:
            raise ValidationError("file_size must be an integer.")
        
        service = StorageService()

        try:
            result = service.generate_upload_authorization(
                user_id=request.user.id,
                orig_filename=orig_filename,
                mime_type=mime_type,
                file_size=file_size,
                is_public=is_public
            )
            return Response(result)

        except StorageException as e:
            raise ValidationError(str(e))