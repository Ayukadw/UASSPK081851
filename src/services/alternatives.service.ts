import { api } from './api';
import type { Alternative, ApiResponse } from '@/types';

export interface AlternativePayload {
  code: string;
  name: string;
  description?: string;
}

export const AlternativeService = {
  getAll: () => api.get<ApiResponse<Alternative[]>>('/alternatives'),
  create: (payload: AlternativePayload) =>
    api.post<ApiResponse<Alternative>>('/alternatives', payload),
  update: (id: number, payload: AlternativePayload) =>
    api.put<ApiResponse<Alternative>>(`/alternatives/${id}`, payload),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/alternatives/${id}`),
};
