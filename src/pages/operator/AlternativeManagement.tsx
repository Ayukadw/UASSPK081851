import { useEffect, useState } from 'react';
import { Button, Form, Input, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/forms/FormModal';
import { AlternativeService } from '@/services/alternatives.service';
import type { AlternativePayload } from '@/services/alternatives.service';
import type { Alternative } from '@/types';

export const AlternativeManagement = () => {
  const [data, setData] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Alternative | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    const res = await AlternativeService.getAll();
    setData(res.data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    try {
      const values: AlternativePayload = await form.validateFields();
      if (editing) {
        await AlternativeService.update(editing.id, values);
        message.success('Alternatif diperbarui');
      } else {
        await AlternativeService.create(values);
        message.success('Alternatif ditambahkan');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetch();
    } catch {
      // validation
    }
  };

  const handleDelete = async (id: number) => {
    await AlternativeService.delete(id);
    message.success('Alternatif dihapus');
    fetch();
  };

  const columns = [
    { title: 'Kode', dataIndex: 'code', key: 'code' },
    { title: 'Nama', dataIndex: 'name', key: 'name' },
    { title: 'Deskripsi', dataIndex: 'description', key: 'description' },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: Alternative) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); }} />
          <Popconfirm title="Hapus?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title="Manajemen Alternatif" />
      <DataTable
        title="Daftar Alternatif (Strategi Content Creator)"
        columns={columns}
        dataSource={data}
        loading={loading}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
            Tambah Alternatif
          </Button>
        }
      />

      <FormModal
        open={modalOpen}
        title={editing ? 'Edit Alternatif' : 'Tambah Alternatif'}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        onSubmit={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Kode" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Nama Alternatif" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </FormModal>
    </div>
  );
};