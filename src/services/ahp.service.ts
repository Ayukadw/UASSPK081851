import { api } from './api';
import type { AHPComparison, AHPResult, ApiResponse } from '@/types';

export const AHPService = {
  getMatrix: () => api.get<ApiResponse<number[][]>>('/ahp/matrix'),
  updateMatrix: (comparisons: AHPComparison[]) =>
    api.post<ApiResponse<void>>('/ahp/matrix', { comparisons }),
  getResult: () => api.get<ApiResponse<AHPResult>>('/ahp/result'),
  finalize: () => api.post<ApiResponse<void>>('/ahp/finalize'),
};