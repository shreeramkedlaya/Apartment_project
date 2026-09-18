from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied
from apt_proj.Apt_Storage.models import Media
from apt_proj.Apt_Storage.services.storage_service import StorageService
from apt_proj.Apt_Common.utils import has_perm

class MediaDownloadView(APIView):
    """
    GET /storage/media/<media_id>/download/
    Generates a temporary signed URL for direct client streaming from Supabase.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, media_id, *args, **kwargs):
        try:
            media = Media.objects.get(id=media_id)
        except Media.DoesNotExist:
            raise NotFound("Media not found.")

        # 1. public media
        if media.is_public: pass # authorized

        # 2. Pending/orphaned media
        elif not media.content_type:
            if media.uploaded_by_id != request.user.id:
                raise PermissionDenied("You don't have access to this pending file")

        # 3. Domain-Attached Media Authorization
        else:
            owner = media.content_object
            if not owner: raise NotFound("Media owner not found")
            model_name = media.content_type.model

            if model_name == 'issue':
                is_creator = getattr(owner, 'created_by_id', None) == request.user.id
                is_assigned = getattr(owner, 'assigned_to_id', None) == request.user.id
                is_admin = has_perm(request.user, 'helpdesk.issues.view')
                if not(is_creator or is_assigned or is_admin):
                    raise PermissionDenied("You don't have access to this file")
            
            elif model_name == 'notice':
                from apt_proj.Apt_Notices.Notices_models import Notice
                is_published = getattr(owner, 'status', None) == Notice.Status.PUBLISHED
                is_admin = has_perm(request.user, 'community.notices.view')

                if not(is_published or is_admin):
                    raise PermissionDenied("You don't have access to this file")

            else:
                # fallback for others
                raise PermissionDenied(f"Access control for {model_name} is not implemented.")
        
        # all checks pass, generate url
        service = StorageService()
        
        try:
            # Generate a 1-hour signed URL (3600 seconds)
            signed_url = service.generate_signed_download_url(media.object_path, expires_in=3600)
            return Response({"url": signed_url})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
