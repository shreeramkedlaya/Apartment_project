import React, { useState, useRef, useEffect } from 'react';
import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { noticeService } from './services/notice.service';
import type { Notice } from './services/notice.service';
import { Check, X, FileText, Clock, AlertCircle } from 'lucide-react';
import NoticeDetailsPanel from './components/NoticeDetailsPanel';
import Modal from '@/components/ui/Modal';

interface NoticeApprovalsPageProps {}

const NoticeApprovalsPage: React.FC<NoticeApprovalsPageProps> = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const tableRef = useRef<DataTableRef>(null);

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [rejectingNotice, setRejectingNotice] = useState<Notice | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canApprove = hasPermission('community.notices.approve');

  const columns: Column[] = [
    {
      header: 'Title',
      type: 'text',
      accessor: 'title',
      sortable: true,
      width: 300,
    },
    {
      header: 'Category',
      type: 'text',
      accessor: 'category',
      sortable: true,
      width: 150,
    },
    {
      header: 'Priority',
      type: 'text',
      accessor: 'priority',
      sortable: true,
      width: 120,
    },
    {
      header: 'Status',
      type: 'text',
      accessor: 'status',
      sortable: true,
      width: 120,
    },
    {
      header: 'Author',
      type: 'text',
      accessor: 'created_by',
      width: 150,
    },
    {
      header: 'Created At',
      type: 'date',
      accessor: 'created_at',
      sortable: true,
      width: 150,
    },
    {
      header: 'Target Publish Date',
      type: 'date',
      accessor: (row: Notice) => row.publish_date || 'Immediate',
      width: 180,
    },
  ];

  const computeStats = (data: Notice[]) => {
    const total = data.length;
    const drafts = data.filter(n => n.status === 'Draft').length;
    const scheduled = data.filter(n => n.status === 'Scheduled').length;

    return [
      { label: 'Total Pending', value: total, icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Drafts', value: drafts, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Scheduled', value: scheduled, icon: Clock, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    ];
  };

  const handleApprove = async (notice: Notice) => {
    setActionLoading(true);
    try {
      await noticeService.approveNotice(notice.id);
      showToast(`Notice "${notice.title}" approved successfully`, 'success');
      tableRef.current?.refresh();
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.error || 'Failed to approve notice';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingNotice) return;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await noticeService.rejectNotice(rejectingNotice.id, rejectionReason.trim());
      showToast(`Notice "${rejectingNotice.title}" rejected`, 'success');
      setRejectingNotice(null);
      setRejectionReason('');
      tableRef.current?.refresh();
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.error || 'Failed to reject notice';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
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
            const allNotices = await noticeService.getNotices();
            // Approvals tab shows Draft notices that require review or approval
            const pendingNotices = allNotices.filter(n => n.status === 'Draft');
            return { results: pendingNotices, count: pendingNotices.length };
          }}
          columns={columns}
          defaultVisibleColumns={['Title', 'Category', 'Priority', 'Status', 'Author', 'Created At']}
          computeStats={computeStats}
          enableSearch
          searchPlaceholder="Search approval requests..."
          defaultView="table"
          allowToggle
          onRowClick={(row: Notice) => setSelectedNotice(row)}
          extraRowActions={canApprove ? (row: Notice) => (
            <>
              <button
                type="button"
                onClick={() => handleApprove(row)}
                disabled={actionLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectingNotice(row);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          ) : undefined}
          filters={[
            { key: 'category', label: 'Category', options: ['General', 'Water', 'Power', 'Maintenance', 'Security', 'Event'] },
            { key: 'priority', label: 'Priority', options: ['Low', 'Medium', 'Critical'] },
          ]}
        />
      </div>

      {/* Notice Details Panel */}
      <NoticeDetailsPanel
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
        onNoticeUpdated={() => {
          tableRef.current?.refresh();
        }}
        canManageNotices={canApprove}
      />

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={!!rejectingNotice}
        onClose={() => {
          setRejectingNotice(null);
          setRejectionReason('');
        }}
        title="Reject Notice"
        width="small"
        footer={
          <>
            <button
              onClick={() => {
                setRejectingNotice(null);
                setRejectionReason('');
              }}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Rejecting...' : 'Reject Notice'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please provide feedback or the reason why notice <strong className="text-gray-900 dark:text-white">"{rejectingNotice?.title}"</strong> is being rejected.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="e.g. Please clarify scheduled maintenance window hours..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-400 outline-none placeholder-gray-400 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoticeApprovalsPage;
