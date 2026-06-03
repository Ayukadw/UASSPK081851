export type UserRole = 'IT_Admin' | 'Verificator' | 'Data_Admin' | 'Public';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Criteria {
  id: number;
  code: string;
  name: string;
  type: 'Cost' | 'Benefit';
  description?: string;
  weight?: number;
  created_at?: string;
}

export interface Alternative {
  id: number;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface AHPComparison {
  criteria_id_1: number;
  criteria_id_2: number;
  value: number;
}

export interface AHPResult {
  weights: Record<string, number>;
  consistency_ratio: number;
  is_consistent: boolean;
  eigen_vector?: number[];
  matrix?: number[][];
}

export interface DecisionMatrixEntry {
  alternative_id: number;
  criteria_id: number;
  value: number;
}

export interface MarcosResult {
  alternative_id: number;
  alternative_name: string;
  score: number;
  rank: number;
  f_i_plus?: number;
  f_i_minus?: number;
  k_i_plus?: number;
  k_i_minus?: number;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ActivityLog {
  id: number;
  user: string;
  action: string;
  target: string;
  created_at: string;
}