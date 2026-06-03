import { Card, Statistic } from 'antd';

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const StatCard = ({ title, value, suffix, icon, color = '#1890ff' }: StatCardProps) => (
  <Card>
    <Statistic title={title} value={value} suffix={suffix} prefix={icon} valueStyle={{ color }} />
  </Card>
);