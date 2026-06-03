import { useEffect, useState } from 'react';
import { Button, Card, Space, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { AHPMatrixTable } from '@/components/tables/AHPMatrixTable';
import { CriteriaService } from '@/services/criteria.service';
import { AHPService } from '@/services/ahp.service';
import type { Criteria, AHPComparison } from '@/types';

const { Text } = Typography;

export const AHPInputPage = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const res = await CriteriaService.getAll();
      const list = res.data.data;
      setCriteria(list);
      const size = list.length;
      setMatrix(Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => (i === j ? 1 : 1))));
      setLoading(false);
    };
    fetch();
  }, []);

  const handleChange = (i: number, j: number, value: number) => {
    const next = matrix.map((row) => [...row]);
    next[i][j] = value;
    next[j][i] = 1 / value;
    setMatrix(next);
  };

  const handleSave = async () => {
    setSaving(true);
    const comparisons: AHPComparison[] = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = 0; j < i; j++) {
        comparisons.push({
          criteria_id_1: criteria[i].id,
          criteria_id_2: criteria[j].id,
          value: matrix[i][j],
        });
      }
    }
    try {
      await AHPService.updateMatrix(comparisons);
      message.success('Matriks perbandingan tersimpan');
    } catch {
      message.error('Gagal menyimpan matriks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageTitle title="Input Matriks AHP" />
      <Card
        title="Pairwise Comparison"
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Simpan Matriks
          </Button>
        }
        loading={loading}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Text>
            Masukkan nilai perbandingan antar kriteria. Skala 1-9 (1 = sama penting, 9 = mutlak lebih penting).
          </Text>
          <AHPMatrixTable criteria={criteria} matrix={matrix} onChange={handleChange} />
        </Space>
      </Card>
    </div>
  );
};