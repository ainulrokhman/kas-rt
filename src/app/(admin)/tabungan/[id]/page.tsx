"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  PiggyBank, 
  History, 
  ArrowDownLeft, 
  Loader2, 
  AlertCircle
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { TabunganRepository } from "@/lib/repositories/tabunganRepository";
import { TabunganService } from "@/lib/services/tabunganService";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { TabunganAccount, TabunganTransaction } from "@/types/tabungan";
import { Warga } from "@/types/warga";
import { useAuth } from "@/lib/context/AuthContext";

export default function TabunganDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [warga, setWarga] = useState<Warga | null>(null);
  const [account, setAccount] = useState<TabunganAccount | null>(null);
  const [history, setHistory] = useState<TabunganTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Withdrawal State
  const [nominalTarik, setNominalTarik] = useState<number>(0);
  const [keterangan, setKeterangan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = React.useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const [wData, aData, hData] = await Promise.all([
        WargaRepository.getById(id),
        TabunganRepository.getAccount(id),
        TabunganRepository.getHistoryByWarga(id)
      ]);
      setWarga(wData);
      setAccount(aData);
      setHistory(hData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTarik = async () => {
    if (!user || !warga || nominalTarik <= 0) return;
    if (nominalTarik > (account?.saldo || 0)) {
      alert("Saldo tidak mencukupi!");
      return;
    }

    if (!confirm(`Konfirmasi penarikan tabungan Rp ${nominalTarik.toLocaleString('id-ID')} untuk ${warga.nama_lengkap}?`)) return;

    setSubmitting(true);
    const result = await TabunganService.tarikTabungan(
      user.petugas_id,
      warga.id,
      warga.nama_lengkap,
      nominalTarik,
      keterangan
    );

    if (result.success) {
      alert(result.message);
      setNominalTarik(0);
      setKeterangan("");
      fetchData(); // Refresh
    } else {
      alert(result.message);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      <p className="text-slate-500">Memuat data tabungan...</p>
    </div>
  );

  if (!warga) return (
    <div className="text-center py-20">
      <p className="text-rose-400">Data warga tidak ditemukan.</p>
      <button onClick={() => router.back()} className="mt-4 text-indigo-400 hover:underline">Kembali</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white truncate">{warga.nama_lengkap}</h1>
          <p className="text-sm text-slate-500">Detail & Riwayat Tabungan</p>
        </div>
      </div>

      {/* Account Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <PiggyBank className="w-24 h-24 rotate-12" />
        </div>
        <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">Total Saldo Tabungan</p>
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          Rp {account?.saldo.toLocaleString('id-ID') || "0"}
        </h2>
        <div className="flex items-center gap-2 text-indigo-200 text-xs bg-black/10 w-fit px-3 py-1 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          Update terakhir: {account?.lastUpdatedAt ? new Date(account.lastUpdatedAt).toLocaleDateString('id-ID') : '-'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-rose-400" />
            Pencairan Tabungan
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 px-1">Nominal Penarikan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                <input 
                  type="number"
                  placeholder="0"
                  value={nominalTarik || ""}
                  onChange={(e) => setNominalTarik(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[50000, 100000, 200000].map(val => (
                  <button 
                    key={val}
                    onClick={() => setNominalTarik(val)}
                    className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg transition-colors"
                  >
                    Rp {val/1000}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 px-1">Keterangan (Opsional)</label>
              <input 
                type="text"
                placeholder="Misal: Keperluan sekolah, dll"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 px-4 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleTarik}
              disabled={submitting || nominalTarik <= 0 || nominalTarik > (account?.saldo || 0)}
              className="w-full py-4 bg-rose-600 disabled:bg-slate-700 hover:bg-rose-500 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-rose-600/20"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "PROSES PENARIKAN"}
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Riwayat & Saldo Berjalan
          </h3>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaksi / Keterangan</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.length > 0 ? (() => {
                  const sortedOldest = [...history].sort((a, b) => a.createdAt - b.createdAt);
                  let running = 0;
                  const historyWithBalance = sortedOldest.map(tx => {
                    running += (tx.jenis === 'SETOR' ? tx.nominal : -tx.nominal);
                    return { ...tx, runningBalance: running };
                  });
                  return historyWithBalance.reverse().map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className={`text-sm font-black ${tx.jenis === 'SETOR' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.jenis === 'SETOR' ? '+' : '-'} {tx.nominal.toLocaleString('id-ID')}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-bold text-slate-400">
                              {new Date(tx.tanggal_timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="truncate max-w-[100px] italic">
                              ({tx.keterangan || (tx.jenis === 'SETOR' ? 'Setoran' : 'Penarikan')})
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="text-sm font-black text-indigo-300">
                          {tx.runningBalance.toLocaleString('id-ID')}
                        </p>
                      </td>
                    </tr>
                  ));
                })() : (
                  <tr>
                    <td colSpan={2} className="py-10 text-center text-slate-600 text-sm">
                      Belum ada riwayat transaksi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
