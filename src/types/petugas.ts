export type JabatanPetugas =
  | "Ketua RT"
  | "Sekretaris"
  | "Bendahara"
  | "Penarik Jimpitan";

export const JABATAN_OPTIONS: JabatanPetugas[] = [
  "Ketua RT",
  "Sekretaris",
  "Bendahara",
  "Penarik Jimpitan",
];

export interface Petugas {
  id: string;
  warga_id: string; // Relasi ke koleksi warga
  jabatan: JabatanPetugas;
  pin: string; // SHA-256 hash dari 6-digit PIN
  is_active: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Data petugas yang sudah di-join dengan data warga,
 * digunakan untuk tampilan di UI dan session storage.
 */
export interface PetugasWithWarga extends Petugas {
  nama_lengkap: string;
  nomor_hp: string;
}

/**
 * Input untuk membuat petugas baru.
 * PIN akan di-hash sebelum disimpan.
 */
export interface PetugasInput {
  warga_id: string;
  jabatan: JabatanPetugas;
  pin: string; // Plain 6-digit PIN, akan di-hash di service layer
}

/**
 * Kredensial untuk login petugas.
 */
export interface LoginCredentials {
  nomor_hp: string;
  pin: string; // Plain 6-digit PIN dari input user
}

/**
 * Data session yang disimpan di localStorage & cookie setelah login berhasil.
 */
export interface AuthSession {
  petugas_id: string;
  warga_id: string;
  nama_lengkap: string;
  jabatan: JabatanPetugas;
  nomor_hp: string;
  loginAt: number; // epoch timestamp
}
