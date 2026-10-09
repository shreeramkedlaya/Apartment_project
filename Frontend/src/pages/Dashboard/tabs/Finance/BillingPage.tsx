import React, { useRef, useState } from 'react';
import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';
import { useAuth } from '@/context/AuthContext';
import { billingService } from '@/services/billing.service';
import type { Invoice } from '@/services/billing.service';
import { CreditCard, FileText, CheckCircle2, Clock, Plus } from 'lucide-react';
import GenerateBillModal from './components/GenerateBillModal';
import PaymentModal from './components/PaymentModal';
import ReceiptDetailsModal from './components/ReceiptDetailsModal';

const BillingPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const tableRef = useRef<DataTableRef>(null);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);

  // Manager permission check
  const canManageBilling = hasPermission('finance.billing.generate');

  const columns: Column[] = [
    { header: 'Title', accessor: 'title', sortable: true, type: 'text' },
    { header: 'Category', accessor: 'category', sortable: true, type: 'text' },
    { header: 'Flat', accessor: 'flat_number', sortable: true, type: 'text' },
    {
      header: 'Amount',
      accessor: (row: any) => <span className="font-semibold text-gray-900 dark:text-gray-100">₹{row.total_amount}</span>,
      type: 'custom',
      sortable: true,
      sortKey: 'total_amount'
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      type: 'date',
      sortable: true
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
          row.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {row.status}
        </span>
      ),
      type: 'custom',
      sortable: true,
      sortKey: 'status'
    }
  ];

  const computeStats = (data: Invoice[], backendStats?: any) => {
    if (backendStats?.stats) {
      const bs = backendStats.stats;
      return [
        { label: 'Total Invoices', value: bs.total || 0, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Paid', value: bs.paid || 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Pending', value: bs.pending || 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Overdue', value: bs.overdue || 0, icon: Clock, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
      ];
    }
    const total = data.length;
    const paid = data.filter(i => i.status === 'Paid').length;
    const pending = data.filter(i => i.status === 'Pending').length;
    const overdue = data.filter(i => i.status === 'Overdue').length;

    return [
      { label: 'Total Invoices', value: total, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: 'Paid', value: paid, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Overdue', value: overdue, icon: Clock, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    ];
  };

  const handleRowClick = async (row: Invoice) => {
    // Fetch full details (which includes nested transactions)
    try {
      const details = await billingService.getInvoiceDetails(row.id);
      setSelectedInvoiceDetails(details);
    } catch (err) {
      console.error("Failed to load details");
    }
  };

  const handleRefresh = () => {
    tableRef.current?.refresh();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {canManageBilling ? 'Manage community invoices and track payments.' : 'View your dues and payment history.'}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <DataTable
          ref={tableRef}
          api={async (params) => {
            const res = await billingService.getInvoices(params);
            if (res && res.results) {
              return res;
            }
            return { results: res || [], count: res?.length || 0 };
          }}
          columns={columns}
          defaultVisibleColumns={['Title', 'Category', 'Flat', 'Amount', 'Due Date', 'Status']}
          computeStats={computeStats}
          enableSearch
          searchPlaceholder="Search invoices by title or category..."
          allowToggle={false}
          onRowClick={handleRowClick}
          filters={[
            { key: 'category', label: 'Category', options: ['Maintenance', 'Event', 'Penalty', 'Amenity'] },
            { key: 'status', label: 'Status', options: ['Pending', 'Paid', 'Overdue', 'Cancelled'] }
          ]}
          extraToolbarActions={
            canManageBilling && (
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Generate Invoice
              </button>
            )
          }
          extraRowActions={(row: Invoice) => {
            if (row.status === 'Pending' || row.status === 'Overdue') {
              return (
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(row)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </button>
              );
            }
            return undefined;
          }}
        />
      </div>

      {/* Modals */}
      <GenerateBillModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {selectedInvoiceForPayment && (
        <PaymentModal
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          onSuccess={handleRefresh}
        />
      )}

      <ReceiptDetailsModal
        isOpen={!!selectedInvoiceDetails}
        onClose={() => setSelectedInvoiceDetails(null)}
        invoice={selectedInvoiceDetails}
      />
    </div>
  );
};

export default BillingPage;
