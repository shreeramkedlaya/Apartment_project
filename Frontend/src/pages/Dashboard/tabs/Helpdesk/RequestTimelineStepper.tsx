import React from 'react';
import { Check } from 'lucide-react';

export type IssueStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

const STAGES: IssueStatus[] = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

interface Props {
  currentStatus: string;
}

const RequestTimelineStepper: React.FC<Props> = ({ currentStatus }) => {
  // Find the index of the current status. Default to 0 if not found (e.g. pending/custom).
  // Some backends return lowercase, some uppercase. Let's normalize to title case.
  const normalizedStatus = currentStatus
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  let currentIndex = STAGES.findIndex(s => s.toLowerCase() === normalizedStatus.toLowerCase());
  
  // If backend returns 'Pending', map it to 'Open'
  if (normalizedStatus.toLowerCase() === 'pending') currentIndex = 0;
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="w-full py-4 mb-6">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-4 left-0 h-1 bg-orange-500 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={stage} className="relative flex flex-col items-center z-10 w-16">
              {/* Node */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-800 transition-all duration-300
                  ${isCompleted ? 'border-orange-500 bg-orange-500 text-white' : ''}
                  ${isActive ? 'border-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/30' : ''}
                  ${isUpcoming ? 'border-gray-300 dark:border-gray-600' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-orange-500' : 'bg-transparent'}`} />
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`mt-2 text-[10px] font-medium text-center whitespace-nowrap transition-colors duration-300
                  ${isCompleted || isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}
                  ${isActive ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''}
                `}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestTimelineStepper;
