import React, { useState, useEffect, useRef } from 'react';
import { fetchAmenityBookings, fetchAmenities, approveBooking, rejectBooking, type AmenityBooking, type Amenity } from '@/services/amenity.service';
import { useToast } from '@/context/ToastContext';
import { Check, X } from 'lucide-react';
import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';

interface AmenityApprovalsPageProps {}

const AmenityApprovalsPage: React.FC<AmenityApprovalsPageProps> = () => {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loadingAmenities, setLoadingAmenities] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
    const pendingTableRef = useRef<DataTableRef>(null);
    const historyTableRef = useRef<DataTableRef>(null);

    const { showToast } = useToast();

    useEffect(() => {
        loadAmenities();
    }, []);

    const loadAmenities = async () => {
        try {
            setLoadingAmenities(true);
            const amenitiesData = await fetchAmenities();
            setAmenities(amenitiesData);
        } catch (error) {
            showToast('Failed to load amenities', 'error');
        } finally {
            setLoadingAmenities(false);
        }
    };

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        try {
            setActionLoadingId(id);
            if (action === 'approve') {
                await approveBooking(id);
            } else {
                await rejectBooking(id);
            }
            showToast(`Booking ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
            // Refresh both tables
            pendingTableRef.current?.refresh();
            historyTableRef.current?.refresh();
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || `Failed to ${action} booking`;
            showToast(errorMsg, 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const getColumns = (): Column[] => {
        const baseColumns: Column[] = [
            {
                header: 'Amenity',
                type: 'text',
                accessor: (b: AmenityBooking) => {
                    const matched = amenities.find(a => a.id === b.amenity);
                    return matched ? matched.name : `Amenity #${b.amenity}`;
                },
                sortable: false, // sorting by related fields usually needs backend support for 'amenity__name', we can disable here
            },
            {
                header: 'Start Time',
                type: 'text',
                accessor: (b: AmenityBooking) => new Date(b.start_time).toLocaleString(),
                sortable: true,
            },
            {
                header: 'End Time',
                type: 'text',
                accessor: (b: AmenityBooking) => new Date(b.end_time).toLocaleString(),
                sortable: true,
            },
            {
                header: 'User',
                type: 'text',
                accessor: (b: any) => b.user_name || `User ID ${b.user}`, // Using basic representation if user info is minimal
            },
            {
                header: 'Purpose',
                type: 'text',
                accessor: 'purpose',
            },
            {
                header: 'Status',
                type: 'badge',
                accessor: (b: AmenityBooking) => {
                    const s = b.status.toLowerCase();
                    let label: string = b.status;
                    let statusClass = 'pending';
                    if (s === 'confirmed' || s === 'approved') {
                        label = 'Confirmed';
                        statusClass = 'confirmed';
                    } else if (s === 'rejected') {
                        label = 'Rejected';
                        statusClass = 'rejected';
                    } else if (s === 'cancelled') {
                        label = 'Cancelled';
                        statusClass = 'cancelled';
                    }
                    return { label, status: statusClass };
                },
                badgeConfig: {
                    confirmed: { label: '', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
                    rejected: { label: '', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
                    cancelled: { label: '', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
                    pending: { label: '', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' }
                }
            }
        ];
        return baseColumns;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Amenity Booking Approvals</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Review and approve facility reservation requests from residents.
                </p>
            </div>

            {loadingAmenities ? (
                <div className="text-sm text-gray-500">Loading...</div>
            ) : (
                <>
                    {/* Pending Requests Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Pending Requests
                            </h2>
                        </div>
                        <DataTable
                            ref={pendingTableRef}
                            api={async (params) => fetchAmenityBookings({ ...params, status: 'pending' })}
                            columns={getColumns()}
                            defaultVisibleColumns={['Amenity', 'Start Time', 'End Time', 'User', 'Purpose', 'Status']}
                            enableSearch={true}
                            defaultView="table"
                            defaultPageSize={10}
                            enableSelection={false}
                            exportable={false}
                            extraRowActions={(b: AmenityBooking) => (
                                b.status.toLowerCase() === 'pending' ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAction(b.id, 'approve')}
                                            disabled={actionLoadingId === b.id}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(b.id, 'reject')}
                                            disabled={actionLoadingId === b.id}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <X className="w-3.5 h-3.5" /> Reject
                                        </button>
                                    </div>
                                ) : null
                            )}
                            emptyMessage={
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-gray-500 text-sm">
                                    No pending amenity bookings requiring approval.
                                </div>
                            }
                        />
                    </div>

                    {/* History & Processed Bookings Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            History & Processed Bookings
                        </h2>
                        <DataTable
                            ref={historyTableRef}
                            api={async (params) => fetchAmenityBookings({ ...params, status: 'processed' })}
                            columns={getColumns()}
                            defaultVisibleColumns={['Amenity', 'Start Time', 'End Time', 'User', 'Purpose', 'Status']}
                            enableSearch={true}
                            defaultView="table"
                            defaultPageSize={10}
                            enableSelection={false}
                            exportable={false}
                            emptyMessage={
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-gray-500 text-sm">
                                    No processed amenity bookings found.
                                </div>
                            }
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default AmenityApprovalsPage;