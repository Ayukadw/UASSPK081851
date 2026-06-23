import { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Popconfirm, message, Table, Typography, Modal, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { UserService } from '@/services/user.service';
import type { UserPayload } from '@/services/user.service';
import type { User, UserRole } from '@/types';

const { Title } = Typography;

export const KelolaUser = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Reset password states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Status pop-up states matching KelolaKriteria
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [successText, setSuccessText] = useState('Berhasil Disimpan');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await UserService.getAll();
      setUsers(res.data);
    } catch (error) {
      message.error('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    try {
      const values: UserPayload = await form.validateFields();

      // Close form modal and show submitting state
      setModalOpen(false);
      setSuccessText(editing ? 'Berhasil Diperbarui' : 'Berhasil Disimpan');
      setSubmitStatus('submitting');

      const apiPromise = editing
        ? UserService.update(editing.id, values)
        : UserService.create(values);

      await Promise.all([
        apiPromise,
        new Promise((resolve) => setTimeout(resolve, 800))
      ]);

      // Transition to success state
      setSubmitStatus('success');

      // Delay to let the success animation show
      await new Promise((resolve) => setTimeout(resolve, 1800));

      setEditing(null);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error, do not close or reopen anything
        return;
      }

      setSubmitStatus('idle');
      setModalOpen(true);

      if (error.response) {
        const errorMessage = error.response.data?.detail || 'Terjadi kesalahan saat menyimpan user.';
        message.error(errorMessage);
      } else {
        message.error('Terjadi kesalahan saat menyimpan user.');
      }
    } finally {
      setSubmitStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setSuccessText('Berhasil Dihapus');
      setSubmitStatus('submitting');
      
      const apiPromise = UserService.delete(id);
      await Promise.all([
        apiPromise,
        new Promise((resolve) => setTimeout(resolve, 800))
      ]);
      
      setSubmitStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1800));
      fetchUsers();
    } catch (error: any) {
      setSubmitStatus('idle');
      const errorMessage = error.response?.data?.detail || 'Gagal menghapus! User ini masih memiliki relasi data.';
      message.error(errorMessage);
    } finally {
      setSubmitStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return;
    try {
      setResetModalOpen(false);
      setSuccessText('Password Berhasil Di-reset');
      setSubmitStatus('submitting');

      const apiPromise = UserService.resetPassword(resetUserId, newPassword);
      await Promise.all([
        apiPromise,
        new Promise((resolve) => setTimeout(resolve, 800))
      ]);

      setSubmitStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1800));

      setNewPassword('');
      setResetUserId(null);
    } catch (error: any) {
      setSubmitStatus('idle');
      setResetModalOpen(true);
      const errorMessage = error.response?.data?.detail || 'Gagal mereset password.';
      message.error(errorMessage);
    } finally {
      setSubmitStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  // Helper to map backend role to Indonesian display label
  const getRoleLabel = (role: string) => {
    if (role === 'IT_Admin') return 'Administrator';
    if (role === 'Verificator') return 'Verifikator';
    if (role === 'Data_Admin') return 'Petugas Data';
    return role;
  };

  const columns = [
    {
      title: 'ID',
      key: 'index',
      width: '10%',
      render: (_: any, __: any, index: number) => (
        <span>{String(index + 1).padStart(2, '0')}</span>
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: '35%',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: '30%',
      render: (role: UserRole) => <span>{getRoleLabel(role)}</span>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: '25%',
      render: (_: any, record: User) => (
        <div className="admin-action-buttons-cell">
          <button
            className="admin-action-btn-blue"
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
            title="Edit User"
          >
            <EditOutlined />
          </button>
          <button
            className="admin-action-btn-blue"
            onClick={() => {
              setResetUserId(record.id);
              setResetModalOpen(true);
            }}
            title="Reset Password"
          >
            <KeyOutlined />
          </button>
          <Popconfirm
            title="Hapus user?"
            description="Apakah Anda yakin ingin menghapus user ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <button className="admin-action-btn-blue" title="Hapus User">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title
        level={2}
        style={{ color: '#1D5EC9', margin: '0 0 24px 0', fontWeight: 'bold', letterSpacing: '0.5px' }}
      >
        MANAJEMEN USER
      </Title>

      <Button
        className="admin-add-btn"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditing(null);
          form.resetFields();
          setModalOpen(true);
        }}
      >
        Tambah User Baru
      </Button>

      <Table
        className="custom-admin-table"
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      {/* Form Modal: Add / Edit User */}
      <Modal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        footer={null}
        closeIcon={true}
        destroyOnClose
        maskClosable={false}
        width={650}
        className="custom-user-modal"
      >
        <Typography.Title
          level={3}
          style={{
            color: '#1D5EC9',
            marginTop: 0,
            marginBottom: '24px',
            fontWeight: 'bold',
            fontSize: '18px',
          }}
        >
          {editing ? 'Edit User' : 'Tambahkan User Baru'}
        </Typography.Title>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="username"
                label={<span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '15px' }}>Username</span>}
                rules={[
                  { required: true, message: 'Silakan masukkan username!' },
                  { min: 3, message: 'Username minimal 3 karakter!' },
                ]}
              >
                <Input
                  placeholder="Masukkan username"
                  className="custom-input-criteria"
                />
              </Form.Item>
              {!editing && (
                <Form.Item
                  name="password"
                  label={<span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '15px' }}>Password</span>}
                  rules={[
                    { required: true, message: 'Silakan masukkan password!' },
                    { min: 6, message: 'Password minimal 6 karakter!' },
                  ]}
                >
                  <Input.Password
                    placeholder="Masukkan password"
                    className="custom-input-criteria"
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label={<span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '15px' }}>Role</span>}
                rules={[{ required: true, message: 'Silakan pilih role!' }]}
              >
                <Select
                  placeholder="Pilih Role"
                  className="custom-select-criteria"
                  dropdownStyle={{
                    borderRadius: '10px',
                    border: '1px solid #1D5EC9',
                  }}
                  options={[
                    { value: 'IT_Admin', label: 'Administrator' },
                    { value: 'Verificator', label: 'Verifikator' },
                    { value: 'Data_Admin', label: 'Petugas Data' },
                  ]}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: editing ? '64px' : '24px' }}>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  style={{
                    backgroundColor: '#1D5EC9',
                    borderColor: '#1D5EC9',
                    height: '42px',
                    borderRadius: '8px',
                    padding: '0 40px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    boxShadow: 'none',
                  }}
                >
                  Simpan
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Form Modal: Reset Password */}
      <Modal
        open={resetModalOpen}
        onCancel={() => {
          setResetModalOpen(false);
          setNewPassword('');
          setResetUserId(null);
        }}
        footer={null}
        closeIcon={true}
        destroyOnClose
        maskClosable={false}
        width={400}
        className="custom-user-modal"
      >
        <Typography.Title
          level={3}
          style={{
            color: '#1D5EC9',
            marginTop: 0,
            marginBottom: '24px',
            fontWeight: 'bold',
            fontSize: '18px',
          }}
        >
          Reset Password
        </Typography.Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input.Password
            placeholder="Masukkan password baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            className="custom-input-criteria"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={handleResetPassword}
              style={{
                backgroundColor: '#1D5EC9',
                borderColor: '#1D5EC9',
                height: '42px',
                borderRadius: '8px',
                padding: '0 32px',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: 'none',
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Custom Pop-up Modal for Status (Processing & Success) similar to KelolaKriteria */}
      {submitStatus !== 'idle' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            width: '380px',
            height: '240px',
            backgroundColor: '#1D5EC9',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            color: '#ffffff',
          }}>
            <div className="status-modal-content">
              {submitStatus === 'submitting' && (
                <>
                  <div className="status-spinner" />
                  <div className="status-text">Diproses...</div>
                </>
              )}
              {submitStatus === 'success' && (
                <>
                  <div className="success-icon-container">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="success-checkmark-svg"
                    >
                      <circle cx="12" cy="12" r="10" className="checkmark-circle-path" />
                      <polyline points="7.5 12.5 10.5 15.5 16.5 8.5" className="checkmark-check-path" />
                    </svg>
                  </div>
                  <div className="status-text">{successText}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
