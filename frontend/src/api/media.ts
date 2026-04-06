import apiClient from './client';
import { Media, PaginatedResponse } from '../types';

export const mediaApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Media>>('/media', { params }),
  upload: (file: File, tags?: string[]) => {
    const form = new FormData();
    form.append('file', file);
    tags?.forEach((t) => form.append('tags', t));
    return apiClient.post<Media>('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateTags: (id: string, tags: string[]) => apiClient.patch<Media>(`/media/${id}/tags`, { tags }),
  delete: (id: string) => apiClient.delete(`/media/${id}`),
};
