"use client";

import { useEffect, useState } from "react";
import { KasRepository } from "@/lib/repositories/kasRepository";
import { KasService } from "@/lib/services/kasService";
import { KasTransaction, KasSummary } from "@/types/kas";
import { exportKasToExcel, exportKasToPDF, formatRupiah } from "@/lib/utils/exportUtils";
import { Calendar, PieChart, FileSpreadsheet, FileText } from "lucide-react";
import { PetugasService } from "@/lib/services/petugasService";
import { PetugasWithWarga } from "@/types/petugas";

interface TransactionWithRunningBalance extends KasTransaction {
  runningBalance: number;
}

export default function LaporanKasPage() {
  const [transactions, setTransactions] = useState<TransactionWithRunningBalance[]>([]);
  const [petugasMap, setPetugasMap] = useState<Record<string, PetugasWithWarga>>({});
  const [summary, setSummary] = useState<KasSummary>({ totalMasuk: 0, totalKeluar: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [txs, petugasList] = await Promise.all([
          KasRepository.getAllTransactions(),
          PetugasService.getAll()
        ]);
        
        // Sort by date ascending to calculate running balance correctly
        const sortedAll = [...txs].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        
        let currentRunningBalance = 0;
        const enrichedAll: TransactionWithRunningBalance[] = sortedAll.map(tx => {
          if (tx.jenis === 'MASUK') currentRunningBalance += tx.nominal;
          else currentRunningBalance -= tx.nominal;
          return { ...tx, runningBalance: currentRunningBalance };
        });

        // Filter by month and keep ASCENDING order for financial reporting
        const filteredTxs = enrichedAll
          .filter(tx => tx.tanggal.startsWith(monthFilter))
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

        setTransactions(filteredTxs);
        setSummary(KasService.calculateSummary(filteredTxs));

        const map: Record<string, PetugasWithWarga> = {};
        petugasList.forEach(p => { map[p.id] = p; });
        setPetugasMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [monthFilter]);

  const handleExport = (type: 'excel' | 'pdf') => {
    const data = transactions.map(tx => ({
      ...tx,
      petugas_nama: petugasMap[tx.petugas_id]?.nama_lengkap,
      petugas_jabatan: petugasMap[tx.petugas_id]?.jabatan
    }));
    const title = `Laporan Kas RT - ${monthFilter}`;
    if (type === 'excel') exportKasToExcel(data, title);
    else exportKasToPDF(data, title, summary);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight">
          Laporan Kas RT
        </h1>
        <p className="text-slate-400 font-medium tracking-wide text-sm mt-1">
          Ringkasan arus kas masuk dan keluar per bulan
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center gap-4 backdrop-blur-sm">
        <div className="flex-1 w-full">
          <label className="text-xs text-slate-500 block mb-1.5 ml-1 font-medium">Periode Laporan</label>
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
        <div className="flex gap-2 w-full sm:w-auto mt-6 sm:mt-0">
          <button onClick={() => handleExport('excel')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold transition-all h-[46px]">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="flex-1 flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs font-bold transition-all h-[46px]">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Masuk</p>
          <p className="text-xl font-bold text-emerald-400">{formatRupiah(summary.totalMasuk)}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Keluar</p>
          <p className="text-xl font-bold text-rose-400">{formatRupiah(summary.totalKeluar)}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Periode</p>
          <p className="text-xl font-bold text-indigo-400">{formatRupiah(summary.saldo)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-slate-900/30 rounded-3xl border border-slate-800/30 shadow-inner">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-sm font-medium tracking-wide">Menyusun data laporan...</div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200">Detail Transaksi Bulan Ini</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">Keterangan</th>
                  <th className="px-4 py-4">Kategori</th>
                  <th className="px-4 py-4 text-right">Nominal</th>
                  <th className="px-4 py-4 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">Tidak ada transaksi di bulan ini.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-slate-400">{tx.tanggal}</td>
                      <td className="px-4 py-4">
                        <p className="text-slate-200 font-medium truncate max-w-[200px]">{tx.keterangan}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{tx.kategori}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className={`font-bold ${tx.jenis === 'MASUK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.jenis === 'MASUK' ? '+' : '-'} {formatRupiah(tx.nominal)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="font-bold text-slate-300">{formatRupiah(tx.runningBalance)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
