import { Button, Dropdown } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { ReportService } from '@/services/report.service';
import { downloadBlob } from '@/utils/helpers';
import { message } from 'antd';

export const ExportButton = () => {
  const handleExcel = async () => {
    try {
      const res = await ReportService.exportExcel();
      downloadBlob(res.data, 'ranking_marcos.xlsx');
      message.success('Excel berhasil diunduh');
    } catch {
      message.error('Gagal mengunduh Excel');
    }
  };

  const handlePdf = async () => {
    try {
      const res = await ReportService.exportPdf();
      downloadBlob(res.data, 'ranking_marcos.pdf');
      message.success('PDF berhasil diunduh');
    } catch {
      message.error('Gagal mengunduh PDF');
    }
  };

  const items = [
    { key: 'excel', icon: <FileExcelOutlined />, label: 'Unduh Excel', onClick: handleExcel },
    { key: 'pdf', icon: <FilePdfOutlined />, label: 'Unduh PDF', onClick: handlePdf },
  ];

  return (
    <Dropdown menu={{ items }}>
      <Button icon={<DownloadOutlined />}>Export</Button>
    </Dropdown>
  );
};