import { api } from './api';

export const ReportService = {
  exportPdf: (payload: any) => api.post('/reports/pdf', payload, { responseType: 'blob' }),
  exportExcel: (payload: any) => api.post('/reports/excel', payload, { responseType: 'blob' }),
};