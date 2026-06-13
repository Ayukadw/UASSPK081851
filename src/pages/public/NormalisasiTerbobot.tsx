import { useState, useMemo, useEffect } from 'react';
import { Card, Table, Typography, Tag, Skeleton, message } from 'antd';
import { AlternativeService } from '@/services/alternatives.service';
import { CriteriaService } from '@/services/criteria.service';
import { MarcosService } from '@/services/marcos.service';
import type { Alternative, Criteria } from '@/types';
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

const defaultAlternatives: Alternative[] = [
  { id: 1, code: 'A1', name: 'Claude' },
  { id: 2, code: 'A2', name: 'Gemini' },
  { id: 3, code: 'A3', name: 'ChtGPT' },
  { id: 4, code: 'A4', name: 'Wowo' },
  { id: 5, code: 'A5', name: 'Wiwi' },
];



export const NormalisasiTerbobot = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [weightedMatrix, setWeightedMatrix] = useState<Record<string, Record<number, number>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resA, resC, resStep4] = await Promise.all([
          AlternativeService.getAll(),
          CriteriaService.getAll(),
          MarcosService.getStep4().catch(() => null),
        ]);

        const altData = resA.data || [];
        const critData = resC.data || [];
        setAlternatives(altData);
        setCriteria(critData);

        if (resStep4 && resStep4.data && resStep4.data.success) {
          const { matrix: backendMatrix, ideal: backendIdeal, anti_ideal: backendAntiIdeal } = resStep4.data.data;
          const weightedMap: Record<string, Record<number, number>> = {};
          
          Object.keys(backendMatrix).forEach((altId) => {
            weightedMap[altId] = backendMatrix[altId];
          });
          weightedMap['AI'] = backendIdeal;
          weightedMap['AAI'] = backendAntiIdeal;
          
          setWeightedMatrix(weightedMap);
        }
      } catch (error) {
        console.error('Gagal memuat data matriks terbobot:', error);
        message.error('Gagal memuat data dari database.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const finalCriteria = criteria.length > 0 ? criteria : defaultCriteria;
  const finalAlternatives = alternatives.length > 0 ? alternatives : defaultAlternatives;

  const columns = useMemo(() => {
    const cols: any[] = [
      {
        title: 'Alternatif',
        dataIndex: 'alt_name',
        key: 'alt_name',
        align: 'left',
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
            {val !== undefined ? val.toFixed(4) : '0.0000'}
          </span>
        ),
      });
    });

    return cols;
  }, [finalCriteria]);

  const dataSource = useMemo(() => {
    const rows = finalAlternatives.map((alt) => {
      const row: Record<string, any> = {
        key: String(alt.id),
        alt_name: alt.name,
      };
      finalCriteria.forEach((c) => {
        row[c.id] = weightedMatrix[alt.id]?.[c.id] ?? 0;
      });
      return row;
    });

    // Tambahkan baris AI dan AAI
    const aiRow: Record<string, any> = {
      key: 'AI',
      alt_name: 'Ideal Solution (AI)',
    };
    const aaiRow: Record<string, any> = {
      key: 'AAI',
      alt_name: 'Anti-Ideal (AAI)',
    };
    finalCriteria.forEach((c) => {
      aiRow[c.id] = weightedMatrix['AI']?.[c.id] ?? 0;
      aaiRow[c.id] = weightedMatrix['AAI']?.[c.id] ?? 0;
    });

    rows.push(aiRow, aaiRow);
    return rows;
  }, [finalAlternatives, finalCriteria, weightedMatrix]);

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
        NORMALISASI TERBOBOT (V)
      </Title>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {finalCriteria.map((c) => {
          const w = c.weight ?? 0;
          return (
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
              {c.code}: Bobot={w.toFixed(4)}
            </Tag>
          );
        })}
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
