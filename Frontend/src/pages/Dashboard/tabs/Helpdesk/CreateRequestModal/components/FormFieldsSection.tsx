import React from 'react';
import CustomDropdown from '@/components/ui/CustomDropdown';
import MediaUpload, { type UploadedFile } from '@/components/widgets/MediaUpload';
import type { CreateRequestFormData } from '../types/createRequest.types';

interface FormFieldsSectionProps {
  formData: CreateRequestFormData;
  attachments: UploadedFile[];
  isSubmitting: boolean;
  onChange: (field: keyof CreateRequestFormData, value: any) => void;
  onAttachmentsChange: (files: UploadedFile[]) => void;
}

const FormFieldsSection: React.FC<FormFieldsSectionProps> = ({
  formData,
  attachments,
  isSubmitting,
  onChange,
  onAttachmentsChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1">
          Issue Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          minLength={3}
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all shadow-xs outline-none"
          placeholder="e.g. Lift door not opening on 3rd floor"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Detailed Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none min-h-[120px] shadow-xs"
          placeholder="Please describe the issue in detail..."
        />
      </div>

      {/* Contact & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-full">
            <label className="block text-[10px] font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={(e) => onChange('mobile_number', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1">
            Priority
          </label>
          <CustomDropdown
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium (Default)' },
              { value: 'High', label: 'High (Urgent)' },
            ]}
            value={formData.priority}
            onChange={(val) => onChange('priority', val)}
            className="w-full"
          />
        </div>
      </div>

      {/* Media Upload */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <MediaUpload
          label="Attachments (Photos/Videos)"
          value={attachments}
          onChange={onAttachmentsChange}
          maxFiles={3}
          maxFileSizeMB={150}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
};

export default FormFieldsSection;
