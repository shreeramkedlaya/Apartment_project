import React from 'react';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

interface SchedulingSectionProps {
  publishMode: 'immediate' | 'scheduled';
  setPublishMode: (val: 'immediate' | 'scheduled') => void;
  publishDate: string;
  setPublishDate: (val: string) => void;
  validUntil: string;
  setValidUntil: (val: string) => void;
}

export const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  publishMode, setPublishMode,
  publishDate, setPublishDate,
  validUntil, setValidUntil
}) => {
  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Publish Mode</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={publishMode === 'immediate'}
              onChange={() => setPublishMode('immediate')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Publish Immediately</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={publishMode === 'scheduled'}
              onChange={() => setPublishMode('scheduled')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Schedule for Later</span>
          </label>
        </div>

        {publishMode === 'scheduled' && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="space-y-1 z-20 max-w-xs">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Publish Date</label>
              <CustomDatePicker
                value={publishDate}
                onChange={setPublishDate}
                mode="datetime"
                placeholder="Select publish time"
              />
            </div>
          </div>
        )}

        <div className="mt-5 space-y-1 z-10 max-w-xs">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Valid Until (Expiry)</label>
          <CustomDatePicker
            value={validUntil}
            onChange={setValidUntil}
            mode="datetime"
            placeholder="Select expiry time (optional)"
          />
          <p className="text-[10px] text-gray-500">Notice will be auto-archived after this time.</p>
        </div>
      </div>
    </section>
  );
};
