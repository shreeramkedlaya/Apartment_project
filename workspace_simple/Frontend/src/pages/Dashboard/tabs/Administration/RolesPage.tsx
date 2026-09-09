/**
 * pages/admin/RolesPage.tsx
 * Role Management list page — powered by the shared DataTable component.
 */

import { useState, useRef } from 'react';
import { Plus, ShieldCheck, CheckCircle2, XCircle, FileEdit, Users } from 'lucide-react';
import type { Role, RoleStats } from '@/types/roles.types';
import { fetchRoles, fetchRole, deleteRole } from './services/roles.service';
import DataTable from '@/components/common/DataTable/DataTable';
import type { DataTableRef, Column } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import RoleFormModal from './RoleFormModal';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' },
  inactive: { label: 'Inactive', className: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60' },
  draft: { label: 'Draft', className: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60' },
};

export default function RolesPage() {
  const { user } = useAuth();
  const tableRef = useRef<DataTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const canAdd = user?.permissionTabs?.includes('administration.roles.add') || user?.role === 'admin';
  const canEdit = user?.permissionTabs?.includes('administration.roles.edit') || user?.role === 'admin';
  const canDelete = user?.permissionTabs?.includes('administration.roles.delete') || user?.role === 'admin';
  const handleEdit = async (r: Role) => {
    try {
      const fullRole = await fetchRole(r.id);
      setEditingRole(fullRole);
      setModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  // ── DataTable column definitions ──────────────────────────────────────────
  const columns: Column[] = [
    {
      header: 'Role',
      type: 'custom',
      accessor: (r: Role) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{r.name}</p>
          {r.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{r.description}</p>}
        </div>
      ),
    },
    {
      header: 'Users',
      type: 'icon-text',
      icon: Users,
      accessor: 'user_count',
      sortKey: 'user_count',
      sortable: true,
    },
    {
      header: 'Status',
      type: 'badge',
      accessor: (r: Role) => {
        const s = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.draft;
        return { status: r.status, label: s.label };
      },
      badgeConfig: {
        active: { label: '', className: STATUS_CONFIG.active.className },
        inactive: { label: '', className: STATUS_CONFIG.inactive.className },
        draft: { label: '', className: STATUS_CONFIG.draft.className },
      },
      sortKey: 'status',
      sortable: true,
    },
  ];

  const computeStats = (_data: any[], backendStats?: RoleStats) => {
    if (!backendStats) return [];
    return [
      { label: 'Total Roles', value: backendStats.total_roles, icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Active Roles', value: backendStats.active_roles, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Inactive Roles', value: backendStats.inactive_roles, icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
      { label: 'Draft Roles', value: backendStats.draft_roles, icon: FileEdit, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Total Users', value: backendStats.total_users, icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
      { label: 'Permissions', value: backendStats.total_permissions, icon: ShieldCheck, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
    ];
  };

  return (
    <div className="space-y-6 fade-up">

      {/* DataTable */}
      <DataTable
        ref={tableRef}
        api={fetchRoles}
        deleteApi={canDelete ? (id) => deleteRole(Number(id)) : undefined}
        columns={columns}
        defaultVisibleColumns={['Role', 'Users', 'Status']}
        computeStats={computeStats}
        enableSelection
        enableSearch
        searchPlaceholder="Search roles..."
        allowToggle
        defaultView="table"
        onEdit={canEdit ? handleEdit : undefined}
        emptyMessage={
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <ShieldCheck className="w-12 h-12 opacity-20" />
            <p className="font-medium">No roles found</p>
            <p className="text-xs">Create your first role using the button above.</p>
          </div>
        }
        extraToolbarActions={
          canAdd && (
            <button
              onClick={() => { setEditingRole(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          )
        }
        extraRowActions={() => null}
      />

      {/* Modal */}
      {modalOpen && (
        <RoleFormModal
          onClose={() => { setModalOpen(false); setEditingRole(null); }}
          role={editingRole}
          onSaved={() => { setModalOpen(false); setEditingRole(null); tableRef.current?.refresh(); }}
        />
      )}
    </div>
  );
}