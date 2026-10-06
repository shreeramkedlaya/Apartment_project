import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { noticeService } from '../services/notice.service';
import type { Notice } from '../services/notice.service';
import { X, Send, XCircle, FileText, CheckSquare } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [confirmAction, setConfirmAction] = useState<'publish' | 'cancel' | null>(null);
  const [hasAcknowledged, setHasAcknowledged] = useState(notice?.user_has_acknowledged || false);
  const [ackStatus, setAckStatus] = useState<'Acknowledged' | 'Declined' | 'Pending' | null>(
    notice?.user_acknowledgement_status || (notice?.user_has_acknowledged ? 'Acknowledged' : null)
  );

  useEffect(() => {
    setHasAcknowledged(notice?.user_has_acknowledged || false);
    setAckStatus(
      notice?.user_acknowledgement_status || (notice?.user_has_acknowledged ? 'Acknowledged' : null)
    );
  }, [notice?.id, notice?.user_has_acknowledged, notice?.user_acknowledgement_status]);

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

  const handleAcknowledge = async (action: 'accept' | 'decline' = 'accept') => {
    setLoading(true);
    try {
      await noticeService.acknowledgeNotice(notice.id, action);
      setHasAcknowledged(true);
      setAckStatus(action === 'decline' ? 'Declined' : 'Acknowledged');
      showToast(action === 'decline' ? 'Notice response recorded (Declined)' : 'Notice accepted successfully', 'success');
      onNoticeUpdated();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.response?.data?.detail || 'Failed to submit response', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* 
  // Redundant status badge commented out per UI streamlining request
  const renderStatusBadge = () => {
    switch (notice.status) {
      case 'Published': return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Published</span>;
      case 'Draft': return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Draft</span>;
      case 'Scheduled': return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Scheduled</span>;
      case 'Cancelled': return <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Cancelled</span>;
      default: return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{notice.status}</span>;
    }
  };
  */

  const renderTargeting = () => {
    const audience = notice.target_audience;
    if (!audience || !Array.isArray(audience) || audience.length === 0) {
      return <span className="text-xs text-gray-500">Everyone</span>;
    }

    const roles = audience.map(a => a.role).filter(Boolean);
    const blocks = audience.map(a => a.block).filter(Boolean);
    const flats = audience.map(a => a.flat).filter(Boolean);

    if (!roles.length && !blocks.length && !flats.length) {
      return <span className="text-xs text-gray-500">Everyone</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {roles.map((r: string, i: number) => <span key={`r-${i}`} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded border border-indigo-100 dark:border-indigo-800/60">{r}</span>)}
        {blocks.map((b: string, i: number) => <span key={`b-${i}`} className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-medium rounded border border-teal-100 dark:border-teal-800/60">{b}</span>)}
        {flats.map((f: string, i: number) => <span key={`f-${i}`} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-100 dark:border-blue-800/60">{f}</span>)}
      </div>
    );
  };

  if (!notice || !mounted) return null;

  const panelContent = (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col transform transition-transform duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Notice Details</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Compact & Non-scrollable for standard notices */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Title & Metadata */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-snug">{notice.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200/50 dark:border-gray-700/50">
                <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400" /> {notice.category}
              </span>
              <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded border ${notice.priority === 'Critical' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200/50 dark:border-red-900/50' :
                  notice.priority === 'Medium' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 dark:border-amber-900/50' :
                    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200/50 dark:border-blue-900/50'
                }`}>
                <AlertIcon priority={notice.priority} /> {notice.priority}
              </span>
              <span>By {notice.created_by}</span>
            </div>
          </div>

          {/* Description Content */}
          <div className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/70 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 leading-relaxed shadow-sm">
            {notice.content}
          </div>

          {/* Target Audience Row */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Target:</span>
            {renderTargeting()}
          </div>

          {/*
          // Bulky publish & validity grid commented out to save vertical height
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
          */}

          {/* Acknowledgement Block */}
          {notice.requires_acknowledgement && (
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Response Required
                </span>
                {notice.acknowledge_by && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400">
                    Due: {new Date(notice.acknowledge_by).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Metrics display for manager / author (Total count hidden per user preference) */}
              {(canManageNotices || notice.is_author) && notice.acknowledgements && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 rounded text-xs font-medium">
                    {notice.acknowledgements.filter(a => a.status === 'Acknowledged').length} Accepted
                  </span>
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50 rounded text-xs font-medium">
                    {notice.acknowledgements.filter(a => a.status === 'Declined').length} Declined
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50 rounded text-xs font-medium">
                    {notice.acknowledgements.filter(a => a.status === 'Pending').length} Pending
                  </span>
                </div>
              )}

              {/* Notice Author Badge */}
              {/* {notice.is_author && (
                <div className="text-xs text-blue-800 dark:text-blue-200 bg-blue-100/70 dark:bg-blue-900/40 border border-blue-200/50 dark:border-blue-800/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                  <span>ℹ️</span> You published this notice
                </div>
              )} */}

              {/* Action Buttons for non-author recipients */}
              {notice.status === 'Published' && !notice.is_author && (notice.can_acknowledge ?? true) && (
                <div className="pt-1">
                  {hasAcknowledged ? (
                    ackStatus === 'Declined' ? (
                      <div className="w-full py-2 bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 select-none">
                        <XCircle className="w-4 h-4" /> Declined ✗
                      </div>
                    ) : (
                      <div className="w-full py-2 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 select-none">
                        <CheckSquare className="w-4 h-4" /> Accepted ✓
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAcknowledge('accept')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAcknowledge('decline')}
                        className="py-2 bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {((notice.media && notice.media.length > 0) || (notice.attachments && notice.attachments.length > 0)) && (
            <div className="pt-1">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Attachments</h4>
              <div className="grid grid-cols-2 gap-2">
                {notice.media && notice.media.length > 0 ? (
                  notice.media.map(item => (
                    <a
                      key={item.id}
                      href={item.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group cursor-pointer"
                    >
                      <div className="w-7 h-7 bg-blue-50 dark:bg-blue-950/50 text-blue-500 dark:text-blue-400 rounded flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.original_filename}
                      </span>
                    </a>
                  ))
                ) : (
                  notice.attachments?.map(att => (
                    <a key={att.id} href={att.file} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group cursor-pointer">
                      <div className="w-7 h-7 bg-blue-50 dark:bg-blue-950/50 text-blue-500 dark:text-blue-400 rounded flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {att.file.split('/').pop()}
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {canManageNotices && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 flex flex-col gap-2">
            {notice.status === 'Draft' && (
              <button disabled={loading} onClick={() => setConfirmAction('publish')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Send className="w-3.5 h-3.5" /> Publish Now
              </button>
            )}

            {(notice.status === 'Draft' || notice.status === 'Scheduled' || notice.status === 'Published') && (
              <button disabled={loading} onClick={() => setConfirmAction('cancel')} className="w-full py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <XCircle className="w-3.5 h-3.5" /> Cancel Notice
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
