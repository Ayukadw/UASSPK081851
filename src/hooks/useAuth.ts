import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, role, isAuthenticated, login, logout } = useAuthStore();
  return { user, role, isAuthenticated, login, logout };
};