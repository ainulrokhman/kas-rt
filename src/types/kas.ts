export type JenisKas = 'MASUK' | 'KELUAR';
export type KategoriKas = 'JIMPITAN' | 'OPERASIONAL' | 'SOSIAL' | 'INFRASTRUKTUR' | 'LAINNYA';

export interface KasTransaction {
  id: string;
  jenis: JenisKas;
  kategori: KategoriKas;
  nominal: number;
  tanggal: string; // Format: YYYY-MM-DD
  tanggal_timestamp: number; // Epoch timestamp
  keterangan: string;
  referensi_id?: string; // Untuk mencegah duplikasi (misal: JIMPITAN-2024-05-14)
  petugas_id: string;
  createdAt: number;
}

export interface KasSummary {
  totalMasuk: number;
  totalKeluar: number;
  saldo: number;
}

export interface AnnualReportMonth {
  index: number;
  nama: string;
  pemasukan: number;
  pengeluaran: number;
  jumlah: number;
  saldoAkhir: number;
  ketMasuk: string;
  ketKeluar: string;
}
