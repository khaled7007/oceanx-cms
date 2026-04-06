import apiClient from './client';
import { Service, PaginatedResponse } from '../types';

export const servicesApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Service>>('/services', { params }),
  get: (id: string) => apiClient.get<Service>(`/services/${id}`),
  create: (data: Partial<Service>) => apiClient.post<Service>('/services', data),
  update: (id: string, data: Partial<Service>) => apiClient.put<Service>(`/services/${id}`, data),
  delete: (id: string) => apiClient.delete(`/services/${id}`),
  toggleActive: (id: string) => apiClient.patch<{ id: string; active: boolean }>(`/services/${id}/toggle-active`),
};
