import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import axiosInstance from '@/services/core/axiosinstance';
import { useToast } from '@/context/ToastContext';
import { createVisitorLog } from '../services/visitor.service';

interface Flat {
  id: number;
  number: string;
}

interface Block {
  id: number;
  name: string;
  flats: Flat[];
}

interface NewVisitorFormProps {
  onComplete?: () => void;
}

export default function NewVisitorForm({ onComplete }: NewVisitorFormProps) {
  const { showToast } = useToast();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  const [selectedFlat, setSelectedFlat] = useState<number | ''>('');
  const [visitorName, setVisitorName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const { data } = await axiosInstance.get('/accounts/blocks/');
        setBlocks(data);
      } catch (err) {
        console.error('Failed to load flats', err);
      } finally {
        setLoadingBlocks(false);
      }
    };
    loadBlocks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlat || !visitorName) return;
    try {
      setSubmitting(true);
      await createVisitorLog({
        flat: Number(selectedFlat),
        details: { name: visitorName, purpose, phone }
      });
      showToast('Visitor request sent to resident', 'success');
      setSelectedFlat('');
      setVisitorName('');
      setPurpose('');
      setPhone('');
      
      // Dispatch global event so tables auto-refresh
      window.dispatchEvent(new CustomEvent('VISITORS_UPDATED'));
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to create visitor request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBlocks) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Flat</label>
        <select 
          value={selectedFlat} 
          onChange={(e) => setSelectedFlat(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Flat...</option>
          {blocks.map(block => (
            <optgroup key={block.id} label={block.name}>
              {block.flats.map(flat => (
                <option key={flat.id} value={flat.id}>{block.name} - {flat.number}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visitor Name</label>
        <input 
          type="text" 
          value={visitorName} 
          onChange={(e) => setVisitorName(e.target.value)}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
        <input 
          type="text" 
          value={purpose} 
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Delivery, Guest..."
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone (Optional)</label>
        <input 
          type="tel" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="1234567890"
        />
      </div>
      <button 
        type="submit" 
        disabled={submitting}
        className="w-full md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Send Request</>}
      </button>
    </form>
  );
}
