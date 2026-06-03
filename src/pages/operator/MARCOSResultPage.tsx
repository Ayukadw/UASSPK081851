import { useEffect, useState } from 'react';
import { Card, Table, Space, Tag, Typography } from 'antd';
import { PageTitle } from '@/components/common/PageTitle';
import { RankingChart } from '@/components/charts/RankingChart';
import { ExportButton } from '@/components/common/ExportButton';
import { MarcosService } from '@/services/marcos.service';
import type { MarcosResult } from '@/types';
import { formatNumber } from '@/utils/helpers';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export const MARCOSResultPage = () => {
  const [data, setData] = useState<MarcosResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MarcosService.getRanking()
      .then((res) => setData(res.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'Rank', dataIndex: 'rank', key: 'rank', width: 80 },
    { title: 'Alternatif', dataIndex: 'alternative_name', key: 'alternative_name' },
    {
      title: 'Skor',
      dataIndex: 'score',
      key: 'score',
      render: (v: number) => <Tag color="blue">{formatNumber(v)}</Tag>,
    },
    { title: 'f(i)+', dataIndex: 'f_i_plus', key: 'f_i_plus', render: formatNumber },
    { title: 'f(i)-', dataIndex: 'f_i_minus', key: 'f_i_minus', render: formatNumber },
    { title: 'k(i)+', dataIndex: 'k_i_plus', key: 'k_i_plus', render: formatNumber },
    { title: 'k(i)-', dataIndex: 'k_i_minus', key: 'k_i_minus', render: formatNumber },
  ];

  return (
    <div>
      <PageTitle title="Hasil Perankingan MARCOS" />
      <Space orientation="vertical" style={{ width: '100%' }} size="middle">
        <Card extra={<ExportButton />}>
          <Title level={5}>Grafik Ranking</Title>
          <RankingChart data={data} />
        </Card>

        <Card title="Tabel Hasil Perhitungan" loading={loading}>
          <Table
            dataSource={data}
            columns={columns as unknown as ColumnsType<MarcosResult>}
            rowKey="alternative_id"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Space>
    </div>
  );
};