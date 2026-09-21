import axiosInstance from '@/services/core/axiosinstance';

export interface VisitorLog {
  id: number;
  flat: number;
  flat_details?: {
    id: number;
    number: string;
    block_id?: number;
  };
  logged_by: number;
  logged_by_name?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED' | 'CHECKED_OUT';
  details: {
    name?: string;
    purpose?: string;
    phone?: string;
    [key: string]: any;
  };
  timeline: Array<{
    event: string;
    timestamp: string;
    by?: string;
    note?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export const getVisitorLogs = async () => {
  const response = await axiosInstance.get<VisitorLog[]>('/visitors/');
  return response.data;
};

export const createVisitorLog = async (data: { flat: number; details: any }) => {
  const response = await axiosInstance.post<VisitorLog>('/visitors/', data);
  return response.data;
};

export const approveRejectVisitor = async (id: number, action: 'APPROVE' | 'REJECT') => {
  const response = await axiosInstance.post<VisitorLog>(`/visitors/${id}/approve/`, { action });
  return response.data;
};

export const checkoutVisitor = async (id: number) => {
  const response = await axiosInstance.post<VisitorLog>(`/visitors/${id}/checkout/`);
  return response.data;
};
