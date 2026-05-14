import { TabunganRepository } from "../repositories/tabunganRepository";
import { BulkTabunganInput, TabunganAccount, TabunganTransaction } from "@/types/tabungan";
import { LogService } from "./logService";

export class TabunganService {
  /**
   * Mencatat setoran masal
   */
  static async simpanTabunganMasal(
    petugasId: string,
    inputs: BulkTabunganInput[],
    tanggal: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Filter hanya yang nominalnya > 0
      const validInputs = inputs.filter(i => i.nominal > 0);
      
      if (validInputs.length === 0) {
        return { success: false, message: "Tidak ada nominal yang diisi" };
      }

      await TabunganRepository.addBulkSetoran(petugasId, validInputs, tanggal);
      
      // Log audit
      await LogService.addLog(
        petugasId,
        "TABUNGAN",
        `Input tabungan masal untuk ${validInputs.length} warga`
      );

      return { success: true, message: `Berhasil mencatat tabungan untuk ${validInputs.length} warga` };
    } catch (error) {
      console.error("Error simpanTabunganMasal:", error);
      return { success: false, message: "Gagal menyimpan tabungan masal" };
    }
  }

  /**
   * Menarik tabungan secara masal
   */
  static async tarikTabunganMasal(
    petugasId: string,
    inputs: BulkTabunganInput[],
    tanggal: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const validInputs = inputs.filter(i => i.nominal > 0);
      if (validInputs.length === 0) return { success: false, message: "Tidak ada nominal yang diisi" };

      // Validasi saldo untuk setiap warga
      const accounts = await new Promise<TabunganAccount[]>((resolve) => {
        const unsub = TabunganRepository.observeAccounts((data) => {
          unsub();
          resolve(data);
        });
      });

      for (const input of validInputs) {
        const account = accounts.find(a => a.warga_id === input.warga_id);
        const saldo = account?.saldo || 0;
        if (input.nominal > saldo) {
          return { 
            success: false, 
            message: `Saldo ${input.nama_lengkap} tidak mencukupi (Saldo: Rp ${saldo.toLocaleString('id-ID')})` 
          };
        }
      }

      await TabunganRepository.addBulkPenarikan(petugasId, validInputs, tanggal);

      await LogService.addLog(
        petugasId,
        "TABUNGAN",
        `Penarikan tabungan masal untuk ${validInputs.length} warga`
      );

      return { success: true, message: `Berhasil mencairkan tabungan untuk ${validInputs.length} warga` };
    } catch (error) {
      console.error("Error tarikTabunganMasal:", error);
      return { success: false, message: "Gagal mencairkan tabungan masal" };
    }
  }

  /**
   * Menarik tabungan warga
   */
  static async tarikTabungan(
    petugasId: string,
    wargaId: string,
    namaWarga: string,
    nominal: number,
    keterangan: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (nominal <= 0) return { success: false, message: "Nominal harus lebih dari 0" };

      // Cek saldo
      const account = await TabunganRepository.getAccount(wargaId);
      const saldoSekarang = account?.saldo || 0;

      if (nominal > saldoSekarang) {
        return { success: false, message: "Saldo tidak mencukupi" };
      }

      await TabunganRepository.addPenarikan(petugasId, wargaId, namaWarga, nominal, keterangan);

      // Log audit
      await LogService.addLog(
        petugasId,
        "TABUNGAN",
        `Penarikan tabungan warga ${namaWarga} sebesar Rp ${nominal.toLocaleString('id-ID')}`
      );

      return { success: true, message: "Berhasil mencairkan tabungan" };
    } catch (error) {
      console.error("Error tarikTabungan:", error);
      return { success: false, message: "Gagal mencairkan tabungan" };
    }
  }

  /**
   * Monitor daftar akun tabungan
   */
  static observeDaftarTabungan(callback: (data: TabunganAccount[]) => void) {
    return TabunganRepository.observeAccounts(callback);
  }

  /**
   * Ambil riwayat tabungan warga
   */
  static async getRiwayatWarga(wargaId: string): Promise<TabunganTransaction[]> {
    return TabunganRepository.getHistoryByWarga(wargaId);
  }
}
