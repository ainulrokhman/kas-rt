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
    const [y, m] = yearMonth.split("-").map(Number);
    const timestamp = new Date(y, m - 1, 15).getTime(); 

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

  /**
   * Menghasilkan data untuk Laporan Keuangan Tahunan
   */
  static generateAnnualReportData(allTransactions: KasTransaction[], targetYear: number) {
    const startDateOfYear = new Date(targetYear, 0, 1).getTime();
    const endDateOfYear = new Date(targetYear, 11, 31, 23, 59, 59).getTime();

    // 1. Hitung Saldo Awal (Semua transaksi sebelum tahun target)
    const saldoAwal = allTransactions
      .filter(tx => tx.tanggal_timestamp < startDateOfYear)
      .reduce((acc, tx) => tx.jenis === 'MASUK' ? acc + tx.nominal : acc - tx.nominal, 0);

    // 2. Inisialisasi data 12 bulan
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNames = [
        "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
      ];
      return {
        index: i + 1,
        nama: monthNames[i],
        pemasukan: 0,
        pengeluaran: 0,
        jumlah: 0,
        saldoAkhir: 0,
        ketMasuk: new Set<string>(),
        ketKeluar: new Set<string>()
      };
    });

    // 3. Isi data dari transaksi di tahun tersebut
    const txInYear = allTransactions
      .filter(tx => tx.tanggal_timestamp >= startDateOfYear && tx.tanggal_timestamp <= endDateOfYear)
      .sort((a, b) => a.tanggal_timestamp - b.tanggal_timestamp);

    txInYear.forEach(tx => {
      const date = new Date(tx.tanggal_timestamp);
      const mIdx = date.getMonth();
      const month = months[mIdx];

      if (tx.jenis === 'MASUK') {
        month.pemasukan += tx.nominal;
        month.ketMasuk.add(tx.kategori);
      } else {
        month.pengeluaran += tx.nominal;
        if (tx.keterangan) month.ketKeluar.add(tx.keterangan);
      }
    });

    // 4. Hitung Running Balance (Saldo Akhir per bulan)
    let currentBalance = saldoAwal;
    const finalMonths = months.map(m => {
      const jumlah = m.pemasukan - m.pengeluaran;
      currentBalance += jumlah;
      return {
        ...m,
        jumlah,
        saldoAkhir: currentBalance,
        ketMasuk: Array.from(m.ketMasuk).join(", "),
        ketKeluar: Array.from(m.ketKeluar).join(", ")
      };
    });

    // 5. Summary Tahunan
    const totalMasuk = finalMonths.reduce((acc, m) => acc + m.pemasukan, 0);
    const totalKeluar = finalMonths.reduce((acc, m) => acc + m.pengeluaran, 0);

    return {
      saldoAwal,
      months: finalMonths,
      totalMasuk,
      totalKeluar,
      totalJumlah: totalMasuk - totalKeluar,
      saldoAkhir: currentBalance
    };
  }
}
