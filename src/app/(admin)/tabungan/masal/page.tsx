"use client";

import React, { useState, useEffect } from "react";
import { 
  PiggyBank, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  Loader2, 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { TabunganService } from "@/lib/services/tabunganService";
import { Warga } from "@/types/warga";
import { useAuth } from "@/lib/context/AuthContext";

export default function TabunganMasalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [search, setSearch] = useState("");
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await WargaRepository.getAll();
        setWargaList(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setInputs(prev => ({ ...prev, [id]: num }));
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
    if (totalNominal === 0) return alert("Harap isi nominal tabungan");
    if (!user) return;

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

    const result = await TabunganService.simpanTabunganMasal(
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
            <PiggyBank className="w-6 h-6 text-indigo-400" />
            Setor Tabungan Masal
          </h1>
          <p className="text-sm text-slate-500">Input tabungan banyak warga sekaligus</p>
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
        ) : filteredWarga.map((w) => (
          <div 
            key={w.id} 
            className={`p-4 rounded-2xl border transition-all ${
              (inputs[w.id] || 0) > 0 
                ? 'bg-indigo-600/10 border-indigo-500/50' 
                : 'bg-slate-800/30 border-slate-700/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                  (inputs[w.id] || 0) > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {w.nama_lengkap.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white leading-tight">{w.nama_lengkap}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Warga RT</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Input Nominal */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Rp</span>
                  <input 
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={inputs[w.id] || ""}
                    onChange={(e) => handleInputChange(w.id, e.target.value)}
                    className="w-32 bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                {/* Quick Add Buttons */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => addNominal(w.id, 5000)}
                    className="px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] font-bold text-white transition-colors"
                  >
                    +5k
                  </button>
                  <button 
                    onClick={() => addNominal(w.id, 10000)}
                    className="px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] font-bold text-white transition-colors"
                  >
                    +10k
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 z-50">
        <div className="container mx-auto max-w-lg flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ringkasan Setoran</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black text-white">Rp {totalNominal.toLocaleString('id-ID')}</p>
              <p className="text-xs text-indigo-400 font-bold">({totalWargaDiisi} Warga)</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || totalNominal === 0}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                SIMPAN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
