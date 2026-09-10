import axiosInstance from '@/services/core/axiosinstance';

export interface IssueComment {
  id: number;
  author: string;
  text: string;
  created_at: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  flat_number: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  attachment: string | null;
  created_at: string;
  updated_at: string;
  comments: IssueComment[];
}

class IssueService {
  /** Fetch all issues */
  async getIssues(): Promise<Issue[]> {
    const response = await axiosInstance.get<Issue[]>('/issues/');
    return response.data;
  }

  /** Create a new issue (supports file upload via FormData) */
  async createIssue(data: FormData): Promise<Issue> {
    const response = await axiosInstance.post<Issue>('/issues/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /** Update an issue (e.g. changing status) */
  async updateIssue(id: number, data: Partial<Issue>): Promise<Issue> {
    const response = await axiosInstance.patch<Issue>(`/issues/${id}/`, data);
    return response.data;
  }

  /** Add a comment to an issue */
  async addComment(id: number, text: string, author: string): Promise<IssueComment> {
    const response = await axiosInstance.post<IssueComment>(`/issues/${id}/add_comment/`, {
      text,
      author,
    });
    return response.data;
  }
}

export const issueService = new IssueService();
