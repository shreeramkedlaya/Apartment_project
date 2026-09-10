/**
 * pages/admin/UserManagementPage.tsx
 * Full User Management page — powered by the shared DataTable component.
 * The "Assign Role" dropdown uses a fixed-position menu so it never goes behind table overflow.
 */

import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ManagedUser } from '@/types/roles.types';
import {
  Home, Phone,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { fetchUsers, bulkDeleteUsers, bulkUpdateUsers } from '../services/roles.service';
import EditUserModal from './EditUserModal';
import UserAccessModal from './UserAccessModal';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60',
  inactive: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60',
  draft: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const tableRef = useRef<DataTableRef>(null);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [accessUser, setAccessUser] = useState<ManagedUser | null>(null);

  const canAdd = currentUser?.permissionTabs?.includes('administration.users.add') || currentUser?.role === 'admin';
  const canEdit = currentUser?.permissionTabs?.includes('administration.users.edit') || currentUser?.role === 'admin';
  const canDelete = currentUser?.permissionTabs?.includes('administration.users.delete') || currentUser?.role === 'admin';

  const computeStats = (_data: ManagedUser[], backendStats?: any) => {
    if (!backendStats) return [];
    return [
      { label: 'Total Users', value: backendStats.total_users, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Role Assigned', value: backendStats.role_assigned, icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'No Role', value: backendStats.no_role, icon: UserX, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Super Admins', value: backendStats.super_admins, icon: UserCheck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    ];
  };

  const columns: Column[] = [
    {
      header: 'User',
      type: 'user',
      accessor: (u: ManagedUser) => ({ name: u.name || u.username }),
    },
    {
      header: 'Phone',
      type: 'icon-text',
      icon: Phone,
      accessor: 'phone_number',
      sortKey: 'phone_number',
      sortable: true,
    },
    {
      header: 'Flat',
      type: 'icon-text',
      icon: Home,
      accessor: (u: ManagedUser) => u.flat ? `Block ${u.flat.block} – ${u.flat.number}` : '',
    },
    {
      header: 'Role',
      type: 'badge',
      accessor: (u: ManagedUser) => {
        if (u.is_superuser) return { label: 'Super Admin', status: 'super' };
        if (u.role_name !== 'Resident') return { label: u.role_name, status: 'active' };
        return null;
      },
      badgeConfig: {
        super: { label: 'Super Admin', className: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800' },
        active: { label: '', className: STATUS_BADGE.active },
        inactive: { label: '', className: STATUS_BADGE.inactive },
        draft: { label: '', className: STATUS_BADGE.draft },
      },
      sortKey: 'role_name',
      sortable: true,
    },
    {
      header: 'Joined',
      type: 'date',
      accessor: 'date_joined',
      sortKey: 'date_joined',
      sortable: true,
    },
  ];

  const bulkOperations = [
    {
      label: 'Block Selected',
      variant: 'destructive' as const,
      onClick: async (selectedRows: ManagedUser[]) => {
        try {
          const ids = selectedRows.map(u => u.id);
          await bulkUpdateUsers(ids, { is_active: false });
          showToast(`Successfully blocked ${ids.length} user(s).`, 'success');
          tableRef.current?.refresh();
        } catch (error) {
          showToast('Failed to block users.', 'error');
        }
      }
    },
    {
      label: 'Unblock Selected',
      variant: 'outline' as const,
      onClick: async (selectedRows: ManagedUser[]) => {
        try {
          const ids = selectedRows.map(u => u.id);
          await bulkUpdateUsers(ids, { is_active: true });
          showToast(`Successfully unblocked ${ids.length} user(s).`, 'success');
          tableRef.current?.refresh();
        } catch (error) {
          showToast('Failed to unblock users.', 'error');
        }
      }
    },
    {
      label: 'Delete Selected',
      variant: 'destructive' as const,
      onClick: async (selectedRows: ManagedUser[]) => {
        if (!confirm(`Are you sure you want to delete ${selectedRows.length} user(s)?`)) return;
        try {
          const ids = selectedRows.map(u => u.id);
          await bulkDeleteUsers(ids);
          showToast(`Successfully deleted ${ids.length} user(s).`, 'success');
          tableRef.current?.refresh();
        } catch (error) {
          showToast('Failed to delete users.', 'error');
        }
      }
    }
  ];

  return (
    <div className="space-y-6 fade-up">
      {/* DataTable */}
      <DataTable
        ref={tableRef}
        api={fetchUsers}
        columns={columns}
        defaultVisibleColumns={['User', 'Phone', 'Role', 'Joined']}
        computeStats={computeStats}
        enableSearch
        searchPlaceholder="Search by name, phone, flat..."
        allowToggle
        defaultView="table"
        defaultPageSize={10}
        enableSelection={true}
        exportable={true}
        bulkOperations={canEdit ? bulkOperations : undefined}
        onEdit={canEdit ? (u: ManagedUser) => setEditUser(u) : undefined}
        onDelete={canDelete ? (u: ManagedUser) => console.log('Delete user:', u) : undefined}
        isActionDisabled={(u: ManagedUser) => u.is_superuser || String(u.id) === currentUser?.uid}
        extraRowActions={(u: ManagedUser) => (
          (u.is_superuser || String(u.id) === currentUser?.uid || !canEdit) ? null : (
            <button
              onClick={() => {
                setAccessUser(u);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              User Access
            </button>
          )
        )}
        emptyMessage={
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Users className="w-12 h-12 opacity-20" />
            <p className="font-medium">No users found</p>
          </div>
        }
        extraToolbarActions={
          canAdd && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-95">
              <Users className="w-4 h-4" />
              Add User
            </button>
          )
        }
      />

      <EditUserModal
        user={editUser}
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onSaved={() => {
          setEditUser(null);
          tableRef.current?.refresh();
        }}
      />

      <UserAccessModal
        user={accessUser}
        isOpen={!!accessUser}
        onClose={() => setAccessUser(null)}
        onSaved={() => setAccessUser(null)}
      />
    </div>
  );
}

export default UserManagementPage;