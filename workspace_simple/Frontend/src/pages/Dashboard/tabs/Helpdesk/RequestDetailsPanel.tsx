import React, { useState, useEffect } from 'react';
import { MessageSquare, Activity, CheckCircle, Clock } from 'lucide-react';
import type { HelpdeskRequest } from '@/types/helpdesk.types';
import { HelpdeskService } from './services/helpdesk.service';
import Drawer from '@/components/ui/Drawer';

import RequestTimelineStepper from './RequestTimelineStepper';

export interface RequestDetailsPanelProps {
  request: HelpdeskRequest | null;
  onClose: () => void;
  onRequestUpdated: (updated: HelpdeskRequest) => void;
  canManageTickets: boolean;
}

const RequestDetailsPanel: React.FC<RequestDetailsPanelProps> = ({
  request,
  onClose,
  onRequestUpdated,
  canManageTickets,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [managementData, setManagementData] = useState({
    status: 'Open',
    resolution_notes: '',
  });

  useEffect(() => {
    console.log('request', request)
    if (request) {
      setManagementData({
        status: request.status,
        resolution_notes: request.resolution_notes || '',
      });
    }
  }, [request]);

  if (!request) return null;

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const updated = await HelpdeskService.updateRequest(request.id, {
        status: managementData.status as any,
        resolution_notes: managementData.resolution_notes,
      });
      onRequestUpdated(updated);
    } catch (error) {
      console.error('Failed to update request', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Drawer
      isOpen={!!request}
      onClose={onClose}
      title="Request Details"
      width="xl"
    >
      <div className="space-y-8">
        <RequestTimelineStepper currentStatus={request.status} />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {request.id}
            </span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {request.priority} Priority
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {request.status}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 dark:border-gray-800">
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Category</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{request.category_name || request.category}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Location</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {request.is_flat_specific ? (request.flat_number || 'Flat') : 'Common Area'}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Raised By</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {request.created_by?.name || 'Resident'}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Contact</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {request.mobile_number}
            </span>
          </div>
        </div>

        {canManageTickets && (
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
                onChange={(e) => setManagementData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Open">Open</option>
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
                onChange={(e) => setManagementData(prev => ({ ...prev, resolution_notes: e.target.value }))}
              ></textarea>
            </div>

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              {isUpdating ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      {request.timeline && request.timeline.length > 0 && (
        <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" />
            Activity Timeline
          </h4>
          <div className="space-y-4">
            {request.timeline.map((entry, idx) => (
              <div key={entry.id} className="relative flex gap-3">
                {/* Timeline vertical line */}
                {idx !== request.timeline!.length - 1 && (
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
                      Changed status from <span className="font-semibold text-gray-700 dark:text-gray-300">{entry.status_from}</span> to <span className="font-semibold text-blue-600 dark:text-blue-400">{entry.status_to}</span>
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
        </div>
      )}
    </Drawer>
  );
};

export default RequestDetailsPanel;
