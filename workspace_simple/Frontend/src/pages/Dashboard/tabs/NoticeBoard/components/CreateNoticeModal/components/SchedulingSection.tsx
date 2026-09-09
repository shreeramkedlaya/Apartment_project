import React from 'react';

interface SchedulingSectionProps {
  publishDate: string;
  setPublishDate: (val: string) => void;
  validUntil: string;
  setValidUntil: (val: string) => void;
  requiresAck: boolean;
  setRequiresAck: (val: boolean) => void;
  acknowledgeBy: string;
  setAcknowledgeBy: (val: string) => void;
}

export const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  publishDate, setPublishDate,
  validUntil, setValidUntil,
  requiresAck, setRequiresAck,
  acknowledgeBy, setAcknowledgeBy
}) => {
  return (
    <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
      <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">3. Scheduling & Compliance</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Publish Date</label>
          <input
            value={publishDate}
            onChange={e => setPublishDate(e.target.value)}
            type="datetime-local"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
          />
          <p className="text-[11px] text-gray-400">Leave blank to publish immediately</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Valid Until (Expiry)</label>
          <input
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
            type="datetime-local"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresAck}
            onChange={e => setRequiresAck(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Requires Acknowledgement</span>
        </label>

        {requiresAck && (
          <div className="pl-6 pt-1 space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Acknowledge By Deadline</label>
            <input
              required={requiresAck}
              value={acknowledgeBy}
              onChange={e => setAcknowledgeBy(e.target.value)}
              type="datetime-local"
              className="w-full max-w-xs px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
            />
          </div>
        )}
      </div>
    </section>
  );
};
