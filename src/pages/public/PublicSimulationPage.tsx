import { useState, useMemo, useEffect } from 'react';
import { Card, Slider, Typography, Table, Tag, Space, Button, Skeleton } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { RankingChart } from '@/components/charts/RankingChart';
import { CriteriaService } from '@/services/criteria.service';
import { AlternativeService } from '@/services/alternatives.service';
import type { Criteria, MarcosResult } from '@/types';

const { Title, Text } = Typography;

export const PublicSimulationPage = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resC, resA] = await Promise.all([
          CriteriaService.getAll(),
          AlternativeService.getAll(),
        ]);

        const criteriaData = resC.data || [];
        const altData = resA.data || [];

        setCriteria(criteriaData);
        setAlternatives(altData);

        if (criteriaData.length > 0) {
          const defaultWeight = 1 / criteriaData.length;
          const initialWeights: Record<number, number> = {};
          criteriaData.forEach((c: Criteria) => {
            initialWeights[c.id] = defaultWeight;
          });
          setWeights(initialWeights);
        }
      } catch (error) {
        console.error("Gagal memuat data simulasi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = () => {
    if (criteria.length > 0) {
      const defaultWeight = 1 / criteria.length;
      const initialWeights: Record<number, number> = {};
      criteria.forEach((c) => {
        initialWeights[c.id] = defaultWeight;
      });
      setWeights(initialWeights);
    }
  };

  // LOGIKA BARU: Fungsi untuk menggerakkan slider lain secara otomatis
  const handleSliderChange = (changedId: number, newValue: number) => {
    setWeights((prev) => {
      const oldWeights = { ...prev };
      
      // Hitung total bobot dari kriteria LAINNYA
      let sumOthers = 0;
      Object.keys(oldWeights).forEach((id) => {
        if (Number(id) !== changedId) sumOthers += oldWeights[Number(id)];
      });

      const newWeights = { ...oldWeights };
      newWeights[changedId] = newValue;

      // Sisa porsi yang harus dibagi ke kriteria lainnya
      const remainingSpace = 1 - newValue;

      Object.keys(newWeights).forEach((id) => {
        const numId = Number(id);
        if (numId !== changedId) {
          if (sumOthers === 0) {
            // Jika kriteria lain kebetulan 0 semua, bagi sisa ruangnya rata
            newWeights[numId] = remainingSpace / (Object.keys(newWeights).length - 1);
          } else {
            // Bagi sisa ruang berdasarkan proporsi (ukuran) mereka sebelumnya
            const proportion = oldWeights[numId] / sumOthers;
            newWeights[numId] = remainingSpace * proportion;
          }
        }
      });

      return newWeights;
    });
  };

  const results: MarcosResult[] = useMemo(() => {
    if (criteria.length === 0 || alternatives.length === 0) return [];

    // Karena weights sudah otomatis berjumlah 1, kita bisa pakai weights langsung
    const list = alternatives.map((alt) => {
      let score = 0;
      
      criteria.forEach((c) => {
        const weight = weights[c.id] || 0;
        const v = alt.scores ? alt.scores[c.id] : Math.floor(Math.random() * 40) + 60; 
        
        if (c.type === 'Benefit') {
          score += v * weight;
        } else {
          score += (100 - v) * weight;
        }
      });
      
      return { alternative_id: alt.id, alternative_name: alt.name, score, rank: 0 };
    });
    
    list.sort((a, b) => b.score - a.score);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [weights, criteria, alternatives]);

  const columns = [
    { title: 'Rank', dataIndex: 'rank', key: 'rank', render: (r: number) => <Tag color="gold">#{r}</Tag> },
    { title: 'Strategi', dataIndex: 'alternative_name', key: 'alternative_name' },
    { title: 'Skor Simulasi', dataIndex: 'score', key: 'score', render: (v: number) => v.toFixed(2) },
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <div>
      <Title level={3}>Simulasi Bobot Kriteria</Title>
      <Text type="secondary">
        Ubah bobot kriteria di bawah ini untuk melihat perubahan ranking secara real-time. Total bobot akan otomatis diseimbangkan agar selalu 100%.
      </Text>

      <Space orientation="vertical" style={{ width: '100%', marginTop: 24 }} size="large">
        <Card title="Pengaturan Bobot">
          <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ marginBottom: 16 }}>
            Reset Bobot
          </Button>
          {criteria.map((c) => {
            const currentWeight = weights[c.id] || 0;
            const displayPercentage = currentWeight * 100;

            return (
              <div key={c.id} style={{ marginBottom: 24 }}>
                <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{c.code} - {c.name} ({c.type})</Text>
                  <Tag color="blue">{displayPercentage.toFixed(1)}%</Tag>
                </Space>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={currentWeight}
                  // Hubungkan onChange dengan fungsi handleSliderChange yang baru
                  onChange={(val) => handleSliderChange(c.id, val)} 
                />
              </div>
            );
          })}
        </Card>

        <Card title="Hasil Simulasi Ranking">
          <Table columns={columns} dataSource={results} pagination={false} rowKey="alternative_id" />
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Visualisasi</Title>
            <RankingChart data={results} />
          </div>
        </Card>
      </Space>
    </div>
  );
};