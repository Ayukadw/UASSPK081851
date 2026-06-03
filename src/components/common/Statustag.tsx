import { Tag } from 'antd';

export const StatusTag = ({ active }: { active: boolean }) => (
  <Tag color={active ? 'success' : 'default'}>{active ? 'Aktif' : 'Nonaktif'}</Tag>
);