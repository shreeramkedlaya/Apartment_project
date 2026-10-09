import React from 'react';
import Modal from '@/components/ui/Modal';
import type { Invoice } from '@/services/billing.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const ReceiptDetailsModal: React.FC<Props> = ({ isOpen, onClose, invoice }) => {
  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{invoice.title}</h3>
            <p className="text-sm text-gray-500">Flat: {invoice.flat_number}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            invoice.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {invoice.status}
          </div>
        </div>

        {/* Line Items */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Itemized Breakdown</h4>
          <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
            {invoice.line_items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{item.description}</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{item.amount}</span>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white">Total</span>
              <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">₹{invoice.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        {invoice.transactions && invoice.transactions.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment History</h4>
            <div className="space-y-2">
              {invoice.transactions.map((txn, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{txn.payment_method}</p>
                    <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">Ref: {txn.reference_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{txn.amount}</p>
                    <p className="text-xs text-gray-500">by {txn.paid_by_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptDetailsModal;
