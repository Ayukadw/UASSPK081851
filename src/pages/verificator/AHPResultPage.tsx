import { useEffect, useState } from 'react';
import { Button, Card, Table, Tag, Space, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { AHPService } from '@/services/ahp.service';
import type { AHPResult } from '@/types';
import { formatNumber } from '@/utils/helpers';

const { Text, Title } = Typography;

export const AHPResultPage = () => {
  const [result, setResult] = useState<AHPResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    AHPService.getResult()
      .then((res) => { setResult(res.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleFinalize = async () => {
    if (!result?.is_consistent) {
      message.error('Consistency Ratio harus < 0.1 untuk finalize');
      return;
    }
    setFinalizing(true);
    try {
      await AHPService.finalize();
      message.success('Bobot AHP telah dikunci');
    } catch {
      message.error('Gagal finalize');
    } finally {
      setFinalizing(false);
    }
  };

  const weightData = result
    ? Object.entries(result.weights).map(([code, weight], idx) => ({
        key: idx,
        code,
        weight,
      }))
    : [];

  return (
    <div>
      <PageTitle title="Hasil AHP" />
      <Space orientation="vertical" style={{ width: '100%' }} size="middle">
        <Card loading={loading} title="Ringkasan Konsistensi">
          <Space size="large">
            <div>
              <Text type="secondary">Consistency Ratio: </Text>
              <Title level={4} style={{ margin: 0, color: result?.is_consistent ? '#52c41a' : '#f5222d' }}>
                {formatNumber(result?.consistency_ratio || 0)}
              </Title>
            </div>
            <Tag color={result?.is_consistent ? 'success' : 'error'}>
              {result?.is_consistent ? 'KONSISTEN' : 'TIDAK KONSISTEN'}
            </Tag>
          </Space>
          {!result?.is_consistent && (
            <Text type="warning" style={{ display: 'block', marginTop: 8 }}>
              CR harus lebih kecil dari 0.1 agar perbandingan dapat diterima.
            </Text>
          )}
        </Card>

        <Card title="Bobot Kriteria">
          <Table
            dataSource={weightData}
            pagination={false}
            columns={[
              { title: 'Kriteria', dataIndex: 'code', key: 'code' },
              { title: 'Bobot', dataIndex: 'weight', key: 'weight', render: (v: number) => formatNumber(v) },
            ]}
          />
        </Card>

        <Button
          type="primary"
          danger
          icon={<LockOutlined />}
          loading={finalizing}
          onClick={handleFinalize}
          disabled={!result?.is_consistent}
        >
          Finalize / Lock Bobot
        </Button>
      </Space>
    </div>
  );
};