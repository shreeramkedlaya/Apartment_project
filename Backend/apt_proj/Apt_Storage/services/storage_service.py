import uuid
import secrets
from supabase import create_client, Client
from django.conf import settings
from apt_proj.Apt_Storage.exceptions import StorageException
from apt_proj.Apt_Storage.models import Media
from django.db import transaction

class StorageService:
    _instance=None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StorageService, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SECRET_KEY
        self.bucket_name=settings.SUPABASE_STORAGE_BUCKET


        if not url or not key:
            raise StorageException("Supabase URL and Secret Key must be set in environment variables.")
        
        self.client: Client=create_client(url,key)
    
    def generate_upload_authorization(self, user_id, orig_filename, mime_type, file_size, is_public=False):
        """
        Phase 6 functionality: Validates the request and generates a proof token 
        and object path for the client to use for TUS or single-shot upload.
        """

        # 1. Validation logic
        # 2. Generate secure proof token
        proof_token = secrets.token_urlsafe(32)

        # generate a secure, collision-resistant object path

        extension = orig_filename.split('.')[-1] if '.' in orig_filename else 'bin'
        unique_id = uuid.uuid4().hex
        object_path = f"users/{user_id}/{unique_id}.{extension}"

        # 4. Generate presigned upload URL from supabase
        # allows client to standard put without supabase session

        try:
            upload_url_response = self.client.storage.from_(self.bucket_name).create_signed_upload_url(object_path)
            signed_upload_url = upload_url_response.get('signed_url')
        except Exception as e:
            raise StorageException(f"Failed to generate signed upload url for {object_path}: {str(e)}")

        media = Media.objects.create(
            object_path=object_path,
            original_filename=orig_filename,
            mime_type=mime_type,
            file_size=file_size,
            bucket=self.bucket_name,
            is_public=is_public,
            proof_token=proof_token,
            uploaded_by_id = user_id,
            upload_status = Media.UploadStatus.PENDING
        )
        return {
            "media_id": media.id,
            "object_path": object_path,
            "proof_token": proof_token,
            "bucket": self.bucket_name,
            "signed_url": signed_upload_url
        }
    
    def attach_media(self, user, media_id, proof_token, target_obj):
        """
        Validates the proof token and attaches a PENDING media record to the target object.
        Transitions the media to UPLOADED atomically.
        """
        try:
            with transaction.atomic():
                # use select_for_update to prevent race conditions on same media row
                media = Media.objects.select_for_update().get(id=media_id, proof_token=proof_token)

                if media.upload_status != Media.UploadStatus.PENDING:
                    raise StorageException("Media is already uploaded or failed. Cannot re-attach.")

                if media.content_object is not None or media.content_type is not None:
                    raise StorageException("Media already has an owner. Cannot reassign")

                # bind to owner and lock state
                media.content_object = target_obj
                media.upload_status = Media.UploadStatus.UPLOADED
                media.save()

                return media
        except Media.DoesNotExist:
            raise StorageException("Invalid media ID or proof token")
    
    def generate_signed_download_url(self, object_path, expires_in=3600):
        """
        Phase 10 functionality: Generates a temporary, signed download URL.
        """
        try:
            response = self.client.storage.from_(self.bucket_name).create_signed_url(object_path,expires_in)
            return response.get('signedURL')
        except Exception as e:
            raise StorageException(f"Failed to generate signed URL for {object_path}: {str(e)}")

    def generate_batch_signed_urls(self, object_paths:list, expires_in=604800): # 604800s = 7 days
        if not object_paths: return {}
        try:
            response = self.client.storage.from_(self.bucket_name).create_signed_urls(object_paths, expires_in)
            return {item.get('path'): item.get('signedURL') for item in response if 'signedURL' in item}
        except Exception as e:
            raise StorageException(f"Failed to generate batch signed URLs: {str(e)}")