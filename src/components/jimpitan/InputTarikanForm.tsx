"use client";

import { Warga } from "@/types/warga";
import { useState } from "react";
import { JimpitanRepository } from "@/lib/repositories/jimpitanRepository";
import { JimpitanTransaction } from "@/types/jimpitan";
import { CheckCircle2, ChevronRight, MapPin, CheckSquare2 } from "lucide-react";

interface Props {
  wargaList: Warga[];
  petugasId: string;
  selectedDate: string; // YYYY-MM-DD
  dailyTransactions: JimpitanTransaction[];
  defaultNominal: number;
  onSuccess: () => void;
}

export default function InputTarikanForm({ wargaList, petugasId, selectedDate, dailyTransactions, defaultNominal, onSuccess }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [customNominal, setCustomNominal] = useState<Record<string, string>>({});

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
  };

  const handlePay = async (wargaId: string, nominal: number) => {
    if (!petugasId) {
      alert("Sistem error: Petugas ID tidak valid!");
      return;
    }
    
    setLoadingId(wargaId);
    try {
      // Setup payload Date according to selectedDate
      let targetDate = new Date(); // default fallback
      if (selectedDate) {
         const parts = selectedDate.split('-');
         targetDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]), 12, 0, 0); // set to mid-day
      }
      
      const monthStr = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${targetDate.getFullYear()}-${monthStr}`;

      await JimpitanRepository.addTransaction({
        warga_id: wargaId,
        petugas_id: petugasId,
        nominal: nominal,
        tanggal_bayar: targetDate.getTime(),
        bulan_tahun: yearMonth
      });

      setSuccessId(wargaId);
      onSuccess();

      // Hilangkan state success setelah 2 detik
      setTimeout(() => {
        setSuccessId(null);
      }, 2000);

    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan transaksi");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="contents space-y-0">
      {wargaList.map((warga) => {
        
        // Cari tau apakah orang ini udah bayar "hari ini" berdasarkan prop dailyTransactions
        const txBeliOrangIni = dailyTransactions.filter(t => t.warga_id === warga.id);
        const totalBayarHariIni = txBeliOrangIni.reduce((sum, t) => sum + t.nominal, 0);
        const sudahBayarHariIni = totalBayarHariIni > 0;

        return (
        <div key={warga.id} className={`rounded-2xl shadow-lg border p-4 transition-all hover:border-slate-600/80 group relative overflow-hidden backdrop-blur-md
          ${sudahBayarHariIni ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-slate-900/60 border-slate-800/60 hover:bg-slate-800/80'}
        `}>
          {sudahBayarHariIni && (
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none"></div>
          )}

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-start gap-3">
               <div className={`rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-inner border mt-0.5
                 ${sudahBayarHariIni ? 'bg-emerald-900 text-emerald-300 border-emerald-700/50' : 'bg-slate-800 text-slate-300 border-slate-700'}
               `}>
                  {warga.nama_lengkap.charAt(0).toUpperCase()}
               </div>
               <div>
                  <h3 className={`font-semibold text-base ${sudahBayarHariIni ? 'text-emerald-100' : 'text-slate-200'}`}>
                    {warga.nama_lengkap}
                  </h3>
                  
                  {sudahBayarHariIni ? (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                       <CheckSquare2 className="w-3.5 h-3.5" /> Total hari ini: Rp{formatRupiah(totalBayarHariIni)}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                       <MapPin className="w-3 h-3" /> Warga RT
                    </div>
                  )}
               </div>
            </div>
            
            {successId === warga.id && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-medium animate-pulse">
                <CheckCircle2 className="w-3 h-3" /> Sukses
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-2 relative z-10 opacity-90 hover:opacity-100 transition-opacity">
            <button 
              disabled={loadingId === warga.id}
              onClick={() => handlePay(warga.id, defaultNominal)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[65px] disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center flex items-center shadow-sm"
            >
              + {defaultNominal/1000}k
            </button>
            <button 
              disabled={loadingId === warga.id}
              onClick={() => handlePay(warga.id, 5000)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[65px] disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center flex items-center shadow-sm"
            >
              + 5k
            </button>
            <button 
              disabled={loadingId === warga.id}
              onClick={() => handlePay(warga.id, 10000)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 hover:border-pink-500/50 text-slate-300 hover:text-pink-300 px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[65px] disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center flex items-center shadow-sm"
            >
              + 10k
            </button>
            
            <div className="w-full sm:w-auto flex-1 flex gap-2 min-w-[140px] mt-2 sm:mt-0">
               <input 
                  type="number"
                  placeholder="Lainnya..."
                  className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 shadow-inner placeholder:text-slate-600"
                  value={customNominal[warga.id] || ''}
                  onChange={(e) => setCustomNominal({...customNominal, [warga.id]: e.target.value})}
                  disabled={loadingId === warga.id}
               />
               <button 
                  disabled={loadingId === warga.id || !customNominal[warga.id]}
                  onClick={() => {
                    const val = parseInt(customNominal[warga.id]);
                    if(val > 0) {
                      handlePay(warga.id, val);
                      setCustomNominal({...customNominal, [warga.id]: ''});
                    }
                  }}
                  className="bg-indigo-600/90 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center p-2"
                >
                 <ChevronRight className="w-5 h-5 mx-1" />
               </button>
            </div>
          </div>
        </div>
        );
      })}
      
      {wargaList.length === 0 && (
         <div className="col-span-full text-center text-slate-500 py-12 px-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <div className="text-3xl mb-3 opacity-50">👥</div>
            Data warga kosong. Tambahkan warga terlebih dahulu dari menu data warga.
         </div>
      )}
    </div>
  );
}
