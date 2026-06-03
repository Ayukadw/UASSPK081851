import { Row, Col, Card, List, Typography, Tag } from 'antd';
import { UserOutlined, SettingOutlined, AppstoreOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useEffect, useState } from 'react';
import { UserService } from '@/services/user.service';
import { CriteriaService } from '@/services/criteria.service';
import { AlternativeService } from '@/services/alternatives.service';
import type { ActivityLog } from '@/types';
import { formatDate } from '@/utils/helpers';

const { Text } = Typography;

export const AdminDashboard = () => {
  // 1. Hapus variabel results dari state
  const [stats, setStats] = useState({ users: 0, criteria: 0, alternatives: 0 });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // 2. Hapus MarcosService dari Promise.all
        const [u, c, a] = await Promise.all([
          UserService.getAll(),
          CriteriaService.getAll(),
          AlternativeService.getAll(),
        ]);
        
        // 3. Update state tanpa results
        setStats({
          users: Array.isArray(u.data) ? u.data.length : 0,
          criteria: Array.isArray(c.data) ? c.data.length : 0,
          alternatives: Array.isArray(a.data) ? a.data.length : 0,
        });
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error); 
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <PageTitle title="Dashboard Admin" />
      <Row gutter={[16, 16]}>
        {/* 4. Ubah lg={6} menjadi lg={8} agar 3 kartu membagi rata ruang (24/3 = 8) */}
        <Col xs={24} sm={12} lg={8}>
          <StatCard title="Total User" value={stats.users} icon={<UserOutlined />} color="#1890ff" />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard title="Kriteria" value={stats.criteria} icon={<SettingOutlined />} color="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard title="Alternatif" value={stats.alternatives} icon={<AppstoreOutlined />} color="#faad14" />
        </Col>
      </Row>

      <Card title="Aktivitas Terbaru" style={{ marginTop: 24 }} loading={loading}>
        {logs.length === 0 ? (
          <EmptyState description="Belum ada aktivitas tercatat" />
        ) : (
          <List
            dataSource={logs}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.user}</Text>
                      <Tag>{item.action}</Tag>
                    </Space>
                  }
                  description={`${item.target} • ${formatDate(item.created_at)}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};