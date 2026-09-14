import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChevronRight, Shield, FileText, HelpCircle, LogOut, KeyRound } from 'lucide-react';
import ResetMpinModal from './components/ResetMpinModal';
import DocumentModal from './components/DocumentModal';
import axiosInstance from '@/services/core/axiosinstance';
import { FRONTEND_VERSION } from '@/services/core/http';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isMpinModalOpen, setIsMpinModalOpen] = useState(false);
  const [backendVersion, setBackendVersion] = useState<string>('');
  const [documentModalState, setDocumentModalState] = useState<{ isOpen: boolean, title: string, type: 'tnc' | 'privacy' | null }>({
    isOpen: false,
    title: '',
    type: null
  });

  useEffect(() => {
    const getVersions = async () => {
      try {
        const res = await axiosInstance.get('settings/version');
        // StandardizedJSONRenderer wraps payload in { status, data: { version, main_version, sub_version } }
        // axiosInstance unwraps res.data to the inner data object
        if (res.data?.version) {
          setBackendVersion(res.data.version);
        }
      } catch (err) {
        console.error('Failed to fetch backend version:', err);
      }
    };
    getVersions();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const openDocument = (title: string, type: 'tnc' | 'privacy') => {
    setDocumentModalState({ isOpen: true, title, type });
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
      </div>

      <div className="space-y-6">

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-2xl uppercase border-2 border-blue-200 dark:border-blue-800/60 shrink-0 shadow-inner">
            {(user?.name || 'U').substring(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {user?.name || 'User'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {user?.email || user?.phone || 'No contact info'}
            </p>
            <div className="flex gap-2 mt-2">
              {user?.role && (
                <span className="inline-flex px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {user.role}
                </span>
              )}
              {user?.flatNumber && (
                <span className="inline-flex px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  Flat {user.flatNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" /> Security
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <button
              onClick={() => setIsMpinModalOpen(true)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reset Fast Login MPIN</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Change your 4-digit quick access pin</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* About & Support Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500" /> About & Support
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <button
              onClick={() => openDocument('Terms & Conditions', 'tnc')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => openDocument('Privacy Policy', 'privacy')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Privacy Policy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <a
              href="mailto:support@example.com"
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Help & Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>

        {/* App Version Info */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 font-medium">
            Frontend: v{FRONTEND_VERSION} {backendVersion ? `| Backend: v${backendVersion}` : ''}
          </p>
        </div>

      </div>

      {/* Modals */}
      <ResetMpinModal
        isOpen={isMpinModalOpen}
        onClose={() => setIsMpinModalOpen(false)}
      />

      <DocumentModal
        isOpen={documentModalState.isOpen}
        title={documentModalState.title}
        type={documentModalState.type}
        onClose={() => setDocumentModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
