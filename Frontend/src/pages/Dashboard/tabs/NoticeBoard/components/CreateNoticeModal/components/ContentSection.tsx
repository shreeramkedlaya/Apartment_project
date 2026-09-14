import React from 'react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
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
  requiresAck: boolean;
  setRequiresAck: (val: boolean) => void;
  acknowledgeBy: string;
  setAcknowledgeBy: (val: string) => void;
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
  editNotice: boolean;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title, setTitle,
  category, setCategory,
  content, setContent,
  priority, setPriority,
  requiresAck, setRequiresAck,
  acknowledgeBy, setAcknowledgeBy,
  files, setFiles,
  editNotice
}) => {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          type="text"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="E.g., Scheduled Power Cut"
        />
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
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-y min-h-[100px]"
          placeholder="Enter the full details here..."
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-1 z-30">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Category</label>
          <CustomDropdown
            value={category}
            onChange={setCategory}
            options={[
              'General', 'Water', 'Electricity', 'Maintenance', 
              'Security', 'Facility', 'Finance', 'Community', 
              'Emergency', 'Event'
            ]}
            placeholder="Select Category"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-1 z-20">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <CustomDropdown
              value={priority}
              onChange={(val: string) => setPriority(val as 'Low' | 'Medium' | 'Critical')}
              options={['Low', 'Medium', 'Critical']}
              placeholder="Priority"
            />
          </div>

          <div className="space-y-1 z-10">
            {/* Invisible label to align the checkbox vertically with the Priority dropdown */}
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 invisible">Acknowledgement</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center h-[38px]">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresAck}
                    onChange={e => setRequiresAck(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">Requires Acknowledgement</span>
                </label>
              </div>

              {requiresAck && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <CustomDatePicker
                    value={acknowledgeBy}
                    onChange={setAcknowledgeBy}
                    mode="date"
                    placeholder="Deadline date"
                  />
                </div>
              )}
            </div>
          </div>
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
