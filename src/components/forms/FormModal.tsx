import { Modal, Button, Space } from 'antd';

interface FormModalProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
  loading?: boolean;
  okText?: string;
}

export const FormModal = ({
  open,
  title,
  onCancel,
  onSubmit,
  children,
  loading,
  okText = 'Simpan',
}: FormModalProps) => (
  <Modal
    open={open}
    title={title}
    onCancel={onCancel}
    footer={[
      <Space key="footer">
        <Button onClick={onCancel}>Batal</Button>
        <Button type="primary" loading={loading} onClick={onSubmit}>
          {okText}
        </Button>
      </Space>,
    ]}
    destroyOnClose
    maskClosable={false}
  >
    {children}
  </Modal>
);