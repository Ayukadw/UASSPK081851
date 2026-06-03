import { useEffect, useState } from 'react';
import { Button, Card, message } from 'antd';
import { SaveOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { DecisionMatrixTable } from '@/components/tables/DecisionMatrixTable';
import { AlternativeService } from '@/services/alternatives.service';
import { CriteriaService } from '@/services/criteria.service';
import { DecisionMatrixService } from '@/services/decisionMatrix.service';
import { MarcosService } from '@/services/marcos.service';
import type { Alternative, Criteria } from '@/types';

export const DecisionMatrixPage = () => {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [values, setValues] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [a, c, m] = await Promise.all([
        AlternativeService.getAll(),
        CriteriaService.getAll(),
        DecisionMatrixService.getAll().catch(() => ({ data: { data: [] } })),
      ]);
      setAlternatives(a.data.data);
      setCriteria(c.data.data);

      const map: Record<string, Record<string, number>> = {};
      m.data.data.forEach((entry) => {
        if (!map[entry.alternative_id]) map[entry.alternative_id] = {};
        map[entry.alternative_id][entry.criteria_id] = entry.value;
      });
      setValues(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleChange = (altId: number, critId: number, value: number) => {
    setValues((prev) => ({
      ...prev,
      [altId]: { ...prev[altId], [critId]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const entries = [];
    for (const altId in values) {
      for (const critId in values[altId]) {
        entries.push({
          alternative_id: Number(altId),
          criteria_id: Number(critId),
          value: values[altId][critId],
        });
      }
    }
    try {
      await DecisionMatrixService.updateBulk(entries);
      message.success('Decision matrix tersimpan');
    } catch {
      message.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    try {
      await MarcosService.calculate();
      message.success('Perhitungan MARCOS berhasil dijalankan');
    } catch {
      message.error('Gagal menjalankan perhitungan');
    }
  };

  return (
    <div>
      <PageTitle title="Decision Matrix" />
      <Card
        loading={loading}
        extra={
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleCalculate} style={{ marginRight: 8 }}>
            Hitung MARCOS
          </Button>
        }
      >
        <DecisionMatrixTable
          alternatives={alternatives}
          criteria={criteria}
          values={values}
          onChange={handleChange}
        />
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ marginTop: 16 }}>
          Simpan Matrix
        </Button>
      </Card>
    </div>
  );
};