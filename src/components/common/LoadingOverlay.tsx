import { Spin } from 'antd';

export const LoadingOverlay = ({ description = 'Memuat data...' }: { description?: string }) => (
  <div style={{ textAlign: 'center', padding: 48 }}>
    <Spin size="large" description={description} />
  </div>
);