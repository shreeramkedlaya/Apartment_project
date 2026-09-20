import React from 'react';
import { Activity, CheckCircle, MessageSquare, Clock } from 'lucide-react';
import type { RequestTimelineEntry } from '@/types/helpdesk.types';

interface ActivityTimelineSectionProps {
  timeline: RequestTimelineEntry[];
  commentText: string;
  isCommenting: boolean;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
}

const ActivityTimelineSection: React.FC<ActivityTimelineSectionProps> = ({
  timeline,
  commentText,
  isCommenting,
  onCommentChange,
  onAddComment,
}) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4" />
        Activity Timeline
      </h4>
      <div className="space-y-4">
        {timeline.map((entry, idx) => (
          <div key={entry.id} className="relative flex gap-3">
            {/* Timeline vertical line */}
            {idx !== timeline.length - 1 && (
              <div className="absolute left-3.5 top-8 bottom-[-16px] w-0.5 bg-gray-100 dark:bg-gray-800" />
            )}

            {/* Icon */}
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-10">
              {entry.status_to ? (
                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-900 dark:text-white">
                  {entry.updated_by?.name || 'System'}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>

              {entry.status_from && entry.status_to && (
                <div className="text-xs text-gray-500 mt-1">
                  Changed status from{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {entry.status_from}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {entry.status_to}
                  </span>
                </div>
              )}

              {entry.comment && (
                <div className="mt-1.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  {entry.comment}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comment Input Box */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => onCommentChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
          placeholder="Type a comment or update..."
          className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          disabled={isCommenting}
        />
        <button
          onClick={onAddComment}
          disabled={isCommenting || !commentText.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all"
        >
          {isCommenting ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ActivityTimelineSection;
