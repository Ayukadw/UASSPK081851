import { api } from './api';
import type { AHPResult, ApiResponse } from '@/types';

export const AHPService = {
  getMatrix: () => api.get<ApiResponse<number[][]>>('/ahp/matrix'),
  updateMatrix: (matrix: Record<number, Record<number, number>>) =>
    api.post<ApiResponse<void>>('/ahp/matrix', { matrix }),
  getResult: () => api.get<ApiResponse<AHPResult>>('/ahp/result'),
  finalize: (weights: Record<number, number>) =>
    api.post<ApiResponse<void>>('/ahp/finalize', { weights }),
};