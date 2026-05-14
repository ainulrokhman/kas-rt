"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { JimpitanService } from "@/lib/services/jimpitanService";
import { JimpitanReportRow, JimpitanMonthTarget } from "@/types/jimpitan";
import LaporanBulananTable from "@/components/jimpitan/LaporanBulananTable";
import {
  LogOut,
  ChevronLeft,
  Calendar,
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  Wallet
} from "lucide-react";
import { KasRepository } from "@/lib/repositories/kasRepository";
import { KasService } from "@/lib/services/kasService";
import { KasTransaction, KasSummary } from "@/types/kas";
import { PetugasService } from "@/lib/services/petugasService";
import { PetugasWithWarga } from "@/types/petugas";
import {
  exportKasToExcel,
  exportKasToPDF,
  exportLaporanTahunanToExcel,
  exportLaporanTahunanToPDF,
  formatRupiah
} from "@/lib/utils/exportUtils";

interface TransactionWithRunningBalance extends KasTransaction {
  runningBalance: number;
}

type TabType = 'jimpitan' | 'bulanan' | 'tahunan';

export default function LaporanRinciPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Tab & Filters State
  const [activeTab, setActiveTab] = useState<TabType>('jimpitan');
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [yearFilter, setYearFilter] = useState(() => new Date().getFullYear());

  // Jimpitan Data State
  const [reports, setReports] = useState<JimpitanReportRow[]>([]);
  const [currentTarget, setCurrentTarget] = useState<JimpitanMonthTarget | null>(null);
  const [isJimpitanLoading, setIsJimpitanLoading] = useState(false);

  // Kas Data State
  const [allKasTransactions, setAllKasTransactions] = useState<KasTransaction[]>([]);
  const [monthlyKasTransactions, setMonthlyKasTransactions] = useState<TransactionWithRunningBalance[]>([]);
  const [monthlyKasSummary, setMonthlyKasSummary] = useState<KasSummary>({ totalMasuk: 0, totalKeluar: 0, saldo: 0 });
  const [petugasMap, setPetugasMap] = useState<Record<string, PetugasWithWarga>>({});
  const [isKasLoading, setIsKasLoading] = useState(true);

  const router = useRouter();

  // Auth Session Check
  useEffect(() => {
    const hasCookie = document.cookie.includes("kas-rt-public-session=1");
    if (hasCookie) {
      setIsAuthenticated(true);
    }
    setIsCheckingSession(false);
  }, []);

  // PIN Input Handlers
  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/public-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setPin("");
      } else {
        const data = await res.json();
        setError(data.message || "PIN salah");
        setPin("");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [pin]);

  useEffect(() => {
    if (pin.length === 6) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  const handleLogout = () => {
    document.cookie = "kas-rt-public-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setIsAuthenticated(false);
    router.push("/");
  };

  // Data Fetching: Jimpitan
  const fetchJimpitan = useCallback(async () => {
    setIsJimpitanLoading(true);
    try {
      const { reports, currentTarget } = await JimpitanService.getLaporanBulanan(monthFilter);
      setReports(reports);
      setCurrentTarget(currentTarget);
    } catch (err) {
      console.error("Gagal ambil laporan jimpitan:", err);
    } finally {
      setIsJimpitanLoading(false);
    }
  }, [monthFilter]);

  // Data Fetching: Kas & Petugas (Real-time)
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribeKas = () => { };
    let unsubscribePetugas = () => { };

    const loadKasData = async () => {
      setIsKasLoading(true);

      unsubscribePetugas = PetugasService.observeAll((petugasList) => {
        const map: Record<string, PetugasWithWarga> = {};
        petugasList.forEach(p => { map[p.id] = p; });
        setPetugasMap(map);
      });

      unsubscribeKas = KasRepository.observeTransactions((txs) => {
        setAllKasTransactions(txs);

        // Process Monthly Data with Running Balance
        const sortedAll = [...txs].sort((a, b) => a.tanggal_timestamp - b.tanggal_timestamp);
        let currentRunningBalance = 0;
        const enrichedAll: TransactionWithRunningBalance[] = sortedAll.map(tx => {
          if (tx.jenis === 'MASUK') currentRunningBalance += tx.nominal;
          else currentRunningBalance -= tx.nominal;
          return { ...tx, runningBalance: currentRunningBalance };
        });

        const filteredTxs = enrichedAll
          .filter(tx => tx.tanggal.startsWith(monthFilter))
          .sort((a, b) => a.tanggal_timestamp - b.tanggal_timestamp);

        setMonthlyKasTransactions(filteredTxs);
        setMonthlyKasSummary(KasService.calculateSummary(filteredTxs));
        setIsKasLoading(false);
      });
    };

    loadKasData();
    return () => {
      unsubscribeKas();
      unsubscribePetugas();
    };
  }, [isAuthenticated, monthFilter]);

  // Fetch Jimpitan when needed
  useEffect(() => {
    if (isAuthenticated && activeTab === 'jimpitan') {
      fetchJimpitan();
    }
  }, [isAuthenticated, activeTab, fetchJimpitan]);

  // Annual Data Calculation
  const annualData = useMemo(() => {
    return KasService.generateAnnualReportData(allKasTransactions, yearFilter);
  }, [allKasTransactions, yearFilter]);

  const getPengurusNames = () => {
    const list = Object.values(petugasMap);
    return {
      ketua: list.find(p => p.jabatan === 'Ketua RT')?.nama_lengkap || '.......................',
      sekretaris: list.find(p => p.jabatan === 'Sekretaris')?.nama_lengkap || '.......................',
      bendahara: list.find(p => p.jabatan === 'Bendahara')?.nama_lengkap || '.......................'
    };
  };

  const handleMonthlyExport = (type: 'excel' | 'pdf') => {
    const data = monthlyKasTransactions.map(tx => ({
      ...tx,
      petugas_nama: petugasMap[tx.petugas_id]?.nama_lengkap,
      petugas_jabatan: petugasMap[tx.petugas_id]?.jabatan
    }));
    const title = `Laporan Kas RT - ${monthFilter}`;
    if (type === 'excel') exportKasToExcel(data, title);
    else exportKasToPDF(data, title, monthlyKasSummary);
  };

  const handleAnnualExport = (type: 'excel' | 'pdf') => {
    if (type === 'excel') exportLaporanTahunanToExcel({ ...annualData, year: yearFilter }, getPengurusNames());
    else exportLaporanTahunanToPDF({ year: yearFilter, ...annualData }, getPengurusNames());
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6">
        <div className="max-w-xs w-full space-y-10">
          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="text-slate-500 hover:text-slate-300 transition-colors mb-6 flex items-center justify-center mx-auto text-xs font-bold uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali
            </button>
            <h1 className="text-3xl font-black text-white tracking-tight">PIN Akses</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Masukkan PIN Umum untuk melihat laporan rinci jimpitan & kas warga.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i
                    ? "bg-indigo-500 border-indigo-500 scale-125 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    : "border-slate-800 bg-slate-900"
                  }`}
              ></div>
            ))}
          </div>

          {error && (
            <p className="text-rose-500 text-sm text-center font-bold animate-shake bg-rose-500/10 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                disabled={isLoading}
                className="w-full aspect-square flex items-center justify-center bg-slate-900 border border-slate-800 text-2xl font-black text-white rounded-2xl hover:bg-slate-800 active:scale-90 transition-all shadow-lg"
              >
                {num}
              </button>
            ))}
            <div className="w-full aspect-square"></div>
            <button
              onClick={() => handleKeyPress("0")}
              disabled={isLoading}
              className="w-full aspect-square flex items-center justify-center bg-slate-900 border border-slate-800 text-2xl font-black text-white rounded-2xl hover:bg-slate-800 active:scale-90 transition-all shadow-lg"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full aspect-square flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl hover:bg-slate-800 active:scale-90 transition-all shadow-lg"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    );
  }



  return (
    <main className="min-h-screen bg-[#0B1120] pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-800 p-4 flex items-center justify-between z-30">
        <button
          onClick={() => router.push("/")}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-white uppercase tracking-widest">Laporan Rinci</h1>
          <p className="text-[10px] text-indigo-400 font-bold">Transparansi Keuangan RT</p>
        </div>
        <button
          onClick={handleLogout}
          title="Keluar"
          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">

        {/* Filters Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm">
          {activeTab !== 'tahunan' ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">Periode Laporan</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700/60 text-white text-sm font-bold rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                  />
                </div>
              </div>
              {activeTab === 'bulanan' && (
                <div className="flex gap-2 w-full sm:w-auto self-end">
                  <button onClick={() => handleMonthlyExport('excel')} className="flex-1 sm:w-auto flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 px-5 py-3.5 rounded-2xl text-xs font-black transition-all">
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL
                  </button>
                  <button onClick={() => handleMonthlyExport('pdf')} className="flex-1 sm:w-auto flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 px-5 py-3.5 rounded-2xl text-xs font-black transition-all">
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">Tahun Laporan</label>
                <div className="relative">
                  <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-700/60 text-white text-sm font-bold rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-indigo-500 transition-all shadow-inner appearance-none"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y} className="bg-slate-900">{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto self-end">
                <button onClick={() => handleAnnualExport('excel')} className="flex-1 sm:w-auto flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 px-5 py-3.5 rounded-2xl text-xs font-black transition-all">
                  <FileSpreadsheet className="w-4 h-4" /> EXCEL
                </button>
                <button onClick={() => handleAnnualExport('pdf')} className="flex-1 sm:w-auto flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 px-5 py-3.5 rounded-2xl text-xs font-black transition-all">
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher - Optimized for Mobile & Desktop */}
        <div className="bg-slate-900/50 p-1.5 rounded-[2rem] border border-slate-800 flex items-center gap-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab('jimpitan')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3.5 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'jimpitan' ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Wallet className={`${activeTab === 'jimpitan' ? 'w-4 h-4' : 'w-3.5 h-3.5 opacity-60'}`} />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">Jimpitan</span>
          </button>
          <button
            onClick={() => setActiveTab('bulanan')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3.5 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'bulanan' ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <PieChart className={`${activeTab === 'bulanan' ? 'w-4 h-4' : 'w-3.5 h-3.5 opacity-60'}`} />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">Kas Bulanan</span>
          </button>
          <button
            onClick={() => setActiveTab('tahunan')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3.5 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'tahunan' ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BarChart3 className={`${activeTab === 'tahunan' ? 'w-4 h-4' : 'w-3.5 h-3.5 opacity-60'}`} />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">Kas Tahunan</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="min-h-[400px]">
          {activeTab === 'jimpitan' && (
            isJimpitanLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm font-medium">Memuat data jimpitan...</p>
              </div>
            ) : (
              <LaporanBulananTable
                reports={reports}
                totalKamis={currentTarget?.total_kamis || 0}
                thursdaysDates={[]}
                monthFilter={monthFilter}
              />
            )
          )}

          {activeTab === 'bulanan' && (
            isKasLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm font-medium">Memuat data kas bulanan...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Chips */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-lg flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Masuk</p>
                      <p className="text-sm sm:text-xl font-black text-emerald-400">{formatRupiah(monthlyKasSummary.totalMasuk)}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-lg flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Keluar</p>
                      <p className="text-sm sm:text-xl font-black text-rose-400">{formatRupiah(monthlyKasSummary.totalKeluar)}</p>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1 bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-4 sm:p-6 shadow-lg flex items-center gap-3 sm:gap-4 ring-1 ring-indigo-500/10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Saldo</p>
                      <p className="text-base sm:text-xl font-black text-white">{formatRupiah(monthlyKasSummary.saldo)}</p>
                    </div>
                  </div>
                </div>

                {/* Kas Bulanan - Desktop Table */}
                <div className="hidden md:block bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-slate-800 bg-slate-950/30">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> Detail Transaksi Kas
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-950/80 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-5">Tanggal</th>
                          <th className="px-6 py-5">Keterangan</th>
                          <th className="px-6 py-5">Kategori</th>
                          <th className="px-6 py-5 text-right">Nominal</th>
                          <th className="px-6 py-5 text-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {monthlyKasTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-medium">Belum ada transaksi kas di bulan ini.</td>
                          </tr>
                        ) : (
                          monthlyKasTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-5 whitespace-nowrap text-slate-400 font-bold">{tx.tanggal}</td>
                              <td className="px-6 py-5">
                                <p className="text-slate-200 font-bold truncate max-w-[250px]">{tx.keterangan}</p>
                              </td>
                              <td className="px-6 py-5">
                                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-slate-700">{tx.kategori}</span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <p className={`font-black text-sm ${tx.jenis === 'MASUK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {tx.jenis === 'MASUK' ? '+' : '-'} {formatRupiah(tx.nominal)}
                                </p>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <p className="font-black text-slate-300">{formatRupiah(tx.runningBalance)}</p>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kas Bulanan - Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {monthlyKasTransactions.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tidak ada transaksi</p>
                    </div>
                  ) : (
                    monthlyKasTransactions.map((tx) => (
                      <div key={tx.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tx.tanggal}</span>
                          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border border-slate-700">{tx.kategori}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200 line-clamp-2">{tx.keterangan}</p>
                        </div>
                        <div className="flex items-end justify-between pt-1">
                          <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mb-0.5">Saldo Berjalan</p>
                            <p className="text-xs font-bold text-slate-400">{formatRupiah(tx.runningBalance)}</p>
                          </div>
                          <p className={`font-black text-lg ${tx.jenis === 'MASUK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.jenis === 'MASUK' ? '+' : '-'} {formatRupiah(tx.nominal)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          )}

          {activeTab === 'tahunan' && (
            <div className="space-y-6">
              {/* Annual Summary Chips */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-lg">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Awal</p>
                  <p className="text-sm sm:text-base font-black text-amber-400">{formatRupiah(annualData.saldoAwal)}</p>
                </div>
                <div className="bg-indigo-600 border border-indigo-500 rounded-3xl p-4 shadow-lg shadow-indigo-500/20">
                  <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Saldo Akhir</p>
                  <p className="text-sm sm:text-base font-black text-white">{formatRupiah(annualData.saldoAkhir)}</p>
                </div>
              </div>

              {/* Kas Tahunan - Desktop Table */}
              <div className="hidden md:block bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-950/80 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-800">
                      <tr className="divide-x divide-slate-800/50">
                        <th className="px-4 py-4 text-center" rowSpan={2}>NO</th>
                        <th className="px-4 py-4" rowSpan={2}>Bulan</th>
                        <th className="px-4 py-4 text-center" colSpan={3}>Tahun {yearFilter}</th>
                        <th className="px-4 py-4 text-center bg-slate-900/50">Saldo Akhir</th>
                      </tr>
                      <tr className="divide-x divide-slate-800/50 border-t border-slate-800/50">
                        <th className="px-4 py-4 text-right">Pemasukan</th>
                        <th className="px-4 py-4 text-right">Pengeluaran</th>
                        <th className="px-4 py-4 text-right">Jumlah</th>
                        <th className="px-4 py-4 text-right text-indigo-300">Akumulasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {annualData.months.map((m) => (
                        <tr key={m.nama} className="divide-x divide-slate-800/30 hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-4 text-center text-slate-500 font-bold">{m.index}</td>
                          <td className="px-4 py-4 font-black text-slate-200">{m.nama}</td>
                          <td className="px-4 py-4 text-right text-emerald-400 font-bold">{m.pemasukan > 0 ? formatRupiah(m.pemasukan) : 'Rp 0'}</td>
                          <td className="px-4 py-4 text-right text-rose-400 font-bold">{m.pengeluaran > 0 ? formatRupiah(m.pengeluaran) : 'Rp 0'}</td>
                          <td className="px-4 py-4 text-right text-slate-400 font-medium">{formatRupiah(m.jumlah)}</td>
                          <td className="px-4 py-4 text-right font-black text-white bg-slate-800/20">{formatRupiah(m.saldoAkhir)}</td>
                        </tr>
                      ))}
                      <tr className="divide-x divide-slate-800/50 font-black bg-slate-950/50">
                        <td colSpan={2} className="px-4 py-5 text-indigo-400 uppercase tracking-widest text-center">TOTAL TAHUNAN</td>
                        <td className="px-4 py-5 text-right text-emerald-400">{formatRupiah(annualData.totalMasuk)}</td>
                        <td className="px-4 py-5 text-right text-rose-400">{formatRupiah(annualData.totalKeluar)}</td>
                        <td className="px-4 py-5 text-right text-slate-300">{formatRupiah(annualData.totalJumlah)}</td>
                        <td className="px-4 py-5 text-right bg-indigo-600 text-white">{formatRupiah(annualData.saldoAkhir)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kas Tahunan - Mobile Grid View */}
              <div className="md:hidden grid grid-cols-1 gap-3">
                {annualData.months.map((m) => (
                  <div key={m.nama} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{m.nama}</span>
                      <span className="text-[10px] font-bold text-slate-600 tracking-tighter">Bulan Ke-{m.index}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pemasukan</p>
                        <p className="text-xs font-black text-emerald-400">{m.pemasukan > 0 ? formatRupiah(m.pemasukan) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pengeluaran</p>
                        <p className="text-xs font-black text-rose-400">{m.pengeluaran > 0 ? formatRupiah(m.pengeluaran) : '-'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl p-3 flex items-center justify-between border border-slate-800/30">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Saldo Akhir Bulan</span>
                      <span className="text-sm font-black text-white">{formatRupiah(m.saldoAkhir)}</span>
                    </div>
                  </div>
                ))}

                {/* Mobile Annual Total */}
                <div className="bg-indigo-600 rounded-2xl p-5 shadow-xl space-y-4">
                  <h4 className="text-center text-[10px] font-black text-indigo-200 uppercase tracking-widest border-b border-indigo-500/50 pb-2">Rekapitulasi {yearFilter}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-indigo-300 uppercase mb-1">Total Masuk</p>
                      <p className="text-xs font-black text-white">{formatRupiah(annualData.totalMasuk)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-indigo-300 uppercase mb-1">Total Keluar</p>
                      <p className="text-xs font-black text-white">{formatRupiah(annualData.totalKeluar)}</p>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/5">
                    <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Saldo Akhir Kas</span>
                    <span className="text-lg font-black text-white">{formatRupiah(annualData.saldoAkhir)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-indigo-500/5 p-6 rounded-[2.5rem] border border-indigo-500/10 text-center">
          <p className="text-[10px] text-slate-500 font-bold italic leading-relaxed uppercase tracking-wider">
            &quot;Seluruh data keuangan di atas tercatat secara transparan sebagai bentuk amanah pengurus RT kepada warga.&quot;
          </p>
        </div>
      </div>
    </main>
  );
}
