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
  const { hasPermission } = useAuth();

  const canAdd = hasPermission('helpdesk.categories.add');
  const canEdit = hasPermission('helpdesk.categories.edit');
  const canDelete = hasPermission('helpdesk.categories.delete');

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
      width: 250,
    },

    {
      header: 'Description',
      accessor: (row: any) => row.description || '-',
      sortable: false,
      width: 400,
    },
    {
      header: 'Status',
      accessor: (row: any) => row.is_active ? 'Active' : 'Inactive',
      type: 'badge',
      width: 120,
      badgeConfig: {
        'Active': { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        'Inactive': { label: 'Inactive', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
      }
    },
    {
      header: 'Created At',
      accessor: 'created_at',
      type: 'date',
      sortable: true,
      width: 180,
    },
    {
      header: 'Updated At',
      accessor: 'updated_at',
      type: 'date',
      sortable: true,
      width: 180,
    },

  ];

  const computeStats = (data: IssueCategoryObj[]) => {
    const total = data.length;
    const active = data.filter(c => c.is_active).length;
    const inactive = total - active;
    return [
      { label: 'Total Categories', value: total, icon: Tag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Active', value: active, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Inactive', value: inactive, icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
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
          defaultVisibleColumns={['Name', 'Description', 'Status', 'Created At', 'Updated At']}
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
