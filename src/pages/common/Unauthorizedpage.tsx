import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="Maaf, Anda tidak memiliki izin untuk mengakses halaman ini."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Kembali ke Beranda
        </Button>
      }
    />
  );
};