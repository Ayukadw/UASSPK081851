import { api } from './api';

export const ReportService = {
  exportExcel: () => api.get('/reports/excel', { responseType: 'blob' }),
  exportPdf: () => api.get('/reports/pdf', { responseType: 'blob' }),
};