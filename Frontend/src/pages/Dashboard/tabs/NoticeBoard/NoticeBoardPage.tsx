import DataTable from '@/components/common/DataTable/DataTable';
import type { Column } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import { noticeService } from './services/notice.service';
import type { Notice } from './services/notice.service';
import { Bell, FileText, CheckCircle2, Clock, Plus, Trash2, XCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { DataTableRef } from '@/components/common/DataTable/types/types';
import CreateNoticeModal from './components/CreateNoticeModal/CreateNoticeModal';
import NoticeDetailsPanel from './components/NoticeDetailsPanel';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';

const NoticeBoardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const tableRef = useRef<DataTableRef>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<Notice | null>(null);
  const [noticeToAction, setNoticeToAction] = useState<Notice | null>(null);
  const [actionType, setActionType] = useState<'delete' | 'cancel' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canManageNotices = hasPermission('community.notices.add');

  const columns: Column[] = [
    {
      header: 'Title',
      type: 'text',
      accessor: 'title',
      sortable: true,
    },
    {
      header: 'Category',
      type: 'text',
      accessor: 'category',
      sortable: true,
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
    {
      header: 'Publish Date',
      type: 'date',
      accessor: 'publish_date',
      sortable: true,
    },
    {
      header: 'Author',
      type: 'text',
      accessor: 'created_by', // We might need to map this if it's an ID
    },
    {
      header: 'Requires Ack',
      type: 'text',
      accessor: (row: Notice) => row.requires_acknowledgement ? 'Yes' : 'No',
    },
  ];

  const computeStats = (_data: Notice[], backendStats?: any) => {
    // If we want real stats, we can pass them from the backend
    if (!backendStats) return [];
    return [
      { label: 'Total Notices', value: backendStats.total, icon: Bell, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Published', value: backendStats.published, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Draft', value: backendStats.draft, icon: FileText, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' },
      { label: 'Scheduled', value: backendStats.scheduled, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];
  };

  const handleRowClick = async (row: Notice) => {
    // Open details panel
    setSelectedNotice(row);
  };

  const handleEdit = (row: Notice) => {
    setNoticeToEdit(row);
  };

  const handleActionClick = (row: Notice) => {
    if (row.status === 'Draft' || row.status === 'Cancelled') {
      setActionType('delete');
    } else {
      setActionType('cancel');
    }
    setNoticeToAction(row);
  };

  const handleConfirmAction = async () => {
    if (!noticeToAction || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === 'delete') {
        await noticeService.deleteNotice(noticeToAction.id);
        showToast('Notice permanently deleted', 'success');
      } else {
        await noticeService.cancelNotice(noticeToAction.id);
        showToast('Notice cancelled successfully', 'success');
      }
      tableRef.current?.refresh();
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.error || `Failed to ${actionType} notice`;
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
      setNoticeToAction(null);
      setActionType(null);
    }
  };

  useEffect(() => {
    const handleNoticeUpdate = () => {
      tableRef.current?.refresh();
    };
    window.addEventListener('NOTICES_UPDATED', handleNoticeUpdate);
    return () => {
      window.removeEventListener('NOTICES_UPDATED', handleNoticeUpdate);
    };
  }, []);

  return (
    <div className="space-y-6 fade-up relative h-full">
      <div className="w-full">
        <DataTable
          ref={tableRef}
          api={async () => {
            const res = await noticeService.getNotices();
            return { results: res, count: res.length };
          }}
          columns={columns}
          defaultVisibleColumns={['Title', 'Category', 'Status', 'Requires Ack', 'Publish Date']}
          computeStats={computeStats}
          enableSearch
          searchPlaceholder="Search notices..."
          defaultView="table"
          allowToggle
          onRowClick={handleRowClick}
          onEdit={canManageNotices ? handleEdit : undefined}
          extraRowActions={canManageNotices ? (row: Notice) => {
            const isDelete = row.status === 'Draft' || row.status === 'Cancelled';
            return (
              <button
                type="button"
                onClick={() => handleActionClick(row)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  isDelete
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                }`}
              >
                {isDelete ? <Trash2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {isDelete ? 'Delete' : 'Cancel Notice'}
              </button>
            );
          } : undefined}
          filters={[
            { key: 'category', label: 'Category', options: ['General', 'Water', 'Power', 'Maintenance', 'Security', 'Event'] },
            { key: 'priority', label: 'Priority', options: ['Low', 'Medium', 'Critical'] },
            { key: 'status', label: 'Status', options: ['Draft', 'Scheduled', 'Published', 'Cancelled', 'Expired'] }
          ]}
          extraToolbarActions={
            canManageNotices && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Notice
              </button>
            )
          }
        />
      </div>

      {/* Details Panel */}
      <NoticeDetailsPanel
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
        onNoticeUpdated={() => {
          tableRef.current?.refresh();
        }}
        canManageNotices={canManageNotices}
      />

      {/* Create / Edit Modal */}
      <CreateNoticeModal
        isOpen={isModalOpen || !!noticeToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setNoticeToEdit(null);
        }}
        editNotice={noticeToEdit}
        onNoticeCreated={() => tableRef.current?.refresh()}
        onNoticeUpdated={() => tableRef.current?.refresh()}
      />

      {/* Context-aware Delete / Cancel Notice Confirmation Modal */}
      <ConfirmModal
        isOpen={!!noticeToAction}
        onClose={() => {
          setNoticeToAction(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
        title={actionType === 'delete' ? 'Delete Notice' : 'Cancel Notice'}
        message={
          actionType === 'delete'
            ? `Are you sure you want to permanently delete "${noticeToAction?.title}"? This action cannot be undone.`
            : `Are you sure you want to cancel "${noticeToAction?.title}"? Residents will no longer see active alerts for it.`
        }
        confirmText={actionType === 'delete' ? 'Delete Permanently' : 'Confirm Cancellation'}
        cancelText="Close"
        isDestructive={true}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default NoticeBoardPage;
