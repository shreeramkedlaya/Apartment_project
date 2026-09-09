import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import type { IssueCategoryObj } from '@/types/helpdesk.types';
import { HelpdeskService } from './services/helpdesk.service';


interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: IssueCategoryObj | null; // null if creating, object if editing
  onSaved: (category: IssueCategoryObj) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setIsActive(category.is_active);
      } else {
        setName('');
        setIsActive(true);
      }
      setError('');
    }
  }, [isOpen, category]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      let savedCategory: IssueCategoryObj;
      if (category) {
        // Update
        savedCategory = await HelpdeskService.updateCategory(category.id, {
          name: name.trim(),
          is_active: isActive,
        });
      } else {
        // Create
        savedCategory = await HelpdeskService.createCategory({
          name: name.trim(),
          is_active: isActive,
        });
      }

      onSaved(savedCategory);
      onClose();
    } catch (err: any) {
      console.error("Failed to save category:", err);
      setError(err?.response?.data?.name?.[0] || 'Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit Category" : "Add New Category"}
      width="small"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Saving...' : (category ? 'Save Changes' : 'Create Category')}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Plumbing, Internet"
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Active Status
            </span>
          </label>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 pl-[3.25rem]">
            Inactive categories will not appear as options when residents create new helpdesk requests.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryModal;
