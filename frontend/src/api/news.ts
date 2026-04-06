import apiClient from './client';
import { NewsItem, PaginatedResponse } from '../types';

export const newsApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<NewsItem>>('/news', { params }),
  get: (id: string) => apiClient.get<NewsItem>(`/news/${id}`),
  create: (data: Partial<NewsItem>) => apiClient.post<NewsItem>('/news', data),
  update: (id: string, data: Partial<NewsItem>) => apiClient.put<NewsItem>(`/news/${id}`, data),
  delete: (id: string) => apiClient.delete(`/news/${id}`),
  toggleStatus: (id: string) => apiClient.patch<{ id: string; status: string }>(`/news/${id}/toggle-status`),
};
