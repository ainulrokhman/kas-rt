import { PetugasRepository } from "@/lib/repositories/petugasRepository";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { AuthService } from "@/lib/services/authService";
import { JabatanPetugas, PetugasWithWarga } from "@/types/petugas";

export class PetugasService {
  /**
   * Mengambil semua data petugas yang sudah di-join dengan data warga.
   */
  static async getAll(): Promise<PetugasWithWarga[]> {
    const [petugasList, wargaList] = await Promise.all([
      PetugasRepository.getAll(),
      WargaRepository.getAll(),
    ]);

    // Buat Map warga untuk lookup O(1)
    const wargaMap = new Map(wargaList.map((w) => [w.id, w]));

    // Join data petugas dengan warga (in-memory)
    return petugasList
      .map((p) => {
        const warga = wargaMap.get(p.warga_id);
        if (!warga) return null;
        return {
          ...p,
          nama_lengkap: warga.nama_lengkap,
          nomor_hp: warga.nomor_hp,
        } as PetugasWithWarga;
      })
      .filter((p): p is PetugasWithWarga => p !== null);
  }

  /**
   * Membuat petugas baru.
   * Validasi: warga_id belum terdaftar sebagai petugas lain.
   * PIN di-hash SHA-256 sebelum disimpan.
   */
  static async create(
    wargaId: string,
    jabatan: JabatanPetugas,
    pin: string
  ): Promise<string> {
    // Cek apakah warga sudah jadi petugas
    const existing = await PetugasRepository.findByWargaId(wargaId);
    if (existing) {
      throw new Error("Warga ini sudah terdaftar sebagai petugas.");
    }

    // Validasi PIN 6 digit
    if (!/^\d{6}$/.test(pin)) {
      throw new Error("PIN harus berupa 6 digit angka.");
    }

    // Hash PIN sebelum disimpan
    const hashedPin = await AuthService.hashPin(pin);

    return await PetugasRepository.create({
      warga_id: wargaId,
      jabatan,
      pin: hashedPin,
    });
  }

  /**
   * Mengubah jabatan petugas.
   */
  static async updateJabatan(id: string, jabatan: JabatanPetugas): Promise<void> {
    await PetugasRepository.updateJabatan(id, jabatan);
  }

  /**
   * Mereset PIN petugas dengan PIN baru (6 digit).
   * PIN baru akan di-hash SHA-256 sebelum disimpan.
   */
  static async resetPin(id: string, pinBaru: string): Promise<void> {
    if (!/^\d{6}$/.test(pinBaru)) {
      throw new Error("PIN harus berupa 6 digit angka.");
    }
    const hashedPin = await AuthService.hashPin(pinBaru);
    await PetugasRepository.resetPin(id, hashedPin);
  }

  /**
   * Mengaktifkan atau menonaktifkan akun petugas.
   */
  static async toggleActive(id: string, isActive: boolean): Promise<void> {
    await PetugasRepository.setActive(id, isActive);
  }
}
