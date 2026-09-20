import type { HelpdeskRequest } from '@/types/helpdesk.types';

export interface RequestDetailsPanelProps {
  request: HelpdeskRequest | null;
  onClose: () => void;
  onRequestUpdated: (updated: HelpdeskRequest) => void;
  canManageTickets: boolean;
}

export interface ManagementData {
  status: string;
  resolution_notes: string;
}
