import { Table, InputNumber, Typography } from 'antd';
import type { Criteria } from '@/types';
import { AHP_SCALE } from '@/constants';

const { Text } = Typography;

interface AHPMatrixTableProps {
  criteria: Criteria[];
  matrix: number[][];
  onChange: (i: number, j: number, value: number) => void;
  disabled?: boolean;
}

export const AHPMatrixTable = ({ criteria, matrix, onChange, disabled }: AHPMatrixTableProps) => {
  const columns = [
    { title: 'Kriteria', dataIndex: 'name', key: 'name', fixed: 'left', width: 140 },
    ...criteria.map((c, idx) => ({
      title: c.code,
      dataIndex: c.code,
      key: c.code,
      width: 100,
      render: (_: any, record: any, rowIndex: number) => {
        if (rowIndex === idx) return <Text strong>1</Text>;
        if (rowIndex > idx) {
          const val = matrix[rowIndex]?.[idx];
          return <Text type="secondary">{val ? (1 / val).toFixed(4) : '-'}</Text>;
        }
        return (
          <InputNumber
            min={1}
            max={9}
            step={0.1}
            value={matrix[rowIndex]?.[idx]}
            onChange={(v) => onChange(rowIndex, idx, v || 1)}
            disabled={disabled}
            style={{ width: 80 }}
            placeholder="1-9"
          />
        );
      },
    })),
  ];

  const data = criteria.map((c, i) => {
    const row: any = { key: i, name: `${c.code} - ${c.name}` };
    criteria.forEach((c2, j) => {
      row[c2.code] = matrix[i]?.[j];
    });
    return row;
  });

  return (
    <div>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 'max-content' }}
      />
      <div style={{ marginTop: 8 }}>
        <Text type="secondary">Skala: </Text>
        {AHP_SCALE.map((s) => (
          <Text type="secondary" key={s.value} style={{ marginRight: 12, fontSize: 12 }}>
            {s.label}
          </Text>
        ))}
      </div>
    </div>
  );
};