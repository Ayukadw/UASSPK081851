import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format = 'DD MMM YYYY HH:mm') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatNumber = (num: number, digits = 4) => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const getRoleBasedHome = (role: string) => {
  if (role === 'admin' || role === 'IT_Admin') return '/admin/dashboard';
  if (role === 'Verificator') return '/verificator/ahp-input';
  if (role === 'Data_Admin') return '/operator/dashboard';
  return '/'; 
};