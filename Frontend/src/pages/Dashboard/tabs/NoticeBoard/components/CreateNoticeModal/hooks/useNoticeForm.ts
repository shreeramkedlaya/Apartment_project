import { useState, useEffect, useCallback } from 'react';
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
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled'>('immediate');
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

  // Audience Type State
  const [audienceType, setAudienceType] = useState<'everyone' | 'roles' | 'blocks'>('everyone');

  useEffect(() => {
    fetchRoles().then((data: any) => {
      const rolesArray = data.results || data.roles || [];
      setAvailableRoles(rolesArray);
    }).catch(console.error);
    fetchBlocks().then(setAvailableBlocks).catch(console.error);
  }, []);

  const resetForm = useCallback(() => {
    if (editNotice) {
      setTitle(editNotice.title);
      setContent(editNotice.content);
      setCategory(editNotice.category);
      setPriority(editNotice.priority);
      setRequiresAck(editNotice.requires_acknowledgement);

      if (editNotice.publish_date || editNotice.valid_until) {
        setPublishMode('scheduled');
        setPublishDate(editNotice.publish_date ? new Date(editNotice.publish_date).toISOString() : '');
        setValidUntil(editNotice.valid_until ? new Date(editNotice.valid_until).toISOString() : '');
      } else {
        setPublishMode('immediate');
        setPublishDate('');
        setValidUntil('');
      }

      setAcknowledgeBy(editNotice.acknowledge_by ? new Date(editNotice.acknowledge_by).toISOString() : '');

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

      if (editRoles.length > 0) {
        setAudienceType('roles');
      } else if (editBlocks.length > 0 || editFlats.length > 0) {
        setAudienceType('blocks');
      } else {
        setAudienceType('everyone');
      }

    } else {
      setTitle('');
      setContent('');
      setCategory('General');
      setPriority('Low');
      setPublishMode('immediate');
      setPublishDate('');
      setValidUntil('');
      setRequiresAck(false);
      setAcknowledgeBy('');
      setAudienceType('everyone');
      setTargetRoles([]);
      setTargetBlocks([]);
      setTargetFlats([]);
      setFiles([]);
    }
  }, [editNotice]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (eOrStatus?: React.FormEvent | 'Draft' | 'Scheduled' | 'Published') => {
    let statusOverride: 'Draft' | 'Scheduled' | 'Published' | undefined;
    if (typeof eOrStatus === 'string') {
      statusOverride = eOrStatus;
    } else if (eOrStatus && 'preventDefault' in eOrStatus) {
      eOrStatus.preventDefault();
    }
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
      let targetAudience: any[] = [];
      if (audienceType === 'roles') {
        targetAudience = targetRoles.map(r => ({ role: r }));
      } else if (audienceType === 'blocks') {
        targetAudience = [
          ...targetBlocks.map(b => ({ block: b })),
          ...targetFlats.map(f => ({ flat: f }))
        ];
      }

      const finalPublishDate = publishMode === 'scheduled' && publishDate ? new Date(publishDate).toISOString() : undefined;
      const finalValidUntil = publishMode === 'scheduled' && validUntil ? new Date(validUntil).toISOString() : undefined;
      const finalAckBy = requiresAck && acknowledgeBy ? new Date(acknowledgeBy).toISOString() : undefined;

      if (editNotice) {
        await noticeService.updateNotice(editNotice.id, {
          title,
          content,
          category,
          priority,
          requires_acknowledgement: requiresAck,
          target_audience: targetAudience,
          publish_date: finalPublishDate,
          valid_until: finalValidUntil,
          acknowledge_by: finalAckBy,
        });
        showToast('Notice updated successfully', 'success');
        onNoticeUpdated();
      } else {
        // Determine status
        const determinedStatus = statusOverride
          ? statusOverride
          : publishMode === 'scheduled'
            ? 'Scheduled'
            : 'Published';

        const media_tokens = files
          .filter(f => f.mediaId && f.proofToken)
          .map(f => ({
            media_id: f.mediaId,
            proof_token: f.proofToken,
          }));

        const payload: any = {
          title,
          content,
          category,
          priority,
          requires_acknowledgement: requiresAck,
          status: determinedStatus,
          target_audience: targetAudience,
        };

        if (media_tokens.length > 0) {
          payload.media_tokens = media_tokens;
        }

        if (finalPublishDate) payload.publish_date = finalPublishDate;
        if (finalValidUntil) payload.valid_until = finalValidUntil;
        if (finalAckBy) payload.acknowledge_by = finalAckBy;

        await noticeService.createNotice(payload);
        
        if (determinedStatus === 'Draft') {
          showToast('Notice saved as draft', 'info');
        } else if (determinedStatus === 'Scheduled') {
          showToast('Notice scheduled successfully', 'success');
        } else {
          showToast('Notice published successfully', 'success');
        }
        onNoticeCreated();
      }
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to save notice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveDraftOnClose = async () => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }
    await handleSubmit('Draft');
  };

  const isDirty = title.trim().length > 0 || content.trim().length > 0;

  return {
    title, setTitle,
    content, setContent,
    category, setCategory,
    priority, setPriority,
    publishMode, setPublishMode,
    publishDate, setPublishDate,
    validUntil, setValidUntil,
    requiresAck, setRequiresAck,
    acknowledgeBy, setAcknowledgeBy,
    audienceType, setAudienceType,
    availableRoles,
    availableBlocks,
    targetRoles, setTargetRoles,
    targetBlocks, setTargetBlocks,
    targetFlats, setTargetFlats,
    selectedBlockForFlats, setSelectedBlockForFlats,
    selectedFlatInput, setSelectedFlatInput,
    files, setFiles,
    loading,
    isDirty,
    handleSubmit,
    saveDraftOnClose,
    resetForm,
  };
};
