from django.test import TestCase
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from apt_proj.Apt_Storage.models import Media
from apt_proj.Apt_Storage.services.storage_service import StorageService
from apt_proj.Apt_Storage.exceptions import StorageException

User = get_user_model()

class StorageMediaTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        
        # mock supabase client
        self.patcher = patch('apt_proj.Apt_Storage.services.storage_service.create_client')
        self.mock_create = self.patcher.start()
        self.mock_client = MagicMock()
        self.mock_create.return_value = self.mock_client
        self.mock_client.storage.from_.return_value.create_signed_upload_url.return_value = {'signed_url': 'http://mock.supabase.com/upload'}
        
        StorageService._instance = None
        self.storage_service = StorageService()

    def tearDown(self):
        self.patcher.stop()

    def test_generate_upload_authorization_creates_pending_media(self):
        result = self.storage_service.generate_upload_authorization(
            user_id=self.user.id,
            orig_filename='test_image.jpg',
            mime_type='image/jpeg',
            file_size=1024
        )
        
        self.assertIn('media_id', result)
        self.assertIn('proof_token', result)
        
        media = Media.objects.get(id=result['media_id'])
        self.assertEqual(media.upload_status, Media.UploadStatus.PENDING)
        self.assertIsNone(media.content_object)
        self.assertEqual(media.original_filename, 'test_image.jpg')
        self.assertEqual(media.proof_token, result['proof_token'])

    def test_attach_media_success(self):
        result = self.storage_service.generate_upload_authorization(
            user_id=self.user.id,
            orig_filename='test_image.jpg',
            mime_type='image/jpeg',
            file_size=1024
        )
        
        attached_media = self.storage_service.attach_media(
            user=self.user, 
            media_id=result['media_id'], 
            proof_token=result['proof_token'], 
            target_obj=self.user
        )
        
        self.assertEqual(attached_media.upload_status, Media.UploadStatus.UPLOADED)
        self.assertEqual(attached_media.content_type, ContentType.objects.get_for_model(User))
        self.assertEqual(attached_media.obj_id, self.user.id)

    def test_attach_media_invalid_proof_token(self):
        result = self.storage_service.generate_upload_authorization(
            user_id=self.user.id,
            orig_filename='test_image.jpg',
            mime_type='image/jpeg',
            file_size=1024
        )
        
        with self.assertRaisesMessage(StorageException, "Invalid media ID or proof token"):
            self.storage_service.attach_media(
                user=self.user, 
                media_id=result['media_id'], 
                proof_token="wrong_token", 
                target_obj=self.user
            )

    def test_attach_media_cannot_reattach_uploaded(self):
        result = self.storage_service.generate_upload_authorization(
            user_id=self.user.id,
            orig_filename='test_image.jpg',
            mime_type='image/jpeg',
            file_size=1024
        )
        
        # First attach succeeds
        self.storage_service.attach_media(
            user=self.user, 
            media_id=result['media_id'], 
            proof_token=result['proof_token'], 
            target_obj=self.user
        )
        
        # Second attach fails
        with self.assertRaisesMessage(StorageException, "Media is already uploaded or failed. Cannot re-attach."):
            self.storage_service.attach_media(
                user=self.user, 
                media_id=result['media_id'], 
                proof_token=result['proof_token'], 
                target_obj=self.user
            )
