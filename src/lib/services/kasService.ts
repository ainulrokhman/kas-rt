import { KasRepository } from "../repositories/kasRepository";
import { JimpitanRepository } from "../repositories/jimpitanRepository";
import { KasSummary, KasTransaction } from "@/types/kas";

export class KasService {
  /**
   * Menghitung ringkasan kas (Total Masuk, Total Keluar, Saldo)
   */
  static calculateSummary(transactions: KasTransaction[]): KasSummary {
    let totalMasuk = 0;
    let totalKeluar = 0;

    transactions.forEach((tx) => {
      if (tx.jenis === "MASUK") {
        totalMasuk += tx.nominal;
      } else {
        totalKeluar += tx.nominal;
      }
    });

    return {
      totalMasuk,
      totalKeluar,
      saldo: totalMasuk - totalKeluar,
    };
  }

  /**
   * Mengambil total jimpitan pada minggu tertentu di bulan tertentu
   * @param yearMonth Format YYYY-MM
   * @param mingguKe 1, 2, 3, 4, 5
   */
  static async getJimpitanTotalByWeek(yearMonth: string, mingguKe: number): Promise<number> {
    const [y, m] = yearMonth.split("-").map(Number);
    
    // Cari tanggal-tanggal Kamis di bulan tersebut
    const thursdays: number[] = [];
    const dateC = new Date(y, m - 1, 1);
    while (dateC.getMonth() === m - 1) {
      if (dateC.getDay() === 4) thursdays.push(dateC.getDate());
      dateC.setDate(dateC.getDate() + 1);
    }

    if (mingguKe > thursdays.length && mingguKe !== 1) return 0;

    // Tentukan rentang hari
    const dateStart = mingguKe === 1 ? 1 : thursdays[mingguKe - 2] + 1;
    // Jika minggu terakhir, ambil sampai akhir bulan (kita pakai 31 saja aman untuk getTime)
    const dateEnd = mingguKe >= thursdays.length ? 31 : thursdays[mingguKe - 1];

    const startTs = new Date(y, m - 1, dateStart, 0, 0, 0).getTime();
    const endTs = new Date(y, m - 1, dateEnd, 23, 59, 59).getTime();

    const jimpitanTxs = await JimpitanRepository.getTransactionsByDateBound(startTs, endTs);
    
    // Filter lagi untuk memastikan hanya transaksi di bulan_tahun yang sama 
    // (karena DateBound bisa nyerempet bulan sebelah jika rentang harinya tidak pas)
    return jimpitanTxs
      .filter(tx => tx.bulan_tahun === yearMonth)
      .reduce((sum, tx) => sum + tx.nominal, 0);
  }

  /**
   * Melakukan sinkronisasi jimpitan mingguan ke kas masuk
   */
  static async syncJimpitanWeeklyToKas(yearMonth: string, mingguKe: number, petugasId: string): Promise<{ success: boolean; message: string }> {
    const referensiId = `JIMPITAN-${yearMonth}-M${mingguKe}`;

    // 1. Cek apakah sudah pernah di-sync
    const exists = await KasRepository.isReferenceExists(referensiId);
    if (exists) {
      return { success: false, message: `Data jimpitan ${yearMonth} Minggu ke-${mingguKe} sudah pernah dimasukkan.` };
    }

    // 2. Hitung total jimpitan
    const total = await this.getJimpitanTotalByWeek(yearMonth, mingguKe);
    if (total <= 0) {
      return { success: false, message: "Tidak ada transaksi jimpitan pada periode minggu tersebut." };
    }

    // 3. Simpan ke kas_transactions
    // Gunakan tanggal tengah bulan atau tanggal Kamis bersangkutan sebagai representasi
    const [y, m] = yearMonth.split("-").map(Number);
    const timestamp = new Date(y, m - 1, 15).getTime(); // Gunakan tengah bulan untuk sorting bulan yang sama

    await KasRepository.addTransaction({
      jenis: "MASUK",
      kategori: "JIMPITAN",
      nominal: total,
      tanggal: `${yearMonth} (M${mingguKe})`,
      tanggal_timestamp: timestamp,
      keterangan: `Pemasukan Jimpitan ${yearMonth} Minggu ke-${mingguKe}`,
      referensi_id: referensiId,
      petugas_id: petugasId,
    });

    return { success: true, message: `Berhasil sinkronisasi Rp ${new Intl.NumberFormat("id-ID").format(total)}` };
  }
}
