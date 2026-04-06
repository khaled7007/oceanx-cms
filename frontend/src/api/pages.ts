import apiClient from './client';
import { Page, PaginatedResponse } from '../types';

export const pagesApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Page>>('/pages', { params }),
  get: (id: string) => apiClient.get<Page>(`/pages/${id}`),
  create: (data: Partial<Page>) => apiClient.post<Page>('/pages', data),
  update: (id: string, data: Partial<Page>) => apiClient.put<Page>(`/pages/${id}`, data),
  delete: (id: string) => apiClient.delete(`/pages/${id}`),
  toggleStatus: (id: string) => apiClient.patch<{ id: string; status: string }>(`/pages/${id}/toggle-status`),
};
