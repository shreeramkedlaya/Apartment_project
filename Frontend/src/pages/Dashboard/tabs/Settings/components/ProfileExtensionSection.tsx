import React, { useRef, useState } from 'react';
import DataTable from '@/components/common/DataTable/DataTable';
import type { Column, DataTableRef } from '@/components/common/DataTable/types/types';
import Modal from '@/components/ui/Modal';
import { fetchProfileExtension, createProfileExtension, updateProfileExtension, deleteProfileExtension } from '@/services/profile.service';
import { useToast } from '@/context/ToastContext';
import { Plus } from 'lucide-react';

export interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'tel';
    options?: { label: string; value: string }[];
    maxLength?: number;
    uppercase?: boolean;
}

interface ProfileExtensionSectionProps {
    title: string;
    icon: React.ElementType;
    endpoint: string;
    columns: Column[];
    fields: FieldConfig[];
}

const ProfileExtensionSection: React.FC<ProfileExtensionSectionProps> = ({ title, icon: Icon, endpoint, columns, fields }) => {
    const tableRef = useRef<DataTableRef>(null);
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData(fields.reduce((acc, field) => ({ ...acc, [field.name]: field.type === 'checkbox' ? false : '' }), {}));
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const fieldConfig = fields.find(f => f.name === target.name);
        
        let value: any = target.type === 'checkbox' ? target.checked : target.value;
        if (fieldConfig?.uppercase && typeof value === 'string') {
            value = value.toUpperCase();
        }
        
        // Only allow numbers for 'tel' inputs
        if (fieldConfig?.type === 'tel' && typeof value === 'string') {
            value = value.replace(/\D/g, '');
        }

        setFormData(prev => ({ ...prev, [target.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await updateProfileExtension(endpoint, editingItem.id, formData);
                showToast(`${title} updated successfully`, 'success');
            } else {
                await createProfileExtension(endpoint, formData);
                showToast(`${title} added successfully`, 'success');
            }
            handleCloseModal();
            tableRef.current?.refresh();
        } catch (error: any) {
            showToast(error.response?.data?.error || `Failed to save ${title}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-500" /> {title}
                </h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                    <Plus className="w-3 h-3" /> Add New
                </button>
            </div>
            
            <div className="p-0">
                <DataTable
                    ref={tableRef}
                    api={() => fetchProfileExtension(endpoint)}
                    deleteApi={(id) => deleteProfileExtension(endpoint, id)}
                    columns={columns}
                    defaultPageSize={5}
                    enableSearch={false}
                    onEdit={handleOpenModal}
                    emptyMessage={`No ${title.toLowerCase()} added yet.`}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingItem ? `Edit ${title}` : `Add ${title}`}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fields.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {field.label}
                            </label>
                            {field.type === 'select' ? (
                                <select
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
                                >
                                    <option value="" disabled>Select {field.label}</option>
                                    {field.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : field.type === 'checkbox' ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        checked={formData[field.name] || false}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Yes</span>
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={field.maxLength}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProfileExtensionSection;
