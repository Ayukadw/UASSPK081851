import { Tag } from 'antd';
import type { UserRole } from '@/types';
import { ROLE_COLORS, ROLE_LABELS } from '@/constants';

export const RoleTag = ({ role }: { role: UserRole }) => (
  <Tag color={ROLE_COLORS[role] || 'default'}>{ROLE_LABELS[role] || role}</Tag>
);