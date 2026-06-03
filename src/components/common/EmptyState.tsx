import { Empty } from 'antd';

export const EmptyState = ({ description = 'Tidak ada data' }: { description?: string }) => (
  <Empty description={description} style={{ padding: 40 }} />
);