import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  IT_Admin: 'IT Admin',
  Verificator: 'Verifikator',
  Data_Admin: 'Data Admin',
  Public: 'Publik',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  IT_Admin: 'red',
  Verificator: 'blue',
  Data_Admin: 'green',
  Public: 'default',
};

export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 80;

export const AHP_SCALE = [
  { value: 1, label: '1 - Sama penting' },
  { value: 2, label: '2 - Mendekati sedikit lebih penting' },
  { value: 3, label: '3 - Sedikit lebih penting' },
  { value: 4, label: '4 - Mendekati lebih penting' },
  { value: 5, label: '5 - Lebih penting' },
  { value: 6, label: '6 - Mendekati sangat penting' },
  { value: 7, label: '7 - Sangat penting' },
  { value: 8, label: '8 - Mendekati mutlak' },
  { value: 9, label: '9 - Mutlak lebih penting' },
];