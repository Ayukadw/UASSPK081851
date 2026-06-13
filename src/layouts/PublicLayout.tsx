import { useState } from 'react';
import { Layout, Button } from 'antd';
import { Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { LoginModal } from '@/pages/auth/LoginPage';

const { Header, Content, Sider } = Layout;

export const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoginVisible = searchParams.get('login') === 'true';

  const handleLoginClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('login');
    setSearchParams(params);
  };

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/ranking/matrix-keputusan') return 'matrix';
    if (path === '/ranking/solusi-ideal-anti-ideal') return 'ideal';
    if (path === '/ranking/normalisasi-matrix-keputusan') return 'decision';
    if (path === '/ranking/normalisasi-terbobot') return 'weighted';
    if (path === '/ranking/tingkat-utilitas-alternatif') return 'utility';
    if (path === '/ranking/fungsi-utilitas') return 'function';
    return 'input';
  };
  const currentTab = getActiveKey();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const menuItems = [
    { key: 'input', label: 'Input Data' },
    { key: 'matrix', label: 'Matrix Keputusan' },
    { key: 'ideal', label: 'Solusi Ideal dan Anti Ideal' },
    { key: 'decision', label: 'Normalisasi Matrix Keputusan' },
    { key: 'weighted', label: 'Normalisasi Terbobot' },
    { key: 'utility', label: 'Tingkat Utilitas Alternatif' },
    { key: 'function', label: 'Fungsi Utilitas' },
  ];

  const handleMenuClick = (key: string) => {
    if (key === 'input') navigate('/');
    else if (key === 'matrix') navigate('/ranking/matrix-keputusan');
    else if (key === 'ideal') navigate('/ranking/solusi-ideal-anti-ideal');
    else if (key === 'decision') navigate('/ranking/normalisasi-matrix-keputusan');
    else if (key === 'weighted') navigate('/ranking/normalisasi-terbobot');
    else if (key === 'utility') navigate('/ranking/tingkat-utilitas-alternatif');
    else if (key === 'function') navigate('/ranking/fungsi-utilitas');
  };

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
            const isActive = currentTab === item.key;
            const isHovered = hoveredKey === item.key;
            return (
              <div
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  background: isActive ? '#ffffff' : isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: isActive ? '#1D5EC9' : '#ffffff',
                  fontWeight: isActive ? 'bold' : '600',
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
            Selamat Datang, Pengguna !
          </span>
          <Button
            onClick={() => setSearchParams({ login: 'true' })}
            style={{
              backgroundColor: '#1D5EC9',
              borderColor: '#1D5EC9',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '4px 20px',
              fontWeight: 'bold',
              height: 'auto',
            }}
          >
            Login
          </Button>
        </Header>

        {/* Content Body */}
        <Content style={{ padding: '0 32px 32px 32px', background: '#f8fafc', overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>

      <LoginModal visible={isLoginVisible} onClose={handleLoginClose} />
    </Layout>
  );
};