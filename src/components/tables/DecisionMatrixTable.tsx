import { Table, InputNumber } from 'antd';
import type { Criteria, Alternative } from '@/types';

interface DecisionMatrixTableProps {
  alternatives: Alternative[];
  criteria: Criteria[];
  values: Record<string, Record<string, number>>;
  onChange: (altId: number, critId: number, value: number) => void;
}

export const DecisionMatrixTable = ({
  alternatives,
  criteria,
  values,
  onChange,
}: DecisionMatrixTableProps) => {
  const columns = [
    { title: 'Alternatif', dataIndex: 'name', key: 'name', fixed: 'left', width: 180 },
    ...criteria.map((c) => ({
      title: `${c.code} (${c.type})`,
      dataIndex: c.id,
      key: c.id,
      width: 120,
      render: (_: any, record: any) => (
        <InputNumber
          value={values[record.id]?.[c.id] ?? 0}
          onChange={(v) => onChange(record.id, c.id, v || 0)}
          style={{ width: '100%' }}
        />
      ),
    })),
  ];

  const data = alternatives.map((a) => ({
    key: a.id,
    id: a.id,
    name: `${a.code} - ${a.name}`,
  }));

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={false}
      bordered
      size="middle"
      scroll={{ x: 'max-content' }}
    />
  );
};