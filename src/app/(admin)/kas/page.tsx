"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, Calendar, Trash2, Info, User } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { KasRepository } from "@/lib/repositories/kasRepository";
import { KasService } from "@/lib/services/kasService";
import { PetugasService } from "@/lib/services/petugasService";
import { PetugasWithWarga } from "@/types/petugas";
import { KasTransaction, KasSummary } from "@/types/kas";
import { formatRupiah } from "@/lib/utils/exportUtils";
import AddTransactionModal from "@/components/kas/AddTransactionModal";
import SyncJimpitanModal from "@/components/kas/SyncJimpitanModal";

export default function KasPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<KasTransaction[]>([]);
  const [petugasMap, setPetugasMap] = useState<Record<string, PetugasWithWarga>>({});
  const [summary, setSummary] = useState<KasSummary>({ totalMasuk: 0, totalKeluar: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const petugasList = await PetugasService.getAll();
        const map: Record<string, PetugasWithWarga> = {};
        petugasList.forEach(p => { map[p.id] = p; });
        setPetugasMap(map);
      } catch (err) {
        console.error("Gagal load petugas:", err);
      }
    };

    loadInitialData();
    const unsubscribe = KasRepository.observeTransactions((txs) => {
      setTransactions(txs);
      setSummary(KasService.calculateSummary(txs));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      await KasRepository.deleteTransaction(id);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-20 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#4f46e533,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tight">
              Buku Kas <span className="text-indigo-500">RT</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-8 h-[1px] bg-indigo-500/50"></span>
               Arus Kas Transparan
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-800 text-indigo-400 border border-slate-700/50 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/20"
            >
              <RefreshCw className="w-4 h-4" />
              Sync
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2rem] p-6 shadow-2xl shadow-indigo-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Saldo Saat Ini</p>
            <p className="text-3xl font-black text-white tracking-tight">{formatRupiah(summary.saldo)}</p>
          </div>
          
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-[2rem] p-6 shadow-2xl shadow-emerald-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em]">Total Masuk</p>
            </div>
            <p className="text-3xl font-black text-emerald-400 tracking-tight">{formatRupiah(summary.totalMasuk)}</p>
          </div>

          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-rose-500/20 rounded-[2rem] p-6 shadow-2xl shadow-rose-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
               <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-[0.2em]">Total Keluar</p>
            </div>
            <p className="text-3xl font-black text-rose-400 tracking-tight">{formatRupiah(summary.totalKeluar)}</p>
          </div>
        </div>


        {/* Riwayat Transaksi Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold text-slate-100 tracking-tight">Riwayat Transaksi</h2>
            <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
              {transactions.length} Records
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2rem] p-12 text-center backdrop-blur-sm shadow-inner">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/30">
                <Info className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada transaksi kas yang tercatat.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {transactions.map((tx) => {
                const petugas = petugasMap[tx.petugas_id];
                const isMasuk = tx.jenis === "MASUK";
                
                return (
                  <div
                    key={tx.id}
                    className="group relative bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/50 rounded-[1.5rem] p-4 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 overflow-hidden"
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${isMasuk ? 'bg-emerald-500' : 'bg-rose-500'} opacity-50`}></div>
                    
                    <div className="flex flex-col gap-3">
                      {/* Top Row: Icon, Title, Nominal */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                            isMasuk ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          }`}>
                            {isMasuk ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-100 text-sm md:text-base leading-tight truncate">
                              {tx.keterangan}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 uppercase tracking-wider border border-slate-700/50">
                                {tx.kategori}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3" />
                                {tx.tanggal}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className={`font-black text-sm md:text-base ${isMasuk ? "text-emerald-400" : "text-rose-400"}`}>
                            {isMasuk ? "+" : "-"} {formatRupiah(tx.nominal).replace('Rp', '').trim()}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Row: Petugas & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
                            <User className="w-2.5 h-2.5 text-indigo-400" />
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-tight">
                            {petugas?.nama_lengkap || "Sistem"} 
                            <span className="text-slate-600 font-medium ml-1">({petugas?.jabatan || "-"})</span>
                          </p>
                        </div>

                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        petugasId={user?.petugas_id || ""}
      />
      <SyncJimpitanModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        petugasId={user?.petugas_id || ""}
      />
    </div>
  );
}
