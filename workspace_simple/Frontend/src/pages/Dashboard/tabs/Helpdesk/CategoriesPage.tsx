import React, { useState, useRef } from 'react';
import { HelpdeskService } from './services/helpdesk.service';
import type { IssueCategoryObj } from '@/types/helpdesk.types';
import DataTable from '@/components/common/DataTable/DataTable';
import type { DataTableRef } from '@/components/common/DataTable/types/types';
import type { Column } from '@/components/common/DataTable/types/types';
import { Plus, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import CategoryModal from './CategoryModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

const CategoriesPage: React.FC = () => {
  const tableRef = useRef<DataTableRef>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const canAdd = user?.permissionTabs?.includes('helpdesk.categories.add') || user?.role === 'admin';
  const canEdit = user?.permissionTabs?.includes('helpdesk.categories.edit') || user?.role === 'admin';
  const canDelete = user?.permissionTabs?.includes('helpdesk.categories.delete') || user?.role === 'admin';

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<IssueCategoryObj | null>(null);

  const handleAdd = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cat: IssueCategoryObj) => {
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };


  const columns: Column[] = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (row: any) => row.is_active ? 'Active' : 'Inactive',
      type: 'badge',
      badgeConfig: {
        'Active': { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        'Inactive': { label: 'Inactive', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
      }
    }
  ];

  const computeStats = (_data: IssueCategoryObj[], backendStats?: any) => {
    if (!backendStats) return [];
    return [
      { label: 'Total Categories', value: backendStats.total, icon: Tag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Active', value: backendStats.active, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Inactive', value: backendStats.inactive, icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    ];
  };

  return (
    <div className="space-y-6 fade-up relative h-full">
      <div className="w-full">
        <DataTable
          ref={tableRef}
          api={HelpdeskService.getCategories}
          deleteApi={canDelete ? HelpdeskService.deleteCategory : undefined}
          columns={columns}
          defaultVisibleColumns={['Name', 'Status']}
          computeStats={computeStats}
          enableSearch
          searchPlaceholder="Search categories..."
          defaultView="table"
          allowToggle
          enableSelection={false}
          onEdit={canEdit ? handleEdit : undefined}
          extraToolbarActions={
            canAdd && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            )
          }
        />
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        category={categoryToEdit}
        onSaved={() => {
          showToast(`Category ${categoryToEdit ? 'updated' : 'created'} successfully`, 'success');
          tableRef.current?.refresh();
        }}
      />
    </div>
  );
};

export default CategoriesPage;
