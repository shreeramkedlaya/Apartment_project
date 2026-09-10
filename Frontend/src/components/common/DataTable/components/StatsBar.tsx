import React from 'react';
import type { StatItem } from '../types/types';

interface StatsBarProps {
  stats?: StatItem[];
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  if (!stats || stats.length === 0) return null;

  const lgGridClass =
    {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
    }[Math.min(stats.length, 6)] || 'lg:grid-cols-4';

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${lgGridClass} gap-4 mb-4`}>
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 shadow-sm"
          >
            {Icon && (
              <div
                className={`w-10 h-10 rounded-xl ${s.bg || 'bg-blue-50 dark:bg-blue-900/20'} ${
                  s.color || 'text-blue-600 dark:text-blue-400'
                } flex items-center justify-center shrink-0`}
              >
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {s.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsBar;
