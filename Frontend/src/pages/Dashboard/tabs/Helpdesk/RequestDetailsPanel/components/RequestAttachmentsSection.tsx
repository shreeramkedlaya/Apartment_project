import React from 'react';
import { FileText } from 'lucide-react';
import type { HelpdeskRequest } from '@/types/helpdesk.types';

interface RequestAttachmentsSectionProps {
  media: NonNullable<HelpdeskRequest['media']>;
}

const RequestAttachmentsSection: React.FC<RequestAttachmentsSectionProps> = ({ media }) => {
  if (!media || media.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Attachments</h4>
      <div className="grid grid-cols-2 gap-3">
        {media.map((item) => (
          <a
            key={item.id}
            href={item.signed_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group cursor-pointer"
          >
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 transition-colors">
              {item.original_filename}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default RequestAttachmentsSection;
