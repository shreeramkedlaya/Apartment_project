import DataTable from '@/components/common/DataTable/DataTable';
import type { Column } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import { fetchBlocks } from '@/services/auth/auth.service';
import { HelpdeskService } from './services/helpdesk.service';
import type { BlockData } from '@/types/auth.types';
import type { HelpdeskRequest } from '@/types/helpdesk.types';
import { AlertCircle, CheckCircle2, Clock, Plus, Ticket, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import type { DataTableRef } from '@/components/common/DataTable/types/types';
import CreateRequestModal from './CreateRequestModal';
import RequestDetailsPanel from './RequestDetailsPanel';
import UpdateStatusModal from './UpdateStatusModal';

const RequestsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const tableRef = useRef<DataTableRef>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HelpdeskRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [requestToEdit, setRequestToEdit] = useState<HelpdeskRequest | null>(null);
  const [requestToUpdateStatus, setRequestToUpdateStatus] = useState<HelpdeskRequest | null>(null);

  // Load Blocks from DB
  useEffect(() => {
    fetchBlocks().then(setBlocks).catch(console.error);
  }, []);

  // Listen for real-time issue updates
  useEffect(() => {
    const handleIssuesUpdated = () => {
      tableRef.current?.refresh();
      // If the currently selected request was updated, we might want to refresh its details panel too.
      if (selectedRequest) {
        handleRowClick(selectedRequest);
      }
    };

    window.addEventListener('ISSUES_UPDATED', handleIssuesUpdated);
    return () => window.removeEventListener('ISSUES_UPDATED', handleIssuesUpdated);
  }, [selectedRequest]);

  const canAdd = hasPermission('helpdesk.requests.add');
  const canEdit = hasPermission('helpdesk.requests.edit');
  const canDelete = hasPermission('helpdesk.requests.delete');
  const canResolve = hasPermission('helpdesk.requests.resolve_close');
  const canManageTickets = canResolve || canEdit;

  const columns: Column[] = [
    {
      header: 'Request ID',
      type: 'text',
      accessor: 'id',
      sortable: true,
    },
    {
      header: 'Title',
      type: 'custom',
      accessor: (row: any) => (
        <span className="flex items-center gap-1.5">
          {row.title}
          {row.is_escalated && <AlertTriangle className="w-3.5 h-3.5 text-red-500 fill-red-500/10" />}
        </span>
      ),
      sortable: true,
      sortKey: 'title',
    },
    {
      header: 'Category',
      type: 'text',
      accessor: 'category',
      sortable: true,
    },
    {
      header: 'Location',
      type: 'custom',
      accessor: (i: HelpdeskRequest) => i.is_flat_specific ? (i.flat_number || 'Flat') : 'Common Area',
    },
    {
      header: 'Created By',
      type: 'custom',
      accessor: (i: HelpdeskRequest) => i.created_by?.name || 'Resident',
    },
    {
      header: 'Priority',
      type: 'text',
      accessor: 'priority',
      sortable: true,
    },
    {
      header: 'Status',
      type: 'text',
      accessor: 'status',
      sortable: true,
    },
  ];

  const computeStats = (_data: HelpdeskRequest[], backendStats?: any) => {
    if (!backendStats) return [];
    return [
      { label: 'Total Requests', value: backendStats.total, icon: Ticket, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Pending', value: backendStats.pending, icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
      { label: 'In Progress', value: backendStats.in_progress, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Resolved', value: backendStats.resolved, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    ];
  };

  const handleRowClick = async (row: HelpdeskRequest) => {
    try {
      const full = await HelpdeskService.getRequestDetails(row.id);
      setSelectedRequest(full);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async (row: HelpdeskRequest) => {
    try {
      const full = await HelpdeskService.getRequestDetails(row.id);
      setRequestToEdit(full);
    } catch (e) {
      console.error(e);
    }
  };

  const renderCard = (row: any) => {
    return (
      <div
        key={row.id}
        onClick={() => handleRowClick(row)}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 hover:shadow-md cursor-pointer transition-shadow space-y-3"
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 text-sm flex items-center gap-1.5">
              {row.title}
              {row.is_escalated && <AlertTriangle className="w-3.5 h-3.5 text-red-500 fill-red-500/10 shrink-0" />}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{row.category_name || row.category}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${row.status === 'Open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            row.status === 'Resolved' || row.status === 'Closed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
            {row.status}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(row.created_at).toLocaleDateString()}
          </div>
          <span className="font-mono">#{row.id}</span>
        </div>
      </div>
    )
  }



  return (
    <div className="space-y-6 fade-up relative h-full">
      {/* Main Table Area */}
      <div className="w-full">
        <DataTable
          ref={tableRef}
          api={HelpdeskService.getRequests}
          deleteApi={canDelete ? HelpdeskService.deleteRequest : undefined}
          columns={columns}
          defaultVisibleColumns={['Request ID', 'Title', 'Category', 'Status', 'Priority']}
          computeStats={computeStats}
          enableSearch
          searchPlaceholder="Search requests..."
          defaultView={canManageTickets ? 'table' : 'grid'}
          renderCard={renderCard}
          allowToggle
          onRowClick={handleRowClick}
          onEdit={canEdit ? handleEdit : undefined}
          extraRowActions={(row) => (
            !canResolve ? null : (
              <button
                onClick={(e) => { e.stopPropagation(); setRequestToUpdateStatus(row); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Update Status
              </button>
            )
          )}
          filters={[
            { key: 'category', label: 'Category', options: ['Water', 'Power', 'Housekeeping', 'Gym', 'Pool'] },
            { key: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High'] },
            { key: 'status', label: 'Status', options: ['Open', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Closed'] }
          ]}
          extraToolbarActions={
            canAdd && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Raise Request
              </button>
            )
          }
        />
      </div>

      {/* Side Panel for Request Details Component */}
      <RequestDetailsPanel
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onRequestUpdated={(updated) => {
          tableRef.current?.refresh();
          if (selectedRequest?.id === updated.id) {
            setSelectedRequest(updated);
          }
        }}
        canManageTickets={canManageTickets}
      />

      {/* Create Request Modal Component (also handles Editing) */}
      <CreateRequestModal
        isOpen={isModalOpen || !!requestToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setRequestToEdit(null);
        }}
        editRequest={requestToEdit}
        onRequestCreated={() => {
          tableRef.current?.refresh();
        }}
        onRequestUpdated={(updated) => {
          tableRef.current?.refresh();
          if (selectedRequest?.id === updated.id) {
            setSelectedRequest(updated);
          }
        }}
        user={user}
        blocks={blocks}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={!!requestToUpdateStatus}
        onClose={() => setRequestToUpdateStatus(null)}
        request={requestToUpdateStatus}
        onStatusUpdated={(updated) => {
          tableRef.current?.refresh();
          if (selectedRequest?.id === updated.id) {
            setSelectedRequest(updated);
          }
        }}
      />

    </div>
  );
};

export default RequestsPage;