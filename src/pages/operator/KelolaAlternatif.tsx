import { useEffect, useState } from 'react';
import { Button, Table, Popconfirm, message, Modal, Form, Input, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { AlternativeService } from '@/services/alternatives.service';
import type { Alternative } from '@/types';

const { Title } = Typography;

export const KelolaAlternatif = () => {
  const [data, setData] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Alternative | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [successText, setSuccessText] = useState('Berhasil Disimpan');
  const [form] = Form.useForm();

  const fetchAlternatives = async () => {
    setLoading(true);
    try {
      const res = await AlternativeService.getAll();
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Gagal mengambil data alternatif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlternatives();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setModalOpen(false);
      setSuccessText(editing ? 'Berhasil Diperbarui' : 'Berhasil Disimpan');
      setSaveStatus('processing');
      
      const apiPromise = editing ? AlternativeService.update(editing.id, values) : AlternativeService.create(values);
      await Promise.all([
        apiPromise,
        new Promise((resolve) => setTimeout(resolve, 800))
      ]);
      
      setSaveStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1800));
      
      setEditing(null);
      form.resetFields();
      fetchAlternatives();
    } catch (err: any) {
      if (err.errorFields) return;
      console.error(err);
      setSaveStatus('idle');
      message.error('Gagal menyimpan alternatif.');
    } finally {
      setSaveStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setSuccessText('Berhasil Dihapus');
      setSaveStatus('processing');
      
      const apiPromise = AlternativeService.delete(id);
      await Promise.all([
        apiPromise,
        new Promise((resolve) => setTimeout(resolve, 800))
      ]);
      
      setSaveStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1800));
      fetchAlternatives();
    } catch (err) {
      console.error(err);
      setSaveStatus('idle');
      message.error('Gagal menghapus alternatif.');
    } finally {
      setSaveStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  const columns = [
    {
      title: 'Kode',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text: string) => (
        <span style={{ fontWeight: 'bold', color: '#1D5EC9', fontSize: '15px' }}>{text}</span>
      ),
    },
    {
      title: 'Nama Kriteria', // Mengikuti label kolom mockup secara literal
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span style={{ fontWeight: '600', color: '#1D5EC9', fontSize: '15px' }}>{text}</span>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      align: 'center' as const,
      width: 180,
      render: (_: any, record: Alternative) => (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {/* Edit Button */}
          <Button
            type="primary"
            icon={<EditOutlined style={{ fontSize: '16px', color: '#ffffff' }} />}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
            style={{
              backgroundColor: '#1D5EC9',
              borderColor: '#1D5EC9',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          {/* Delete Button */}
          <Popconfirm
            title="Apakah Anda yakin ingin menghapus alternatif ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined style={{ fontSize: '16px', color: '#ffffff' }} />}
              style={{
                backgroundColor: '#1D5EC9', // Sesuai mockup tombol hapus juga berwarna biru
                borderColor: '#1D5EC9',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4px 0' }}>
      <style>{`
        /* Custom Styles for Alternative Management Table */
        .alternative-mgmt-table .ant-table {
          background: #ffffff !important;
          border: 1.5px solid #adc6ff !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .alternative-mgmt-table .ant-table-thead > tr > th {
          background-color: #1D5EC9 !important;
          color: #ffffff !important;
          font-weight: bold !important;
          font-size: 15px !important;
          text-align: center !important;
          border-right: 1.5px solid #adc6ff !important;
          border-bottom: 1.5px solid #adc6ff !important;
        }
        /* Make last header item center (Aksi) and first/second matching mockup alignment */
        .alternative-mgmt-table .ant-table-thead > tr > th:nth-child(1),
        .alternative-mgmt-table .ant-table-thead > tr > th:nth-child(2) {
          text-align: left !important;
          padding-left: 32px !important;
        }
        .alternative-mgmt-table .ant-table-tbody > tr > td {
          background-color: #e6f0ff !important;
          border-right: 1.5px solid #adc6ff !important;
          border-bottom: 1.5px solid #adc6ff !important;
          padding: 14px 32px !important;
        }
        .alternative-mgmt-table .ant-table-row {
          background-color: #e6f0ff !important;
        }
        .alternative-mgmt-table .ant-table-row:hover > td {
          background-color: #dbe7ff !important;
        }
        
        /* Modal Input styles matching theme */
        .mgmt-modal-input {
          border-radius: 8px !important;
          border: 1.5px solid #adc6ff !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
        }
        .mgmt-modal-input:focus, .mgmt-modal-input:hover {
          border-color: #1D5EC9 !important;
          box-shadow: 0 0 0 2px rgba(29, 94, 201, 0.1) !important;
        }
      `}</style>

      {/* Title */}
      <Title level={2} style={{ color: '#1D5EC9', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '16px' }}>
        MANAJEMEN ALTERNATIF
      </Title>

      {/* Add Button */}
      <div style={{ marginBottom: '20px' }}>
        <Button
          type="default"
          icon={<PlusOutlined style={{ fontSize: '14px', fontWeight: 'bold' }} />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setModalOpen(true);
          }}
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#1D5EC9',
            color: '#1D5EC9',
            borderRadius: '8px',
            height: '42px',
            padding: '0 20px',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(29, 94, 201, 0.05)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e6f0ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          Tambah Alternatif Baru
        </Button>
      </div>

      {/* Table Section */}
      <div style={{ marginBottom: '20px' }}>
        <Table
          columns={columns}
          dataSource={data.map((item) => ({ ...item, key: item.id }))}
          pagination={false}
          className="alternative-mgmt-table"
          bordered
          loading={loading}
          size="middle"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        title={
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1D5EC9' }}>
            {editing ? 'Edit Alternatif' : 'Tambah Alternatif Baru'}
          </span>
        }
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={saveStatus === 'processing'}
        okText="Simpan"
        cancelText="Batal"
        okButtonProps={{
          style: {
            backgroundColor: '#1D5EC9',
            borderColor: '#1D5EC9',
            borderRadius: '6px',
            fontWeight: 'bold',
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '6px',
          },
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item
            name="code"
            label={<span style={{ fontWeight: '600', color: '#1D5EC9' }}>Kode Alternatif</span>}
            rules={[{ required: true, message: 'Kode alternatif wajib diisi!' }]}
          >
            <Input placeholder="Contoh: A1" className="mgmt-modal-input" />
          </Form.Item>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: '600', color: '#1D5EC9' }}>Nama Alternatif</span>}
            rules={[{ required: true, message: 'Nama alternatif wajib diisi!' }]}
          >
            <Input placeholder="Masukkan nama alternatif" className="mgmt-modal-input" />
          </Form.Item>
          <Form.Item
            name="description"
            label={<span style={{ fontWeight: '600', color: '#1D5EC9' }}>Deskripsi (Opsional)</span>}
          >
            <Input.TextArea placeholder="Masukkan deskripsi singkat..." rows={3} className="mgmt-modal-input" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Custom Pop-up Modal for Status (Processing & Success) similar to PembobotanKriteria */}
      {saveStatus !== 'idle' && (
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
              {saveStatus === 'processing' && (
                <>
                  <div className="status-spinner" />
                  <div className="status-text">Diproses...</div>
                </>
              )}
              {saveStatus === 'success' && (
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
