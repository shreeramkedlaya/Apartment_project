import React from 'react';
import Drawer from '@/components/ui/Drawer';
import type { RequestDetailsPanelProps } from './types/requestDetails.types';
import { useRequestDetails } from './hooks/useRequestDetails';
import RequestTimelineStepper from './components/RequestTimelineStepper';
import RequestHeaderInfo from './components/RequestHeaderInfo';
import RequestAttachmentsSection from './components/RequestAttachmentsSection';
import ManagementUpdateSection from './components/ManagementUpdateSection';
import ActivityTimelineSection from './components/ActivityTimelineSection';

const RequestDetailsPanel: React.FC<RequestDetailsPanelProps> = ({
  request,
  onClose,
  onRequestUpdated,
  canManageTickets,
}) => {
  const {
    managementData,
    setManagementData,
    commentText,
    setCommentText,
    isUpdating,
    isCommenting,
    handleAddComment,
    handleUpdate,
  } = useRequestDetails({
    request,
    onRequestUpdated,
  });

  if (!request) return null;

  return (
    <Drawer
      isOpen={!!request}
      onClose={onClose}
      title="Request Details"
      width="xl"
    >
      <div className="space-y-8">
        <RequestTimelineStepper currentStatus={request.status} />

        <RequestHeaderInfo request={request} />

        {request.media && request.media.length > 0 && (
          <RequestAttachmentsSection media={request.media} />
        )}

        {canManageTickets && (
          <ManagementUpdateSection
            managementData={managementData}
            isUpdating={isUpdating}
            onChange={(patch) => setManagementData((prev) => ({ ...prev, ...patch }))}
            onUpdate={handleUpdate}
          />
        )}
      </div>

      {request.timeline && request.timeline.length > 0 && (
        <ActivityTimelineSection
          timeline={request.timeline}
          commentText={commentText}
          isCommenting={isCommenting}
          onCommentChange={setCommentText}
          onAddComment={handleAddComment}
        />
      )}
    </Drawer>
  );
};

export default RequestDetailsPanel;
