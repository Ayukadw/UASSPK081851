import { Layout, Button, Space, Typography, Dropdown, Badge, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const { Header } = Layout;
const { Text } = Typography;

export const AppHeader = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const items = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined /> Profil
        </Space>
      ),
    },
    {
      key: 'logout',
      danger: true,
      label: (
        <Space onClick={logout}>
          <LogoutOutlined /> Keluar
        </Space>
      ),
    },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Button
        type="text"
        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggleSidebar}
      />
      <Space size="large">
        <Badge count={0} size="small">
          <BellOutlined style={{ fontSize: 18 }} />
        </Badge>
        <Dropdown menu={{ items }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text strong>{user?.username || user?.full_name || 'User'}</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};