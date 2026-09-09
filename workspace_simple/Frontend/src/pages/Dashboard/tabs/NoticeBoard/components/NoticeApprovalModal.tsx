import React, { useState } from 'react';
import { noticeService } from '../services/notice.service';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';

interface NoticeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  noticeId: string;
  onDecisionComplete: () => void;
}

const NoticeApprovalModal: React.FC<NoticeApprovalModalProps> = ({
  isOpen,
  onClose,
  noticeId,
  onDecisionComplete,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await noticeService.approveNotice(noticeId);
      showToast('Notice approved successfully', 'success');
      onDecisionComplete();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to approve', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }
    setLoading(true);
    try {
      await noticeService.rejectNotice(noticeId, rejectionReason);
      showToast('Notice rejected', 'success');
      onDecisionComplete();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to reject', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Notice"
      width="small"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Approving this notice will transition it out of Draft. If the publish date is immediate, it will be published right away.
        </p>

        {isRejecting ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Explain what needs to be changed..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-400 outline-none placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                disabled={loading}
                className="flex-1 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Approve Notice
            </button>
            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              disabled={loading}
              className="w-full py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors"
            >
              Reject Notice
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NoticeApprovalModal;

