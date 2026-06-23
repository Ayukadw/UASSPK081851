import { useState, useMemo, useEffect } from 'react';
import { Card, Table, Typography, Tag, Skeleton, message } from 'antd';
import { MarcosService } from '@/services/marcos.service';
import { CriteriaService } from '@/services/criteria.service';
import type { Alternative, Criteria } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export const MatrixKeputusan = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [matrixValues, setMatrixValues] = useState<Record<number, Record<number, number>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resC, resStep1] = await Promise.all([
          CriteriaService.getAll(),
          MarcosService.getStep1().catch(() => null),
        ]);

        const critData = resC.data || [];
        setCriteria(critData);

        if (resStep1 && resStep1.data && resStep1.data.success) {
          const step1Data = resStep1.data.data;
          setAlternatives(step1Data.alternatives || []);
          
          // Map backend matrix
          const backendMatrix = step1Data.matrix || {};
          const map: Record<number, Record<number, number>> = {};
          Object.keys(backendMatrix).forEach((altId) => {
            map[Number(altId)] = backendMatrix[altId];
          });
          setMatrixValues(map);
        } else {
          message.error('Gagal mengambil data dari API.');
        }
      } catch (error) {
        console.error('Gagal memuat matriks keputusan awal:', error);
        message.error('Gagal memuat data dari database.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = useMemo(() => {
    const cols: any[] = [
      {
        title: 'Alternatif',
        dataIndex: 'alt_name',
        key: 'alt_name',
        align: 'center',
        render: (text: string) => (
          <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
            {text}
          </span>
        ),
      },
    ];

    criteria.forEach((c) => {
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
            {val !== undefined ? val.toFixed(2) : '0.00'}
          </span>
        ),
      });
    });

    return cols;
  }, [criteria]);

  const dataSource = useMemo(() => {
    return alternatives.map((alt) => {
      const row: Record<string, any> = {
        key: String(alt.id),
        alt_name: alt.name,
      };
      criteria.forEach((c) => {
        row[c.id] = matrixValues[alt.id]?.[c.id] ?? 0;
      });
      return row;
    });
  }, [alternatives, criteria, matrixValues]);

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
        MATRIKS KEPUTUSAN AWAL
      </Title>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {criteria.map((c) => (
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
