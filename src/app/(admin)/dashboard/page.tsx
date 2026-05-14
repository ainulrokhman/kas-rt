"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Wallet,
  UserCog,
  RefreshCw,
  TrendingUp,
  CalendarCheck,
  CircleDollarSign,
  PiggyBank,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { PetugasRepository } from "@/lib/repositories/petugasRepository";
import { JimpitanService } from "@/lib/services/jimpitanService";
import { JimpitanRepository } from "@/lib/repositories/jimpitanRepository";
import { KasRepository } from "@/lib/repositories/kasRepository";
import { KasService } from "@/lib/services/kasService";
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
  saldoKas: number;
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
      const [wargaList, petugasList, jimpitanReport, kasList] = await Promise.all([
        WargaRepository.getAll(),
        PetugasRepository.getAll(),
        JimpitanService.getLaporanBulanan(yearMonth),
        KasRepository.getAllTransactions(),
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

      const kasSummary = KasService.calculateSummary(kasList);
      
      setStats({
        totalWarga: wargaList.length,
        petugasAktif,
        jimpitanBulanIni: totalJimpitan,
        saldoKas: kasSummary.saldo,
        wargaLunas: 0, 
        totalWargaReport: reports.length,
        progressPersen: 0, 
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

  const quickActions = [
    { label: "Jimpitan", href: "/jimpitan", icon: Wallet, color: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
    { label: "Tabung", href: "/tabungan/masal", icon: PiggyBank, color: "bg-indigo-500", shadow: "shadow-indigo-500/20" },
    { label: "Cairkan", href: "/tabungan/tarik-masal", icon: ArrowDownLeft, color: "bg-rose-500", shadow: "shadow-rose-500/20" },
  ];

  const menuItems = [
    { label: "Data Warga", href: "/warga", icon: Users, color: "bg-slate-700", shadow: "shadow-slate-500/20" },
    { label: "Tabungan", href: "/tabungan", icon: PiggyBank, color: "bg-indigo-600", shadow: "shadow-indigo-500/20" },
    ...(user?.jabatan !== "Penarik Jimpitan" 
      ? [
          { label: "Buku Kas", href: "/kas", icon: CircleDollarSign, color: "bg-emerald-600", shadow: "shadow-emerald-500/20" },
          { label: "Laporan", href: "/laporan/kas", icon: CalendarCheck, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
          { label: "Petugas", href: "/petugas", icon: UserCog, color: "bg-violet-500", shadow: "shadow-violet-500/20" },
          { label: "Bantuan", href: "/faq", icon: HelpCircle, color: "bg-slate-600", shadow: "shadow-slate-500/20" },
        ]
      : [
          { label: "Laporan", href: "/laporan/jimpitan", icon: CalendarCheck, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
          { label: "Bantuan", href: "/faq", icon: HelpCircle, color: "bg-slate-600", shadow: "shadow-slate-500/20" },
      ]),
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
               <p className="text-slate-400 text-xs font-medium">Saldo Kas RT Saat Ini</p>
               <h2 className="text-2xl font-bold text-white tracking-tight">
                  {isLoading ? "..." : formatRupiah(stats?.saldoKas ?? 0)}
               </h2>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
               <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
         </div>
      </div>

      {/* ── Quick Actions (Most Frequent) ── */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Aksi Cepat</h3>
         <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, i) => (
               <Link 
                  key={i}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl hover:bg-slate-800 transition-all active:scale-95"
               >
                  <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center shadow-lg ${action.shadow}`}>
                     <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{action.label}</span>
               </Link>
            ))}
         </div>
      </div>

      {/* ── Main Menu Grid ── */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Manajemen & Laporan</h3>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {menuItems.map((item, i) => (
               <Link 
                  key={i}
                  href={item.href}
                  className="group flex flex-col items-center justify-center bg-slate-900 border border-slate-800/50 p-4 rounded-[1.5rem] hover:bg-slate-800 transition-all active:scale-95"
               >
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                     <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">{item.label}</span>
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
