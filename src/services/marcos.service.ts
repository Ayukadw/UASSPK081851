import { api } from './api';
import type { MarcosResult, ApiResponse } from '@/types';

export const MarcosService = {
  calculate: () => api.post<ApiResponse<void>>('/marcos/calculate'),
  getResult: () => api.get<ApiResponse<MarcosResult[]>>('/marcos/result'),
  getRanking: () => api.get<ApiResponse<MarcosResult[]>>('/marcos/ranking'),
};