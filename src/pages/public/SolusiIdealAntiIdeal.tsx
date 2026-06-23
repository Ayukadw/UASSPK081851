import { useState, useMemo, useEffect } from 'react';
import { Card, Table, Typography, Tag, Skeleton, message } from 'antd';
import { CriteriaService } from '@/services/criteria.service';
import { MarcosService } from '@/services/marcos.service';
import type { Criteria } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

// Definisikan Kriteria dan Alternatif default/fallback jika DB masih kosong
const defaultCriteria: Criteria[] = [
  { id: 1, code: 'C1', name: 'Biaya', type: 'Cost' },
  { id: 2, code: 'C2', name: 'Waktu Produksi', type: 'Cost' },
  { id: 3, code: 'C3', name: 'Potensi Engagement', type: 'Benefit' },
  { id: 4, code: 'C4', name: 'Kompleksitas Implementasi', type: 'Cost' },
  { id: 5, code: 'C5', name: 'Fleksibilitas Adaptasi Tren', type: 'Benefit' },
];



export const SolusiIdealAntiIdeal = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [idealData, setIdealData] = useState<Record<number, number>>({});
  const [antiIdealData, setAntiIdealData] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resC, resStep2] = await Promise.all([
          CriteriaService.getAll(),
          MarcosService.getStep2().catch(() => null),
        ]);

        const critData = resC.data || [];
        setCriteria(critData);

        if (resStep2 && resStep2.data && resStep2.data.success) {
          const step2Data = resStep2.data.data;
          setIdealData(step2Data.ideal || {});
          setAntiIdealData(step2Data.anti_ideal || {});
        }
      } catch (error) {
        console.error('Gagal memuat data solusi ideal:', error);
        message.error('Gagal memuat data dari database.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const finalCriteria = criteria.length > 0 ? criteria : defaultCriteria;

  const columns = useMemo(() => {
    const cols: any[] = [
      {
        title: 'Solusi',
        dataIndex: 'solusi_type',
        key: 'solusi_type',
        align: 'center',
        render: (text: string) => (
          <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
            {text}
          </span>
        ),
      },
    ];

    finalCriteria.forEach((c) => {
      cols.push({
        title: (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', lineHeight: '1.2' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{c.code}</span>
            <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.9 }}>{c.name}</span>
            <span style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.75 }}>({c.type})</span>
          </div>
        ),
        dataIndex: String(c.id),
        key: String(c.id),
        align: 'center',
        render: (val: number) => (
          <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
            {val !== undefined ? val.toFixed(3) : '0.000'}
          </span>
        ),
      });
    });

    return cols;
  }, [finalCriteria]);

  const dataSource = useMemo(() => {
    const aiRow: Record<string, any> = {
      key: 'ai',
      solusi_type: 'Ideal Solution (AI)',
    };
    const aaiRow: Record<string, any> = {
      key: 'aai',
      solusi_type: 'Anti-Ideal (AAI)',
    };

    finalCriteria.forEach((c) => {
      aiRow[c.id] = idealData[c.id] ?? 0;
      aaiRow[c.id] = antiIdealData[c.id] ?? 0;
    });

    return [aiRow, aaiRow];
  }, [finalCriteria, idealData, antiIdealData]);

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
        SOLUSI IDEAL DAN ANTI IDEAL
      </Title>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {finalCriteria.map((c) => (
          <Tag
            key={c.id}
            style={{
              backgroundColor: '#e6f4ff',
              color: '#1D5EC9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 16px',
              fontSize: '14px',
              fontWeight: '600',
              margin: 0,
            }}
          >
            {c.code} ({c.name}) [{c.type}]
          </Tag>
        ))}
      </div>

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
