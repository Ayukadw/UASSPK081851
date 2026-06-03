import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/common/AppHeader';
import { AppSidebar } from '@/components/common/AppSidebar';

const { Content } = Layout;

export const DashboardLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <AppHeader />
    <Layout>
      <AppSidebar />
      <Layout style={{ padding: '24px' }}>
        <Content style={{ background: '#fff', padding: 24, borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  </Layout>
);