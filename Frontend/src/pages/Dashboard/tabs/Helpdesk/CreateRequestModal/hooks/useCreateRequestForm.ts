import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { fetchBlocks } from '@/services/auth/auth.service';
import { HelpdeskService } from '../../services/helpdesk.service';
import type { BlockData, AuthUser } from '@/types/auth.types';
import type { HelpdeskRequest, IssueCategoryObj } from '@/types/helpdesk.types';
import type { UploadedFile } from '@/components/widgets/MediaUpload';
import type { CreateRequestFormData } from '../types/createRequest.types';
import { GROUPED_COMMON_AREAS } from '../utils/requestConstants';

interface UseCreateRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: (newReq: HelpdeskRequest) => void;
  onRequestUpdated?: (updatedReq: HelpdeskRequest) => void;
  user: AuthUser | null;
  editRequest?: HelpdeskRequest | null;
}

export const useCreateRequestForm = ({
  isOpen,
  onClose,
  onRequestCreated,
  onRequestUpdated,
  user,
  editRequest,
}: UseCreateRequestFormProps) => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState<CreateRequestFormData>({
    title: '',
    category: '',
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

  // Fetch Categories and Blocks on open
  useEffect(() => {
    if (isOpen) {
      if (blocks.length === 0) {
        fetchBlocks().then(setBlocks).catch(console.error);
      }

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
        let bId: number | '' = '';
        let fId: number | '' = '';

        if (editRequest.is_flat_specific && editRequest.flat_number && blocks.length > 0) {
          const parts = editRequest.flat_number.split(' - ');
          if (parts.length === 2) {
            const [blockName, flatNum] = parts;
            const foundBlock = blocks.find((b) => b.name.toLowerCase() === blockName.trim().toLowerCase());
            if (foundBlock) {
              bId = foundBlock.id;
              const foundFlat = foundBlock.flats.find((f) => String(f.number).toLowerCase() === flatNum.trim().toLowerCase());
              if (foundFlat) {
                fId = foundFlat.id;
              }
            }
          }
        }

        setFormData({
          title: editRequest.title,
          category: editRequest.category,
          is_flat_specific: editRequest.is_flat_specific,
          block_id: bId,
          flat_id: fId,
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
        const selectedCat = dynamicCategories.find(c => String(c.id) === String(newValue));
        const catName = selectedCat?.name || '';
        if (catName === 'Pool') {
          updated.is_flat_specific = false;
          updated.common_area = 'Swimming Pool Area & Deck';
        } else if (catName === 'Gym') {
          updated.is_flat_specific = false;
          updated.common_area = 'Gymnasium';
        } else if (catName === 'Water' || catName === 'Power') {
          updated.is_flat_specific = true;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (formData.title.trim().length < 3) return;

    try {
      setIsSubmitting(true);

      const finalLocation = formData.is_flat_specific
        ? formData.flat_number
        : formData.common_area;

      const media_tokens = attachments
        .filter(f => f.mediaId && f.proofToken)
        .map(f => ({
          media_id: f.mediaId,
          proof_token: f.proofToken,
        }));

      const payload: any = {
        title: formData.title,
        category: formData.category,
        is_flat_specific: formData.is_flat_specific,
        flat_number: finalLocation,
        description: formData.description,
        mobile_number: formData.mobile_number,
        priority: formData.priority,
      };

      if (media_tokens.length > 0) {
        payload.media_tokens = media_tokens;
      }

      const onProgress = (progressEvent: any) => {
        if (progressEvent.total) {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
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

  const isFormValid =
    formData.title.trim().length >= 3 &&
    formData.description.trim().length > 0 &&
    (formData.is_flat_specific ? Boolean(formData.block_id && formData.flat_id) : true);

  return {
    blocks,
    formData,
    dynamicCategories,
    attachments,
    setAttachments,
    isSubmitting,
    uploadProgress,
    isFormValid,
    handleChange,
    handleSubmit,
  };
};
