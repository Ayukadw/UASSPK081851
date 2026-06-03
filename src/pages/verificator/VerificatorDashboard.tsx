import { Card, Row, Col, Statistic, Typography, Alert } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { useEffect, useState } from 'react';
import { AHPService } from '@/services/ahp.service';
import type { AHPResult } from '@/types';

const { Text } = Typography;

export const VerificatorDashboard = () => {
  const [result, setResult] = useState<AHPResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AHPService.getResult().then((res) => {
      setResult(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageTitle title="Dashboard Verifikator" />
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card loading={loading}>
            <Statistic
              title="Consistency Ratio"
              value={result?.consistency_ratio || 0}
              precision={4}
              suffix={result ? (result.is_consistent ? 'Valid' : 'Tidak Valid') : '-'}
              valueStyle={{ color: result?.is_consistent ? '#3f8600' : '#cf1322' }}
              prefix={result?.is_consistent ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card loading={loading} title="Status Bobot">
            {result ? (
              <Alert
                message={result.is_consistent ? 'Bobot sudah konsisten (CR < 0.1)' : 'Bobot belum konsisten (CR >= 0.1)'}
                type={result.is_consistent ? 'success' : 'warning'}
                showIcon
              />
            ) : (
              <Text type="secondary">Belum ada perhitungan AHP</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};