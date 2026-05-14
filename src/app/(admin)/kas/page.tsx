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
    setLoading(true);
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
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight">
            Buku Kas RT
          </h1>
          <p className="text-slate-400 font-medium tracking-wide text-sm mt-1">
            Pencatatan arus kas masuk dan keluar warga
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Jimpitan
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Saldo</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(summary.saldo)}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Masuk</p>
          <p className="text-2xl font-bold text-emerald-400">{formatRupiah(summary.totalMasuk)}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Keluar</p>
          <p className="text-2xl font-bold text-rose-400">{formatRupiah(summary.totalKeluar)}</p>
        </div>
      </div>


        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200 px-1">Riwayat Transaksi</h2>
          {transactions.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-10 text-center">
              <Info className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">Belum ada transaksi kas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const petugas = petugasMap[tx.petugas_id];
                return (
                  <div
                    key={tx.id}
                    className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between group hover:bg-slate-900/80 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.jenis === "MASUK" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      }`}>
                        {tx.jenis === "MASUK" ? <ArrowDownCircle className="w-6 h-6" /> : <ArrowUpCircle className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-100 truncate">{tx.keterangan}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                              {tx.kategori}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {tx.tanggal}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                            <User className="w-3 h-3 text-indigo-400" />
                            <p className="text-[11px] text-slate-400 font-medium">
                              {petugas?.nama_lengkap || "Sistem"}
                              <span className="text-[10px] text-slate-600 ml-1">
                                ({petugas?.jabatan || "-"})
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4 flex-shrink-0">
                      <div>
                        <p className={`font-bold ${tx.jenis === "MASUK" ? "text-emerald-400" : "text-rose-400"}`}>
                          {tx.jenis === "MASUK" ? "+" : "-"} {formatRupiah(tx.nominal)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
