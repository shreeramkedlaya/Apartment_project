import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getVisitorLogs, 
  approveRejectVisitor, 
  checkoutVisitor
} from './services/visitor.service';
import type { VisitorLog } from './services/visitor.service';
import { Loader2, UserCheck, UserX, LogOut } from 'lucide-react';
import { useToast } from '@/context/ToastContext'; 
import NewVisitorForm from './components/NewVisitorForm';

export default function VisitorsPage() {
  const { user } = useAuth();
  const isGuard = user?.role === 'Security' || user?.role === 'admin' || user?.role === 'manager';
  const { showToast } = useToast();

  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getVisitorLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load visitor logs', err);
      showToast('Failed to load visitor logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    
    const handleUpdate = () => {
      loadLogs();
    };
    
    window.addEventListener('VISITORS_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('VISITORS_UPDATED', handleUpdate);
    };
  }, [isGuard]);

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await approveRejectVisitor(id, action);
      showToast(`Visitor ${action.toLowerCase()}d successfully`, 'success');
      loadLogs();
    } catch (err) {
      console.error(err);
      showToast(`Failed to ${action.toLowerCase()} visitor`, 'error');
    }
  };

  const handleCheckout = async (id: number) => {
    try {
      await checkoutVisitor(id);
      showToast('Visitor checked out', 'success');
      loadLogs();
    } catch (err) {
      console.error(err);
      showToast('Failed to checkout visitor', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Pending</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">Approved</span>;
      case 'DENIED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">Denied</span>;
      case 'CHECKED_OUT':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">Checked Out</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visitor Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isGuard ? 'Log new visitors and track gate passes' : 'Manage your visitor requests'}
          </p>
        </div>
      </div>

      {isGuard && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <NewVisitorForm />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">Visitor</th>
                {isGuard && <th className="px-6 py-4 font-medium">Flat</th>}
                <th className="px-6 py-4 font-medium">Purpose</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={isGuard ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    No visitor logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{log.details?.name || 'Unknown'}</div>
                      {log.details?.phone && <div className="text-xs text-gray-500">{log.details.phone}</div>}
                    </td>
                    {isGuard && (
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {log.flat_details?.number || log.flat}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {log.details?.purpose || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isGuard && log.status === 'PENDING_APPROVAL' && (
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
                      )}
                      {isGuard && log.status === 'APPROVED' && (
                        <button 
                          onClick={() => handleCheckout(log.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-auto"
                        >
                          <LogOut className="w-4 h-4" /> Checkout
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
