import apiClient from './client';
import { Article, PaginatedResponse } from '../types';

export const articlesApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Article>>('/articles', { params }),
  get: (id: string) => apiClient.get<Article>(`/articles/${id}`),
  create: (data: Partial<Article>) => apiClient.post<Article>('/articles', data),
  update: (id: string, data: Partial<Article>) => apiClient.put<Article>(`/articles/${id}`, data),
  delete: (id: string) => apiClient.delete(`/articles/${id}`),
  toggleStatus: (id: string) => apiClient.patch<{ id: string; status: string }>(`/articles/${id}/toggle-status`),
};
