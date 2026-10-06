import type { UploadedFile } from '@/components/widgets/MediaUpload';
import { useToast } from '@/context/ToastContext';
import { fetchBlocks } from '@/services/auth/auth.service';
import type { BlockData } from '@/types/auth.types';
import type { Role } from '@/types/roles.types';
import { useCallback, useEffect, useState } from 'react';
import { fetchRoles } from '../../../../Administration/services/roles.service';
import { noticeService } from '../../../services/notice.service';
import type { NoticeFormData, UseNoticeFormProps, UseNoticeFormReturn } from '../types/noticeForm.types';

const getDefaultValidUntil = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setHours(23, 59, 59, 0);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, -1);
};

export const INITIAL_NOTICE_FORM_DATA: NoticeFormData = {
  title: '',
  content: '',
  category: 'General',
  priority: 'Low',
  publishMode: 'immediate',
  publishDate: '',
  validUntil: getDefaultValidUntil(),
  requiresAck: false,
  acknowledgeBy: '',
  audienceType: 'everyone',
  targetRoles: [],
  targetBlocks: [],
  targetFlats: [],
  selectedBlockForFlats: '',
  selectedFlatInput: '',
  files: [],
};

export const buildNoticePayload = (
  formData: NoticeFormData,
  statusOverride?: 'Draft' | 'Scheduled' | 'Published'
) => {
  let targetAudience: Array<{ role?: string; block?: string; flat?: string }> = [];
  if (formData.audienceType === 'roles') {
    targetAudience = formData.targetRoles.map((r: string) => ({ role: r }));
  } else if (formData.audienceType === 'blocks') {
    targetAudience = [
      ...formData.targetBlocks.map((b: string) => ({ block: b })),
      ...formData.targetFlats.map((f: string) => ({ flat: f })),
    ];
  }

  const finalPublishDate = formData.publishMode === 'scheduled' && formData.publishDate
    ? new Date(formData.publishDate).toISOString()
    : undefined;

  const finalValidUntil = formData.validUntil
    ? new Date(formData.validUntil).toISOString()
    : undefined;

  const finalAckBy = formData.requiresAck && formData.acknowledgeBy
    ? new Date(formData.acknowledgeBy).toISOString()
    : undefined;

  const determinedStatus = statusOverride
    ? statusOverride
    : formData.publishMode === 'scheduled'
      ? 'Scheduled'
      : 'Published';

  const media_tokens = formData.files
    .filter((f: UploadedFile) => f.mediaId && f.proofToken)
    .map((f: UploadedFile) => ({
      media_id: f.mediaId!,
      proof_token: f.proofToken!,
    }));

  const payload: any = {
    title: formData.title,
    content: formData.content,
    category: formData.category,
    priority: formData.priority,
    requires_acknowledgement: formData.requiresAck,
    status: determinedStatus,
    target_audience: targetAudience,
  };

  if (media_tokens.length > 0) payload.media_tokens = media_tokens;
  if (finalPublishDate) payload.publish_date = finalPublishDate;
  if (finalValidUntil) payload.valid_until = finalValidUntil;
  if (finalAckBy) payload.acknowledge_by = finalAckBy;

  return payload;
};

export const useNoticeForm = ({ editNotice, onNoticeCreated, onNoticeUpdated, onClose }: UseNoticeFormProps): UseNoticeFormReturn => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NoticeFormData>(INITIAL_NOTICE_FORM_DATA);

  // Available metadata
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<BlockData[]>([]);

  const updateField = useCallback(<K extends keyof NoticeFormData>(key: K, value: NoticeFormData[K]) => {
    setFormData((prev: NoticeFormData) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetchRoles()
      .then((data: any) => {
        if (signal.aborted) return;
        const rolesArray = Array.isArray(data) ? data : (data.results || data.roles || []);
        setAvailableRoles(rolesArray);
      })
      .catch((err) => {
        if (!signal.aborted) console.error(err);
      });

    fetchBlocks()
      .then((data) => {
        if (signal.aborted) return;
        setAvailableBlocks(data);
      })
      .catch((err) => {
        if (!signal.aborted) console.error(err);
      });

    return () => controller.abort();
  }, []);

  const resetForm = useCallback(() => {
    if (editNotice) {
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

      let audienceType: 'everyone' | 'roles' | 'blocks' = 'everyone';
      if (editRoles.length > 0) {
        audienceType = 'roles';
      } else if (editBlocks.length > 0 || editFlats.length > 0) {
        audienceType = 'blocks';
      }

      setFormData({
        title: editNotice.title || '',
        content: editNotice.content || '',
        category: editNotice.category || 'General',
        priority: editNotice.priority || 'Low',
        publishMode: editNotice.publish_date ? 'scheduled' : 'immediate',
        publishDate: editNotice.publish_date ? new Date(editNotice.publish_date).toISOString() : '',
        validUntil: editNotice.valid_until ? new Date(editNotice.valid_until).toISOString() : getDefaultValidUntil(),
        requiresAck: editNotice.requires_acknowledgement || false,
        acknowledgeBy: editNotice.acknowledge_by ? new Date(editNotice.acknowledge_by).toISOString() : '',
        audienceType,
        targetRoles: editRoles,
        targetBlocks: editBlocks,
        targetFlats: editFlats,
        selectedBlockForFlats: '',
        selectedFlatInput: '',
        files: [],
      });
    } else {
      setFormData({
        ...INITIAL_NOTICE_FORM_DATA,
        validUntil: getDefaultValidUntil(),
      });
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
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showToast('Notice content is required', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = buildNoticePayload(formData, statusOverride);

      if (editNotice) {
        await noticeService.updateNotice(editNotice.id, payload);
        showToast('Notice updated successfully', 'success');
        onNoticeUpdated();
      } else {
        await noticeService.createNotice(payload);

        if (payload.status === 'Draft') {
          showToast('Notice saved as draft', 'info');
        } else if (payload.status === 'Scheduled') {
          showToast('Notice scheduled successfully', 'success');
        } else {
          showToast('Notice published successfully', 'success');
        }
        onNoticeCreated();
      }
      onClose();
    } catch (error: any) {
      let errorMsg = 'Failed to save notice';
      const responseData = error.response?.data;

      if (responseData) {
        if (typeof responseData.error === 'string') {
          errorMsg = responseData.error;
        } else if (typeof responseData.error === 'object' && responseData.error !== null) {
          const firstKey = Object.keys(responseData.error)[0];
          if (firstKey) {
            const firstErr = responseData.error[firstKey];
            errorMsg = `${firstKey}: ${Array.isArray(firstErr) ? firstErr[0] : firstErr}`;
          }
        } else if (typeof responseData.detail === 'string') {
          errorMsg = responseData.detail;
        } else if (typeof responseData === 'object') {
          const firstKey = Object.keys(responseData)[0];
          if (firstKey && firstKey !== 'status') {
            const firstErr = responseData[firstKey];
            errorMsg = `${firstKey}: ${Array.isArray(firstErr) ? firstErr[0] : firstErr}`;
          }
        }
      }

      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveDraftOnClose = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      onClose();
      return;
    }
    await handleSubmit('Draft');
  };

  const isDirty = formData.title.trim().length > 0 || formData.content.trim().length > 0;

  return {
    formData,
    updateField,
    setFormData,
    availableRoles,
    availableBlocks,
    loading,
    isDirty,
    handleSubmit,
    saveDraftOnClose,
    resetForm,
  };
};
