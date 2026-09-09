import type { UploadedFile } from '@/components/widgets/MediaUpload';
import type { Notice } from '../../../services/notice.service';

export interface TargetAudienceState {
  roles: string[];
  blocks: string[];
  flats: string[];
}

export interface NoticeFormState {
  title: string;
  content: string;
  category: string;
  priority: 'Low' | 'Medium' | 'Critical';
  publishDate: string;
  validUntil: string;
  requiresAck: boolean;
  acknowledgeBy: string;
  targetRoles: string[];
  targetBlocks: string[];
  targetFlats: string[];
  files: UploadedFile[];
}

export interface UseNoticeFormProps {
  editNotice: Notice | null;
  onNoticeCreated: () => void;
  onNoticeUpdated: () => void;
  onClose: () => void;
}
