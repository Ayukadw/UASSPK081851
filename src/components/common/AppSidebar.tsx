import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import {
  DashboardOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TableOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import type { UserRole } from '@/types';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '@/constants';

const { Sider } = Layout;

const menuConfig: Record<UserRole, any[]> = {
  IT_Admin: [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/users', icon: <TeamOutlined />, label: 'Manajemen User' },
    { key: '/admin/criteria', icon: <SettingOutlined />, label: 'Manajemen Kriteria' },
  ],
  Verificator: [
    { key: '/verificator/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/verificator/ahp-input', icon: <TableOutlined />, label: 'Input Matriks AHP' },
    { key: '/verificator/ahp-result', icon: <CheckCircleOutlined />, label: 'Hasil AHP' },
  ],
  Data_Admin: [
    { key: '/operator/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/operator/alternatives', icon: <AppstoreOutlined />, label: 'Alternatif' },
    { key: '/operator/decision-matrix', icon: <TableOutlined />, label: 'Decision Matrix' },
    { key: '/operator/marcos-result', icon: <CalculatorOutlined />, label: 'Hasil MARCOS' },
  ],
  Public: [],
};

export const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  if (!role) return null;

  const items = menuConfig[role] || [];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={sidebarCollapsed}
      width={SIDEBAR_WIDTH}
      collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      theme="light"
      style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 18,
        }}
      >
        SPK
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};