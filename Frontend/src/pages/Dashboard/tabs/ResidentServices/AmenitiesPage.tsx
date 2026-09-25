import React, { useState, useEffect } from 'react';
import { fetchAmenities, fetchAmenityBookings, createBooking, cancelBooking, type Amenity, type AmenityBooking } from '@/services/amenity.service';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/common/DataTable/DataTable';
import type { Column } from '@/components/common/DataTable/types/types';
import { Plus, XCircle } from 'lucide-react';

interface AmenitiesPageProps {}

const AmenitiesPage: React.FC<AmenitiesPageProps> = () => {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [bookings, setBookings] = useState<AmenityBooking[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [amenitiesData, bookingsData] = await Promise.all([
                fetchAmenities(),
                fetchAmenityBookings()
            ]);
            setAmenities(amenitiesData);
            setBookings(bookingsData);
        } catch (error) {
            showToast('Failed to load amenities data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBookingModal = (amenity: Amenity) => {
        setSelectedAmenity(amenity);
        setStartTime('');
        setEndTime('');
        setPurpose('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAmenity(null);
    };

    const handleSubmitBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAmenity) return;

        if (!startTime || !endTime || !purpose.trim()) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (new Date(startTime) >= new Date(endTime)) {
            showToast('End time must be after start time', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await createBooking({
                amenity: selectedAmenity.id,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                purpose: purpose.trim()
            });
            showToast('Booking request submitted successfully!', 'success');
            handleCloseModal();
            loadData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to submit booking';
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelBooking = async (bookingId: number) => {
        try {
            await cancelBooking(bookingId);
            showToast('Booking cancelled successfully', 'success');
            loadData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || 'Failed to cancel booking';
            showToast(errorMsg, 'error');
        }
    };

    const bookingColumns: Column[] = [
        {
            header: 'Amenity',
            type: 'text',
            accessor: (b: AmenityBooking) => {
                const matched = amenities.find(a => a.id === b.amenity);
                return matched ? matched.name : `Amenity #${b.amenity}`;
            },
            sortable: true,
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
                    label = 'Approved';
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
                confirmed: { label: '', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' },
                rejected: { label: '', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60' },
                cancelled: { label: '', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700' },
                pending: { label: '', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60' }
            }
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Amenities</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Book clubhouse, sports courts, and community facilities.
                </p>
            </div>

            {/* Available Amenities Cards */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Available Facilities</h2>
                {loading ? (
                    <div className="text-sm text-gray-500">Loading amenities...</div>
                ) : amenities.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-gray-500">
                        No active amenities found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {amenities.map((amenity) => (
                            <div
                                key={amenity.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {amenity.name}
                                        </h3>
                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                                        {amenity.description || 'No description provided.'}
                                    </p>
                                    {amenity.rules && (
                                        <div className="bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-lg mb-4 text-xs text-gray-600 dark:text-gray-400">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Rules:</span> {amenity.rules}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleOpenBookingModal(amenity)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> Book Slot
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* My Bookings Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">My Bookings</h2>
                {bookings.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-gray-500 text-sm">
                        You have not made any amenity bookings yet.
                    </div>
                ) : (
                    <DataTable
                        api={async () => fetchAmenityBookings()}
                        columns={bookingColumns}
                        defaultVisibleColumns={['Amenity', 'Start Time', 'End Time', 'Purpose', 'Status']}
                        enableSearch={false}
                        defaultView="table"
                        defaultPageSize={5}
                        enableSelection={false}
                        exportable={false}
                        extraRowActions={(b: AmenityBooking) => (
                            (b.status.toLowerCase() === 'pending' || b.status.toLowerCase() === 'confirmed') ? (
                                <button
                                    onClick={() => handleCancelBooking(b.id)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" /> Cancel
                                </button>
                            ) : null
                        )}
                        emptyMessage={
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-gray-500 text-sm">
                                You have not made any amenity bookings yet.
                            </div>
                        }
                    />
                )}
            </div>

            {/* Booking Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`Book ${selectedAmenity?.name || 'Amenity'}`}
                maxWidth="md"
            >
                <form onSubmit={handleSubmitBooking} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                            Start Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                            End Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                            Purpose / Notes
                        </label>
                        <textarea
                            rows={3}
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g. Birthday Party, Badminton Match"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AmenitiesPage;