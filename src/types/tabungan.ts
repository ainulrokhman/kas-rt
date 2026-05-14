export type JenisTabunganTx = 'SETOR' | 'TARIK';

export interface TabunganTransaction {
  id: string;
  warga_id: string;
  petugas_id: string;
  jenis: JenisTabunganTx;
  nominal: number;
  tanggal_timestamp: number; // Epoch timestamp
  bulan_tahun: string;       // Format: "YYYY-MM"
  keterangan?: string;
  createdAt: number;
}

export interface TabunganAccount {
  id: string; // Sama dengan warga_id
  warga_id: string;
  nama_lengkap: string;
  saldo: number;
  lastUpdatedAt: number;
}

export interface BulkTabunganInput {
  warga_id: string;
  nama_lengkap: string;
  nominal: number;
}
