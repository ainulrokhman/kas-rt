"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  Users,
  Wallet,
  UserCog,
  RefreshCw,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { PetugasRepository } from "@/lib/repositories/petugasRepository";
import { JimpitanService } from "@/lib/services/jimpitanService";
import { JimpitanRepository } from "@/lib/repositories/jimpitanRepository";
import { Warga } from "@/types/warga";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalWarga: number;
  petugasAktif: number;
  jimpitanBulanIni: number;
  wargaLunas: number;
  totalWargaReport: number;
  progressPersen: number;
}

interface RecentTrx {
  id: string;
  namaWarga: string;
  nominal: number;
  tanggal: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────



// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrx, setRecentTrx] = useState<RecentTrx[]>([]);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const yearMonth = getCurrentYearMonth();
      const [wargaList, petugasList, jimpitanReport] = await Promise.all([
        WargaRepository.getAll(),
        PetugasRepository.getAll(),
        JimpitanService.getLaporanBulanan(yearMonth),
      ]);

      const now = Date.now();
      const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
      const rawTrx = await JimpitanRepository.getTransactionsByDateBound(
        fourteenDaysAgo,
        now
      );

      const wargaMap = new Map<string, Warga>(wargaList.map((w) => [w.id, w]));

      const latestTrx: RecentTrx[] = rawTrx
        .slice()
        .reverse()
        .slice(0, 3) // Cukup 3 saja untuk dashboard mobile
        .map((t) => ({
          id: t.id,
          namaWarga: wargaMap.get(t.warga_id)?.nama_lengkap ?? "Warga",
          nominal: t.nominal,
          tanggal: t.tanggal_bayar,
        }));

      const petugasAktif = petugasList.filter((p) => p.is_active).length;
      const reports = jimpitanReport.reports;
      const totalJimpitan = reports.reduce(
        (sum, r) => sum + r.total_masuk_bulan_ini,
        0
      );
      
      setStats({
        totalWarga: wargaList.length,
        petugasAktif,
        jimpitanBulanIni: totalJimpitan,
        wargaLunas: 0, // Tidak lagi digunakan di UI baru
        totalWargaReport: reports.length,
        progressPersen: 0, // Tidak lagi digunakan di UI baru
      });
      setRecentTrx(latestTrx);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const firstName = user?.nama_lengkap?.split(" ")[0] ?? "Petugas";
  const yearMonth = getCurrentYearMonth();
  const [tahun, bulan] = yearMonth.split("-");
  const namaBulan = new Date(Number(tahun), Number(bulan) - 1, 1).toLocaleDateString("id-ID", { month: "long" });

  const menuItems = [
    { label: "Tarik Jimpitan", href: "/jimpitan?tab=TARIK", icon: Wallet, color: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
    { label: "Data Warga", href: "/warga", icon: Users, color: "bg-indigo-500", shadow: "shadow-indigo-500/20" },
    { label: "Laporan Kas", href: "/jimpitan?tab=LAPORAN", icon: CalendarCheck, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
    { label: "Petugas RT", href: "/petugas", icon: UserCog, color: "bg-violet-500", shadow: "shadow-violet-500/20" },
    { label: "Pengaturan", href: "/jimpitan?tab=SETTING", icon: RefreshCw, color: "bg-slate-600", shadow: "shadow-slate-500/20" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ── App Header Style ── */}
      <div className="relative overflow-hidden bg-slate-900 -mx-4 px-4 pt-6 pb-12 rounded-b-[3rem] border-b border-slate-800 shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
         
         <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
               <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{getGreeting()}</p>
               <h1 className="text-2xl font-extrabold text-white tracking-tight">{firstName} 👋</h1>
            </div>
            <button 
               onClick={fetchDashboard}
               className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-slate-300 hover:bg-slate-800 transition-colors"
            >
               <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
         </div>

         {/* Mini Stats Card */}
         <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex justify-between items-center relative z-10 shadow-inner">
            <div className="space-y-1">
               <p className="text-slate-400 text-xs font-medium">Kas Terkumpul {namaBulan}</p>
               <h2 className="text-2xl font-bold text-white tracking-tight">
                  {isLoading ? "..." : formatRupiah(stats?.jimpitanBulanIni ?? 0)}
               </h2>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
               <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
         </div>
      </div>

      {/* ── Main Menu Grid ── */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Menu Utama</h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {menuItems.map((item, i) => (
               <Link 
                  key={i}
                  href={item.href}
                  className="group flex flex-col items-center justify-center bg-slate-900 border border-slate-800/50 p-6 rounded-[2rem] hover:bg-slate-800/50 hover:border-slate-700 transition-all duration-300 active:scale-95 shadow-sm"
               >
                  <div className={`w-14 h-14 ${item.color} ${item.shadow} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                     <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-200 text-center tracking-tight">{item.label}</span>
               </Link>
            ))}
         </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="space-y-4">
         <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aktivitas Terbaru</h3>
            <Link href="/jimpitan" className="text-xs font-bold text-indigo-400">Lihat Semua</Link>
         </div>

         <div className="bg-slate-900/50 rounded-3xl border border-slate-800/50 overflow-hidden divide-y divide-slate-800/50">
            {isLoading ? (
               [1, 2, 3].map(i => <div key={i} className="p-4 h-16 animate-pulse bg-slate-800/20" />)
            ) : recentTrx.length === 0 ? (
               <div className="p-10 text-center text-slate-600 text-sm italic">Belum ada transaksi</div>
            ) : (
               recentTrx.map((trx) => (
                  <div key={trx.id} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                           <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-200">{trx.namaWarga}</p>
                           <p className="text-[10px] text-slate-500 font-medium">{formatRelativeTime(trx.tanggal)}</p>
                        </div>
                     </div>
                     <p className="text-sm font-black text-emerald-400">+{formatRupiah(trx.nominal)}</p>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* ── Quick Stats Footer ── */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
               <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase">Warga</p>
               <p className="text-sm font-black text-white">{stats?.totalWarga ?? 0} KK</p>
            </div>
         </div>
         <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
               <UserCog className="w-4 h-4 text-violet-400" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase">Petugas</p>
               <p className="text-sm font-black text-white">{stats?.petugasAktif ?? 0} Aktif</p>
            </div>
         </div>
      </div>
    </div>
  );
}
