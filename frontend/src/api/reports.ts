import apiClient from './client';
import { Report, PaginatedResponse } from '../types';

export const reportsApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Report>>('/reports', { params }),
  get: (id: string) => apiClient.get<Report>(`/reports/${id}`),
  create: (data: Partial<Report>) => apiClient.post<Report>('/reports', data),
  update: (id: string, data: Partial<Report>) => apiClient.put<Report>(`/reports/${id}`, data),
  delete: (id: string) => apiClient.delete(`/reports/${id}`),
  toggleStatus: (id: string) => apiClient.patch<{ id: string; status: string }>(`/reports/${id}/toggle-status`),
};
