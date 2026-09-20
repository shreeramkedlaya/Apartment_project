import { useState, useEffect } from 'react';
import type { HelpdeskRequest } from '@/types/helpdesk.types';
import { HelpdeskService } from '../../services/helpdesk.service';
import type { ManagementData } from '../types/requestDetails.types';

interface UseRequestDetailsProps {
  request: HelpdeskRequest | null;
  onRequestUpdated: (updated: HelpdeskRequest) => void;
}

export const useRequestDetails = ({
  request,
  onRequestUpdated,
}: UseRequestDetailsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [managementData, setManagementData] = useState<ManagementData>({
    status: 'Open',
    resolution_notes: '',
  });

  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    if (request) {
      setManagementData({
        status: request.status,
        resolution_notes: request.resolution_notes || '',
      });
    }
  }, [request]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !request) return;

    try {
      setIsCommenting(true);
      const updated = await HelpdeskService.updateRequest(request.id, {
        status: request.status as any,
        resolution_notes: commentText.trim(),
      });
      onRequestUpdated(updated);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleUpdate = async () => {
    if (!request) return;
    try {
      setIsUpdating(true);
      const updated = await HelpdeskService.updateRequest(request.id, {
        status: managementData.status as any,
        resolution_notes: managementData.resolution_notes,
      });
      onRequestUpdated(updated);
    } catch (error) {
      console.error('Failed to update request', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    managementData,
    setManagementData,
    commentText,
    setCommentText,
    isUpdating,
    isCommenting,
    handleAddComment,
    handleUpdate,
  };
};
