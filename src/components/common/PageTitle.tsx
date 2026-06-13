import { Breadcrumb, Typography, Space } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const { Title } = Typography;

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Admin',
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Manajemen User',
  '/admin/criteria': 'Manajemen Kriteria',
  '/verificator': 'Verifikator',
  '/verificator/dashboard': 'Dashboard',
  '/verificator/ahp-input': 'Input AHP',
  '/verificator/ahp-result': 'Hasil AHP',
  '/operator': 'Operator',
  '/operator/dashboard': 'Data Alternatif',
  '/operator/alternatives': 'Kelola Alternatif',
  '/ranking': 'Ranking Publik',
  '/simulation': 'Simulasi',
};

export const PageTitle = ({ title }: { title: string }) => {
  const location = useLocation();
  const paths = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((_, i) => '/' + parts.slice(0, i + 1).join('/'));
  }, [location]);

  return (
    <Space orientation="vertical" style={{ marginBottom: 24 }} size={4}>
      <Breadcrumb>
        {paths.map((p) => (
          <Breadcrumb.Item key={p}>
            <Link to={p}>{breadcrumbMap[p] || p}</Link>
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
    </Space>
  );
};