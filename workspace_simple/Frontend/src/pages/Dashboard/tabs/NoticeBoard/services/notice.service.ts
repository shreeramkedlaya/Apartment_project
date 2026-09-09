import axiosInstance from '@/services/core/axiosinstance';

export interface NoticeAttachment {
  id: string;
  file: string;
  file_type: string;
}

export interface NoticeAcknowledgement {
  id: string;
  user_id: string;
  status: 'Pending' | 'Acknowledged';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'Low' | 'Medium' | 'Critical';
  status: 'Draft' | 'Scheduled' | 'Published' | 'Cancelled' | 'Expired';
  target_audience: any;
  requires_acknowledgement: boolean;
  publish_date: string;
  valid_until: string | null;
  acknowledge_by: string | null;
  created_at: string;
  created_by: string;
  attachments: NoticeAttachment[];
  acknowledgements?: NoticeAcknowledgement[]; // Mostly for managers
}

class NoticeService {
  /** Fetch all notices for managers */
  async getNotices(): Promise<Notice[]> {
    const response = await axiosInstance.get<Notice[]>('/notices/');
    return response.data;
  }

  /** Fetch active notices targeted at the current resident */
  async getMyNotices(): Promise<Notice[]> {
    const response = await axiosInstance.get<Notice[]>('/notices/my-notices/');
    return response.data;
  }

  /** Create a new notice (supports file uploads via FormData) */
  async createNotice(data: FormData): Promise<Notice> {
    const response = await axiosInstance.post<Notice>('/notices/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /** Update a notice (only valid within 15 mins) */
  async updateNotice(id: string, data: Partial<Notice>): Promise<Notice> {
    const response = await axiosInstance.patch<Notice>(`/notices/${id}/`, data);
    return response.data;
  }

  /** Publish a notice (or schedule it if publish_date is future) */
  async publishNotice(id: string): Promise<Notice> {
    const response = await axiosInstance.post<Notice>(`/notices/${id}/publish/`);
    return response.data;
  }

  /** Cancel a notice */
  async cancelNotice(id: string): Promise<Notice> {
    const response = await axiosInstance.post<Notice>(`/notices/${id}/cancel/`);
    return response.data;
  }

  /** Approve a draft notice */
  async approveNotice(id: string): Promise<Notice> {
    const response = await axiosInstance.post<Notice>(`/notices/${id}/approve/`);
    return response.data;
  }

  /** Reject a draft notice */
  async rejectNotice(id: string, reason: string): Promise<Notice> {
    const response = await axiosInstance.post<Notice>(`/notices/${id}/reject/`, {
      rejection_reason: reason,
    });
    return response.data;
  }

  /** Resident acknowledges a notice */
  async acknowledgeNotice(id: string): Promise<void> {
    await axiosInstance.post(`/notices/${id}/acknowledge/`);
  }
}

export const noticeService = new NoticeService();
