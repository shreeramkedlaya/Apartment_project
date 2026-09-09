import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import type { BlockData, AuthUser } from '@/types/auth.types';
import type { HelpdeskRequest } from '@/types/helpdesk.types';
import { HelpdeskService } from './services/helpdesk.service';
import { Droplet, Zap, Sparkles, Dumbbell, Waves, Tag } from 'lucide-react';
import type { IssueCategoryObj } from '@/types/helpdesk.types';
import MediaUpload from '@/components/widgets/MediaUpload';
import type { UploadedFile } from '@/components/widgets/MediaUpload';
import { useToast } from '@/context/ToastContext';

const ICON_MAP: Record<string, any> = {
  'Water': Droplet,
  'Power': Zap,
  'Housekeeping': Sparkles,
  'Gym': Dumbbell,
  'Pool': Waves
};

export const GROUPED_COMMON_AREAS = [
  { group: 'Outdoor & Perimeter', items: ['Main Entrance / Security Gates', 'Visitor Parking', 'Children Play Area / Park'] },
  { group: 'Clubhouse & Amenities', items: ['Community Hall', 'Gymnasium', 'Swimming Pool Area & Deck'] },
  { group: 'Block Shared Facilities', items: ['Elevator Lobby', 'Passenger Elevators', 'Staircases', 'Corridors / Passages', 'Terrace / Rooftop'] },
  { group: 'Basement & Utilities', items: ['Basement Parking', 'DG Room & Transformer Yard', 'Pump Room & Water Sumps', 'STP Area'] },
];

export interface CreateRequestFormData {
  title: string;
  category: string | number;
  is_flat_specific: boolean;
  block_id: number | '';
  flat_id: number | '';
  flat_number: string;
  common_area: string;
  description: string;
  mobile_number: string;
  priority: string;
}

export interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: (newReq: HelpdeskRequest) => void;
  onRequestUpdated?: (updatedReq: HelpdeskRequest) => void;
  user: AuthUser | null;
  blocks: BlockData[];
  editRequest?: HelpdeskRequest | null;
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
  onRequestUpdated,
  user,
  blocks,
  editRequest,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { showToast } = useToast();

  // Single Unified Form State matching Backend Request Model
  const [formData, setFormData] = useState<CreateRequestFormData>({
    title: '',
    category: '', // Will be set to first dynamic category ID
    is_flat_specific: true,
    block_id: '',
    flat_id: '',
    flat_number: user?.flatNumber || '',
    common_area: GROUPED_COMMON_AREAS[0].items[0],
    description: '',
    mobile_number: user?.phone || '',
    priority: 'Medium',
  });

  const [dynamicCategories, setDynamicCategories] = useState<IssueCategoryObj[]>([]);

  // Fetch Categories
  useEffect(() => {
    if (isOpen) {
      HelpdeskService.getCategories().then((cats) => {
        setDynamicCategories(cats);
        if (cats.length > 0 && !editRequest && !formData.category) {
          setFormData((prev) => ({ ...prev, category: String(cats[0].id) }));
        }
      }).catch(console.error);
    }
  }, [isOpen, editRequest]);

  // Pre-select user's registered block & flat when modal opens, OR populate edit data
  useEffect(() => {
    if (isOpen) {
      if (editRequest) {
        setFormData({
          title: editRequest.title,
          category: editRequest.category,
          is_flat_specific: editRequest.is_flat_specific,
          block_id: (editRequest as any).block_id || '',
          flat_id: (editRequest as any).flat_id || '',
          flat_number: editRequest.flat_number || '',
          common_area: (!editRequest.is_flat_specific ? editRequest.flat_number : (editRequest as any).common_area) || GROUPED_COMMON_AREAS[0].items[0],
          description: editRequest.description,
          mobile_number: editRequest.mobile_number || '',
          priority: editRequest.priority,
        });
      } else if (user) {
        let bId: number | '' = '';
        let fId: number | '' = '';

        if (user.flatNumber && blocks.length > 0) {
          const parts = user.flatNumber.split(' - ');
          if (parts.length === 2) {
            const [blockName, flatNum] = parts;
            const foundBlock = blocks.find((b) => b.name.toLowerCase() === blockName.trim().toLowerCase());
            if (foundBlock) {
              bId = foundBlock.id;
              const foundFlat = foundBlock.flats.find((f) => f.number.toLowerCase() === flatNum.trim().toLowerCase());
              if (foundFlat) {
                fId = foundFlat.id;
              }
            }
          }
        }

        setFormData((prev) => ({
          ...prev,
          title: '',
          category: 'Water',
          is_flat_specific: true,
          description: '',
          priority: 'Medium',
          mobile_number: user.phone || '',
          flat_number: user.flatNumber || '',
          block_id: bId || '',
          flat_id: fId || '',
        }));
      }
    }
  }, [user, blocks, isOpen, editRequest]);

  // Universal handleChange with Intent Mapping Logic
  const handleChange = (
    fieldOrEvent: keyof CreateRequestFormData | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    value?: any
  ) => {
    let fieldName: string;
    let newValue: any;

    if (typeof fieldOrEvent === 'string') {
      fieldName = fieldOrEvent;
      newValue = value;
    } else {
      const { name, value: val, type } = fieldOrEvent.target;
      const checked = (fieldOrEvent.target as HTMLInputElement).checked;
      fieldName = name;
      newValue = type === 'checkbox' ? checked : val;
    }

    setFormData((prev) => {
      const updated = { ...prev, [fieldName]: newValue };

      // Intent Mapping: Auto-switch location based on Category
      if (fieldName === 'category') {
        if (newValue === 'Pool') {
          updated.is_flat_specific = false;
          updated.common_area = 'Swimming Pool Area & Deck';
        } else if (newValue === 'Gym') {
          updated.is_flat_specific = false;
          updated.common_area = 'Gymnasium';
        } else if (newValue === 'Water' || newValue === 'Power') {
          updated.is_flat_specific = true;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim().length < 3) return;

    try {
      setIsSubmitting(true);

      // Compute final location / flat_number matching Backend Issue model
      const finalLocation = formData.is_flat_specific
        ? formData.flat_number
        : formData.common_area;

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('category', String(formData.category));
      payload.append('is_flat_specific', String(formData.is_flat_specific));
      payload.append('flat_number', finalLocation);
      payload.append('description', formData.description);
      payload.append('mobile_number', formData.mobile_number);
      payload.append('priority', formData.priority);

      attachments.forEach((file) => {
        payload.append('attachments', file);
      });

      const onProgress = (e: any) => {
        if (e.total) {
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      };

      if (editRequest) {
        const updated = await HelpdeskService.updateRequest(editRequest.id, payload, onProgress);
        if (onRequestUpdated) onRequestUpdated(updated);
        showToast('Request updated successfully', 'success');
      } else {
        const created = await HelpdeskService.createRequest(payload, onProgress);
        onRequestCreated(created);
        showToast('Request created successfully', 'success');
      }
      onClose();
      
      // Reset form
      setAttachments([]);
      setUploadProgress(null);
      setFormData({
        title: '',
        category: dynamicCategories.length > 0 ? String(dynamicCategories[0].id) : '',
        is_flat_specific: true,
        block_id: '',
        flat_id: '',
        flat_number: user?.flatNumber || '',
        common_area: GROUPED_COMMON_AREAS[0].items[0],
        description: '',
        mobile_number: user?.phone || '',
        priority: 'Medium',
      });
    } catch (error) {
      console.error(editRequest ? "Error updating request:" : "Error creating request:", error);
      showToast(editRequest ? "Failed to update request." : "Failed to create request.", 'error');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editRequest ? "Edit Request" : "Raise a New Request"}
      description={editRequest ? "Update the details of your helpdesk request." : "Tell us what you need help with, and we'll get it sorted."}
      width="large"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim() || (formData.is_flat_specific ? !formData.block_id || !formData.flat_id : false)}
            className="flex items-center justify-center gap-2 px-6 py-2 min-w-[140px] text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden"
          >
            {/* Progress bar background */}
            {isSubmitting && uploadProgress !== null && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-blue-800 opacity-30 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            )}
            
            <span className="relative z-10">
              {isSubmitting 
                ? (uploadProgress !== null ? `Uploading... ${uploadProgress}%` : (editRequest ? 'Updating...' : 'Submitting...')) 
                : (editRequest ? 'Update Request' : 'Submit Request')}
            </span>
          </button>
        </>
      }
    >
      <div className="space-y-8 pb-4">
        {/* Row 1: Category */}
        <div>
          <label className="block text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {dynamicCategories.map((cat) => {
              const Icon = ICON_MAP[cat.name] || Tag;
              const isSelected = String(formData.category) === String(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleChange('category', cat.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${isSelected
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                      }`}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
            {dynamicCategories.length === 0 && (
              <div className="col-span-5 text-sm text-gray-400 p-4 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                No categories available.
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Location Block */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
              Location / Target Area <span className="text-red-500">*</span>
            </span>
            <div className="inline-flex rounded-lg bg-gray-200/80 dark:bg-gray-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleChange('is_flat_specific', true)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${formData.is_flat_specific
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                My Flat
              </button>
              <button
                type="button"
                onClick={() => handleChange('is_flat_specific', false)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${!formData.is_flat_specific
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Common Area
              </button>
            </div>
          </div>

          {formData.is_flat_specific ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <CustomDropdown
                  label="Block"
                  placeholder="Select Block"
                  required={formData.is_flat_specific}
                  options={blocks.map((b) => ({ value: b.id, label: b.name }))}
                  value={formData.block_id}
                  onChange={(bId) => {
                    const blk = blocks.find((b) => b.id === bId);
                    if (blk && blk.flats.length > 0) {
                      handleChange('block_id', bId || '');
                      handleChange('flat_id', blk.flats[0].id);
                      handleChange('flat_number', `${blk.name} - ${blk.flats[0].number}`);
                    } else {
                      handleChange('block_id', bId || '');
                      handleChange('flat_id', '');
                      handleChange('flat_number', '');
                    }
                  }}
                />
              </div>
              <div>
                <CustomDropdown
                  label="Flat No"
                  placeholder="Select Flat"
                  required={formData.is_flat_specific}
                  disabled={!formData.block_id}
                  options={(blocks.find((b) => b.id === formData.block_id)?.flats || []).map((f) => ({
                    value: f.id,
                    label: f.number,
                  }))}
                  value={formData.flat_id}
                  onChange={(fId) => {
                    const blk = blocks.find((b) => b.id === formData.block_id);
                    const flat = blk?.flats.find((f) => f.id === fId);
                    if (blk && flat) {
                      handleChange('flat_id', fId);
                      handleChange('flat_number', `${blk.name} - ${flat.number}`);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <CustomDropdown
                required
                searchable
                searchPlaceholder="Search common facility..."
                options={GROUPED_COMMON_AREAS}
                value={formData.common_area}
                onChange={(area) => handleChange('common_area', area)}
              />
            </div>
          )}
        </div>

        {/* Row 3: Issue Title & Description */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                Issue Title <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all shadow-xs outline-none"
              placeholder="e.g. Lift door not opening on 3rd floor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detailed Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none min-h-[120px] shadow-xs"
              placeholder="Please describe the issue in detail..."
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <MediaUpload
              label="Attachments (Photos/Videos)"
              value={attachments}
              onChange={setAttachments}
              maxFiles={3} // Allowing multiple files just in case!
              maxFileSizeMB={150}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Row 4: Contact & Priority (Secondary Fields) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <label className="block text-[10px] font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1">
                Contact
              </label>
              <input
                type="tel"
                name="mobile_number"
                required
                value={formData.mobile_number}
                onChange={(e) => handleChange('mobile_number', e.target.value)}
                className="w-full max-w-[140px] border-none bg-transparent p-0 text-sm font-semibold text-gray-900 dark:text-white focus:ring-0 outline-none"
                placeholder="Phone number"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1">
              Priority
            </label>
            <CustomDropdown
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium (Default)' },
                { value: 'High', label: 'High (Urgent)' },
              ]}
              value={formData.priority}
              onChange={(val) => handleChange('priority', val)}
              className="w-full"
            />
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default CreateRequestModal;