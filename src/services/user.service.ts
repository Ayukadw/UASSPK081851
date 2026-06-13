import { api } from './api';
import type { User } from '@/types';

export interface UserPayload {
  username: string;
  role: string;
  password?: string;
}

export const UserService = {
  getAll: (params?: { role?: string; search?: string }) =>
    api.get<User[]>('/users', { params }),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  create: (payload: UserPayload) => api.post<User>('/users', payload),
  update: (id: number, payload: UserPayload) => api.put<User>(`/users/${id}`, payload),
  delete: (id: number) => api.delete<any>(`/users/${id}`),
  resetPassword: (id: number, password: string) =>
    api.post<any>(`/users/${id}/reset-password`, { password }),
};