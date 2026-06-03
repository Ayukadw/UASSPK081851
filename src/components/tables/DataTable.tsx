import { Table, Input, Space, Card } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface DataTableProps<T> {
  columns: any[];
  dataSource: T[];
  loading?: boolean;
  rowKey?: string;
  searchable?: boolean;
  searchFields?: (keyof T)[];
  pagination?: any;
  title?: string;
  extra?: React.ReactNode;
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  dataSource,
  loading,
  rowKey = 'id',
  searchable = true,
  searchFields,
  pagination = { pageSize: 10 },
  title,
  extra,
}: DataTableProps<T>) => {
  const [searchText, setSearchText] = useState('');

  const filtered = searchText
    ? dataSource.filter((item) =>
        (searchFields || Object.keys(item)).some((field) =>
          String(item[field as string]).toLowerCase().includes(searchText.toLowerCase())
        )
      )
    : dataSource;

  return (
    <Card
      title={title}
      extra={
        <Space>
          {searchable && (
            <Input
              placeholder="Cari data..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          )}
          {extra}
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};