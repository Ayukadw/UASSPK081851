import { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Popconfirm, Tag, message, Table, Typography, Modal, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { CriteriaService } from '@/services/criteria.service';
import type { CriteriaPayload } from '@/services/criteria.service';
import type { Criteria } from '@/types';

const { Title } = Typography;

interface ChipSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const ChipSelector = ({ value, onChange }: ChipSelectorProps) => {
  const options = ['Rp', 'Jam', '%', 'Likert', 'Jumlah'];
  
  return (
    <div className="chip-container">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`chip-btn ${value === opt ? 'selected' : ''}`}
          onClick={() => onChange?.(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export const KelolaKriteria = () => {
  const [data, setData] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Criteria | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [successText, setSuccessText] = useState('Berhasil Disimpan');
  const [form] = Form.useForm();

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const res = await CriteriaService.getAll();
      setData(res.data);
    } catch (error) {
      message.error('Gagal memuat data kriteria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleSubmit = async () => {
    try {
      const values: CriteriaPayload = await form.validateFields();
      
      // Close form modal and show submitting state
      setModalOpen(false);
      setSuccessText(editing ? 'Berhasil Diperbarui' : 'Berhasil Disimpan');
      setSubmitStatus('submitting');
      
      const apiPromise = editing ? CriteriaService.update(editing.id, values) : CriteriaService.create(values);
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
      fetchCriteria();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error, do not close or reopen anything
        return;
      }
      
      setSubmitStatus('idle');
      setModalOpen(true);
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || 'Terjadi kesalahan saat menyimpan kriteria.';
        message.error(errorMessage);
      } else {
        message.error('Terjadi kesalahan saat menyimpan kriteria.');
      }
    } finally {
      setSubmitStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setSuccessText('Berhasil Dihapus');
      setSubmitStatus('submitting');
      
      const apiPromise = CriteriaService.delete(id);
      await Promise.all([
        apiPromise,
        new Promise((resolve) => setTimeout(resolve, 800))
      ]);
      
      setSubmitStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1800));
      fetchCriteria();
    } catch (error: any) {
      setSubmitStatus('idle');
      const errorMessage = error.response?.data?.detail || 'Gagal menghapus kriteria.';
      message.error(errorMessage);
    } finally {
      setSubmitStatus((prev) => (prev === 'success' ? 'idle' : prev));
    }
  };

  const columns = [
    {
      title: 'Kode',
      dataIndex: 'code',
      key: 'code',
      width: '15%',
    },
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: 'Satuan',
      dataIndex: 'unit',
      key: 'unit',
      width: '15%',
      render: (unit: string) => (
        unit ? (
          <Tag color="blue" style={{ fontWeight: 'bold' }}>
            {unit}
          </Tag>
        ) : (
          '-'
        )
      ),
    },
    {
      title: 'Tipe',
      dataIndex: 'type',
      key: 'type',
      width: '20%',
      render: (t: string) => (
        <Tag color={t === 'Benefit' ? 'green' : 'red'} style={{ fontWeight: 'bold' }}>
          {t}
        </Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: '15%',
      render: (_: any, record: Criteria) => (
        <div className="admin-action-buttons-cell">
          <button
            className="admin-action-btn-blue"
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
            title="Edit Kriteria"
          >
            <EditOutlined />
          </button>
          <Popconfirm
            title="Hapus kriteria?"
            description="Apakah Anda yakin ingin menghapus kriteria ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <button className="admin-action-btn-blue" title="Hapus Kriteria">
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
        MANAJEMEN KRITERIA
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
        Tambah Kriteria Baru
      </Button>

      <Table
        className="custom-admin-table"
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

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
        className="custom-criteria-modal"
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
          {editing ? 'Edit Kriteria' : 'Tambahkan Kriteria Baru'}
        </Typography.Title>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={<span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '15px' }}>Code</span>}
                rules={[{ required: true, message: 'Silakan masukkan kode kriteria!' }]}
              >
                <Input
                  placeholder="Contoh: C1"
                  className="custom-input-criteria"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={<span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '15px' }}>Nama Kriteria</span>}
                rules={[{ required: true, message: 'Silakan masukkan nama kriteria!' }]}
              >
                <Input
                  placeholder="Contoh: Kualitas Layanan"
                  className="custom-input-criteria"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="unit"
                label={<span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '15px' }}>Satuan:</span>}
                rules={[{ required: true, message: 'Silakan pilih satuan kriteria!' }]}
              >
                <ChipSelector />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label={<span style={{ color: '#1D5EC9', fontWeight: 'bold', fontSize: '15px' }}>Tipe</span>}
                rules={[{ required: true, message: 'Silakan pilih tipe kriteria!' }]}
              >
                <Select
                  placeholder="Pilih Tipe"
                  className="custom-select-criteria"
                  dropdownStyle={{
                    borderRadius: '10px',
                    border: '1px solid #1D5EC9',
                  }}
                  options={[
                    { value: 'Benefit', label: 'Benefit' },
                    { value: 'Cost', label: 'Cost' },
                  ]}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
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

      {/* Custom Pop-up Modal for Status (Processing & Success) similar to PembobotanKriteria */}
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
