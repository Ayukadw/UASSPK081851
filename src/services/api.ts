import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jjk990-uas-spk.hf.space/api/v1';

interface ApiErrorBody {
  message?: string;
  detail?: string; // PERBAIKAN 1: Tambahkan detail agar bisa membaca error dari FastAPI
}

export const api: AxiosInstance = axios.create({
  // Hardcode URL Ngrok sementara agar kita yakin 100% tidak tertimpa file .env
  baseURL: 'https://jjk990-uas-spk.hf.space/api/v1',
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // <-- TIKET VIP NGROK (Wajib Ada)
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        message.error('Sesi habis. Silakan login kembali.');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('Anda tidak memiliki izin untuk mengakses fitur ini.');
      } else if (status === 400) {
        // PERBAIKAN 2: Kosongkan blok ini agar pop-up ditangani langsung oleh komponen (UserManagement.tsx)
      } else {
        // PERBAIKAN 3: Prioritaskan membaca `data.detail` dari FastAPI
        message.error(data?.detail || data?.message || 'Terjadi kesalahan pada server.');
      }
    } else {
      message.error('Koneksi ke server gagal.');
    }
    return Promise.reject(error);
  }
);