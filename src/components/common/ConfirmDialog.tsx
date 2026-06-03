import { Modal } from 'antd';

export const confirmDelete = (onOk: () => void, title = 'Yakin ingin menghapus data ini?') => {
  Modal.confirm({
    title,
    content: 'Data yang dihapus tidak dapat dikembalikan.',
    okText: 'Hapus',
    okType: 'danger',
    cancelText: 'Batal',
    onOk,
  });
};