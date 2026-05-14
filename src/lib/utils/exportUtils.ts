import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JimpitanReportRow, JimpitanMonthTarget } from '@/types/jimpitan';
import { AnnualReportMonth } from '@/types/kas';

// Extend jsPDF type to include lastAutoTable from jspdf-autotable
interface jsPDFWithPlugin extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

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
      const lastY = (doc as jsPDFWithPlugin).lastAutoTable.finalY + 10;
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
  transactions: Array<Record<string, unknown> & { 
    tanggal: string; 
    jenis: string; 
    kategori: string; 
    keterangan: string; 
    nominal: number; 
    petugas_nama?: string; 
    petugas_jabatan?: string;
  }>, 
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
  transactions: Array<Record<string, unknown> & { 
    tanggal: string; 
    jenis: string; 
    kategori: string; 
    keterangan: string; 
    nominal: number; 
    petugas_nama?: string; 
    petugas_jabatan?: string;
  }>,
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

/**
 * EXPORT ANNUAL FINANCIAL REPORT
 */

export const exportLaporanTahunanToExcel = (
  data: {
    year: number;
    saldoAwal: number;
    months: AnnualReportMonth[];
    totalMasuk: number;
    totalKeluar: number;
    totalJumlah: number;
    saldoAkhir: number;
  },
  pengurus: { ketua: string; sekretaris: string; bendahara: string }
) => {
  const excelData = data.months.map(m => ({
    'NO': m.index,
    'Bulan': m.nama,
    'PEMASUKAN': m.pemasukan,
    'PENGELUARAN': m.pengeluaran,
    'JUMLAH': m.jumlah,
    'SALDO AKHIR': m.saldoAkhir,
    'KET. MASUK': m.ketMasuk,
    'KET. KELUAR': m.ketKeluar
  }));

  const worksheet = XLSX.utils.aoa_to_sheet([]);
  XLSX.utils.sheet_add_json(worksheet, excelData, { origin: "A4" });

  // Add Headers
  XLSX.utils.sheet_add_aoa(worksheet, [
    [`LAPORAN PEMASUKAN DAN PENGELUARAN KAS TAHUN ${data.year}`],
    ["", "", "", "", "", "", "", ""],
    [`TAHUN : ${data.year}`, "", "", "", "", `SALDO AWAL: ${formatRupiah(data.saldoAwal)}`, "KETERANGAN", ""]
  ], { origin: "A1" });

  // Add Totals Row
  const lastRowIdx = excelData.length + 5;
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["SALDO AKHIR KAS", "", data.totalMasuk, data.totalKeluar, data.totalJumlah, data.saldoAkhir, "", ""]
  ], { origin: `A${lastRowIdx}` });

  // Add Signatures
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["", ""],
    ["", ""],
    ["KETUA RT", "", "SEKRETARIS", "", "BENDAHARA"],
    ["", ""],
    ["", ""],
    [pengurus.ketua, "", pengurus.sekretaris, "", pengurus.bendahara]
  ], { origin: `A${lastRowIdx + 3}` });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Tahunan");

  XLSX.writeFile(workbook, `Laporan_Tahunan_${data.year}.xlsx`);
};

export const exportLaporanTahunanToPDF = (
  data: {
    year: number;
    saldoAwal: number;
    months: AnnualReportMonth[];
    totalMasuk: number;
    totalKeluar: number;
    totalJumlah: number;
    saldoAkhir: number;
  },
  pengurus: { ketua: string; sekretaris: string; bendahara: string }
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`LAPORAN PEMASUKAN DAN PENGELUARAN KAS`, 148, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`PERIODE JANUARI - DESEMBER TAHUN ${data.year}`, 148, 22, { align: 'center' });

  const formatPdfRupiah = (val: number) => val === 0 ? 'Rp -' : `Rp ${formatRupiah(val)}`;

  // Multi-row Header Structure to match design
  const tableHeaders = [
    [
      { content: 'NO', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: 'Bulan', rowSpan: 2, styles: { valign: 'middle' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: `TAHUN : ${data.year}`, colSpan: 3, styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: 'SALDO AWAL', styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: 'KETERANGAN', colSpan: 2, styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } }
    ],
    [
      { content: 'PEMASUKAN', styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: 'PENGELUARAN', styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: 'JUMLAH', styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: formatPdfRupiah(data.saldoAwal), styles: { halign: 'right' as const, fillColor: [255, 255, 200] as [number, number, number] } },
      { content: 'PEMASUKAN', styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } },
      { content: 'PENGELUARAN', styles: { halign: 'center' as const, fillColor: [240, 240, 240] as [number, number, number] } }
    ]
  ];
  
  const tableData: (string | number | object)[][] = data.months.map(m => [
    m.index,
    m.nama,
    formatPdfRupiah(m.pemasukan),
    formatPdfRupiah(m.pengeluaran),
    formatPdfRupiah(m.jumlah),
    formatPdfRupiah(m.saldoAkhir),
    m.ketMasuk || '-',
    m.ketKeluar || '-'
  ]);

  // Add Summary Row
  tableData.push([
    { content: 'SALDO AKHIR KAS', colSpan: 2, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
    formatPdfRupiah(data.totalMasuk),
    formatPdfRupiah(data.totalKeluar),
    formatPdfRupiah(data.totalJumlah),
    formatPdfRupiah(data.saldoAkhir),
    '',
    ''
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] as [number, number, number] },
    headStyles: { textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold' as const, lineWidth: 0.1, lineColor: [150, 150, 150] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' as const },
      1: { cellWidth: 25, fontStyle: 'bold' as const },
      2: { cellWidth: 32, halign: 'right' as const },
      3: { cellWidth: 32, halign: 'right' as const },
      4: { cellWidth: 32, halign: 'right' as const },
      5: { cellWidth: 35, halign: 'right' as const },
      6: { cellWidth: 35 },
      7: { cellWidth: 70 },
    },
    didParseCell: (d) => {
      // Style Summary Row
      if (d.row.index === tableData.length - 1) {
        d.cell.styles.fontStyle = 'bold' as const;
        if (d.column.index >= 1 && d.column.index <= 4) d.cell.styles.fillColor = [210, 255, 210] as [number, number, number]; // Light Green
        if (d.column.index === 5) {
          d.cell.styles.fillColor = [255, 210, 210] as [number, number, number]; // Light Red
          d.cell.styles.textColor = [180, 0, 0] as [number, number, number]; // Dark Red text
        }
      }
    }
  });

  const finalY = (doc as jsPDFWithPlugin).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const colW = pageWidth / 3;

  doc.text("KETUA RT", colW * 0.5, finalY, { align: 'center' });
  doc.text("SEKRETARIS", colW * 1.5, finalY, { align: 'center' });
  doc.text("BENDAHARA", colW * 2.5, finalY, { align: 'center' });

  doc.setFont("helvetica", "normal");
  doc.text(pengurus.ketua, colW * 0.5, finalY + 25, { align: 'center' });
  doc.text(pengurus.sekretaris, colW * 1.5, finalY + 25, { align: 'center' });
  doc.text(pengurus.bendahara, colW * 2.5, finalY + 25, { align: 'center' });

  doc.save(`Laporan_Tahunan_${data.year}.pdf`);
};
