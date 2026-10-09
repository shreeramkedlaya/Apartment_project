import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { billingService } from '@/services/billing.service';
import type { Invoice } from '@/services/billing.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess: () => void;
}

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, invoice, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const handleSimulatePayment = async () => {
    setLoading(true);
    
    // Simulate Razorpay/UPI gateway delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockReferenceId = `txn_razorpay_${Date.now()}`;

    try {
      await billingService.processPayment({
        invoice_id: invoice.id,
        amount: invoice.total_amount,
        payment_method: paymentMethod,
        reference_id: mockReferenceId
      });
      showToast('Payment successful!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">Paying for</span>
            <span className="font-semibold text-gray-900 dark:text-white">{invoice.title}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-500">Amount Due</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{invoice.total_amount}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            {['UPI', 'Card', 'Net Banking', 'Cash'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center font-medium transition-all ${
                  paymentMethod === method
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
        
        {paymentMethod === 'UPI' && (
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <span className="text-gray-400 text-xs text-center px-4">Mock QR Code<br/>Scan to Pay</span>
            </div>
            <p className="text-sm text-gray-500 text-center">Open GPay, PhonePe, or Paytm and scan this code.</p>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSimulatePayment}
            disabled={loading}
            className="flex-1 flex justify-center items-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              `Pay ₹${invoice.total_amount}`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
