"use client";

import { useEffect, useState, useCallback } from "react";
import { JimpitanService } from "@/lib/services/jimpitanService";
import { JimpitanReportRow, JimpitanMonthTarget } from "@/types/jimpitan";
import LaporanBulananTable from "@/components/jimpitan/LaporanBulananTable";
import { Calendar, RefreshCw } from "lucide-react";

export default function LaporanJimpitanPage() {
  const [reports, setReports] = useState<JimpitanReportRow[]>([]);
  const [currentTarget, setCurrentTarget] = useState<JimpitanMonthTarget | null>(null);
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
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
  }, [monthFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const getThursdaysDates = (yearMonth: string) => {
    if (!yearMonth) return [];
    const [y, m] = yearMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const dates: string[] = [];
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight">
            Laporan Jimpitan
          </h1>
          <p className="text-slate-400 font-medium tracking-wide text-sm mt-1">
            Rekapitulasi setoran jimpitan mingguan warga
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row gap-4 backdrop-blur-sm">
        <div className="flex-1 relative">
          <label className="text-xs text-slate-500 block mb-1.5 ml-1 font-medium">Pilih Bulan</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700/60 hover:border-slate-600 text-slate-200 text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={loadReports}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-6 py-3 text-sm transition-all shadow-lg flex items-center justify-center gap-2 h-[46px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-slate-900/30 rounded-3xl border border-slate-800/30 shadow-inner">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-sm font-medium tracking-wide">Menyusun data laporan...</div>
        </div>
      ) : (
        <LaporanBulananTable
          reports={reports}
          totalKamis={getThursdaysDates(monthFilter).length}
          thursdaysDates={getThursdaysDates(monthFilter)}
          currentTarget={currentTarget}
          monthFilter={monthFilter}
        />
      )}
    </div>
  );
}
