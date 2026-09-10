import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { fetchBlocks } from '@/services/auth/auth.service';
import { fetchRoles } from '../../../../Administration/services/roles.service';
import { noticeService } from '../../../services/notice.service';
import type { Role } from '@/types/roles.types';
import type { BlockData } from '@/types/auth.types';
import type { UploadedFile } from '@/components/widgets/MediaUpload';
import type { UseNoticeFormProps } from '../types/noticeForm.types';

export const useNoticeForm = ({ editNotice, onNoticeCreated, onNoticeUpdated, onClose }: UseNoticeFormProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'Critical'>('Low');

  // Scheduling State
  const [publishDate, setPublishDate] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Acknowledgement State
  const [requiresAck, setRequiresAck] = useState(false);
  const [acknowledgeBy, setAcknowledgeBy] = useState('');

  // Target Audience State
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<BlockData[]>([]);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetBlocks, setTargetBlocks] = useState<string[]>([]);
  const [targetFlats, setTargetFlats] = useState<string[]>([]);

  // Dependent Dropdown state for flats
  const [selectedBlockForFlats, setSelectedBlockForFlats] = useState<string>('');
  const [selectedFlatInput, setSelectedFlatInput] = useState<string>('');

  // Media
  const [files, setFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    fetchRoles().then((data: any) => {
      const rolesArray = data.results || data.roles || [];
      setAvailableRoles(rolesArray);
    }).catch(console.error);
    fetchBlocks().then(setAvailableBlocks).catch(console.error);
  }, []);

  useEffect(() => {
    if (editNotice) {
      setTitle(editNotice.title);
      setContent(editNotice.content);
      setCategory(editNotice.category);
      setPriority(editNotice.priority);
      setRequiresAck(editNotice.requires_acknowledgement);

      setPublishDate(editNotice.publish_date ? new Date(editNotice.publish_date).toISOString().slice(0, 16) : '');
      setValidUntil(editNotice.valid_until ? new Date(editNotice.valid_until).toISOString().slice(0, 16) : '');
      setAcknowledgeBy(editNotice.acknowledge_by ? new Date(editNotice.acknowledge_by).toISOString().slice(0, 16) : '');

      const audience = editNotice.target_audience || [];
      const editRoles: string[] = [];
      const editBlocks: string[] = [];
      const editFlats: string[] = [];

      if (Array.isArray(audience)) {
        audience.forEach((item: any) => {
          if (item.role) editRoles.push(item.role);
          if (item.block) editBlocks.push(item.block);
          if (item.flat) editFlats.push(item.flat);
        });
      }

      setTargetRoles(editRoles);
      setTargetBlocks(editBlocks);
      setTargetFlats(editFlats);
    } else {
      setTitle('');
      setContent('');
      setCategory('General');
      setPriority('Low');
      setPublishDate('');
      setValidUntil('');
      setRequiresAck(false);
      setAcknowledgeBy('');
      setTargetRoles([]);
      setTargetBlocks([]);
      setTargetFlats([]);
      setFiles([]);
    }
  }, [editNotice]); // removed isOpen from dependencies since hook shouldn't care about it

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!content.trim()) {
      showToast('Notice content is required', 'error');
      return;
    }

    setLoading(true);

    try {
      const targetAudience = [
        ...targetRoles.map(r => ({ role: r })),
        ...targetBlocks.map(b => ({ block: b })),
        ...targetFlats.map(f => ({ flat: f }))
      ];

      if (editNotice) {
        await noticeService.updateNotice(editNotice.id, {
          title,
          content,
          category,
          priority,
          requires_acknowledgement: requiresAck,
          target_audience: targetAudience,
        });
        showToast('Notice updated successfully', 'success');
        onNoticeUpdated();
      } else {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        formData.append('priority', priority);
        formData.append('requires_acknowledgement', String(requiresAck));

        if (publishDate) formData.append('publish_date', new Date(publishDate).toISOString());
        if (validUntil) formData.append('valid_until', new Date(validUntil).toISOString());
        if (requiresAck && acknowledgeBy) formData.append('acknowledge_by', new Date(acknowledgeBy).toISOString());

        formData.append('target_audience', JSON.stringify(targetAudience));

        files.forEach((file) => {
          formData.append('attachments', file);
        });

        await noticeService.createNotice(formData);
        showToast('Notice created successfully as Draft', 'success');
        onNoticeCreated();
      }
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to save notice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setTargetRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleBlockToggle = (block: string) => {
    setTargetBlocks(prev => prev.includes(block) ? prev.filter(b => b !== block) : [...prev, block]);
  };

  const handleRemoveFlat = (flat: string) => {
    setTargetFlats(prev => prev.filter(f => f !== flat));
  };

  const handleAddFlat = () => {
    if (!selectedBlockForFlats || !selectedFlatInput) return;
    const flatString = `${selectedBlockForFlats} - ${selectedFlatInput}`;
    if (!targetFlats.includes(flatString)) {
      setTargetFlats(prev => [...prev, flatString]);
    }
    setSelectedFlatInput('');
  };

  return {
    loading,
    title, setTitle,
    content, setContent,
    category, setCategory,
    priority, setPriority,
    publishDate, setPublishDate,
    validUntil, setValidUntil,
    requiresAck, setRequiresAck,
    acknowledgeBy, setAcknowledgeBy,
    availableRoles,
    availableBlocks,
    targetRoles,
    targetBlocks,
    targetFlats,
    selectedBlockForFlats, setSelectedBlockForFlats,
    selectedFlatInput, setSelectedFlatInput,
    files, setFiles,
    handleSubmit,
    handleRoleToggle,
    handleBlockToggle,
    handleRemoveFlat,
    handleAddFlat,
  };
};
