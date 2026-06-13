import { useState, useEffect } from 'react';
import { Card, Table, Typography, Skeleton, message } from 'antd';
import { MarcosService } from '@/services/marcos.service';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export const FungsiUtilitas = () => {
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resStep6, resStep7] = await Promise.all([
          MarcosService.getStep6().catch(() => null),
          MarcosService.getStep7().catch(() => null),
        ]);

        if (resStep7 && resStep7.data && resStep7.data.success && resStep6 && resStep6.data && resStep6.data.success) {
          const step6Data = resStep6.data.data;
          const step7Data = resStep7.data.data;
          
          const combined = step7Data.map((item: any) => {
            const fData = step6Data[item.alternative_id] || { f_k_minus: 0, f_k_plus: 0 };
            return {
              key: String(item.alternative_id),
              alt_name: item.alternative_name,
              f_i_minus: fData.f_k_minus,
              f_i_plus: fData.f_k_plus,
              score: item.score,
              rank: item.ranking,
            };
          });
          
          setDataSource(combined);
        } else {
          message.error('Gagal mengambil data dari API.');
        }
      } catch (error) {
        console.error('Gagal memuat data fungsi utilitas:', error);
        message.error('Gagal memuat data dari database.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: 'Peringkat',
      dataIndex: 'rank',
      key: 'rank',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {val === 1 ? '1st' : val === 2 ? '2nd' : val === 3 ? '3rd' : `${val}th`}
        </span>
      ),
    },
    {
      title: 'Alternatif',
      dataIndex: 'alt_name',
      key: 'alt_name',
      align: 'left' as const,
      render: (text: string) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'f(Ki-)',
      dataIndex: 'f_i_minus',
      key: 'f_i_minus',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {val.toFixed(4)}
        </span>
      ),
    },
    {
      title: 'f(Ki+)',
      dataIndex: 'f_i_plus',
      key: 'f_i_plus',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {val.toFixed(4)}
        </span>
      ),
    },
    {
      title: 'Skor Preferensi f(Ki)',
      dataIndex: 'score',
      key: 'score',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {val.toFixed(4)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '32px' }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Title level={2} style={{ color: '#1D5EC9', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>
        FUNGSI UTILITAS & PERINGKAT AKHIR
      </Title>

      <Card
        style={{
          borderColor: '#b9dfeb',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(29, 94, 201, 0.05)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={dataSource}
          columns={columns as unknown as ColumnsType<any>}
          pagination={false}
          bordered={false}
          style={{ borderRadius: '12px' }}
          components={{
            header: {
              cell: (props: any) => (
                <th
                  {...props}
                  style={{
                    backgroundColor: '#1D5EC9',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textAlign: 'center',
                    padding: '16px 8px',
                    borderBottom: 'none',
                  }}
                />
              ),
            },
            body: {
              cell: (props: any) => (
                <td
                  {...props}
                  style={{
                    padding: '16px 8px',
                    borderBottom: '1px solid #e6f4ff',
                  }}
                />
              ),
            },
          }}
        />
      </Card>
    </div>
  );
};
