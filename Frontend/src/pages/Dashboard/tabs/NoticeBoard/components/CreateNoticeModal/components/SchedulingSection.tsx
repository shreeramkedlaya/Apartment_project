import React from 'react';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { Send, Calendar } from 'lucide-react';
import type { NoticeFormData } from '../types/noticeForm.types';

interface SchedulingSectionProps {
  formData: NoticeFormData;
  updateField: <K extends keyof NoticeFormData>(key: K, value: NoticeFormData[K]) => void;
}

const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  formData,
  updateField,
}) => {
  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Publish Mode</label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => updateField('publishMode', 'immediate')}
            className={`
              relative p-3 rounded-lg border cursor-pointer transition-all duration-200
              ${formData.publishMode === 'immediate'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-xs'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700/70 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
              }
            `}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${formData.publishMode === 'immediate' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  <Send className="w-3.5 h-3.5" /> Publish Immediately
                </span>
                {formData.publishMode === 'immediate' && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                Notice goes live to all targeted members right away.
              </span>
            </div>
          </div>

          <div
            onClick={() => updateField('publishMode', 'scheduled')}
            className={`
              relative p-3 rounded-lg border cursor-pointer transition-all duration-200
              ${formData.publishMode === 'scheduled'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-xs'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700/70 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
              }
            `}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${formData.publishMode === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  <Calendar className="w-3.5 h-3.5" /> Schedule for Later
                </span>
                {formData.publishMode === 'scheduled' && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                Pick a future date and time for automatic publishing.
              </span>
            </div>
          </div>
        </div>

        {/* Date Inputs Grid */}
        <div className={`grid grid-cols-1 ${formData.publishMode === 'scheduled' ? 'md:grid-cols-2' : ''} gap-4 pt-1`}>
          {formData.publishMode === 'scheduled' && (
            <div className="space-y-1 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Publish Date & Time <span className="text-red-500">*</span></label>
              <CustomDatePicker
                value={formData.publishDate}
                onChange={(val: string) => updateField('publishDate', val)}
                mode="datetime"
                placeholder="Select publish date & time"
              />
            </div>
          )}

          <div className="space-y-1 z-10">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>Valid Until (Expiry)</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Default: 2 weeks</span>
            </label>
            <CustomDatePicker
              value={formData.validUntil}
              onChange={(val: string) => updateField('validUntil', val)}
              mode="datetime"
              placeholder="Select expiry time"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Notice will be auto-archived after this time.</p>
          </div>
        </div>

        {/* Acknowledgement Block */}
        <div className="p-2.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-3 min-h-[46px] mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={formData.requiresAck}
              onChange={e => {
                const checked = e.target.checked;
                updateField('requiresAck', checked);
                if (checked && !formData.acknowledgeBy) {
                  const today = new Date();
                  today.setHours(23, 59, 59, 0);
                  const offset = today.getTimezoneOffset() * 60000;
                  const localISOTime = new Date(today.getTime() - offset).toISOString().slice(0, -1);
                  updateField('acknowledgeBy', localISOTime);
                }
              }}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Requires Acknowledgement</span>
          </label>

          {formData.requiresAck && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200 w-44 sm:w-52 shrink-0">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:inline">Deadline:</span>
              <CustomDatePicker
                value={formData.acknowledgeBy}
                onChange={(val: string) => updateField('acknowledgeBy', val)}
                mode="date"
                placeholder="Deadline date"
                className="flex-1"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SchedulingSection;