import { JimpitanRepository } from '@/lib/repositories/jimpitanRepository';
import { WargaRepository } from '@/lib/repositories/wargaRepository';
import { JimpitanReportRow, JimpitanWeeklyStatus } from '@/types/jimpitan';

export class JimpitanService {
  /**
   * Men-generate laporan bulanan Jimpitan 
   * @param targetYearMonth format "YYYY-MM"
   */
  static async getLaporanBulanan(targetYearMonth: string): Promise<{ reports: JimpitanReportRow[], currentTarget: any }> {
    // 1. Dapatkan daftar warga
    const wargasList = await WargaRepository.getAll();
    
    // 2. Akses target bulan ini (otomatis dilock jika belum ada)
    const currentMonthTarget = await JimpitanRepository.getMonthTarget(targetYearMonth, true);
    if (!currentMonthTarget) throw new Error("Gagal mengambil/membuat target bulan ini");

    // 3. Dapatkan semua target hingga bulan ini untuk perhitungan potongan saldo
    const targets = await JimpitanRepository.getAllTargetsUpToMonth(targetYearMonth);
    // Buat map target untuk kemudahan pembacaan
    const targetMap = new Map<string, typeof currentMonthTarget>();
    targets.forEach(t => targetMap.set(t.id, t));

    // 4. Dapatkan semua transaksi uang masuk hingga bulan ini
    const transactions = await JimpitanRepository.getTransactionsUpToMonth(targetYearMonth);

    // 5. Kita butuh mencari 'Kapan arisan/jimpitan ini dimulai' agar kita tahu sejak kapan membebankan tagihan.
    // Asumsi: Jimpitan dimulai dari bulan transaksi paling awal di sistem, ATAU kalau kosong, ya bulan ini.
    let startYearMonth = targetYearMonth;
    if (transactions.length > 0) {
      startYearMonth = transactions.reduce((min, t) => t.bulan_tahun < min ? t.bulan_tahun : min, transactions[0].bulan_tahun);
    }

    // Bangun daftar semua bulan dari startYearMonth sampai targetYearMonth
    const allMonthsRange = this.getMonthsRange(startYearMonth, targetYearMonth);

    // Pastikan semua bulan di range punya target definition. Jika blm ada di database, kita anggap pakai global setting.
    // (Biar logicnya ga bocor)
    const globalSetting = await JimpitanRepository.getGlobalSetting();
    const finalTargets = allMonthsRange.map(ym => {
        if (targetMap.has(ym)) return targetMap.get(ym)!;
        return {
            id: ym,
            nominal_mingguan: globalSetting.nominal_default,
            total_kamis: this.countThursdays(ym),
            createdAt: 0
        };
    });

    const reports: JimpitanReportRow[] = [];

    // 6. Kalkulasi per warga
    for (const warga of wargasList) {
      // 6a. Kumpulkan semua transaksi milik warga ini
      const wargaTxs = transactions.filter(t => t.warga_id === warga.id);
      
      // Total uang masuk SEPANJANG MASA
      const totalUangMasuk = wargaTxs.reduce((sum, tx) => sum + tx.nominal, 0);
      
      // Uang masuk KHUSUS bulan tersebut (hanya untuk info di UI)
      const uangMasukBulanIni = wargaTxs
        .filter(t => t.bulan_tahun === targetYearMonth)
        .reduce((sum, tx) => sum + tx.nominal, 0);

      // 6b. Berapa tagihan masa lalu? (Semua bulan sebelum targetYearMonth)
      let totalTagihanLalu = 0;
      for (const t of finalTargets) {
          if (t.id < targetYearMonth) {
              totalTagihanLalu += (t.nominal_mingguan * t.total_kamis);
          }
      }

      // 6c. Saldo yang bisa dipakai untuk bulan ini
      // Saldo = Total Kas Masuk - Total Tagihan Masa Lalu
      let saldoTersediaBulanIni = totalUangMasuk - totalTagihanLalu;

      // Jika saldoTersediaBulanIni negatif, artinya dia punya tunggakan dari bulan sebelumnya.
      // Jika positif, kita alokasikan ke minggu-minggu di bulan ini.

      // 6d. Alokasi ke minggu-minggu di targetYearMonth
      const weeklyStatuses: JimpitanWeeklyStatus[] = [];
      const nominalPerMinggu = currentMonthTarget.nominal_mingguan;
      
      // Catatan: Walaupun punya tunggakan lama (saldo negatif),
      // untuk Laporan Bulan Ini (Ceklis Mingguan), tagihan dialokasikan berurut.
      // Skenario A: Warga bayar 10rb. Tapi saldo bulan lalu minus 6rb. Berarti saldo available cuma 4rb. 
      // 4rb ini yg dialokasikan ke bulan ini. (2 minggu lunas).

      let remainingToAllocate = saldoTersediaBulanIni;
      
      const [y, m] = targetYearMonth.split('-');
      const thursdays = [];
      const dateC = new Date(parseInt(y), parseInt(m)-1, 1);
      while(dateC.getMonth() === parseInt(m)-1) {
          if (dateC.getDay() === 4) thursdays.push(dateC.getDate());
          dateC.setDate(dateC.getDate() + 1);
      }

      for (let i = 1; i <= currentMonthTarget.total_kamis; i++) {
        // Tentukan batas rentang tanggal minggu ke-i bersangkutan
        let dateStart = i === 1 ? 1 : thursdays[i-2] + 1;
        let dateEnd = i === currentMonthTarget.total_kamis ? 31 : thursdays[i-1];
        
        // Cek total transaksi di minggu ini
        let nominalAsliMingguIni = 0;
        wargaTxs.filter(t => t.bulan_tahun === targetYearMonth).forEach(tx => {
             const txDate = new Date(tx.tanggal_bayar).getDate();
             if (txDate >= dateStart && txDate <= dateEnd) {
                 nominalAsliMingguIni += tx.nominal;
             }
        });

        if (remainingToAllocate >= nominalPerMinggu) {
            // Cukup untuk 1 minggu penuh
            weeklyStatuses.push({ minggu_ke: i, status: 'LUNAS', target: nominalPerMinggu, terbayar: nominalPerMinggu, nominal_asli_transaksi: nominalAsliMingguIni });
            remainingToAllocate -= nominalPerMinggu;
        } else if (remainingToAllocate > 0) {
            // Sisa tanggung (misal 1000)
            weeklyStatuses.push({ minggu_ke: i, status: 'PARSIAL', target: nominalPerMinggu, terbayar: remainingToAllocate, nominal_asli_transaksi: nominalAsliMingguIni });
            remainingToAllocate = 0; // Habis
        } else {
            // Gak ada sisa
            weeklyStatuses.push({ minggu_ke: i, status: 'BELUM', target: nominalPerMinggu, terbayar: 0, nominal_asli_transaksi: nominalAsliMingguIni });
        }
      }

      // Saldo akhir adalah remainingToAllocate setelah dikurangi seluruh tagihan bulan ini
      
      reports.push({
          warga_id: warga.id,
          nama_warga: warga.nama_lengkap,
          total_masuk_bulan_ini: uangMasukBulanIni,
          status_mingguan: weeklyStatuses,
          saldo_akhir: remainingToAllocate // Bisa positif (deposit) atau negatif (tunggakan)
      });
    }

    return { reports, currentTarget: currentMonthTarget };
  }

  // Utility List Range YYYY-MM
  private static getMonthsRange(start: string, end: string): string[] {
      const dates: string[] = [];
      let current = start;
      while (current <= end) {
          dates.push(current);
          const [y, m] = current.split('-').map(Number);
          let nY = y;
          let nM = m + 1;
          if (nM > 12) { nM = 1; nY++; }
          current = `${nY}-${nM.toString().padStart(2, '0')}`;
      }
      return dates;
  }

  // Utility Hitung Kamis
  private static countThursdays(yearMonth: string): number {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; 
    let total_kamis = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 4) { 
        total_kamis++;
      }
      date.setDate(date.getDate() + 1);
    }
    return total_kamis;
  }
}
