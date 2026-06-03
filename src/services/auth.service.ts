import { api } from './api'; // Sesuaikan path import api.ts milikmu

export const AuthService = {
  login: async (values: { username: string; password: string }) => {
    // 1. Bungkus data menggunakan URLSearchParams
    const formData = new URLSearchParams();
    formData.append('username', values.username);
    formData.append('password', values.password);

    // 2. Kirim request dengan menimpa Content-Type bawaan api.ts
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  
  me: async () => {
    // Karena axios interceptor di api.ts sudah otomatis menyisipkan token,
    // kita cukup memanggil endpoint GET /auth/me
    return api.get('/auth/me');
  },
};