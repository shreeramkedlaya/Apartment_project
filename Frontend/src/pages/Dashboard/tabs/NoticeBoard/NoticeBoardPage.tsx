import DataTable from '@/components/common/DataTable/DataTable';
import type { Column } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import { noticeService } from './services/notice.service';
import type { Notice } from './services/notice.service';
import { Bell, FileText, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { DataTableRef } from '@/components/common/DataTable/types/types';
import CreateNoticeModal from './components/CreateNoticeModal/CreateNoticeModal';
import NoticeDetailsPanel from './components/NoticeDetailsPanel';

const NoticeBoardPage: React.FC = () => {
  const { user } = useAuth();
  const tableRef = useRef<DataTableRef>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<Notice | null>(null);

  // Only users with the explicit "Manage Notices" (community.notices.add) permission can create/manage notices.
  // Admins inherently get this capability based on their role setup, but we check the specific permission tab.
  const canManageNotices = user?.permissionTabs?.includes('community.notices.add') || user?.role === 'admin';

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
          deleteApi={canManageNotices ? (id) => noticeService.cancelNotice(String(id)) : undefined}
          columns={columns}
          defaultVisibleColumns={['Title', 'Category', 'Status', 'Requires Ack', 'Publish Date']}
          computeStats={computeStats}
          enableSearch
          searchPlaceholder="Search notices..."
          defaultView="table"
          allowToggle
          onRowClick={handleRowClick}
          onEdit={canManageNotices ? handleEdit : undefined}
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
    </div>
  );
};

export default NoticeBoardPage;
