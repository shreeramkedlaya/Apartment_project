import React from 'react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import MediaUpload, { type UploadedFile } from '@/components/widgets/MediaUpload';
import type { NoticeFormData } from '../types/noticeForm.types';
import { NOTICE_CATEGORIES, NOTICE_PRIORITIES } from '../utils/noticeConstants';

interface ContentSectionProps {
  formData: NoticeFormData;
  updateField: <K extends keyof NoticeFormData>(key: K, value: NoticeFormData[K]) => void;
  editNotice: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  formData,
  updateField,
  editNotice,
}) => {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={formData.title}
          onChange={e => updateField('title', e.target.value)}
          type="text"
          className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="E.g., Scheduled Power Cut"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Message Body <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={formData.content}
          onChange={e => updateField('content', e.target.value)}
          rows={3}
          className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-y min-h-[68px]"
          placeholder="Enter the full details here..."
        />
      </div>

      {/* Category and Priority in a single row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <div className="space-y-1 z-30">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Category</label>
          <CustomDropdown
            value={formData.category}
            onChange={(val: string) => updateField('category', val)}
            options={[...NOTICE_CATEGORIES]}
            placeholder="Select Category"
          />
        </div>

        <div className="space-y-1 z-20">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Priority</label>
          <CustomDropdown
            value={formData.priority}
            onChange={(val: string) => updateField('priority', val as 'Low' | 'Medium' | 'Critical')}
            options={[...NOTICE_PRIORITIES]}
            placeholder="Priority"
          />
        </div>
      </div>

      {!editNotice && (
        <div>
          <MediaUpload
            label="Attachments (Images/PDF)"
            value={formData.files}
            onChange={(files: UploadedFile[]) => updateField('files', files)}
            maxFiles={3}
            compact
          />
        </div>
      )}
    </section>
  );
};

export default ContentSection;