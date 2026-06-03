import { Row, Col } from 'antd';
import { AppstoreOutlined, TableOutlined, CalculatorOutlined, TrophyOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { StatCard } from '@/components/common/StatCard';
import { useEffect, useState } from 'react';
import { AlternativeService } from '@/services/alternatives.service';
import { CriteriaService } from '@/services/criteria.service';
import { MarcosService } from '@/services/marcos.service';

export const OperatorDashboard = () => {
  const [stats, setStats] = useState({ alternatives: 0, criteria: 0, matrix: 0, results: 0 });

  useEffect(() => {
    Promise.all([
      AlternativeService.getAll(),
      CriteriaService.getAll(),
      MarcosService.getRanking().catch(() => ({ data: { data: [] } })),
    ]).then(([a, c, r]) => {
      setStats({
        alternatives: a.data.data.length,
        criteria: c.data.data.length,
        matrix: a.data.data.length * c.data.data.length,
        results: r.data.data.length,
      });
    });
  }, []);

  return (
    <div>
      <PageTitle title="Dashboard Operator" />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Alternatif" value={stats.alternatives} icon={<AppstoreOutlined />} color="#1890ff" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Kriteria" value={stats.criteria} icon={<TableOutlined />} color="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Sel Matrix" value={stats.matrix} icon={<CalculatorOutlined />} color="#faad14" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Hasil Ranking" value={stats.results} icon={<TrophyOutlined />} color="#f5222d" />
        </Col>
      </Row>
    </div>
  );
};