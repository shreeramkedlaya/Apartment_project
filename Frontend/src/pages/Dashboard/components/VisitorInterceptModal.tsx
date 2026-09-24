import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { approveRejectVisitor } from '../tabs/ResidentServices/services/visitor.service';
import { Clock, UserX, UserCheck, ShieldAlert } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface VisitorPayload {
  log_id: number;
  title: string;
  body: string;
}

export default function VisitorInterceptModal() {
  const [visitor, setVisitor] = useState<VisitorPayload | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const { showToast } = useToast();

  useEffect(() => {
    const handleVisitorRequest = (e: CustomEvent<VisitorPayload>) => {
      setVisitor(e.detail);
      setTimeLeft(30);
    };

    window.addEventListener('VISITOR_REQUESTED' as any, handleVisitorRequest);
    return () => {
      window.removeEventListener('VISITOR_REQUESTED' as any, handleVisitorRequest);
    };
  }, []);

  useEffect(() => {
    if (!visitor) return;

    if (timeLeft <= 0) {
      // Auto close when time expires
      setVisitor(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visitor, timeLeft]);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!visitor) return;
    try {
      await approveRejectVisitor(visitor.log_id, action);
      showToast(action === 'APPROVE' ? 'Visitor Approved' : 'Visitor Denied', 'success');
      setVisitor(null);
      // Dispatch an event to refresh any open visitor tables
      window.dispatchEvent(new CustomEvent('VISITORS_UPDATED'));
    } catch (err) {
      console.error(err);
      showToast('Failed to process visitor action', 'error');
    }
  };

  if (!visitor) return null;

  return (
    <Modal
      isOpen={!!visitor}
      onClose={() => {}} // We don't want them to easily close it without rejecting/approving
      title={visitor.title}
      description={visitor.body}
      icon={<ShieldAlert className="w-6 h-6 text-red-500" />}
      width="md"
    >
      <div className="flex flex-col space-y-6">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-1000 ease-linear" 
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-4xl font-mono font-bold text-gray-900 dark:text-white">
          <Clock className="w-8 h-8 text-red-500 animate-pulse" />
          00:{timeLeft.toString().padStart(2, '0')}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button
            onClick={() => handleAction('REJECT')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800/50"
          >
            <UserX className="w-5 h-5" />
            Reject Entry
          </button>
          <button
            onClick={() => handleAction('APPROVE')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-sm shadow-green-600/20"
          >
            <UserCheck className="w-5 h-5" />
            Approve Entry
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          If no action is taken, entry will be automatically approved.
        </p>
      </div>
    </Modal>
  );
}
