import { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Space, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/forms/FormModal';
import { CriteriaService } from '@/services/criteria.service';
import type { CriteriaPayload } from '@/services/criteria.service';
import type { Criteria } from '@/types';

export const CriteriaManagement = () => {
  const [data, setData] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Criteria | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    const res = await CriteriaService.getAll();
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    try {
      const values: CriteriaPayload = await form.validateFields();
      if (editing) {
        await CriteriaService.update(editing.id, values);
        message.success('Kriteria diperbarui');
      } else {
        await CriteriaService.create(values);
        message.success('Kriteria ditambahkan');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetch();
    } catch (error: any) {
      // Tangkap pesan API jika error berasal dari server (bukan dari validasi form kosong)
      if (error.response) {
        const errorMessage = error.response.data?.detail || 'Terjadi kesalahan saat menyimpan kriteria.';
        message.error(errorMessage);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await CriteriaService.delete(id);
      message.success('Kriteria dihapus');
      fetch();
    } catch (error: any) {
      // Tangkap penolakan 400 dari backend jika kriteria tidak bisa dihapus
      const errorMessage = error.response?.data?.detail || 'Gagal menghapus kriteria.';
      message.error(errorMessage);
    }
  };

  const columns = [
    { title: 'Kode', dataIndex: 'code', key: 'code' },
    { title: 'Nama', dataIndex: 'name', key: 'name' },
    {
      title: 'Tipe',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag color={t === 'Benefit' ? 'green' : 'red'}>{t}</Tag>,
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: Criteria) => (
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
      <PageTitle title="Manajemen Kriteria" />
      <DataTable
        title="Daftar Kriteria"
        columns={columns}
        dataSource={data}
        loading={loading}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
            Tambah Kriteria
          </Button>
        }
      />

      <FormModal
        open={modalOpen}
        title={editing ? 'Edit Kriteria' : 'Tambah Kriteria'}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        onSubmit={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Kode" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Nama Kriteria" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Tipe" rules={[{ required: true }]}>
            <Select options={[{ value: 'Benefit', label: 'Benefit' }, { value: 'Cost', label: 'Cost' }]} />
          </Form.Item>
        </Form>
      </FormModal>
    </div>
  );
};