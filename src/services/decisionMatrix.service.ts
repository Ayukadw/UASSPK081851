import { api } from './api';
import type { DecisionMatrixEntry, ApiResponse } from '@/types';

export const DecisionMatrixService = {
  getAll: () => api.get<ApiResponse<DecisionMatrixEntry[]>>('/matrix'),
  updateBulk: (entries: DecisionMatrixEntry[]) =>
    api.put<ApiResponse<any>>('/matrix/bulk-update', { matrix_data: entries }),
};