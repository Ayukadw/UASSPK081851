import { useEffect, useState } from 'react';
import { Card, Input, Select, Table, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { MarcosService } from '@/services/marcos.service';
import type { MarcosResult } from '@/types';
import { formatNumber } from '@/utils/helpers';
import { RankingChart } from '@/components/charts/RankingChart';
import { EmptyState } from '@/components/common/EmptyState';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export const PublicRankingPage = () => {
  const [data, setData] = useState<MarcosResult[]>([]);
  const [filtered, setFiltered] = useState<MarcosResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'rank' | 'score'>('rank');

  useEffect(() => {
    MarcosService.getRanking()
      .then((res) => {
        setData(res.data.data);
        setFiltered(res.data.data);
      })
      .catch(() => {
        setData([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let next = [...data];
    if (search) {
      next = next.filter((d) => d.alternative_name.toLowerCase().includes(search.toLowerCase()));
    }
    if (sort === 'score') {
      next.sort((a, b) => b.score - a.score);
    } else {
      next.sort((a, b) => a.rank - b.rank);
    }
    setTimeout(() => {
      setFiltered(next);
    }, 0);
  }, [search, sort, data]);

  const columns = [
    { title: 'Rank', dataIndex: 'rank', key: 'rank', render: (r: number) => <Tag color="gold">#{r}</Tag> },
    { title: 'Strategi', dataIndex: 'alternative_name', key: 'alternative_name' },
    { title: 'Skor', dataIndex: 'score', key: 'score', render: (v: number) => formatNumber(v) },
  ];

  return (
    <div>
      <Title level={3}>Ranking Strategi Content Creator</Title>
      <Card loading={loading}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Cari strategi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'rank', label: 'Urutkan: Rank' },
              { value: 'score', label: 'Urutkan: Skor Tertinggi' },
            ]}
            style={{ width: 200 }}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Table columns={columns as unknown as ColumnsType<MarcosResult>} dataSource={filtered} pagination={{ pageSize: 10 }} rowKey="alternative_id" />
            <div style={{ marginTop: 32 }}>
              <Title level={5}>Visualisasi Ranking</Title>
              <RankingChart data={filtered} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};