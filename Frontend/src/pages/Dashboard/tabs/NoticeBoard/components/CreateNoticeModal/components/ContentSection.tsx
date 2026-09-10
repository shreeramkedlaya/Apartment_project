import React from 'react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import MediaUpload, { type UploadedFile } from '@/components/widgets/MediaUpload';

interface ContentSectionProps {
  title: string;
  setTitle: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  priority: 'Low' | 'Medium' | 'Critical';
  setPriority: (val: 'Low' | 'Medium' | 'Critical') => void;
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
  editNotice: boolean;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title, setTitle,
  category, setCategory,
  content, setContent,
  priority, setPriority,
  files, setFiles,
  editNotice
}) => {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">1. Notice Content</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            type="text"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200
            dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
            outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="E.g., Scheduled Power Cut"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Category</label>
          <CustomDropdown
            value={category}
            onChange={setCategory}
            options={['General', 'Water', 'Power', 'Maintenance', 'Security']}
            placeholder="Select Category"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Message Body <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200
          dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
          outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Enter the full details here..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Priority</label>
        <div className="flex gap-2">
          {(['Low', 'Medium', 'Critical'] as const).map(p => (
            <button
              type="button"
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${priority === p
                ? p === 'Critical'
                  ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-semibold'
                  : p === 'Medium'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-semibold'
                    : 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!editNotice && (
        <div className="mt-2">
          <MediaUpload
            label="Attachments (Images/PDF)"
            value={files}
            onChange={setFiles}
            maxFiles={3}
          />
        </div>
      )}
    </section>
  );
};
