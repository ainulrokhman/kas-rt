"use client";

import { useEffect, useState } from "react";
import { KasRepository } from "@/lib/repositories/kasRepository";
import { KasService } from "@/lib/services/kasService";
import { KasTransaction, KasSummary } from "@/types/kas";
import { exportKasToExcel, exportKasToPDF, exportLaporanTahunanToExcel, exportLaporanTahunanToPDF, formatRupiah } from "@/lib/utils/exportUtils";
import { Calendar, PieChart, FileSpreadsheet, FileText, BarChart3 } from "lucide-react";
import { PetugasService } from "@/lib/services/petugasService";
import { PetugasWithWarga } from "@/types/petugas";

interface TransactionWithRunningBalance extends KasTransaction {
  runningBalance: number;
}

export default function LaporanKasPage() {
  const [activeTab, setActiveTab] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [allTransactions, setAllTransactions] = useState<KasTransaction[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<TransactionWithRunningBalance[]>([]);
  const [petugasMap, setPetugasMap] = useState<Record<string, PetugasWithWarga>>({});
  const [monthlySummary, setMonthlySummary] = useState<KasSummary>({ totalMasuk: 0, totalKeluar: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [yearFilter, setYearFilter] = useState(() => new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    let unsubscribeKas = () => {};
    let unsubscribePetugas = () => {};

    const loadData = async () => {
      unsubscribePetugas = PetugasService.observeAll((petugasList) => {
        const map: Record<string, PetugasWithWarga> = {};
        petugasList.forEach(p => { map[p.id] = p; });
        setPetugasMap(map);
      });

      unsubscribeKas = KasRepository.observeTransactions((txs) => {
        setAllTransactions(txs);
        
        // Process monthly data
        const sortedAll = [...txs].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        let currentRunningBalance = 0;
        const enrichedAll: TransactionWithRunningBalance[] = sortedAll.map(tx => {
          if (tx.jenis === 'MASUK') currentRunningBalance += tx.nominal;
          else currentRunningBalance -= tx.nominal;
          return { ...tx, runningBalance: currentRunningBalance };
        });

        const filteredTxs = enrichedAll
          .filter(tx => tx.tanggal.startsWith(monthFilter))
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

        setMonthlyTransactions(filteredTxs);
        setMonthlySummary(KasService.calculateSummary(filteredTxs));
        setLoading(false);
      });
    };

    loadData();
    return () => {
      unsubscribeKas();
      unsubscribePetugas();
    };
  }, [monthFilter]);

  const annualData = KasService.generateAnnualReportData(allTransactions, yearFilter);

  const getPengurusNames = () => {
    const list = Object.values(petugasMap);
    return {
      ketua: list.find(p => p.jabatan === 'Ketua RT')?.nama_lengkap || '.......................',
      sekretaris: list.find(p => p.jabatan === 'Sekretaris')?.nama_lengkap || '.......................',
      bendahara: list.find(p => p.jabatan === 'Bendahara')?.nama_lengkap || '.......................'
    };
  };

  const handleMonthlyExport = (type: 'excel' | 'pdf') => {
    const data = monthlyTransactions.map(tx => ({
      ...tx,
      petugas_nama: petugasMap[tx.petugas_id]?.nama_lengkap,
      petugas_jabatan: petugasMap[tx.petugas_id]?.jabatan
    }));
    const title = `Laporan Kas RT - ${monthFilter}`;
    if (type === 'excel') exportKasToExcel(data, title);
    else exportKasToPDF(data, title, monthlySummary);
  };

  const handleAnnualExport = (type: 'excel' | 'pdf') => {
    if (type === 'excel') exportLaporanTahunanToExcel({ ...annualData, year: yearFilter }, getPengurusNames());
    else exportLaporanTahunanToPDF({ year: yearFilter, ...annualData }, getPengurusNames());
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight">
            Laporan Keuangan Kas
          </h1>
          <p className="text-slate-400 font-medium tracking-wide text-sm mt-1">
            Pantau arus kas masuk dan keluar secara transparan
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-900/50 p-1 rounded-xl border border-slate-800 flex items-center self-start md:self-auto">
          <button
            onClick={() => setActiveTab('bulanan')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'bulanan' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Bulanan
          </button>
          <button
            onClick={() => setActiveTab('tahunan')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'tahunan' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Tahunan
          </button>
        </div>
      </div>

      {activeTab === 'bulanan' ? (
        <>
          {/* Filter Bulanan */}
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
              <button onClick={() => handleMonthlyExport('excel')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold transition-all h-[46px]">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => handleMonthlyExport('pdf')} className="flex-1 flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs font-bold transition-all h-[46px]">
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Masuk</p>
              <p className="text-xl font-bold text-emerald-400">{formatRupiah(monthlySummary.totalMasuk)}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Keluar</p>
              <p className="text-xl font-bold text-rose-400">{formatRupiah(monthlySummary.totalKeluar)}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Periode</p>
              <p className="text-xl font-bold text-indigo-400">{formatRupiah(monthlySummary.saldo)}</p>
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
                    {monthlyTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">Tidak ada transaksi di bulan ini.</td>
                      </tr>
                    ) : (
                      monthlyTransactions.map((tx) => (
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
        </>
      ) : (
        <>
          {/* Filter Tahunan */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center gap-4 backdrop-blur-sm">
            <div className="flex-1 w-full">
              <label className="text-xs text-slate-500 block mb-1.5 ml-1 font-medium">Pilih Tahun</label>
              <div className="relative">
                <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(Number(e.target.value))}
                  className="w-full bg-slate-950/50 border border-slate-700/60 hover:border-slate-600 text-slate-200 text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-all shadow-inner appearance-none"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y} className="bg-slate-900 text-slate-200">{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-6 sm:mt-0">
              <button onClick={() => handleAnnualExport('excel')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold transition-all h-[46px]">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => handleAnnualExport('pdf')} className="flex-1 flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs font-bold transition-all h-[46px]">
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Awal {yearFilter}</p>
              <p className="text-lg font-bold text-amber-400">{formatRupiah(annualData.saldoAwal)}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Masuk</p>
              <p className="text-lg font-bold text-emerald-400">{formatRupiah(annualData.totalMasuk)}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Keluar</p>
              <p className="text-lg font-bold text-rose-400">{formatRupiah(annualData.totalKeluar)}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg ring-1 ring-indigo-500/30">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Saldo Akhir {yearFilter}</p>
              <p className="text-lg font-bold text-indigo-200">{formatRupiah(annualData.saldoAkhir)}</p>
            </div>
          </div>

          {/* Tabel Tahunan Sesuai Desain */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-950/80 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800">
                  <tr className="divide-x divide-slate-800/50">
                    <th className="px-4 py-3 text-center" rowSpan={2}>NO</th>
                    <th className="px-4 py-3" rowSpan={2}>Bulan</th>
                    <th className="px-4 py-3 text-center" colSpan={3}>TAHUN : {yearFilter}</th>
                    <th className="px-4 py-3 text-center bg-slate-900/50">SALDO AWAL</th>
                    <th className="px-4 py-3 text-center" colSpan={2}>KETERANGAN</th>
                  </tr>
                  <tr className="divide-x divide-slate-800/50 border-t border-slate-800/50">
                    <th className="px-4 py-3 text-right">PEMASUKAN</th>
                    <th className="px-4 py-3 text-right">PENGELUARAN</th>
                    <th className="px-4 py-3 text-right">JUMLAH</th>
                    <th className="px-4 py-3 text-right bg-amber-400/10 text-amber-300">{formatRupiah(annualData.saldoAwal)}</th>
                    <th className="px-4 py-3">PEMASUKAN</th>
                    <th className="px-4 py-3">PENGELUARAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {annualData.months.map((m) => (
                    <tr key={m.nama} className="divide-x divide-slate-800/30 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-500">{m.index}</td>
                      <td className="px-4 py-3 font-bold text-slate-300">{m.nama}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{m.pemasukan > 0 ? formatRupiah(m.pemasukan) : 'Rp -'}</td>
                      <td className="px-4 py-3 text-right text-rose-400 font-medium">{m.pengeluaran > 0 ? formatRupiah(m.pengeluaran) : 'Rp -'}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{formatRupiah(m.jumlah)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-200 bg-slate-800/20">{formatRupiah(m.saldoAkhir)}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">{m.ketMasuk || '-'}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{m.ketKeluar || '-'}</td>
                    </tr>
                  ))}
                  {/* Summary Footer */}
                  <tr className="divide-x divide-slate-800/50 font-bold bg-slate-950/50">
                    <td colSpan={2} className="px-4 py-4 text-emerald-400 uppercase tracking-widest text-center">Saldo Akhir Kas</td>
                    <td className="px-4 py-4 text-right text-emerald-400">{formatRupiah(annualData.totalMasuk)}</td>
                    <td className="px-4 py-4 text-right text-rose-400">{formatRupiah(annualData.totalKeluar)}</td>
                    <td className="px-4 py-4 text-right text-indigo-400">{formatRupiah(annualData.totalJumlah)}</td>
                    <td className="px-4 py-4 text-right bg-rose-600/20 text-rose-400 ring-1 ring-rose-500/50">{formatRupiah(annualData.saldoAkhir)}</td>
                    <td colSpan={2} className="px-4 py-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tanda Tangan Section */}
          <div className="grid grid-cols-3 gap-8 pt-10 pb-16 text-center text-xs">
            <div className="space-y-16">
              <p className="font-bold text-slate-500 uppercase tracking-widest">Ketua RT</p>
              <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 inline-block min-w-[120px]">
                {getPengurusNames().ketua}
              </p>
            </div>
            <div className="space-y-16">
              <p className="font-bold text-slate-500 uppercase tracking-widest">Sekretaris</p>
              <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 inline-block min-w-[120px]">
                {getPengurusNames().sekretaris}
              </p>
            </div>
            <div className="space-y-16">
              <p className="font-bold text-slate-500 uppercase tracking-widest">Bendahara</p>
              <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 inline-block min-w-[120px]">
                {getPengurusNames().bendahara}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
