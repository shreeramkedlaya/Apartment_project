import React from 'react';
import { Tag } from 'lucide-react';
import type { IssueCategoryObj } from '@/types/helpdesk.types';
import { ICON_MAP } from '../utils/requestConstants';

interface CategorySectionProps {
  categories: IssueCategoryObj[];
  selectedCategory: string | number;
  onSelectCategory: (catId: number | string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div>
      <label className="block text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1">
        Category <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.name] || Tag;
          const isSelected = String(selectedCategory) === String(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                }`}
              />
              <span className="truncate">{cat.name}</span>
            </button>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-5 text-sm text-gray-400 p-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            No categories available.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
