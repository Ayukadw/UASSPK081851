import { useEffect, useState } from 'react';
import { Button, Table, Tag, Typography, message, InputNumber } from 'antd';
import { AlternativeService } from '@/services/alternatives.service';
import { CriteriaService } from '@/services/criteria.service';
import { DecisionMatrixService } from '@/services/decisionMatrix.service';
import type { Alternative, Criteria, DecisionMatrixEntry } from '@/types';

const { Title } = Typography;

export const InputDataAlternatif = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [values, setValues] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const fetch = async () => {
    setLoading(true);
    try {
      const [altsRes, critsRes, matrixRes] = await Promise.all([
        AlternativeService.getAll(),
        CriteriaService.getAll(),
        DecisionMatrixService.getAll().catch(() => ({ data: { data: [] } })),
      ]);
      const fetchedAlts = altsRes.data || [];
      const fetchedCrits = critsRes.data || [];
      const matrixData = matrixRes.data?.data || [];
      
      setAlternatives(fetchedAlts);
      setCriteria(fetchedCrits);

      const map: Record<string, Record<string, number>> = {};
      fetchedAlts.forEach((alt) => {
        map[alt.id] = {};
        fetchedCrits.forEach((crit) => {
          map[alt.id][crit.id] = 0.0;
        });
      });

      matrixData.forEach((entry) => {
        if (map[entry.alternative_id]) {
          map[entry.alternative_id][entry.criteria_id] = entry.value;
        }
      });

      const saved = localStorage.getItem('unsaved_alternatif_values');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach((altId) => {
            if (map[altId]) {
              Object.keys(parsed[altId]).forEach((critId) => {
                if (map[altId][critId] !== undefined) {
                  map[altId][critId] = parsed[altId][critId];
                }
              });
            }
          });
        } catch (e) {
          console.error('Error parsing unsaved_alternatif_values', e);
        }
      }

      setValues(map);
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat kriteria atau alternatif dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleChange = (altId: number, critId: number, value: number) => {
    setValues((prev) => {
      const next = {
        ...prev,
        [altId]: { ...prev[altId], [critId]: value },
      };
      localStorage.setItem('unsaved_alternatif_values', JSON.stringify(next));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('processing');
    try {
      const payload: DecisionMatrixEntry[] = [];
      Object.entries(values).forEach(([altId, critMap]) => {
        Object.entries(critMap).forEach(([critId, value]) => {
          payload.push({
            alternative_id: Number(altId),
            criteria_id: Number(critId),
            value: Number(value),
          });
        });
      });

      const apiPromise = DecisionMatrixService.updateBulk(payload);
      const [res] = await Promise.all([
        apiPromise,
        new Promise((resolve) => setTimeout(resolve, 800))
      ]);

      if (res.data.success) {
        localStorage.removeItem('unsaved_alternatif_values');
        setSaveStatus('success');
        await new Promise((resolve) => setTimeout(resolve, 1800));
      } else {
        setSaveStatus('idle');
        message.error(res.data.message || 'Gagal menyimpan nilai alternatif.');
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus('idle');
      message.error(err.response?.data?.detail || 'Gagal menyimpan nilai alternatif.');
    } finally {
      setSaving(false);
      setSaveStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Memuat data...</div>;
  }

  // Define Table Columns dynamically
  const columns = [
    {
      title: 'Alt',
      dataIndex: 'code',
      key: 'code',
      align: 'center' as const,
      width: 100,
      render: (text: string) => (
        <span style={{ fontWeight: 'bold', color: '#1D5EC9', fontSize: '15px' }}>{text}</span>
      ),
    },
    ...criteria.map((c) => ({
      title: c.unit ? `${c.code} (${c.unit})` : c.code,
      dataIndex: c.id,
      key: c.id,
      align: 'center' as const,
      render: (_: any, record: Alternative) => {
        const val = values[record.id]?.[c.id] ?? 0;
        
        // Cek apakah kriteria merupakan mata uang / biaya
        const isCurrency = 
          c.unit?.toLowerCase().includes('rp') || 
          c.unit?.toLowerCase().includes('rupiah') || 
          c.name?.toLowerCase().includes('biaya') || 
          c.name?.toLowerCase().includes('harga') ||
          c.name?.toLowerCase().includes('gaji') ||
          c.name?.toLowerCase().includes('tarif') ||
          c.name?.toLowerCase().includes('ongkos');

        return (
          <InputNumber
            value={val}
            onChange={(v) => handleChange(record.id, c.id, v || 0)}
            controls={false}
            formatter={(value) => {
              if (value === undefined || value === null || value === '') return '';
              if (isCurrency) {
                const parts = `${value}`.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                return parts.join(',');
              } else {
                return `${value}`.replace(/\./g, ',');
              }
            }}
            parser={(value) => {
              if (!value) return 0;
              if (isCurrency) {
                const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');
                return parseFloat(cleanValue) || 0;
              } else {
                const cleanValue = value.replace(/,/g, '.');
                return parseFloat(cleanValue) || 0;
              }
            }}
            className="alternative-cell-input"
            style={{
              width: '100%',
              textAlign: 'center',
            }}
          />
        );
      },
    })),
  ];

  const tableData = alternatives.map((a) => ({
    key: a.id,
    id: a.id,
    code: a.code,
    name: a.name,
  }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4px 0' }}>
      <style>{`
        /* Custom Styles for Alternative input Table */
        .alternative-input-table .ant-table {
          background: #ffffff !important;
          border: 1.5px solid #adc6ff !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .alternative-input-table .ant-table-thead > tr > th {
          background-color: #1D5EC9 !important;
          color: #ffffff !important;
          font-weight: bold !important;
          font-size: 15px !important;
          text-align: center !important;
          border-right: 1.5px solid #adc6ff !important;
          border-bottom: 1.5px solid #adc6ff !important;
        }
        .alternative-input-table .ant-table-tbody > tr > td {
          background-color: #e6f0ff !important;
          border-right: 1.5px solid #adc6ff !important;
          border-bottom: 1.5px solid #adc6ff !important;
          padding: 8px 12px !important;
        }
        .alternative-input-table .ant-table-row {
          background-color: #e6f0ff !important;
        }
        .alternative-input-table .ant-table-row:hover > td {
          background-color: #dbe7ff !important;
        }
        /* Custom borderless inputs matching design */
        .alternative-cell-input {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .alternative-cell-input input {
          color: #1D5EC9 !important;
          font-weight: bold !important;
          text-align: center !important;
          font-size: 15px !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          height: 38px !important;
        }
        .alternative-cell-input-focused, .alternative-cell-input:focus-within {
          background: #ffffff !important;
          border: 1px solid #1D5EC9 !important;
          border-radius: 6px !important;
        }
      `}</style>

      {/* Title */}
      <Title level={2} style={{ color: '#1D5EC9', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '16px' }}>
        DATA ALTERNATIF
      </Title>

      {/* Criteria Tags */}
      <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {criteria.map((c) => (
          <Tag
            key={c.id}
            style={{
              background: '#e6f0ff',
              color: '#1D5EC9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            {c.code} ({c.name})
          </Tag>
        ))}
      </div>

      {/* Alternative Tags */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {alternatives.map((a) => (
          <Tag
            key={a.id}
            style={{
              background: '#e6f0ff',
              color: '#1D5EC9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            {a.code} ({a.name})
          </Tag>
        ))}
      </div>

      {/* Table Card Grid */}
      <div style={{ marginBottom: '20px' }}>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          className="alternative-input-table"
          bordered
          size="middle"
        />
      </div>

      {/* Save Button */}
      <Button
        type="primary"
        onClick={handleSave}
        loading={saving}
        style={{
          backgroundColor: '#1D5EC9',
          borderColor: '#1D5EC9',
          borderRadius: '8px',
          height: '40px',
          padding: '0 24px',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 4px 10px rgba(29, 94, 201, 0.2)',
        }}
      >
        Simpan Nilai
      </Button>

      {/* Custom Pop-up Modal for Status (Processing & Success) similar to PembobotanKriteria */}
      {saveStatus !== 'idle' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            width: '380px',
            height: '240px',
            backgroundColor: '#1D5EC9',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            color: '#ffffff',
          }}>
            <div className="status-modal-content">
              {saveStatus === 'processing' && (
                <>
                  <div className="status-spinner" />
                  <div className="status-text">Diproses...</div>
                </>
              )}
              {saveStatus === 'success' && (
                <>
                  <div className="success-icon-container">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="success-checkmark-svg"
                    >
                      <circle cx="12" cy="12" r="10" className="checkmark-circle-path" />
                      <polyline points="7.5 12.5 10.5 15.5 16.5 8.5" className="checkmark-check-path" />
                    </svg>
                  </div>
                  <div className="status-text">Berhasil Disimpan</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
