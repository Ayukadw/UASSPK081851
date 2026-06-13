import { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { getRoleBasedHome } from '@/utils/helpers';

// LoginPage now serves as a redirect to the main page with a login parameter
export const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/?login=true', { replace: true });
  }, [navigate]);

  return null;
};

// LoginModal is the pop-up modal component rendered on the public page
export const LoginModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  if (!visible) return null;

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await AuthService.login(values);
      const token = res.data.access_token;
      
      useAuthStore.setState({ token });
      
      const meRes = await AuthService.me();
      const user = meRes.data;
      
      login(token, user);
      message.success(`Selamat datang, ${user.username}`);
      
      const targetPath = getRoleBasedHome(user.role);
      navigate(targetPath, { replace: true });
      if (targetPath === '/') {
        onClose();
      }
    } catch (err: any) {
      console.error("Error Detail:", err);
      setError(err?.response?.data?.detail || 'Login gagal. Periksa kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
      onClick={onClose}
    >
      <style>{`
        .login-input-field::placeholder {
          color: #bfbfbf !important;
        }
        .login-btn-hover:hover {
          background-color: #f0f5ff !important;
          color: #1D5EC9 !important;
        }
        /* Style override to hide Ant Design default input outlines and match exact design */
        .login-input-wrapper {
          background: #ffffff !important;
          border: none !important;
          box-shadow: none !important;
        }
        .login-input-wrapper:focus, .login-input-wrapper:focus-within {
          border: 1.5px solid #ffffff !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
        }
      `}</style>

      {/* Login Card Box */}
      <div
        style={{
          width: '400px',
          backgroundColor: '#1D5EC9',
          borderRadius: '16px',
          padding: '44px 36px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '22px',
            cursor: 'pointer',
            opacity: 0.8,
            transition: 'opacity 0.2s',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        >
          ✕
        </button>

        {/* Title SPK */}
        <span
          style={{
            fontSize: '44px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '36px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: 1,
            letterSpacing: '0.5px',
          }}
        >
          SPK
        </span>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{
              marginBottom: 20,
              backgroundColor: '#fff1f0',
              border: '1px solid #ffa39e',
              color: '#a8071a',
              borderRadius: '8px',
            }}
          />
        )}

        <Form name="login_popup" onFinish={onFinish} autoComplete="off" layout="vertical">
          {/* Username Label */}
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px', display: 'block' }}>
            Username
          </span>
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Masukkan username' }]}
            style={{ marginBottom: '24px' }}
          >
            <Input
              placeholder="Username"
              size="large"
              className="login-input-wrapper login-input-field"
              style={{
                borderRadius: '8px',
                height: '45px',
                fontSize: '15px',
              }}
            />
          </Form.Item>

          {/* Password Label */}
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px', display: 'block' }}>
            Password
          </span>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Masukkan password' }]}
            style={{ marginBottom: '36px' }}
          >
            <Input.Password
              placeholder="Password"
              size="large"
              className="login-input-wrapper login-input-field"
              iconRender={(visible) => (
                <span style={{ color: '#1D5EC9', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {visible ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </span>
              )}
              style={{
                borderRadius: '8px',
                height: '45px',
                fontSize: '15px',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="default"
              htmlType="submit"
              loading={loading}
              className="login-btn-hover"
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#1D5EC9',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                transition: 'all 0.2s ease',
              }}
            >
              Masuk
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};