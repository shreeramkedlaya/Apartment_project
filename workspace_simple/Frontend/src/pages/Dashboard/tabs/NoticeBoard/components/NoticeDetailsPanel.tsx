import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { noticeService } from '../services/notice.service';
import type { Notice } from '../services/notice.service';
import { X, Send, XCircle, FileText, CheckSquare } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import NoticeApprovalModal from './NoticeApprovalModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface NoticeDetailsPanelProps {
  notice: Notice | null;
  onClose: () => void;
  onNoticeUpdated: () => void;
  canManageNotices: boolean;
}

const NoticeDetailsPanel: React.FC<NoticeDetailsPanelProps> = ({
  notice,
  onClose,
  onNoticeUpdated,
  canManageNotices,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [confirmAction, setConfirmAction] = useState<'publish' | 'cancel' | null>(null);

  if (!notice) return null;

  const handlePublish = async () => {
    setLoading(true);
    try {
      await noticeService.publishNotice(notice.id);
      showToast('Notice published successfully', 'success');
      onNoticeUpdated();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to publish', 'error');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await noticeService.cancelNotice(notice.id);
      showToast('Notice cancelled', 'success');
      onNoticeUpdated();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to cancel', 'error');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const renderStatusBadge = () => {
    switch(notice.status) {
      case 'Published': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Published</span>;
      case 'Draft': return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Draft</span>;
      case 'Scheduled': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Scheduled</span>;
      case 'Cancelled': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Cancelled</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{notice.status}</span>;
    }
  };

  const renderTargeting = () => {
    const audience = notice.target_audience;
    if (!audience || !Array.isArray(audience) || audience.length === 0) {
      return <div className="text-sm text-gray-500">Broadcast to Everyone</div>;
    }

    const roles = audience.map(a => a.role).filter(Boolean);
    const blocks = audience.map(a => a.block).filter(Boolean);
    const flats = audience.map(a => a.flat).filter(Boolean);

    if (!roles.length && !blocks.length && !flats.length) {
      return <div className="text-sm text-gray-500">Broadcast to Everyone</div>;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {roles.map((r: string, i: number) => <span key={`r-${i}`} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">{r}</span>)}
        {blocks.map((b: string, i: number) => <span key={`b-${i}`} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded border border-teal-100">{b}</span>)}
        {flats.map((f: string, i: number) => <span key={`f-${i}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">{f}</span>)}
      </div>
    );
  };



  if (!notice || !mounted) return null;

  const panelContent = (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notice Details</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{notice.title}</h3>
              {renderStatusBadge()}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {notice.category}</span>
              <span className={`flex items-center gap-1 ${notice.priority === 'Critical' ? 'text-red-500 font-semibold' : ''}`}><AlertIcon priority={notice.priority} /> {notice.priority}</span>
              <span>By {notice.created_by}</span>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            {notice.content}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Target Audience</h4>
            {renderTargeting()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Publish Date</div>
              <div className="text-sm font-medium">{notice.publish_date ? new Date(notice.publish_date).toLocaleString() : 'Immediate'}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Valid Until</div>
              <div className="text-sm font-medium">{notice.valid_until ? new Date(notice.valid_until).toLocaleString() : 'Forever'}</div>
            </div>
          </div>

          {notice.requires_acknowledgement && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                <CheckSquare className="w-4 h-4" /> Requires Acknowledgement
              </h4>
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                Deadline: {notice.acknowledge_by ? new Date(notice.acknowledge_by).toLocaleString() : 'None'}
              </div>
              
              {/* Basic Metrics display if admin */}
              {canManageNotices && notice.acknowledgements && (
                <div className="mt-4 border-t border-blue-200 dark:border-blue-800 pt-4">
                  <div className="text-xs font-semibold mb-2">Metrics (Total: {notice.acknowledgements.length})</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-emerald-600 font-medium">
                      {notice.acknowledgements.filter(a => a.status === 'Acknowledged').length} Acknowledged
                    </span>
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-amber-600 font-medium">
                      {notice.acknowledgements.filter(a => a.status === 'Pending').length} Pending
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Attachments</h4>
              <div className="grid grid-cols-2 gap-3">
                {notice.attachments.map(att => (
                  <a key={att.id} href={att.file} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group cursor-pointer">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 transition-colors">
                      {att.file.split('/').pop()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {canManageNotices && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-2">
            {notice.status === 'Draft' && (
              <button onClick={() => setIsApprovalModalOpen(true)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                Request Approval
              </button>
            )}
            
            {notice.status === 'Draft' && (
              <button disabled={loading} onClick={() => setConfirmAction('publish')} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Send className="w-4 h-4" /> Publish Now
              </button>
            )}

            {(notice.status === 'Draft' || notice.status === 'Scheduled' || notice.status === 'Published') && (
              <button disabled={loading} onClick={() => setConfirmAction('cancel')} className="w-full py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors">
                <XCircle className="w-4 h-4" /> Cancel Notice
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {createPortal(panelContent, document.body)}

      <NoticeApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        noticeId={notice.id}
        onDecisionComplete={() => {
          setIsApprovalModalOpen(false);
          onNoticeUpdated();
          onClose();
        }}
      />

      <ConfirmModal
        isOpen={confirmAction === 'publish'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handlePublish}
        title="Publish Notice"
        message="Are you sure you want to publish this notice? It will become visible to the targeted residents immediately."
        confirmText="Publish"
        isLoading={loading}
      />

      <ConfirmModal
        isOpen={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCancel}
        title="Cancel Notice"
        message="Are you sure you want to cancel this notice? This action will mark it as cancelled."
        confirmText="Cancel Notice"
        isDestructive={true}
        isLoading={loading}
      />
    </>
  );
};

export default NoticeDetailsPanel;

function AlertIcon({ priority }: { priority: string }) {
  if (priority === 'Critical') return <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />;
  if (priority === 'Medium') return <div className="w-2 h-2 rounded-full bg-amber-500" />;
  return <div className="w-2 h-2 rounded-full bg-blue-500" />;
}
