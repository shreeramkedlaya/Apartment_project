import React from 'react';
import type { HelpdeskRequest } from '@/types/helpdesk.types';

interface RequestHeaderInfoProps {
  request: HelpdeskRequest;
}

const RequestHeaderInfo: React.FC<RequestHeaderInfoProps> = ({ request }) => {
  return (
    <>
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
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {request.category_name || request.category}
          </span>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 mb-1">Location</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {request.is_flat_specific ? (request.flat_number || 'Flat') : 'Common Area'}
          </span>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 mb-1">Created By</span>
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
    </>
  );
};

export default RequestHeaderInfo;
