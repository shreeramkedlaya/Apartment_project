import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, Radio } from 'lucide-react';
import { createBroadcast } from '@/services/emergency.service';
import { useToast } from '@/context/ToastContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TriggerBroadcastModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        severity: 'HIGH',
        category: 'SECURITY_ALERT'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.message) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await createBroadcast(formData);
            showToast('Emergency broadcast dispatched successfully!', 'success');
            onSuccess();
        } catch (error) {
            showToast('Failed to dispatch broadcast', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Trigger Emergency Broadcast"
            description="Send a high-priority alert to all residents immediately."
            icon={<Radio className="w-5 h-5 text-red-500" />}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex gap-3 border border-red-100 dark:border-red-900/50 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                        Warning: This will immediately send a push notification to all users and display a dashboard banner. Use only for genuine emergencies.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                        Alert Title
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Fire in Block B"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                            Severity
                        </label>
                        <select
                            value={formData.severity}
                            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                        >
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="WARNING">Warning</option>
                            <option value="INFO">Info</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                        >
                            <option value="SECURITY_ALERT">Security Alert</option>
                            <option value="FIRE_HAZARD">Fire Hazard</option>
                            <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                            <option value="NATURAL_DISASTER">Natural Disaster</option>
                            <option value="UTILITY_FAILURE">Utility Failure</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                        Message Details
                    </label>
                    <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Provide specific details and instructions for residents..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                        required
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
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? 'Dispatching...' : (
                            <>
                                <Radio className="w-4 h-4" />
                                Broadcast Now
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TriggerBroadcastModal;
