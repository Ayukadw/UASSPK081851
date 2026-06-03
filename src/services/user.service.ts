import { api } from './api';
import type { User, ApiResponse } from '@/types';

export interface UserPayload {
  username: string;
  full_name: string;
  email: string;
  role: string;
  password?: string;
}

export const UserService = {
  getAll: (params?: { role?: string; search?: string }) =>
    api.get<ApiResponse<User[]>>('/users', { params }),
  getById: (id: number) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (payload: UserPayload) => api.post<ApiResponse<User>>('/users', payload),
  update: (id: number, payload: UserPayload) => api.put<ApiResponse<User>>(`/users/${id}`, payload),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/users/${id}`),
  resetPassword: (id: number, password: string) =>
    api.post<ApiResponse<void>>(`/users/${id}/reset-password`, { password }),
};