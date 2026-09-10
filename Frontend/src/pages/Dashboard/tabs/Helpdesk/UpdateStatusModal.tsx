import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { HelpdeskService } from './services/helpdesk.service';
import type { HelpdeskRequest } from '@/types/helpdesk.types';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: HelpdeskRequest | null;
  onStatusUpdated: (updated: HelpdeskRequest) => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  request,
  onStatusUpdated,
}) => {
  const [status, setStatus] = useState<string>('Open');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request && isOpen) {
      setStatus(request.status);
      setResolutionNotes('');
    }
  }, [request, isOpen]);

  const handleSubmit = async () => {
    if (!request) return;
    try {
      setIsSubmitting(true);
      const payload: any = { status: status as any };
      if (resolutionNotes.trim()) {
        payload.resolution_notes = resolutionNotes.trim();
      }
      
      const updated = await HelpdeskService.updateRequest(request.id, payload);
      onStatusUpdated(updated);
      onClose();
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update the status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Status"
      width="small"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (status === request.status && !resolutionNotes.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update the status for request <strong className="text-gray-900 dark:text-white">#{request.id} - {request.title}</strong>
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Internal Note / Resolution <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Add a note to the timeline..."
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[80px] resize-y"
          />
        </div>
      </div>
    </Modal>
  );
};

export default UpdateStatusModal;
