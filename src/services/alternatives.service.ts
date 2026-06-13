import { api } from './api';
import type { Alternative } from '@/types';

export interface AlternativePayload {
  code: string;
  name: string;
  description?: string;
}

export const AlternativeService = {
  getAll: () => api.get<Alternative[]>('/alternatives/'),
  create: (payload: AlternativePayload) =>
    api.post<Alternative>('/alternatives/', payload),
  update: (id: number, payload: AlternativePayload) =>
    api.put<Alternative>(`/alternatives/${id}`, payload),
  delete: (id: number) => api.delete<any>(`/alternatives/${id}`),
};
