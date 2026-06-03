import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Space, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { getRoleBasedHome } from '@/utils/helpers'; // Pastikan file dan fungsi ini ada

const { Title, Text } = Typography;

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      // 1. Lakukan request login untuk mendapatkan token
      const res = await AuthService.login(values);
      const token = res.data.access_token; 
      
      // 2. Simpan token ke store SEKARANG agar axios interceptor bisa membacanya
      useAuthStore.setState({ token }); 
      
      // 3. Ambil data profil user asli dari backend
      const meRes = await AuthService.me();
      const user = meRes.data;
      
      // 4. Simpan ke state login secara permanen
      login(token, user); 
      message.success(`Selamat datang, ${user.username}`);
      
      // 5. Arahkan ke halaman yang BENAR berdasarkan role (bukan ke '/')
      const targetPath = getRoleBasedHome(user.role);
      navigate(targetPath, { replace: true });

    } catch (err: any) {
      console.error("Error Detail:", err);
      setError(err?.response?.data?.detail || 'Login gagal. Periksa kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
      <Space orientation="vertical" align="center" style={{ width: '100%', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          SPK Content Creator
        </Title>
        <Text type="secondary">Sistem Pendukung Keputusan</Text>
      </Space>

      {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Masukkan username' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Masukkan password' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<LoginOutlined />}
            loading={loading}
            block
            size="large"
          >
            Masuk
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};