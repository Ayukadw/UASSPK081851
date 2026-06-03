import { api } from './api';
import type { Criteria, ApiResponse } from '@/types';

export interface CriteriaPayload {
  code: string;
  name: string;
  type: 'Cost' | 'Benefit';
  description?: string;
}

export const CriteriaService = {
  getAll: () => api.get<ApiResponse<Criteria[]>>('/criteria'),
  create: (payload: CriteriaPayload) => api.post<ApiResponse<Criteria>>('/criteria', payload),
  update: (id: number, payload: CriteriaPayload) => api.put<ApiResponse<Criteria>>(`/criteria/${id}`, payload),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/criteria/${id}`),
};