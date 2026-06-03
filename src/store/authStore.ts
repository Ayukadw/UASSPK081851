import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { AuthService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  setToken: (token: string) => void; // Tambahan untuk mempermudah alur login
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,

      setToken: (token) => set({ token }),

      login: (token, user) => {
        set({ token, user, role: user.role, isAuthenticated: true });
        // Hapus window.location.href, biarkan UI yang melakukan navigasi
      },

      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false, isLoading: false });
        // Hapus window.location.href, arahkan via komponen atau helper di luar store
      },

      initialize: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }
        try {
          const res = await AuthService.me();
          const user = res.data; // PERBAIKAN: Hapus .data ekstra
          set({ user, role: user.role, isAuthenticated: true, isLoading: false });
        } catch {
          // Jika token kadaluarsa atau API error, bersihkan state
          set({ user: null, token: null, role: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      // PERBAIKAN: Simpan state esensial agar navbar tidak berkedip "Login" saat refresh
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);