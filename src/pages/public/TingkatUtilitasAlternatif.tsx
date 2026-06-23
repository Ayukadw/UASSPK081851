import { useState, useMemo, useEffect } from 'react';
import { Card, Table, Typography, Skeleton, message } from 'antd';
import { AlternativeService } from '@/services/alternatives.service';
import { MarcosService } from '@/services/marcos.service';
import type { Alternative } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;


const defaultAlternatives: Alternative[] = [
  { id: 1, code: 'A1', name: 'Claude' },
  { id: 2, code: 'A2', name: 'Gemini' },
  { id: 3, code: 'A3', name: 'ChtGPT' },
  { id: 4, code: 'A4', name: 'Wowo' },
  { id: 5, code: 'A5', name: 'Wiwi' },
];


export const TingkatUtilitasAlternatif = () => {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [sValues, setSValues] = useState<Record<string, number>>({});
  const [kMinusValues, setKMinusValues] = useState<Record<string, number>>({});
  const [kPlusValues, setKPlusValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resA, resStep5] = await Promise.all([
          AlternativeService.getAll(),
          MarcosService.getStep5().catch(() => null),
        ]);

        const altData = resA.data || [];
        setAlternatives(altData);

        if (resStep5 && resStep5.data && resStep5.data.success) {
          const { s_alternatives, s_anti_ideal, s_ideal, ki_minus, ki_plus } = resStep5.data.data;
          
          const S: Record<string, number> = {};
          Object.keys(s_alternatives).forEach((altId) => {
            S[altId] = s_alternatives[altId];
          });
          S['AI'] = s_ideal;
          S['AAI'] = s_anti_ideal;
          
          const K_minus: Record<string, number> = {};
          Object.keys(ki_minus).forEach((altId) => {
            K_minus[altId] = ki_minus[altId];
          });
          
          const K_plus: Record<string, number> = {};
          Object.keys(ki_plus).forEach((altId) => {
            K_plus[altId] = ki_plus[altId];
          });
          
          setSValues(S);
          setKMinusValues(K_minus);
          setKPlusValues(K_plus);
        }
      } catch (error) {
        console.error('Gagal memuat data tingkat utilitas:', error);
        message.error('Gagal memuat data dari database.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const finalAlternatives = alternatives.length > 0 ? alternatives : defaultAlternatives;

  const columns = [
    {
      title: 'Alternatif',
      dataIndex: 'alt_name',
      key: 'alt_name',
      align: 'center' as const,
      render: (text: string) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Jumlah Terbobot (Si)',
      dataIndex: 'S_val',
      key: 'S_val',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {val.toFixed(4)}
        </span>
      ),
    },
    {
      title: 'Derajat Utilitas Ki-',
      dataIndex: 'K_min_val',
      key: 'K_min_val',
      align: 'center' as const,
      render: (val: number | string) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {typeof val === 'number' ? val.toFixed(4) : val}
        </span>
      ),
    },
    {
      title: 'Derajat Utilitas Ki+',
      dataIndex: 'K_plus_val',
      key: 'K_plus_val',
      align: 'center' as const,
      render: (val: number | string) => (
        <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
          {typeof val === 'number' ? val.toFixed(4) : val}
        </span>
      ),
    },
  ];

  const dataSource = useMemo(() => {
    const rows = finalAlternatives.map((alt) => ({
      key: String(alt.id),
      alt_name: alt.name,
      S_val: sValues[alt.id] ?? 0,
      K_min_val: kMinusValues[alt.id] ?? 0,
      K_plus_val: kPlusValues[alt.id] ?? 0,
    }));

    // Tambahkan baris AI dan AAI
    rows.push({
      key: 'AI',
      alt_name: 'Ideal Solution (AI)',
      S_val: sValues['AI'] ?? 0,
      K_min_val: 1.0,
      K_plus_val: 1.0,
    });
    rows.push({
      key: 'AAI',
      alt_name: 'Anti-Ideal (AAI)',
      S_val: sValues['AAI'] ?? 0,
      K_min_val: 1.0,
      K_plus_val: 1.0,
    });

    return rows;
  }, [finalAlternatives, sValues, kMinusValues, kPlusValues]);

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
        TINGKAT UTILITAS ALTERNATIF
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
                    ...props.style,
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
