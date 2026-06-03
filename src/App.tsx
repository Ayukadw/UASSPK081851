import { useEffect } from 'react';
import { Spin } from 'antd';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';

function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <Spin fullscreen description="Memuat aplikasi..." />;
  }

  return <AppRoutes />;
}

export default App;