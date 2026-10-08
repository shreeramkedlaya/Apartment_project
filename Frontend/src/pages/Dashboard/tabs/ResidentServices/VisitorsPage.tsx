import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Clock, LogOut, Plus, UserCheck, UserX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NewVisitorForm from './components/NewVisitorForm';
import type { VisitorLog } from './services/visitor.service';
import {
  approveRejectVisitor,
  checkoutVisitor,
  getVisitorLogs
} from './services/visitor.service';

export default function VisitorsPage() {
  const { user } = useAuth();
  const isGuard = user?.role === 'Security' || user?.role === 'admin' || user?.role === 'manager';
  const { showToast } = useToast();
  const tableRef = useRef<DataTableRef>(null);

  const [showNewVisitorForm, setShowNewVisitorForm] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      tableRef.current?.refresh();
    };

    window.addEventListener('VISITORS_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('VISITORS_UPDATED', handleUpdate);
    };
  }, []);

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await approveRejectVisitor(id, action);
      showToast(`Visitor ${action.toLowerCase()}d successfully`, 'success');
      tableRef.current?.refresh();
    } catch (err) {
      console.error(err);
      showToast(`Failed to ${action.toLowerCase()} visitor`, 'error');
    }
  };

  const handleCheckout = async (id: number) => {
    try {
      await checkoutVisitor(id);
      showToast('Visitor checked out', 'success');
      tableRef.current?.refresh();
    } catch (err) {
      console.error(err);
      showToast('Failed to checkout visitor', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 whitespace-nowrap">Pending</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">Approved</span>;
      case 'DENIED':
        return <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">Denied</span>;
      case 'CHECKED_OUT':
        return <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap">Checked Out</span>;
      default:
        return null;
    }
  };

  const columns: Column[] = [
    {
      header: 'Visitor',
      type: 'custom',
      accessor: (log: VisitorLog) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{log.details?.name || 'Unknown'}</div>
          {log.details?.phone && <div className="text-xs text-gray-500">{log.details.phone}</div>}
        </div>
      ),
      sortable: false,
    },
    ...(isGuard ? [{
      header: 'Flat',
      type: 'custom',
      accessor: (log: VisitorLog) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {log.flat_details?.number || log.flat}
        </span>
      ),
      sortable: false,
    } as Column] : []),
    {
      header: 'Purpose',
      type: 'custom',
      accessor: (log: VisitorLog) => log.details?.purpose || '-',
      sortable: false,
    },
    {
      header: 'Time',
      type: 'custom',
      accessor: (log: VisitorLog) => new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sortable: true,
      sortKey: 'created_at'
    },
    {
      header: 'Status',
      type: 'custom',
      accessor: (log: VisitorLog) => getStatusBadge(log.status),
      sortable: true,
      sortKey: 'status'
    }
  ];

  const renderCard = (log: VisitorLog) => {
    return (
      <div
        key={log.id}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 hover:shadow-md transition-shadow space-y-3"
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
              {log.details?.name || 'Unknown'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isGuard ? `Flat: ${log.flat_details?.number || log.flat} | ` : ''}{log.details?.purpose || 'No Purpose'}
            </p>
          </div>
          {getStatusBadge(log.status)}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {log.details?.phone && <span className="font-mono">{log.details.phone}</span>}
        </div>

        {/* Actions for Card View */}
        {((!isGuard && log.status === 'PENDING_APPROVAL') || (isGuard && log.status === 'APPROVED')) && (
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-gray-800">
            {!isGuard && log.status === 'PENDING_APPROVAL' && (
              <>
                <button
                  onClick={() => handleAction(log.id, 'APPROVE')}
                  className="flex-1 py-1.5 flex items-center justify-center gap-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors text-xs font-medium"
                >
                  <UserCheck className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleAction(log.id, 'REJECT')}
                  className="flex-1 py-1.5 flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-medium"
                >
                  <UserX className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            {isGuard && log.status === 'APPROVED' && (
              <button
                onClick={() => handleCheckout(log.id)}
                className="flex-1 py-1.5 flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs font-medium"
              >
                <LogOut className="w-4 h-4" /> Checkout
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-up relative h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visitor Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isGuard ? 'Log new visitors and track gate passes' : 'Manage your visitor requests'}
          </p>
        </div>
      </div>

      {isGuard && showNewVisitorForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <NewVisitorForm onComplete={() => setShowNewVisitorForm(false)} />
        </div>
      )}

      <div className="w-full">
        <DataTable
          ref={tableRef}
          api={getVisitorLogs}
          columns={columns}
          defaultVisibleColumns={['Visitor', 'Flat', 'Purpose', 'Time', 'Status']}
          enableSearch
          searchPlaceholder="Search by name, phone, or flat..."
          defaultView="table"
          renderCard={renderCard}
          allowToggle
          filters={[
            { key: 'status', label: 'Status', options: ['PENDING_APPROVAL', 'APPROVED', 'DENIED', 'CHECKED_OUT'] }
          ]}
          extraRowActions={(log) => {
            if (!isGuard && log.status === 'PENDING_APPROVAL') {
              return (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleAction(log.id, 'APPROVE')}
                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <UserCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleAction(log.id, 'REJECT')}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              );
            }
            if (isGuard && log.status === 'APPROVED') {
              return (
                <button
                  onClick={() => handleCheckout(log.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-auto"
                >
                  <LogOut className="w-4 h-4" /> Checkout
                </button>
              );
            }
            return null;
          }}
          extraToolbarActions={
            isGuard && !showNewVisitorForm && (
              <button
                onClick={() => setShowNewVisitorForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Visitor
              </button>
            )
          }
        />
      </div>
    </div>
  );
}
