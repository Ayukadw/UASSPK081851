import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { UserService } from '@/services/user.service';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await UserService.getAll();
      setUsers(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  return { users, loading, error, refetch: fetch };
};