import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChartOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

export const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/ranking', icon: <BarChartOutlined />, label: 'Ranking Publik' },
    { key: '/simulation', icon: <ExperimentOutlined />, label: 'Simulasi' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginRight: 24 }}>
          SPK Content Creator
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />
        <div style={{ color: '#fff' }}>
          <a href="/login" style={{ color: '#fff' }}>Login</a>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
};