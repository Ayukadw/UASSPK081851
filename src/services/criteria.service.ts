import { api } from './api';
import type { Criteria } from '@/types';

export interface CriteriaPayload {
  code: string;
  name: string;
  type: 'Cost' | 'Benefit';
  description?: string;
  unit?: string;
}

export const CriteriaService = {
  getAll: () => api.get<Criteria[]>('/criteria/'),
  create: (payload: CriteriaPayload) => api.post<Criteria>('/criteria/', payload),
  update: (id: number, payload: CriteriaPayload) => api.put<Criteria>(`/criteria/${id}`, payload),
  delete: (id: number) => api.delete<any>(`/criteria/${id}`),
};