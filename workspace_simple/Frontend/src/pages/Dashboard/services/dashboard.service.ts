import axiosInstance from '@/services/core/axiosinstance';
import type { Notice } from '@/pages/Dashboard/tabs/NoticeBoard/services/notice.service';

export interface DashboardMetrics {
  fee_due: string;
  unread_notices: number;
  open_issues: number;
  total_issues: number;
}

export interface UpcomingHoliday {
  date: string;
  name: string;
  type: string;
}

export interface RecentActivity {
  title: string;
  description: string;
  time: string;
}

export interface DashboardSummary {
  hero_carousel: Notice[];
  metrics: DashboardMetrics;
  upcoming_holidays: UpcomingHoliday[];
  recent_activity: RecentActivity[];
}

export interface DashboardSummaryResponse {
  status: string;
  data: DashboardSummary;
}

class DashboardService {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const response = await axiosInstance.get<DashboardSummaryResponse>('/dashboard/summary/');
    return response.data;
  }
}

export const dashboardService = new DashboardService();
