export interface JimpitanGlobalSetting {
  id: string; // Akan disimpan dengan doc ID: 'config' di collection settings
  nominal_default: number;
}

export interface JimpitanMonthTarget {
  id: string; // Format: "YYYY-MM" contoh: "2026-04"
  nominal_mingguan: number;
  total_kamis: number; 
  lokasi_tahlil?: Record<number, string>; // Mapping minggu_ke -> lokasi
  createdAt: number;
}

export interface JimpitanTransaction {
  id: string;
  warga_id: string;
  petugas_id: string;   
  nominal: number;
  tanggal_bayar: number; // epoch timestamp
  bulan_tahun: string;   // format: "2026-04" untuk kemudahan query
  createdAt: number;
}

export interface JimpitanWeeklyStatus {
  minggu_ke: number;
  status: 'LUNAS' | 'PARSIAL' | 'BELUM';
  terbayar: number; // Berapa uang yang sudah teralokasi di minggu ini
  target: number; // Berapa target nominal di minggu ini
  nominal_asli_transaksi?: number; // Uang aktual di sistem yang dibayar warga pada minggu/tanggal ini
}

export interface JimpitanReportRow {
  warga_id: string;
  nama_warga: string;
  total_masuk_bulan_ini: number;
  status_mingguan: JimpitanWeeklyStatus[];
  saldo_akhir: number; // Saldo yang tersisa setelah menutupi minggu yang ada
}
