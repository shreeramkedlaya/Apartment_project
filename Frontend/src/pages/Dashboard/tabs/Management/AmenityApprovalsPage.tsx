import React, { useState, useEffect } from 'react';
import { fetchAmenityBookings, fetchAmenities, approveBooking, rejectBooking, type AmenityBooking, type Amenity } from '@/services/amenity.service';
import { useToast } from '@/context/ToastContext';
import { Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AmenityApprovalsPageProps {}

const AmenityApprovalsPage: React.FC<AmenityApprovalsPageProps> = () => {
    const [bookings, setBookings] = useState<AmenityBooking[]>([]);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bookingsData, amenitiesData] = await Promise.all([
                fetchAmenityBookings(),
                fetchAmenities()
            ]);
            setBookings(bookingsData);
            setAmenities(amenitiesData);
        } catch (error) {
            showToast('Failed to load bookings', 'error');
        } finally {
            setLoading(false);
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
            await loadData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || `Failed to ${action} booking`;
            showToast(errorMsg, 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Confirmed
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                        Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> Pending Review
                    </span>
                );
        }
    };

    const pendingBookings = bookings.filter(b => b.status.toLowerCase() === 'pending');
    const pastBookings = bookings.filter(b => b.status.toLowerCase() !== 'pending');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Amenity Booking Approvals</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Review and approve facility reservation requests from residents.
                </p>
            </div>

            {/* Pending Requests Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Pending Requests ({pendingBookings.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="text-sm text-gray-500">Loading requests...</div>
                ) : pendingBookings.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-gray-500 text-sm">
                        No pending amenity bookings requiring approval.
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs uppercase font-medium border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-5 py-3">Amenity</th>
                                        <th className="px-5 py-3">Start Time</th>
                                        <th className="px-5 py-3">End Time</th>
                                        <th className="px-5 py-3">Purpose</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {pendingBookings.map((b) => {
                                        const matchedAmenity = amenities.find(a => a.id === b.amenity);
                                        const isActionLoading = actionLoadingId === b.id;
                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                                <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                                                    {matchedAmenity ? matchedAmenity.name : `Amenity #${b.amenity}`}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                                                    {new Date(b.start_time).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                                                    {new Date(b.end_time).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                                                    {b.purpose}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {getStatusBadge(b.status)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleAction(b.id, 'approve')}
                                                            disabled={isActionLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(b.id, 'reject')}
                                                            disabled={isActionLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <X className="w-3.5 h-3.5" /> Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* All / Past Bookings Section */}
            {pastBookings.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        History & Processed Bookings ({pastBookings.length})
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs uppercase font-medium border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-5 py-3">Amenity</th>
                                        <th className="px-5 py-3">Start Time</th>
                                        <th className="px-5 py-3">End Time</th>
                                        <th className="px-5 py-3">Purpose</th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {pastBookings.map((b) => {
                                        const matchedAmenity = amenities.find(a => a.id === b.amenity);
                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                                <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                                                    {matchedAmenity ? matchedAmenity.name : `Amenity #${b.amenity}`}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                                                    {new Date(b.start_time).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                                                    {new Date(b.end_time).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                                                    {b.purpose}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {getStatusBadge(b.status)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AmenityApprovalsPage;