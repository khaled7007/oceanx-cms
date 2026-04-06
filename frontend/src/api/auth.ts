import apiClient from './client';
import { User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }),
  getMe: () => apiClient.get<User>('/auth/me'),
  changePassword: (current_password: string, new_password: string) =>
    apiClient.put('/auth/change-password', { current_password, new_password }),
};
