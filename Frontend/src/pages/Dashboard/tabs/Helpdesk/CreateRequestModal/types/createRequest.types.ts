import type { AuthUser } from '@/types/auth.types';
import type { HelpdeskRequest } from '@/types/helpdesk.types';

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
  editRequest?: HelpdeskRequest | null;
}
