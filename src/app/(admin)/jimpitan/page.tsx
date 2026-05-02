"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Warga } from "@/types/warga";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { JimpitanService } from "@/lib/services/jimpitanService";
import { JimpitanRepository } from "@/lib/repositories/jimpitanRepository";
import { JimpitanReportRow, JimpitanTransaction } from "@/types/jimpitan";
import { Calendar, Settings, Wallet, Users, LayoutDashboard, MapPin, CalendarDays } from "lucide-react";

import InputTarikanForm from "@/components/jimpitan/InputTarikanForm";
import LaporanBulananTable from "@/components/jimpitan/LaporanBulananTable";
import SettingJimpitan from "@/components/jimpitan/SettingJimpitan";
import SettingSistem from "@/components/admin/SettingSistem";
import SyncIndicator from "@/components/jimpitan/SyncIndicator";

type Tab = 'TARIK' | 'LAPORAN' | 'SETTING';

export default function JimpitanPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || 'TARIK';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && (tab === 'TARIK' || tab === 'LAPORAN' || tab === 'SETTING')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [reports, setReports] = useState<JimpitanReportRow[]>([]);
  const [currentTarget, setCurrentTarget] = useState<any>(null);

  // Tab Tarikan States
  const [defaultNominal, setDefaultNominal] = useState(2000);
  const [tanggalFilter, setTanggalFilter] = useState('');
  const [lokasiTahlil, setLokasiTahlil] = useState('');
  const [dailyTransactions, setDailyTransactions] = useState<JimpitanTransaction[]>([]);

  // Laporan State
  const [monthFilter, setMonthFilter] = useState('');

  const [loading, setLoading] = useState(true);

  // Init & Observe Data (Real-time & Offline-First)
  useEffect(() => {
    setLoading(true);
    
    // 1. Observe Warga
    const unsubWarga = WargaRepository.observeAll((data) => {
      setWargaList(data);
      if (data.length > 0) setLoading(false);
    });

    // 2. Observe Global Setting
    const unsubSetting = JimpitanRepository.observeGlobalSetting((setting) => {
      setDefaultNominal(setting.nominal_default);
    });

    // Set Default Month & Date
    const date = new Date();
    const yMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    setMonthFilter(yMonth);

    const todayStr = date.toISOString().split('T')[0];
    setTanggalFilter(todayStr);

    return () => {
      unsubWarga();
      unsubSetting();
    };
  }, []);

  // 1. Fetch Daily Info (Lokasi Tahlil) when tanggalFilter changes
  useEffect(() => {
    if (activeTab === 'TARIK' && tanggalFilter) {
      loadDailyInfo();
    }
  }, [activeTab, tanggalFilter]);

  const loadDailyInfo = async () => {
    try {
      const parts = tanggalFilter.split('-'); // YYYY-MM-DD
      const yMonth = `${parts[0]}-${parts[1]}`;
      
      const target = await JimpitanRepository.getMonthTarget(yMonth, true);
      if (target) {
        setCurrentTarget(target);
        const mKe = hitungMingguKeDariTanggal(tanggalFilter);
        const locs = target.lokasi_tahlil || {};
        setLokasiTahlil(locs[mKe] || '');
      }
    } catch (e) {
      console.error("Gagal load info harian:", e);
    }
  };

  // 2. Real-time Observer for Daily Transactions
  useEffect(() => {
    if (activeTab === 'TARIK' && tanggalFilter) {
      const parts = tanggalFilter.split('-'); // YYYY-MM-DD
      const startOfDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0).getTime();
      const endOfDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59).getTime();

      const unsubscribe = JimpitanRepository.observeTransactionsByDateBound(startOfDay, endOfDay, (txs) => {
        setDailyTransactions(txs);
      });

      return () => unsubscribe();
    }
  }, [activeTab, tanggalFilter]);

  const handleLokasiChange = async (wargaIdLoc: string) => {
    setLokasiTahlil(wargaIdLoc);
    if (!currentTarget) return;
    try {
      const mKe = hitungMingguKeDariTanggal(tanggalFilter);

      let displayLocName = wargaIdLoc;
      if (wargaIdLoc) {
        const wFind = wargaList.find(w => w.id === wargaIdLoc);
        if (wFind) displayLocName = wFind.nama_lengkap;
      }

      const newLocs = { ...(currentTarget.lokasi_tahlil || {}), [mKe]: displayLocName };
      setCurrentTarget({ ...currentTarget, lokasi_tahlil: newLocs });
      await JimpitanRepository.updateMonthTargetLocation(currentTarget.id, newLocs);
    } catch (e) {
      console.error("Gagal save lokasi", e);
    }
  };

  // Helper Mnghitung Minggu ke-XX dari parameter Date String YYYY-MM-DD (Kamis reference)
  const hitungMingguKeDariTanggal = (dateStr: string) => {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);

    const thursdays = [];
    const dateC = new Date(y, m, 1);
    while (dateC.getMonth() === m) {
      if (dateC.getDay() === 4) thursdays.push(dateC.getDate());
      dateC.setDate(dateC.getDate() + 1);
    }

    let mingguKe = thursdays.length > 0 ? thursdays.length : 1;
    for (let i = 0; i < thursdays.length; i++) {
      if (d <= thursdays[i]) {
        mingguKe = i + 1;
        break;
      }
    }
    return mingguKe;
  };

  // Laporan logic
  useEffect(() => {
    if (activeTab === 'LAPORAN' && monthFilter) {
      loadReports();
    }
  }, [activeTab, monthFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const result = await JimpitanService.getLaporanBulanan(monthFilter);
      setReports(result.reports);
      setCurrentTarget(result.currentTarget);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getThursdaysDates = (yearMonth: string) => {
    if (!yearMonth) return [];
    const [y, m] = yearMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    let dates: string[] = [];
    while (date.getMonth() === parseInt(m) - 1) {
      if (date.getDay() === 4) {
        const d = date.getDate().toString().padStart(2, '0');
        const monthName = date.toLocaleString('id-ID', { month: 'short' });
        dates.push(`${d} ${monthName}`);
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  if (loading && wargaList.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Header Compact - Menyatu dengan gaya admin */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight">
            Jimpitan RT
          </h1>
          <p className="text-slate-400 font-medium tracking-wide text-sm mt-1">
            Pencatatan kas keliling digital & laporan otomatis
          </p>
        </div>
      </div>

      {/* Offline/Sync Indicator */}
      <SyncIndicator />

      {/* Animated Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex relative shadow-inner max-w-md w-full">
        <button
          onClick={() => setActiveTab('TARIK')}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 z-10 ${activeTab === 'TARIK' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          <Users className="w-4 h-4 mb-1" />
          Tarikan
        </button>

        <button
          onClick={() => setActiveTab('LAPORAN')}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 z-10 ${activeTab === 'LAPORAN' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          <Calendar className="w-4 h-4 mb-1" />
          Laporan
        </button>

        <button
          onClick={() => setActiveTab('SETTING')}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 z-10 ${activeTab === 'SETTING' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          <Settings className="w-4 h-4 mb-1" />
          Setting
        </button>

        {/* Tab Glider Background */}
        <div
          className="absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-slate-800 rounded-xl transition-all duration-300 ease-out border border-slate-700 shadow-md"
          style={{ left: activeTab === 'TARIK' ? '6px' : activeTab === 'LAPORAN' ? 'calc(33.33% + 2px)' : 'calc(66.66% - 2px)' }}
        />
      </div>

      {/* Content Area */}
      <div className="w-full">
        {activeTab === 'TARIK' && (
          <div className="animate-fade-in fade-in transition-all">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Tanggal Penarikan */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-500" />
                  Tanggal Penarikan
                </label>
                <div className="relative border shadow-inner rounded-xl border-slate-700/60 overflow-hidden">
                  <input
                    type="date"
                    value={tanggalFilter}
                    onChange={(e) => setTanggalFilter(e.target.value)}
                    className="w-full bg-slate-950/50 hover:border-slate-600 text-slate-200 text-sm px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                  />
                </div>
                <div className="mt-2 text-[10px] text-slate-500 font-medium">Berdampak pada: Minggu Ke-{hitungMingguKeDariTanggal(tanggalFilter || "") || 0} Laporan</div>
              </div>

              {/* Lokasi Tahlil */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  Lokasi Tahlil
                </label>
                <div className="relative border shadow-inner rounded-xl border-slate-700/60 overflow-hidden">
                  <select
                    value={lokasiTahlil || ""}
                    onChange={(e) => handleLokasiChange(e.target.value)}
                    className="w-full bg-slate-950/50 hover:border-slate-600 text-slate-200 text-sm px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none font-medium"
                  >
                    <option value="" className="text-slate-500">-- Pilih Rumah Tuan Rumah --</option>
                    {wargaList.map(w => (
                      // Kita simpan ID atau Nama? Kita simpan ID di select, tp pas nge-save ke target di convert nama aja biar gampang. Atau simpan namanya sbg val dsb.
                      <option key={w.id} value={w.nama_lengkap} className="bg-slate-900">{w.nama_lengkap}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 mt-2 border-t border-slate-800/80 pt-6">
              <h2 className="font-semibold text-slate-300 text-sm flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                Mulai Keliling Area
              </h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {wargaList.length} Rumah
              </span>
            </div>

            {/* Dibikin grid jika layar lebar, dan single col jika mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputTarikanForm
                wargaList={wargaList}
                petugasId="admin"
                selectedDate={tanggalFilter}
                dailyTransactions={dailyTransactions}
                defaultNominal={defaultNominal}
                onSuccess={() => loadDailyInfo()}
              />
            </div>
          </div>
        )}

        {activeTab === 'LAPORAN' && (
          <div className="animate-fade-in fade-in transition-all space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row gap-4 backdrop-blur-sm max-w-xl">
              <div className="flex-1 relative">
                <label className="text-xs text-slate-500 block mb-1.5 ml-1 font-medium">Bulan Laporan</label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/60 hover:border-slate-600 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadReports}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-6 py-3 text-sm transition-all shadow-[0_0_15px_-3px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 h-[46px]"
                >
                  Refresh Data
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800/30 shadow-inner">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="text-sm font-medium tracking-wide animate-pulse">Menghitung buku kas otomatis...</div>
              </div>
            ) : (
              <LaporanBulananTable
                reports={reports}
                totalKamis={getThursdaysDates(monthFilter).length}
                thursdaysDates={getThursdaysDates(monthFilter)}
                currentTarget={currentTarget}
                onLocationChange={async (minggu_ke: number, loc: string) => {
                  if (!currentTarget) return;
                  const newLocs = { ...(currentTarget.lokasi_tahlil || {}), [minggu_ke]: loc };
                  setCurrentTarget({ ...currentTarget, lokasi_tahlil: newLocs });
                  await JimpitanRepository.updateMonthTargetLocation(currentTarget.id, newLocs);
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'SETTING' && (
          <div className="animate-fade-in fade-in transition-all max-w-2xl space-y-6">
            <SettingJimpitan
              initialNominal={defaultNominal}
              currentYearMonth={monthFilter}
              onSaved={(val) => setDefaultNominal(val)}
            />
            <SettingSistem />
          </div>
        )}
      </div>

    </div>
  );
}
