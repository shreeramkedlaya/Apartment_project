import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useToast } from '@/context/ToastContext';
import { billingService } from '@/services/billing.service';
import type { LineItem } from '@/services/billing.service';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateBillModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [flatId, setFlatId] = useState('');
  const [category, setCategory] = useState('Maintenance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', amount: 0 }]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId || lineItems.length === 0 || !title) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      await billingService.generateInvoice({
        flat_id: Number(flatId),
        category,
        title,
        description,
        line_items: lineItems
      });
      showToast('Invoice generated successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to generate invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Invoice">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Flat ID *</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
              value={flatId}
              onChange={(e) => setFlatId(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
          <div>
            <CustomDropdown
              label="Category *"
              required
              options={['Maintenance', 'Event', 'Penalty', 'Amenity']}
              value={category}
              onChange={(val) => setCategory(val)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. November Maintenance"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Line Items *</label>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center font-medium"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="flex gap-3 items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <input
                  type="text"
                  required
                  placeholder="Item description..."
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                />
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1.5 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full pl-6 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                    value={item.amount || ''}
                    onChange={(e) => handleLineItemChange(index, 'amount', Number(e.target.value))}
                  />
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center"
          >
            {loading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateBillModal;
