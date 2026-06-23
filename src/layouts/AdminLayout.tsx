import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogoutOutlined } from '@ant-design/icons';
import '@/styles/admin.css';

const { Header, Content, Sider } = Layout;

export const AdminLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isUserActive = location.pathname === '/admin/dashboard' || location.pathname === '/admin/users';
  const isCriteriaActive = location.pathname === '/admin/criteria';

  const menuItems = [
    { key: 'user', label: 'Kelola User', isActive: isUserActive, path: '/admin/dashboard' },
    { key: 'criteria', label: 'Kelola Kriteria', isActive: isCriteriaActive, path: '/admin/criteria' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar Kolom Kiri */}
      <Sider
        width={260}
        theme="light"
        style={{
          background: '#f8fafc',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* SPK Logo Area */}
        <div style={{ height: '60px', display: 'flex', alignItems: 'center', paddingLeft: '32px' }}>
          <span style={{ fontSize: '30px', fontWeight: 'bold', color: '#1D5EC9', letterSpacing: '1px' }}>
            SPK
          </span>
        </div>

        {/* Blue Curved Sidebar Wrapper */}
        <div
          style={{
            background: '#1D5EC9',
            borderTopRightRadius: '36px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '20px',
            paddingRight: '12px',
            height: 'calc(100vh - 60px)',
          }}
        >
          {menuItems.map((item) => {
            const isHovered = hoveredKey === item.key;
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  background: item.isActive ? '#ffffff' : isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: item.isActive ? '#1D5EC9' : '#ffffff',
                  fontWeight: item.isActive ? 'bold' : '600',
                  borderRadius: '24px',
                  padding: '12px 24px',
                  margin: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </Sider>

      {/* Main Area Kolom Kanan */}
      <Layout style={{ background: '#f8fafc' }}>
        {/* Top Header */}
        <Header
          style={{
            background: '#f8fafc',
            height: '60px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingRight: '32px',
            gap: '24px',
            borderBottom: 'none',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1D5EC9' }}>
            Selamat Datang, {user?.full_name || 'Administrator'} !
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
            }}
          >
            <div
              style={{
                border: '2px solid #ff4d4f',
                borderRadius: '8px',
                padding: '6px',
                color: '#ff4d4f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff2f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <LogoutOutlined />
            </div>
          </button>
        </Header>

        {/* Content Body */}
        <Content style={{ padding: '0 32px 32px 32px', background: '#f8fafc', overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};