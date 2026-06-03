import { api } from './api';
import type { DecisionMatrixEntry, ApiResponse } from '@/types';

export const DecisionMatrixService = {
  getAll: () => api.get<ApiResponse<DecisionMatrixEntry[]>>('/decision-matrix'),
  updateBulk: (entries: DecisionMatrixEntry[]) =>
    api.post<ApiResponse<void>>('/decision-matrix', { entries }),
};