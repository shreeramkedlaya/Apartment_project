import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import EmergencyContactsPage from './EmergencyContactsPage';
import TriggerBroadcastModal from './components/TriggerBroadcastModal';
import ResolveBroadcastModal from './components/ResolveBroadcastModal';
import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';
import { fetchBroadcasts, type EmergencyBroadcast } from '@/services/emergency.service';

const EmergencyPage = () => {
    const { hasPermission } = useAuth();
    const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
    const [resolveBroadcastObj, setResolveBroadcastObj] = useState<EmergencyBroadcast | null>(null);
    const broadcastsTableRef = useRef<DataTableRef>(null);

    const canManageBroadcasts = hasPermission('emergency.manage_broadcasts');

    const broadcastColumns: Column[] = [
        {
            header: 'Alert',
            type: 'text',
            accessor: (b: EmergencyBroadcast) => b.title,
            sortable: true,
            width: 250,
        },
        {
            header: 'Severity',
            type: 'badge',
            accessor: (b: EmergencyBroadcast) => ({
                label: b.severity,
                status: b.severity.toLowerCase()
            }),
            badgeConfig: {
                critical: { label: '', className: 'bg-red-100 text-red-800 border border-red-200 dark:border-red-800/60' },
                high: { label: '', className: 'bg-orange-100 text-orange-800 border border-orange-200 dark:border-orange-800/60' },
                warning: { label: '', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:border-yellow-800/60' },
                info: { label: '', className: 'bg-blue-100 text-blue-800 border border-blue-200 dark:border-blue-800/60' },
            },
            width: 120,
        },
        {
            header: 'Category',
            type: 'text',
            accessor: 'category',
            width: 150,
        },
        {
            header: 'Status',
            type: 'badge',
            accessor: (b: EmergencyBroadcast) => ({
                label: b.status,
                status: b.status.toLowerCase()
            }),
            badgeConfig: {
                active: { label: '', className: 'bg-red-100 text-red-800 border border-red-200 dark:border-red-800/60 animate-pulse' },
                resolved: { label: '', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:border-emerald-800/60' }
            },
            width: 100,
        },
        {
            header: 'Dispatched At',
            type: 'text',
            accessor: (b: EmergencyBroadcast) => new Date(b.created_at).toLocaleString(),
            sortable: true,
            sortKey: 'created_at',
            width: 180,
        }
    ];

    // Refetch when global websocket triggers
    useEffect(() => {
        const handleUpdate = () => broadcastsTableRef.current?.refresh();
        window.addEventListener('EMERGENCY_UPDATE', handleUpdate);
        return () => window.removeEventListener('EMERGENCY_UPDATE', handleUpdate);
    }, []);

    return (
        <div className="space-y-8 fade-up">
            {/* Header & Trigger Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        Emergency Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Trigger broadcasts and manage community emergency contacts.
                    </p>
                </div>
                {canManageBroadcasts && (
                    <button
                        onClick={() => setIsTriggerModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-red-200 dark:shadow-none active:scale-95"
                    >
                        <AlertTriangle className="w-5 h-5" />
                        Trigger Broadcast
                    </button>
                )}
            </div>

            {/* Broadcasts History */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">Broadcast History</h2>
                <DataTable
                    ref={broadcastsTableRef}
                    api={fetchBroadcasts}
                    columns={broadcastColumns}
                    defaultVisibleColumns={['Alert', 'Severity', 'Category', 'Status', 'Dispatched At']}
                    enableSearch={false}
                    defaultView="table"
                    defaultPageSize={5}
                    enableSelection={false}
                    exportable={false}
                    extraRowActions={(b: EmergencyBroadcast) => (
                        (b.status === 'ACTIVE' && canManageBroadcasts) ? (
                            <button
                                onClick={() => setResolveBroadcastObj(b)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" /> Resolve
                            </button>
                        ) : null
                    )}
                    emptyMessage={
                        <div className="flex flex-col items-center gap-3 text-gray-400 p-8">
                            <Info className="w-12 h-12 opacity-20" />
                            <p className="font-medium">No emergency broadcasts dispatched.</p>
                        </div>
                    }
                />
            </div>

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* Emergency Contacts Directory */}
            <div className="!mt-0 !p-0">
                <EmergencyContactsPage />
            </div>

            {/* Modals */}
            <TriggerBroadcastModal
                isOpen={isTriggerModalOpen}
                onClose={() => setIsTriggerModalOpen(false)}
                onSuccess={() => {
                    setIsTriggerModalOpen(false);
                    broadcastsTableRef.current?.refresh();
                }}
            />
            <ResolveBroadcastModal
                broadcast={resolveBroadcastObj}
                isOpen={!!resolveBroadcastObj}
                onClose={() => setResolveBroadcastObj(null)}
                onSuccess={() => {
                    setResolveBroadcastObj(null);
                    broadcastsTableRef.current?.refresh();
                }}
            />
        </div>
    );
};

export default EmergencyPage;
