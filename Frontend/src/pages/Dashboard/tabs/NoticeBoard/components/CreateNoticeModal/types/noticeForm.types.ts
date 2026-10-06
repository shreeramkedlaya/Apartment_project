import type { UploadedFile } from '@/components/widgets/MediaUpload';
import type { BlockData } from '@/types/auth.types';
import type { Role } from '@/types/roles.types';
import type { Notice } from '../../../services/notice.service';

export interface Step {
  id: number;
  title: string;
}

export interface UseNoticeFormProps {
  isOpen: boolean;
  editNotice?: Notice | null;
  onNoticeCreated: () => void;
  onNoticeUpdated: () => void;
  onClose: () => void;
}

export interface NoticeFormData {
  title: string;
  content: string;
  category: string;
  priority: 'Low' | 'Medium' | 'Critical';
  publishMode: 'immediate' | 'scheduled';
  publishDate: string;
  validUntil: string;
  requiresAck: boolean;
  acknowledgeBy: string;
  audienceType: 'everyone' | 'roles' | 'blocks';
  targetRoles: string[];
  targetBlocks: string[];
  targetFlats: string[];
  selectedBlockForFlats: string;
  selectedFlatInput: string;
  files: UploadedFile[];
}

export interface UseNoticeFormReturn {
  formData: NoticeFormData;
  updateField: <K extends keyof NoticeFormData>(key: K, value: NoticeFormData[K]) => void;
  setFormData: React.Dispatch<React.SetStateAction<NoticeFormData>>;
  availableRoles: Role[];
  availableBlocks: BlockData[];
  loading: boolean;
  isDirty: boolean;
  handleSubmit: (eOrStatus?: React.FormEvent | 'Draft' | 'Scheduled' | 'Published') => Promise<void>;
  saveDraftOnClose: () => Promise<void>;
  resetForm: () => void;
}
