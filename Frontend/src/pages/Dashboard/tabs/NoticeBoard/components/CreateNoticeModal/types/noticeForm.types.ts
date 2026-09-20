import type { UploadedFile } from '@/components/widgets/MediaUpload';
import type { Notice } from '../../../services/notice.service';
import type { Role } from '@/types/roles.types';
import type { BlockData } from '@/types/auth.types';

export interface Step {
  id: number;
  title: string;
}

export interface UseNoticeFormProps {
  editNotice?: Notice | null;
  onNoticeCreated: () => void;
  onNoticeUpdated: () => void;
  onClose: () => void;
}

export interface UseNoticeFormReturn {
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  priority: 'Low' | 'Medium' | 'Critical';
  setPriority: (val: 'Low' | 'Medium' | 'Critical') => void;
  publishMode: 'immediate' | 'scheduled';
  setPublishMode: (val: 'immediate' | 'scheduled') => void;
  publishDate: string;
  setPublishDate: (val: string) => void;
  validUntil: string;
  setValidUntil: (val: string) => void;
  requiresAck: boolean;
  setRequiresAck: (val: boolean) => void;
  acknowledgeBy: string;
  setAcknowledgeBy: (val: string) => void;
  audienceType: 'everyone' | 'roles' | 'blocks';
  setAudienceType: (val: 'everyone' | 'roles' | 'blocks') => void;
  availableRoles: Role[];
  availableBlocks: BlockData[];
  targetRoles: string[];
  setTargetRoles: React.Dispatch<React.SetStateAction<string[]>>;
  targetBlocks: string[];
  setTargetBlocks: React.Dispatch<React.SetStateAction<string[]>>;
  targetFlats: string[];
  setTargetFlats: React.Dispatch<React.SetStateAction<string[]>>;
  selectedBlockForFlats: string;
  setSelectedBlockForFlats: (val: string) => void;
  selectedFlatInput: string;
  setSelectedFlatInput: (val: string) => void;
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  loading: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}
