from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apt_proj.Apt_Storage.models import Media
from apt_proj.Apt_Storage.services.storage_service import StorageService
import logging

logger = logging.getLogger(__name__)


@shared_task
def purge_orphan_media():
    """
    Finds PENDING media records older than 24 hours and safely deletes 
    them from both Supabase and the local database.
    """
    cutoff = timezone.now() - timedelta(hours=24)
    orphans = Media.objects.filter(
        upload_status=Media.UploadStatus.PENDING,
        created_at__lt=cutoff
    )

    orphan_count = orphans.count()
    if orphan_count == 0:
        logger.info("No orphan media records found")
        return "0 orphans purged"

    object_paths = list(orphans.values_list('object_path', flat=True))

    try:
        # 1. delete actual files from supabase
        storage_service = StorageService()
        storage_service.delete_media_batch(object_paths)

        # 2. delete rows from database
        orphans.delete()

        logger.info(f"Successfully purged {orphan_count} orphan media records")
        return f"Purged {orphan_count} orphans"

    except Exception as e:
        logger.error(f"Failed to purge orphan media: {str(e)}")
        raise