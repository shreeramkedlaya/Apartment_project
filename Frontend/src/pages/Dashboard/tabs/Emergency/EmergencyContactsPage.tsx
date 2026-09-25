import { useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';
import { Phone, Plus } from 'lucide-react';
import { fetchContacts, deleteContact, type EmergencyContact } from '@/services/emergency.service';

const EmergencyContactsPage = () => {
    const tableRef = useRef<DataTableRef>(null);
    const { hasPermission } = useAuth();
    const canAdd = hasPermission('emergency.add_contact');
    const canDelete = hasPermission('emergency.delete_contact');

    const columns: Column[] = [
        {
            header: 'Name',
            type: 'text',
            accessor: 'name',
            sortable: true,
            sortKey: 'name',
            width: 250,
        },
        {
            header: 'Category',
            type: 'badge',
            accessor: (c: EmergencyContact) => ({
                label: c.category_display || c.category,
                status: 'default'
            }),
            badgeConfig: {
                default: { label: '', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' }
            },
            sortable: true,
            sortKey: 'category',
            width: 200,
        },
        {
            header: 'Phone',
            type: 'icon-text',
            icon: Phone,
            accessor: 'phone_number',
            sortable: true,
            sortKey: 'phone_number',
            width: 150,
        },
        {
            header: 'Hotline',
            type: 'badge',
            accessor: (c: EmergencyContact) => ({
                label: c.is_emergency_hotline ? 'Yes' : 'No',
                status: c.is_emergency_hotline ? 'yes' : 'no'
            }),
            badgeConfig: {
                yes: { label: '', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' },
                no: { label: '', className: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700' },
            },
            width: 100,
        }
    ];

    return (
        <div className="space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Directory</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage society emergency contacts and hotlines.
                </p>
            </div>

            <DataTable
                ref={tableRef}
                api={fetchContacts}
                columns={columns}
                defaultVisibleColumns={['Name', 'Category', 'Phone', 'Hotline']}
                enableSearch
                searchPlaceholder="Search contacts by name or phone..."
                defaultView="table"
                defaultPageSize={10}
                enableSelection={false}
                exportable={true}
                deleteApi={canDelete ? deleteContact : undefined}
                emptyMessage={
                    <div className="flex flex-col items-center gap-3 text-gray-400 p-8">
                        <Phone className="w-12 h-12 opacity-20" />
                        <p className="font-medium">No contacts found</p>
                    </div>
                }
                extraToolbarActions={
                    canAdd && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-95">
                            <Plus className="w-4 h-4" />
                            Add Contact
                        </button>
                    )
                }
            />
        </div>
    );
};

export default EmergencyContactsPage;
