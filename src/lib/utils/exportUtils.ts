import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JimpitanReportRow, JimpitanMonthTarget } from '@/types/jimpitan';

export const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(angka);

export const exportToExcel = (
  reports: JimpitanReportRow[],
  thursdaysDates: string[],
  monthLabel: string
) => {
  // const headers = ['No', 'Nama Warga', ...thursdaysDates, 'Total'];
  
  const data = reports.map((row, index) => {
    const rowData: Record<string, string | number> = {
      'No': index + 1,
      'Nama Warga': row.nama_warga,
    };
    
    thursdaysDates.forEach((_, i) => {
      const weekData = row.status_mingguan.find(s => s.minggu_ke === i + 1);
      rowData[thursdaysDates[i]] = weekData?.nominal_asli_transaksi || 0;
    });
    
    rowData['Total'] = row.total_masuk_bulan_ini;
    return rowData;
  });

  // Calculate totals
  const totalRow: Record<string, string | number> = {
    'No': '',
    'Nama Warga': 'TOTAL',
  };
  
  thursdaysDates.forEach((_, i) => {
    totalRow[thursdaysDates[i]] = reports.reduce((sum, row) => {
      const weekData = row.status_mingguan.find(s => s.minggu_ke === i + 1);
      return sum + (weekData?.nominal_asli_transaksi || 0);
    }, 0);
  });
  
  totalRow['Total'] = reports.reduce((sum, row) => sum + row.total_masuk_bulan_ini, 0);
  data.push(totalRow);

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

  // Adjust column widths
  const wscols = [
    { wch: 5 },
    { wch: 25 },
    ...thursdaysDates.map(() => ({ wch: 15 })),
    { wch: 15 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Laporan_Jimpitan_${monthLabel.replace(' ', '_')}.xlsx`);
};

export const exportToPDF = (
  reports: JimpitanReportRow[],
  thursdaysDates: string[],
  monthLabel: string,
  currentTarget?: JimpitanMonthTarget | null
) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape
  
  // Title
  doc.setFontSize(18);
  doc.text(`LAPORAN JIMPITAN WARGA`, 14, 15);
  doc.setFontSize(12);
  doc.text(`Periode: ${monthLabel}`, 14, 22);

  const tableHeaders = [['No', 'Nama Warga', ...thursdaysDates, 'Total']];
  
  const tableData = reports.map((row, index) => [
    index + 1,
    row.nama_warga,
    ...thursdaysDates.map((_, i) => {
      const weekData = row.status_mingguan.find(s => s.minggu_ke === i + 1);
      const val = weekData?.nominal_asli_transaksi || 0;
      return val > 0 ? formatRupiah(val) : '-';
    }),
    formatRupiah(row.total_masuk_bulan_ini)
  ]);

  // Totals row
  const totals = thursdaysDates.map((_, i) => {
    const sum = reports.reduce((s, row) => {
      const weekData = row.status_mingguan.find(s => s.minggu_ke === i + 1);
      return s + (weekData?.nominal_asli_transaksi || 0);
    }, 0);
    return formatRupiah(sum);
  });
  
  const grandTotal = reports.reduce((s, row) => s + row.total_masuk_bulan_ini, 0);
  
  tableData.push([
    '',
    'TOTAL',
    ...totals,
    formatRupiah(grandTotal)
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [63, 81, 181], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index > 1) {
            data.cell.styles.textColor = [16, 185, 129]; // emerald color for totals
        }
      }
    }
  });

  // Add Lokasi Tahlil if available
  if (currentTarget?.lokasi_tahlil) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text('Lokasi Pertemuan:', 14, lastY);
      
      let currentY = lastY + 5;
      Object.entries(currentTarget.lokasi_tahlil).forEach(([minggu, lokasi]) => {
          if (lokasi) {
              const date = thursdaysDates[parseInt(minggu) - 1] || `Minggu ${minggu}`;
              doc.text(`${date}: ${lokasi}`, 14, currentY);
              currentY += 5;
          }
      });
  }

  doc.save(`Laporan_Jimpitan_${monthLabel.replace(' ', '_')}.pdf`);
};

/**
 * EXPORT KAS TRANSACTIONS
 */

export const exportKasToExcel = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions: Record<string, any>[], 
  title: string
) => {
  const data = transactions.map((tx, index) => ({
    'No': index + 1,
    'Tanggal': tx.tanggal,
    'Jenis': tx.jenis,
    'Kategori': tx.kategori,
    'Keterangan': tx.keterangan,
    'Nominal': tx.nominal,
    'Petugas': tx.petugas_nama || '-',
    'Jabatan': tx.petugas_jabatan || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Log Transaksi");

  const wscols = [
    { wch: 5 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${title.replace(/ /g, '_')}.xlsx`);
};

export const exportKasToPDF = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions: Record<string, any>[],
  title: string,
  summary: { totalMasuk: number; totalKeluar: number; saldo: number }
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(18);
  doc.text(title.toUpperCase(), 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Total Masuk: ${formatRupiah(summary.totalMasuk)}`, 14, 22);
  doc.text(`Total Keluar: ${formatRupiah(summary.totalKeluar)}`, 70, 22);
  doc.text(`Saldo Akhir: ${formatRupiah(summary.saldo)}`, 130, 22);

  const tableHeaders = [['No', 'Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal', 'Petugas']];
  
  const tableData = transactions.map((tx, index) => [
    index + 1,
    tx.tanggal,
    tx.jenis,
    tx.kategori,
    tx.keterangan,
    formatRupiah(tx.nominal),
    `${tx.petugas_nama || '-'} (${tx.petugas_jabatan || '-'})`
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 80 },
      5: { cellWidth: 30 },
    }
  });

  doc.save(`${title.replace(/ /g, '_')}.pdf`);
};
