import { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Space, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/forms/FormModal';
import { RoleTag } from '@/components/common/RoleTag';
import { StatusTag } from '@/components/common/StatusTag';
import { confirmDelete } from '@/components/common/ConfirmDialog';
import { UserService } from '@/services/user.service';
import type { UserPayload } from '@/services/user.service';
import type { User, UserRole } from '@/types';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [resetModal, setResetModal] = useState(false);
  const [resetId, setResetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetch = async () => {
    setLoading(true);
    const res = await UserService.getAll();
    setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleSubmit = async () => {
    try {
      const values: UserPayload = await form.validateFields();
      if (editing) {
        await UserService.update(editing.id, values);
        message.success('User diperbarui');
      } else {
        await UserService.create(values);
        message.success('User ditambahkan');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetch();
    } catch {
      // validation handled by form
    }
  };

  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        await UserService.delete(id);
        message.success('User dihapus');
        fetch();
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || 'Gagal menghapus! User ini masih memiliki relasi data.';
        message.error(errorMessage);
      }
    });
};

  const handleReset = async () => {
    if (!resetId || !newPassword) return;
    await UserService.resetPassword(resetId, newPassword);
    message.success('Password direset');
    setResetModal(false);
    setNewPassword('');
    setResetId(null);
  };

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (r: UserRole) => <RoleTag role={r} />,
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
          />
          <Button
            icon={<KeyOutlined />}
            onClick={() => {
              setResetId(record.id);
              setResetModal(true);
            }}
          />
          <Popconfirm title="Hapus user?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title="Manajemen User" />
      <DataTable
        title="Daftar User"
        columns={columns}
        dataSource={users}
        loading={loading}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
            Tambah User
          </Button>
        }
      />

      <FormModal
        open={modalOpen}
        title={editing ? 'Edit User' : 'Tambah User'}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        onSubmit={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={[
              { value: 'IT_Admin', label: 'IT Admin' },
              { value: 'Verificator', label: 'Verifikator' },
              { value: 'Data_Admin', label: 'Data Admin' },
            ]} />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </FormModal>

      <FormModal
        open={resetModal}
        title="Reset Password"
        onCancel={() => { setResetModal(false); setNewPassword(''); setResetId(null); }}
        onSubmit={handleReset}
        okText="Reset"
      >
        <Input.Password
          placeholder="Password baru"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
        />
      </FormModal>
    </div>
  );
};