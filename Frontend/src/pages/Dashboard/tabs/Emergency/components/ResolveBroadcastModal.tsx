import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CheckCircle } from 'lucide-react';
import { resolveBroadcast, type EmergencyBroadcast } from '@/services/emergency.service';
import { useToast } from '@/context/ToastContext';

interface Props {
    broadcast: EmergencyBroadcast | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ResolveBroadcastModal: React.FC<Props> = ({ broadcast, isOpen, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!broadcast) return;

        try {
            setSubmitting(true);
            await resolveBroadcast(broadcast.id, { resolution_note: resolutionNote });
            showToast('Emergency marked as resolved.', 'success');
            onSuccess();
        } catch (error) {
            showToast('Failed to resolve broadcast', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Resolve Emergency"
            description="Mark the active emergency as resolved and notify residents."
            icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{broadcast?.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Sent on: {broadcast?.created_at ? new Date(broadcast.created_at).toLocaleString() : ''}</p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                        Resolution Note (Optional)
                    </label>
                    <textarea
                        rows={3}
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Briefly explain how the situation was resolved..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        {submitting ? 'Resolving...' : 'Confirm Resolution'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ResolveBroadcastModal;
