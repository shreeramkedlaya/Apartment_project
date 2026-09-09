import axiosInstance from '@/services/core/axiosinstance';
import type { HelpdeskRequest, IssueCategoryObj } from '@/types/helpdesk.types';

export const HelpdeskService = {
  getRequests: async (params?: any): Promise<any> => {
    const { data } = await axiosInstance.get('/issues/', { params });
    // Keep array fallback in case we use it without pagination
    if (Array.isArray(data)) return { results: data, count: data.length };
    return data;
  },

  getRequestDetails: async (id: number | string): Promise<HelpdeskRequest> => {
    const { data } = await axiosInstance.get(`/issues/${id}/`);
    return data;
  },

  createRequest: async (requestData: Partial<HelpdeskRequest> | FormData, onUploadProgress?: (progressEvent: any) => void): Promise<HelpdeskRequest> => {
    const config = onUploadProgress ? { onUploadProgress } : {};
    const { data } = await axiosInstance.post('/issues/', requestData, config);
    return data;
  },

  updateRequest: async (id: number | string, updateData: Partial<HelpdeskRequest> | FormData, onUploadProgress?: (progressEvent: any) => void): Promise<HelpdeskRequest> => {
    const config = onUploadProgress ? { onUploadProgress } : {};
    const { data } = await axiosInstance.put(`/issues/${id}/`, updateData, config);
    return data;
  },

  deleteRequest: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/issues/${id}/`);
  },

  // Categories API
  getCategories: async (params?: any): Promise<any> => {
    const { data } = await axiosInstance.get('/issues/categories/', { params });
    if (Array.isArray(data)) return { results: data, count: data.length };
    return data;
  },
  
  createCategory: async (categoryData: Partial<IssueCategoryObj>): Promise<IssueCategoryObj> => {
    const { data } = await axiosInstance.post('/issues/categories/', categoryData);
    return data;
  },
  
  updateCategory: async (id: number | string, categoryData: Partial<IssueCategoryObj>): Promise<IssueCategoryObj> => {
    const { data } = await axiosInstance.put(`/issues/categories/${id}/`, categoryData);
    return data;
  },
  
  deleteCategory: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/issues/categories/${id}/`);
  },

  // Aliases for compatibility
  getIssues: async (params?: any): Promise<any> => HelpdeskService.getRequests(params),
  createIssue: async (data: Partial<HelpdeskRequest> | FormData, onUploadProgress?: (progressEvent: any) => void) => HelpdeskService.createRequest(data, onUploadProgress),
  updateIssue: async (id: number | string, data: Partial<HelpdeskRequest> | FormData, onUploadProgress?: (progressEvent: any) => void) => HelpdeskService.updateRequest(id, data, onUploadProgress),
  deleteIssue: async (id: number | string) => HelpdeskService.deleteRequest(id),
};
