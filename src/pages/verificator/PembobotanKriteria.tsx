import { useEffect, useState } from 'react';
import { Button, Select, Space, Typography, Tag, Row, Col, message } from 'antd';
import { CriteriaService } from '@/services/criteria.service';
import { AHPService } from '@/services/ahp.service';
import type { Criteria } from '@/types';

const { Title, Text } = Typography;

export const PembobotanKriteria = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [preferences, setPreferences] = useState<Record<string, 'left' | 'right' | 'none'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cr, setCr] = useState<number>(0.0);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // 1. Fetch criteria and initialize matrix
  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        const res = await CriteriaService.getAll();
        const list = res.data || [];
        setCriteria(list);

        const size = list.length;
        if (size === 0) {
          setLoading(false);
          return;
        }

        // Attempt to load from localStorage for persistent user inputs
        const savedMatrix = localStorage.getItem('ahp_matrix_data');
        if (savedMatrix) {
          const parsed = JSON.parse(savedMatrix);
          if (parsed.length === size) {
            setMatrix(parsed);
            calculateAHP(parsed, size);

            // Re-construct visual preferences from loaded matrix values
            const initPrefs: Record<string, 'left' | 'right' | 'none'> = {};
            for (let i = 0; i < size; i++) {
              for (let j = i + 1; j < size; j++) {
                const val = parsed[i][j];
                if (val > 1) {
                  initPrefs[`${i}-${j}`] = 'left';
                } else if (val < 1) {
                  initPrefs[`${i}-${j}`] = 'right';
                } else {
                  // Fallback to loaded localStorage preference override if value is 1 but highlight exists
                  const savedPref = localStorage.getItem(`ahp_pref_${i}_${j}`);
                  initPrefs[`${i}-${j}`] = (savedPref as any) || 'none';
                }
              }
            }
            setPreferences(initPrefs);
            setLoading(false);
            return;
          }
        }

        // Default matrix: 1 on diagonal, 1 elsewhere (all values default to 1 as requested)
        const defaultMatrix = Array.from({ length: size }, (_, i) =>
          Array.from({ length: size }, (_, j) => (i === j ? 1 : 1))
        );
        setMatrix(defaultMatrix);
        calculateAHP(defaultMatrix, size);

        const initPrefs: Record<string, 'left' | 'right' | 'none'> = {};
        for (let i = 0; i < size; i++) {
          for (let j = i + 1; j < size; j++) {
            initPrefs[`${i}-${j}`] = 'none';
          }
        }
        setPreferences(initPrefs);
      } catch (err) {
        console.error('Error fetching criteria:', err);
        message.error('Gagal memuat kriteria dari database.');
      } finally {
        setLoading(false);
      }
    };
    fetchCriteria();
  }, []);

  // Helper to extract dropdown values (integer values: 1, 3, 5, 7, 9)
  const getPairDropdownValue = (i: number, j: number) => {
    const val = matrix[i]?.[j] || 1;
    if (val > 1) {
      return val;
    } else if (val < 1) {
      return Math.round(1 / val);
    }
    return 1;
  };

  // 2. Perform client-side AHP calculations
  const calculateAHP = (mat: number[][], n: number) => {
    if (n <= 1) {
      setCr(0);
      setIsValid(true);
      return;
    }

    // A. Column sums
    const colSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += mat[i][j];
      }
    }

    // B. Normalization and Weights (average of rows)
    const weights = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let rowSum = 0;
      for (let j = 0; j < n; j++) {
        rowSum += mat[i][j] / colSums[j];
      }
      weights[i] = rowSum / n;
    }

    // C. Weighted Sum Vector
    const weightedSum = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        weightedSum[i] += mat[i][j] * weights[j];
      }
    }

    // E. Lambda Max
    let lambdaMax = 0;
    for (let i = 0; i < n; i++) {
      lambdaMax += weightedSum[i] / weights[i];
    }
    lambdaMax /= n;

    // F. Consistency Index (CI) & Consistency Ratio (CR)
    const CI = (lambdaMax - n) / (n - 1);
    const RI_table: Record<number, number> = {
      1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
      6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
    };
    const RI = RI_table[n] || 1.49;
    const computedCr = RI > 0 ? CI / RI : 0;

    const finalCr = Math.max(0, computedCr);
    setCr(finalCr);
    setIsValid(finalCr < 0.1);
  };

  // 3. Handle criteria box click (highlight toggle)
  const handleBoxClick = (i: number, j: number, targetSide: 'left' | 'right') => {
    const key = `${i}-${j}`;

    // Toggle active side preference
    const nextPrefs = { ...preferences, [key]: targetSide };
    setPreferences(nextPrefs);
    localStorage.setItem(`ahp_pref_${i}_${j}`, targetSide);

    const nextMatrix = matrix.map((row) => [...row]);
    const currentDropdownVal = getPairDropdownValue(i, j);

    if (currentDropdownVal === 1) {
      // Keep value at 1.0 (defaulting to 1, not 3) when clicked!
      nextMatrix[i][j] = 1;
      nextMatrix[j][i] = 1;
    } else {
      // Recalculate reciprocal values based on highlights
      if (targetSide === 'left') {
        nextMatrix[i][j] = currentDropdownVal;
        nextMatrix[j][i] = 1 / currentDropdownVal;
      } else {
        nextMatrix[i][j] = 1 / currentDropdownVal;
        nextMatrix[j][i] = currentDropdownVal;
      }
    }

    setMatrix(nextMatrix);
    calculateAHP(nextMatrix, criteria.length);
  };

  // 4. Handle dropdown selection changes
  const handleSelectChange = (i: number, j: number, selectedValue: number) => {
    const key = `${i}-${j}`;
    let currentPref = preferences[key] || 'none';

    if (selectedValue === 1) {
      currentPref = 'none';
      localStorage.removeItem(`ahp_pref_${i}_${j}`);
    } else if (currentPref === 'none') {
      currentPref = 'left'; // default to left preferred when value is chosen
      localStorage.setItem(`ahp_pref_${i}_${j}`, 'left');
    }

    const nextPrefs = { ...preferences, [key]: currentPref };
    setPreferences(nextPrefs);

    const nextMatrix = matrix.map((row) => [...row]);
    if (selectedValue === 1) {
      nextMatrix[i][j] = 1;
      nextMatrix[j][i] = 1;
    } else {
      if (currentPref === 'left') {
        nextMatrix[i][j] = selectedValue;
        nextMatrix[j][i] = 1 / selectedValue;
      } else {
        nextMatrix[i][j] = 1 / selectedValue;
        nextMatrix[j][i] = selectedValue;
      }
    }

    setMatrix(nextMatrix);
    calculateAHP(nextMatrix, criteria.length);
  };

  // 5. Handle Save button click
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('processing');
    try {
      localStorage.setItem('ahp_matrix_data', JSON.stringify(matrix));

      const n = criteria.length;
      const colSums = Array(n).fill(0);
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          colSums[j] += matrix[i][j];
        }
      }
      const weightsObj: Record<string, number> = {};
      const weightsPayload: Record<number, number> = {};
      for (let i = 0; i < n; i++) {
        let rowSum = 0;
        for (let j = 0; j < n; j++) {
          rowSum += matrix[i][j] / colSums[j];
        }
        const w = rowSum / n;
        weightsObj[criteria[i].code] = w;
        weightsPayload[criteria[i].id] = w;
      }

      const clientSideResult = {
        weights: weightsObj,
        consistency_ratio: cr,
        is_consistent: isValid
      };

      localStorage.setItem('ahp_client_result', JSON.stringify(clientSideResult));

      // Construct matrix payload with DB criteria IDs
      const matrixPayload: Record<number, Record<number, number>> = {};
      for (let i = 0; i < n; i++) {
        const rowId = criteria[i].id;
        matrixPayload[rowId] = {};
        for (let j = 0; j < n; j++) {
          const colId = criteria[j].id;
          matrixPayload[rowId][colId] = matrix[i][j];
        }
      }

      // Call Backend APIs with a minimum 1 second delay to display the processing state smoothly
      await Promise.all([
        AHPService.updateMatrix(matrixPayload),
        AHPService.finalize(weightsPayload),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(err);
      message.error('Gagal menyimpan pembobotan kriteria.');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  // Descriptive AHP option labels
  const dropdownOptions = [
    { value: 1, label: '1 - Sama penting' },
    { value: 3, label: '3 - Sedikit lebih penting' },
    { value: 5, label: '5 - Lebih penting' },
    { value: 7, label: '7 - Sangat penting' },
    { value: 9, label: '9 - Mutlak lebih penting' },
  ];

  // Generate unique pairwise comparisons for N criteria
  const getPairs = () => {
    const pairs = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        pairs.push({ from: criteria[i], to: criteria[j], i, j });
      }
    }
    return pairs;
  };

  const pairs = getPairs();
  const midPoint = Math.ceil(pairs.length / 2);
  const leftColumnPairs = pairs.slice(0, midPoint);
  const rightColumnPairs = pairs.slice(midPoint);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Memuat data kriteria...</div>;
  }

  if (criteria.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="warning" strong style={{ fontSize: '16px' }}>
          Tidak ada kriteria di database. Silakan tambahkan kriteria terlebih dahulu di panel admin.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4px 0' }}>
      {/* Title */}
      <Title level={2} style={{ color: '#1D5EC9', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '12px' }}>
        PEMBOBOTAN KRITERIA
      </Title>

      {/* Criteria Tags */}
      <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {criteria.map((c) => (
          <Tag
            key={c.id}
            style={{
              background: '#e6f0ff',
              color: '#1D5EC9',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            {c.code} ({c.name})
          </Tag>
        ))}
      </div>

      {/* Main Pairwise Form Panel */}
      <div
        style={{
          border: '1px solid #adc6ff',
          borderRadius: '12px',
          padding: '16px 24px',
          background: '#ffffff',
          boxShadow: '0 4px 12px rgba(29, 94, 201, 0.03)',
          marginBottom: '12px',
        }}
      >
        <Text strong style={{ display: 'block', fontSize: '15px', color: '#1D5EC9', marginBottom: '12px' }}>
          Berikan Bobot Untuk Setiap Kriteria !
        </Text>

        <Row gutter={48}>
          {/* Column 1 */}
          <Col xs={24} md={12}>
            {leftColumnPairs.map((pair, index) => {
              const key = `${pair.i}-${pair.j}`;
              const activeSide = preferences[key] || 'none';
              const dropdownVal = getPairDropdownValue(pair.i, pair.j);
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {/* Left Criteria Box */}
                  <div
                    onClick={() => handleBoxClick(pair.i, pair.j, 'left')}
                    style={{
                      width: '38px',
                      height: '38px',
                      border: '1.5px solid #1D5EC9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: activeSide === 'left' ? '#ffffff' : '#1D5EC9',
                      background: activeSide === 'left' ? '#1D5EC9' : '#ffffff',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    {pair.from.code}
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#1D5EC9', fontSize: '14px' }}>Vs</span>

                  {/* Right Criteria Box */}
                  <div
                    onClick={() => handleBoxClick(pair.i, pair.j, 'right')}
                    style={{
                      width: '38px',
                      height: '38px',
                      border: '1.5px solid #1D5EC9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: activeSide === 'right' ? '#ffffff' : '#1D5EC9',
                      background: activeSide === 'right' ? '#1D5EC9' : '#ffffff',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    {pair.to.code}
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#1D5EC9', fontSize: '14px' }}>=</span>

                  <Select
                    placeholder="Pilih Nilai"
                    style={{ flex: 1, height: '38px' }}
                    options={dropdownOptions}
                    value={dropdownVal}
                    onChange={(val) => handleSelectChange(pair.i, pair.j, val)}
                  />
                </div>
              );
            })}
          </Col>

          {/* Column 2 */}
          <Col xs={24} md={12}>
            {rightColumnPairs.map((pair, index) => {
              const key = `${pair.i}-${pair.j}`;
              const activeSide = preferences[key] || 'none';
              const dropdownVal = getPairDropdownValue(pair.i, pair.j);
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {/* Left Criteria Box */}
                  <div
                    onClick={() => handleBoxClick(pair.i, pair.j, 'left')}
                    style={{
                      width: '38px',
                      height: '38px',
                      border: '1.5px solid #1D5EC9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: activeSide === 'left' ? '#ffffff' : '#1D5EC9',
                      background: activeSide === 'left' ? '#1D5EC9' : '#ffffff',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    {pair.from.code}
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#1D5EC9', fontSize: '14px' }}>Vs</span>

                  {/* Right Criteria Box */}
                  <div
                    onClick={() => handleBoxClick(pair.i, pair.j, 'right')}
                    style={{
                      width: '38px',
                      height: '38px',
                      border: '1.5px solid #1D5EC9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: activeSide === 'right' ? '#ffffff' : '#1D5EC9',
                      background: activeSide === 'right' ? '#1D5EC9' : '#ffffff',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    {pair.to.code}
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#1D5EC9', fontSize: '14px' }}>=</span>

                  <Select
                    placeholder="Pilih Nilai"
                    style={{ flex: 1, height: '38px' }}
                    options={dropdownOptions}
                    value={dropdownVal}
                    onChange={(val) => handleSelectChange(pair.i, pair.j, val)}
                  />
                </div>
              );
            })}
          </Col>
        </Row>
      </div>

      {/* Results consistency status & Save button */}
      <div
        style={{
          border: '1px solid #adc6ff',
          borderRadius: '12px',
          padding: '12px 24px',
          background: '#f0f5ff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#1D5EC9', fontSize: '14px', letterSpacing: '0.3px' }}>
            HASIL UJI KONSISTENSI (CR):
          </Text>
          <Text strong style={{ color: '#1D5EC9', fontSize: '14px' }}>
            Nilai CR : {cr.toFixed(3)}
          </Text>
          <Text strong style={{ color: '#1D5EC9', fontSize: '14px' }}>
            Status : <span style={{ color: isValid ? '#52c41a' : '#ff4d4f' }}>
              {isValid ? 'Valid' : 'Tidak Valid'}
            </span>
          </Text>
        </Space>

        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          disabled={!isValid}
          style={{
            background: isValid ? '#1D5EC9' : '#bfbfbf',
            borderColor: isValid ? '#1D5EC9' : '#d9d9d9',
            borderRadius: '8px',
            height: '38px',
            padding: '0 32px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: isValid ? '0 4px 10px rgba(29, 94, 201, 0.2)' : 'none',
          }}
        >
          Simpan
        </Button>
      </div>

      {/* Custom Pop-up Modal for Save Status (Processing & Success) */}
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
            <style>{`
              .custom-spinner {
                width: 64px;
                height: 64px;
                border: 6px solid rgba(255, 255, 255, 0.35);
                border-radius: 50%;
                border-top-color: #ffffff;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            
            {saveStatus === 'processing' ? (
              <>
                <div className="custom-spinner" style={{ marginBottom: '24px' }} />
                <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  Diproses...
                </span>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg
                    width="76"
                    height="76"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  Berhasil Disimpan
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
