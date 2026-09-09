import { useState } from 'react';
import type { Notice } from '../tabs/NoticeBoard/services/notice.service';
import { noticeService } from '../tabs/NoticeBoard/services/notice.service';
import { useToast } from '@/context/ToastContext';
import { FileText, CheckCircle2, CheckSquare, Loader2, Calendar } from 'lucide-react';

interface Props {
  notice: Notice;
  onAcknowledged: () => void;
}

export default function ResidentNoticeCard({ notice, onAcknowledged }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      await noticeService.acknowledgeNotice(notice.id);
      showToast('Notice acknowledged successfully!', 'success');
      onAcknowledged();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to acknowledge', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCritical = notice.priority === 'Critical';
  
  // Checking if the user has already acknowledged this notice.
  // In `getMyNotices()`, the backend should ideally return notice.acknowledgements filtered to just the current user.
  // Alternatively, we can assume if it's returned and `requires_acknowledgement` is true, we check the nested array.
  const myAck = notice.acknowledgements?.find(a => a.status === 'Acknowledged');
  const needsAck = notice.requires_acknowledgement && !myAck;

  return (
    <div className={`p-5 rounded-2xl border transition-all shadow-sm flex flex-col gap-4 ${isCritical ? 'border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800'}`}>
      
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {notice.category}
            </span>
            {isCritical && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full animate-pulse"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"/> CRITICAL</span>}
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {notice.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(notice.publish_date).toLocaleDateString()}</span>
            <span>•</span>
            <span>By {notice.created_by}</span>
          </div>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">
        {notice.content}
      </div>

      {notice.attachments && notice.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {notice.attachments.map(att => (
            <a key={att.id} href={att.file} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              Attachment
            </a>
          ))}
        </div>
      )}

      {needsAck && (
        <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <CheckSquare className="w-4 h-4" /> Action Required
              </span>
              <span className="text-xs text-gray-500">
                Please acknowledge reading this notice {notice.acknowledge_by ? `before ${new Date(notice.acknowledge_by).toLocaleDateString()}` : ''}.
              </span>
            </div>
            <button 
              onClick={handleAcknowledge} 
              disabled={loading}
              className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Acknowledge
            </button>
          </div>
        </div>
      )}
      
      {myAck && (
        <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> You acknowledged this notice
        </div>
      )}
    </div>
  );
}
