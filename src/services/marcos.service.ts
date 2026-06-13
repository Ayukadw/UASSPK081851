import { api } from './api';
import type { MarcosResult, ApiResponse } from '@/types';

export const MarcosService = {
  calculate: () => api.post<ApiResponse<any>>('/marcos/calculate'),
  getResult: () => api.get<ApiResponse<MarcosResult[]>>('/marcos/result'),
  getRanking: () => api.get<ApiResponse<any>>('/marcos/step7-ranking'),
  getStep1: () => api.get<ApiResponse<any>>('/marcos/step1-decision-matrix'),
  getStep2: () => api.get<ApiResponse<any>>('/marcos/step2-ideal-solutions'),
  getStep3: () => api.get<ApiResponse<any>>('/marcos/step3-normalized-matrix'),
  getStep4: () => api.get<ApiResponse<any>>('/marcos/step4-weighted-matrix'),
  getStep5: () => api.get<ApiResponse<any>>('/marcos/step5-utility-degrees'),
  getStep6: () => api.get<ApiResponse<any>>('/marcos/step6-utility-functions'),
  getStep7: () => api.get<ApiResponse<any>>('/marcos/step7-ranking'),
};