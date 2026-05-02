import Link from "next/link";
import { cookies } from "next/headers";
import { JimpitanService } from "@/lib/services/jimpitanService";
import { JimpitanRepository } from "@/lib/repositories/jimpitanRepository";
import { Wallet, TrendingUp, Calendar, Users, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "kas-rt-session";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default async function Home() {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  
  const yearMonth = getCurrentYearMonth();
  const namaBulan = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  
  const stats = {
    mingguIni: 0,
    bulanIni: 0,
    totalSeluruhnya: 0
  };

  try {
    const { reports } = await JimpitanService.getLaporanBulanan(yearMonth);
    
    // Hitung total bulan ini
    stats.bulanIni = reports.reduce((sum, r) => sum + r.total_masuk_bulan_ini, 0);
    
    // Cari minggu berjalan (minggu ke berapa sekarang?)
    const now = new Date();
    const today = now.getDate();
    
    // Tentukan hari kamis di bulan ini
    const [y, m] = yearMonth.split('-').map(Number);
    const thursdays: number[] = [];
    const dateC = new Date(y, m - 1, 1);
    while(dateC.getMonth() === m - 1) {
        if (dateC.getDay() === 4) thursdays.push(dateC.getDate());
        dateC.setDate(dateC.getDate() + 1);
    }
    
    // Tentukan minggu ke-n (1-indexed)
    let currentWeekIdx = thursdays.findIndex(d => d >= today);
    if (currentWeekIdx === -1) currentWeekIdx = thursdays.length - 1; // Jika sudah lewat semua kamis, ambil minggu terakhir
    
    // Hitung total minggu ini
    reports.forEach(r => {
      const weekStatus = r.status_mingguan[currentWeekIdx];
      if (weekStatus) {
        stats.mingguIni += weekStatus.nominal_asli_transaksi || 0;
      }
    });

    // Total Seluruhnya (All time)
    // Untuk performa, kita ambil semua transaksi yang ada
    const allTransactions = await JimpitanRepository.getTransactionsUpToMonth(yearMonth);
    stats.totalSeluruhnya = allTransactions.reduce((sum, t) => sum + t.nominal, 0);

  } catch (err) {
    console.error("Gagal mengambil stats publik:", err);
  }

  return (
    <main className="min-h-screen bg-[#0B1120] flex flex-col items-center p-6 text-slate-200">
      <div className="max-w-xl w-full space-y-10 py-12">
        {/* Logo & Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Kas RT Transparan
          </h1>
          <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
            Sistem informasi pengelolaan dana warga yang akuntabel dan dapat dipantau bersama.
          </p>
        </div>

        {/* Public Transparency Stats */}
        <div className="grid grid-cols-1 gap-4">
           {/* Main Stat: Total Saldo */}
           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-center shadow-2xl shadow-indigo-500/20 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <TrendingUp className="w-16 h-16 sm:w-24 sm:h-24 rotate-12" />
              </div>
              <p className="text-indigo-100/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Total Kas Terkumpul</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter truncate px-2">
                {formatRupiah(stats.totalSeluruhnya)}
              </h2>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
                 <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse" />
                 <span className="text-[9px] sm:text-[10px] font-bold text-indigo-100 uppercase tracking-tight">Status Kas: Aktif</span>
              </div>
           </div>

           {/* Secondary Stats: Minggu & Bulan */}
           <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] text-center shadow-xl">
                 <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">Minggu Ini</p>
                 <p className="text-base sm:text-xl font-black text-emerald-400 truncate">{formatRupiah(stats.mingguIni)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] text-center shadow-xl">
                 <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{namaBulan}</p>
                 <p className="text-base sm:text-xl font-black text-indigo-400 truncate">{formatRupiah(stats.bulanIni)}</p>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-4 pt-4">
          <Link
            href="/laporan-rinci"
            className="group flex items-center justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-[2rem] hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                  <Calendar className="w-6 h-6 text-indigo-400" />
               </div>
               <div className="text-left">
                  <p className="text-sm font-bold text-white">Laporan Rinci</p>
                  <p className="text-[11px] text-slate-500">Lihat detail setoran per warga (Butuh PIN)</p>
               </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 transition-colors" />
          </Link>

          <Link
            href={session?.value ? "/dashboard" : "/login"}
            className="group flex items-center justify-center p-5 bg-white rounded-[2rem] shadow-xl hover:bg-slate-100 transition-all duration-300"
          >
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {session?.value ? "Buka Dashboard Pengurus" : "Login Pengurus RT"}
            </span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-8 text-center">
           <div className="flex items-center justify-center gap-4 mb-4 text-slate-600">
              <div className="flex items-center gap-1.5">
                 <Users size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-tighter">Transparansi Warga</span>
              </div>
              <div className="w-1 h-1 bg-slate-800 rounded-full" />
              <div className="flex items-center gap-1.5">
                 <Calendar size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-tighter">Update Real-time</span>
              </div>
           </div>
           <p className="text-[10px] text-slate-600 font-medium leading-relaxed opacity-60">
             Dikelola oleh Pengurus RT setempat untuk <br /> mewujudkan lingkungan yang jujur dan aman.
           </p>
        </div>
      </div>
    </main>
  );
}

