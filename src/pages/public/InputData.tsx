import { useState, useMemo, useEffect } from 'react';
import { Card, Slider, Typography, Space, Button, message, Skeleton } from 'antd';
import { FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { ReportService } from '@/services/report.service';
import { AlternativeService } from '@/services/alternatives.service';
import { CriteriaService } from '@/services/criteria.service';
import { MarcosService } from '@/services/marcos.service';
import { downloadBlob } from '@/utils/helpers';
import type { Alternative, Criteria } from '@/types';

const { Title, Text } = Typography;

// 1. Definisikan Kriteria dan Alternatif default/fallback jika DB masih kosong
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

export const InputData = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  // State untuk bobot kasar kriteria (skala 1-9) yang di-drag
  const [sliderValues, setSliderValues] = useState<Record<number, number>>({});


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resA, resC, resR] = await Promise.all([
          AlternativeService.getAll(),
          CriteriaService.getAll(),
          MarcosService.getRanking().catch(() => null),
        ]);

        const altData = resA.data || [];
        const critData = resC.data || [];

        setAlternatives(altData);
        setCriteria(critData);

        if (resR && resR.data && resR.data.success) {
          setRankingData(resR.data.data);
        }

        // Load & Initialize slider values
        const saved = localStorage.getItem('spk_simulator_weights');
        let initialWeights: Record<number, number> = {};
        if (saved) {
          try {
            initialWeights = JSON.parse(saved);
          } catch {
            // ignore
          }
        }
        // Pastikan default nilai ketika membuka halaman tersebut adalah 1 untuk kriteria baru/kosong
        critData.forEach((c: any) => {
          if (initialWeights[c.id] === undefined) {
            initialWeights[c.id] = 1;
          }
        });
        setSliderValues(initialWeights);

      } catch (error) {
        console.error('Gagal memuat data simulator:', error);
        message.error('Gagal memuat data dari database.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSliderChange = (criteriaId: number, val: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [criteriaId]: val,
    }));
  };

  const handleSaveWeights = async () => {
    try {
      setLoading(true);
      localStorage.setItem('spk_simulator_weights', JSON.stringify(sliderValues));
      
      // Hubungkan tombol simpan dengan API POST /api/v1/marcos/calculate
      await MarcosService.calculate();
      
      // Refresh barchart ranking dengan API GET /api/v1/marcos/step7-ranking
      const resR = await MarcosService.getRanking();
      if (resR && resR.data && resR.data.success) {
        setRankingData(resR.data.data);
      }
      setHasSaved(true);
      message.success('Kalkulasi MARCOS backend berhasil diperbarui!');
    } catch (error: any) {
      console.error('Gagal melakukan kalkulasi MARCOS:', error);
      message.error(error.response?.data?.detail || 'Gagal melakukan kalkulasi MARCOS.');
    } finally {
      setLoading(false);
    }
  };

  // Gunakan data dari database jika tersedia, jika tidak pakai fallback default
  const finalCriteria = criteria.length > 0 ? criteria : defaultCriteria;
  const finalAlternatives = alternatives.length > 0 ? alternatives : defaultAlternatives;



  // Export handlers
  const handlePdfExport = async () => {
    try {
      const res = await ReportService.exportPdf();
      downloadBlob(res.data, 'ranking_marcos.pdf');
      message.success('PDF berhasil diunduh');
    } catch {
      message.error('Gagal mengunduh PDF');
    }
  };

  const handleExcelExport = async () => {
    try {
      const res = await ReportService.exportExcel();
      downloadBlob(res.data, 'ranking_marcos.xlsx');
      message.success('Excel berhasil diunduh');
    } catch {
      message.error('Gagal mengunduh Excel');
    }
  };

  // Urutan grafik podium dinamis (menampilkan hingga 5 alternatif teratas)
  const podiumData = useMemo(() => {
    if (!hasSaved || rankingData.length === 0) {
      return finalAlternatives.slice(0, 5).map((alt) => ({
        alternative_id: alt.id,
        alternative_name: alt.name,
        score: 0,
        rank: 0,
      }));
    }
    const sortedResults = [...rankingData].slice(0, 5);
    if (sortedResults.length === 0) return [];

    // Urutan peringkat untuk podium (kiri ke kanan)
    const orderMap: Record<number, number[]> = {
      1: [0],
      2: [1, 0],
      3: [1, 0, 2],
      4: [3, 1, 0, 2],
      5: [4, 1, 0, 2, 3]
    };

    const count = sortedResults.length;
    const indices = orderMap[count] || [0];
    return indices.map((idx) => {
      const item = sortedResults[idx];
      return {
        alternative_id: item.alternative_id,
        alternative_name: item.alternative_name,
        score: item.score,
        rank: item.ranking,
      };
    }).filter(Boolean);
  }, [rankingData, finalAlternatives, hasSaved]);

  if (loading) {
    return (
      <div style={{ padding: '32px' }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Rekomendasi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ color: '#1D5EC9', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>
          REKOMENDASI STRATEGI TERBAIK
        </Title>
        <Space size="middle" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#1D5EC9', fontWeight: 'bold' }}>Export:</span>
          <Button
            onClick={handlePdfExport}
            style={{
              borderColor: '#ff4d4f',
              color: '#ff4d4f',
              width: 42,
              height: 42,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            icon={<FilePdfOutlined style={{ fontSize: 22 }} />}
          />
          <Button
            onClick={handleExcelExport}
            style={{
              borderColor: '#52c41a',
              color: '#52c41a',
              width: 42,
              height: 42,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            icon={<FileExcelOutlined style={{ fontSize: 22 }} />}
          />
        </Space>
      </div>

      {/* Section Podium & List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 16 }}>
        {/* Card Podium Chart */}
        <Card
          style={{
            borderColor: '#b9dfeb',
            borderRadius: '12px',
            height: '215px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: '8px',
          }}
          bodyStyle={{ width: '100%', padding: 0 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-end',
              height: '145px',
              width: '100%',
              padding: '0 20px',
            }}
          >
            {podiumData.map((item) => {
              const barHeights: Record<number, number> = { 1: 100, 2: 80, 3: 60, 4: 45, 5: 30 };
              const height = (hasSaved && rankingData.length > 0) ? (barHeights[item.rank] || 30) : 60;

              return (
                <div
                  key={item.alternative_id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '64px',
                  }}
                >
                  {/* Nilai Skor di atas Bar */}
                  <span style={{ color: '#1D5EC9', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>
                    {(hasSaved && rankingData.length > 0) ? item.score.toFixed(3) : '0.000'}
                  </span>
                  {/* Batang Podium */}
                  <div
                    style={{
                      width: '100%',
                      height: `${height}px`,
                      backgroundColor: '#1D5EC9',
                      borderTopLeftRadius: '6px',
                      borderTopRightRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Teks Peringkat di dalam Bar */}
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>
                      {(hasSaved && rankingData.length > 0) ? (item.rank === 1 ? '1st' : item.rank === 2 ? '2nd' : item.rank === 3 ? '3rd' : item.rank === 4 ? '4th' : '5th') : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Card List Ranking */}
        <Card
          style={{
            borderColor: '#b9dfeb',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '215px',
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 12 }}>
            {(hasSaved && rankingData.length > 0 ? rankingData : finalAlternatives).map((item) => {
              const rankText = hasSaved && rankingData.length > 0
                ? ('ranking' in item ? (item.ranking === 1 ? '1st' : item.ranking === 2 ? '2nd' : item.ranking === 3 ? '3rd' : `${item.ranking}th`) : '')
                : '-';
              const nameText = 'alternative_name' in item ? item.alternative_name : ('name' in item ? item.name : '');
              const keyId = 'alternative_id' in item ? item.alternative_id : item.id;
              return (
                <div key={keyId} style={{ display: 'flex', gap: 24, fontSize: '15px' }}>
                  <span style={{ color: '#1D5EC9', fontWeight: 'bold', width: '30px' }}>
                    {rankText}
                  </span>
                  <span style={{ color: '#1D5EC9', fontWeight: 'bold' }}>
                    {nameText}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Simulator Keputusan */}
      <Card
        title={
          <span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '16px' }}>
            SIMULATOR KEPUTUSAN
          </span>
        }
        style={{ borderColor: '#b9dfeb', borderRadius: '12px' }}
        bodyStyle={{ padding: '16px 24px 12px 24px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {finalCriteria.map((c) => {
            const sliderVal = sliderValues[c.id] ?? 1;
            return (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', alignItems: 'center', gap: 16 }}>
                <Text strong style={{ color: '#1D5EC9', fontSize: '14px' }}>{c.name}</Text>
                <Slider
                  min={1}
                  max={9}
                  step={1}
                  value={sliderVal}
                  onChange={(val) => handleSliderChange(c.id, val)}
                  marks={{
                    1: '1',
                    3: '3',
                    5: '5',
                    7: '7',
                    9: '9',
                  }}
                  tooltip={{ open: false }}
                  style={{
                    margin: '0 10px 8px 10px',
                  }}
                />
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <Button
              type="primary"
              onClick={handleSaveWeights}
              style={{
                backgroundColor: '#1D5EC9',
                borderColor: '#1D5EC9',
                borderRadius: '20px',
                padding: '6px 24px',
                height: 'auto',
                fontWeight: 'bold',
              }}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Card>

      {/* Legenda Skala */}
      <div style={{ marginTop: -14 }}>
        <span style={{ color: '#1D5EC9', fontStyle: 'italic', fontWeight: '500', fontSize: '12px' }}>
          *1 = Penting, 3 = Sedikit Lebih Penting, 5 = Lebih Penting, 7 = Sangat Penting, 9 = Mutlak Penting
        </span>
      </div>
    </div>
  );
};
