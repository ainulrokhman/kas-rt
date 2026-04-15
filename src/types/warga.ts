export type JenisKelamin = "L" | "P";

export interface Warga {
  id: string;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  nomor_hp: string;
  createdAt?: number; // Menggunakan epoch/number agar lebih mudah dikelola
  updatedAt?: number;
}

export interface WargaInput {
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  nomor_hp: string;
}
