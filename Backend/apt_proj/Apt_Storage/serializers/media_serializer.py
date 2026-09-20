from rest_framework import serializers
from django.utils import timezone
from apt_proj.Apt_Storage.models import Media
from apt_proj.Apt_Storage.services.storage_service import StorageService

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['id', 'original_filename', 'mime_type', 'file_size', 'upload_status', 'object_path', 'signed_url', 'signed_url_expires']

def enrich_media_with_signed_urls(items: list, media_key: str = 'media'):
    """
    Scans a list of serialized dictionaries for media items whose signed_url is missing or expired.
    Batches Supabase create_signed_urls for all needed objects, updates DB in bulk,
    and injects fresh signed_urls directly into the response payload.
    """
    now = timezone.now()
    media_to_refresh = []

    for item in items:
        for m in item.get(media_key, []):
            expires = m.get('signed_url_expires')
            if not m.get('signed_url') or not expires or now >= (expires - timezone.timedelta(hours=1)):
                if m.get('object_path'):
                    media_to_refresh.append(m)

    if media_to_refresh:
        paths_to_refresh = list(set(m['object_path'] for m in media_to_refresh))
        storage = StorageService()
        new_urls = storage.generate_batch_signed_urls(paths_to_refresh, expires_in=604800)

        media_updates = []
        new_expiry = now + timezone.timedelta(days=7)
        for m_data in media_to_refresh:
            fresh_url = new_urls.get(m_data['object_path'])
            if fresh_url:
                m_data['signed_url'] = fresh_url
                m_data['signed_url_expires'] = new_expiry

                media_instance = Media(id=m_data['id'])
                media_instance.signed_url = fresh_url
                media_instance.signed_url_expires = new_expiry
                media_updates.append(media_instance)
        
        if media_updates:
            Media.objects.bulk_update(media_updates, ['signed_url', 'signed_url_expires'])

    return items