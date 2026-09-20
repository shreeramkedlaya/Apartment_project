import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { ManagementData } from '../types/requestDetails.types';

interface ManagementUpdateSectionProps {
  managementData: ManagementData;
  isUpdating: boolean;
  onChange: (data: Partial<ManagementData>) => void;
  onUpdate: () => void;
}

const ManagementUpdateSection: React.FC<ManagementUpdateSectionProps> = ({
  managementData,
  isUpdating,
  onChange,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Management Update
      </h4>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Update Status
        </label>
        <select
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          value={managementData.status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="Open">Open</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Internal Notes / Resolution
        </label>
        <textarea
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 h-24 resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          placeholder="Add a status update or resolution notes..."
          value={managementData.resolution_notes}
          onChange={(e) => onChange({ resolution_notes: e.target.value })}
        />
      </div>

      <button
        onClick={onUpdate}
        disabled={isUpdating}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
      >
        {isUpdating ? 'Saving...' : 'Save Updates'}
      </button>
    </div>
  );
};

export default ManagementUpdateSection;
