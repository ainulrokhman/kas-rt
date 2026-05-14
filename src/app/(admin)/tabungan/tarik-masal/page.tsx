"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  ArrowDownLeft,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { TabunganService } from "@/lib/services/tabunganService";
import { TabunganRepository } from "@/lib/repositories/tabunganRepository";
import { Warga } from "@/types/warga";
import { useAuth } from "@/lib/context/AuthContext";

export default function TarikTabunganMasalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [accounts, setAccounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wData] = await Promise.all([WargaRepository.getAll()]);
        setWargaList(wData);
        
        // Listen to accounts for real-time balance validation
        const unsub = TabunganRepository.observeAccounts((accs) => {
          const accMap: Record<string, number> = {};
          accs.forEach(a => accMap[a.warga_id] = a.saldo);
          setAccounts(accMap);
        });
        
        setLoading(false);
        return () => unsub();
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setInputs(prev => ({ ...prev, [id]: num }));
  };

  const setNominal = (id: string, amount: number) => {
    setInputs(prev => ({ ...prev, [id]: amount }));
  };

  const addNominal = (id: string, amount: number) => {
    setInputs(prev => ({ ...prev, [id]: (prev[id] || 0) + amount }));
  };

  const filteredWarga = wargaList.filter(w => 
    w.nama_lengkap.toLowerCase().includes(search.toLowerCase())
  );

  const totalNominal = Object.values(inputs).reduce((a, b) => a + b, 0);
  const totalWargaDiisi = Object.values(inputs).filter(v => v > 0).length;

  const handleSubmit = async () => {
    if (totalNominal === 0) return alert("Harap isi nominal penarikan");
    if (!user) return;

    if (!confirm(`Konfirmasi penarikan masal total Rp ${totalNominal.toLocaleString('id-ID')} untuk ${totalWargaDiisi} warga?`)) return;

    setSubmitting(true);
    const bulkInputs = Object.entries(inputs)
      .map(([warga_id, nominal]) => ({ warga_id, nominal }))
      .filter(item => item.nominal > 0)
      .map(item => {
        const warga = wargaList.find(w => w.id === item.warga_id);
        return {
          warga_id: item.warga_id,
          nama_lengkap: warga?.nama_lengkap || "Warga Tanpa Nama",
          nominal: item.nominal
        };
      });

    const result = await TabunganService.tarikTabunganMasal(
      user.petugas_id,
      bulkInputs,
      new Date(tanggal).getTime()
    );

    if (result.success) {
      alert(result.message);
      router.push("/tabungan");
    } else {
      alert(result.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-rose-400" />
            Pencairan Tabungan Masal
          </h1>
          <p className="text-sm text-slate-500">Tarik tabungan banyak warga sekaligus</p>
        </div>
      </div>

      {/* Date Picker & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-2 flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Tanggal Transaksi</label>
          <input 
            type="date" 
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="bg-transparent text-white px-2 focus:outline-none font-bold"
          />
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Cari nama warga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/40 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Warga List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-slate-500 text-sm">Memuat data warga...</p>
          </div>
        ) : filteredWarga.map((w) => {
          const saldo = accounts[w.id] || 0;
          const inputVal = inputs[w.id] || 0;
          const isError = inputVal > saldo;

          return (
            <div 
              key={w.id} 
              className={`p-4 rounded-2xl border transition-all ${
                isError 
                  ? 'bg-rose-600/10 border-rose-500/50' 
                  : inputVal > 0 
                    ? 'bg-emerald-600/10 border-emerald-500/50' 
                    : 'bg-slate-800/30 border-slate-700/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    inputVal > 0 ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {w.nama_lengkap.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">{w.nama_lengkap}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                      Saldo: Rp {saldo.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto mt-2">
                  {isError && (
                    <div className="flex items-center gap-1 text-rose-400 animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Saldo kurang!</span>
                    </div>
                  )}

                  {/* Input Nominal */}
                  <div className="relative group/input">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 group-focus-within/input:text-rose-400 transition-colors">Rp</span>
                    <input 
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={inputs[w.id] || ""}
                      onChange={(e) => handleInputChange(w.id, e.target.value)}
                      className={`w-full sm:w-48 bg-slate-900/50 border rounded-xl py-3 pl-9 pr-3 text-white text-base font-black focus:outline-none transition-all ${
                        isError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                  
                  {/* Quick Buttons Grid */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[10000, 20000, 50000, 100000].map(amount => (
                      <button 
                        key={amount}
                        onClick={() => addNominal(w.id, amount)}
                        disabled={saldo <= 0}
                        className="px-1 py-2 bg-slate-800 hover:bg-rose-600 disabled:bg-slate-900 disabled:text-slate-700 border border-slate-700/50 hover:border-rose-500 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all active:scale-90 shadow-sm"
                      >
                        +{amount/1000}k
                      </button>
                    ))}
                    <button 
                      onClick={() => setNominal(w.id, saldo)}
                      disabled={saldo <= 0}
                      className="px-1 py-2 bg-rose-600/10 border border-rose-500/50 hover:bg-rose-600 text-rose-400 hover:text-white disabled:bg-slate-900 disabled:text-slate-700 disabled:border-slate-800 rounded-lg text-[10px] font-black transition-all active:scale-90 shadow-sm"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Summary Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 z-50">
        <div className="container mx-auto max-w-lg flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Total Pencairan</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black text-white">Rp {totalNominal.toLocaleString('id-ID')}</p>
              <p className="text-xs text-rose-400 font-bold">({totalWargaDiisi} Warga)</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || totalNominal === 0 || Object.entries(inputs).some(([id, val]) => val > (accounts[id] || 0))}
            className="flex items-center gap-2 px-8 py-4 bg-rose-600 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-rose-500 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-rose-600/30"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ArrowDownLeft className="w-5 h-5" />
                CAIRKAN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
