"use client";

import { useState } from "react";
import { JimpitanRepository } from "@/lib/repositories/jimpitanRepository";
import { Save, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  initialNominal: number;
  currentYearMonth: string;
  onSaved: (newNominal: number) => void;
}

export default function SettingJimpitan({ initialNominal, currentYearMonth, onSaved }: Props) {
  const [nominal, setNominal] = useState(initialNominal.toString());
  const [applyToCurrentMonth, setApplyToCurrentMonth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [y, m] = currentYearMonth.split("-");
  const namaBulan = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(nominal);
    if (!val || val < 0) {
      alert("Masukkan nominal yang valid");
      return;
    }

    setLoading(true);
    setSuccess(false);
    try {
      // 1. Update Global Setting (untuk bulan-bulan mendatang)
      await JimpitanRepository.updateGlobalSetting(val);
      
      // 2. Jika dipilih, update juga target bulan berjalan
      if (applyToCurrentMonth) {
        await JimpitanRepository.updateMonthTargetNominal(currentYearMonth, val);
      }

      onSaved(val);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Gagal merubah setting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800/60 p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
      
      <div className="flex items-center gap-3 mb-2">
         <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
            <SettingsIcon className="w-5 h-5" />
         </div>
         <h3 className="font-semibold text-slate-200 text-lg">Konfigurasi Tarif Jimpitan</h3>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6 mt-4 space-y-3">
         <div className="flex gap-3 text-amber-400/90 text-xs leading-relaxed font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Tarif global digunakan sebagai acuan otomatis saat memasuki bulan baru. Perubahan di sini tidak akan mengubah data transaksi yang sudah tersimpan.</p>
         </div>
         
         <label className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-950/60 transition-colors group">
            <input 
               type="checkbox" 
               checked={applyToCurrentMonth}
               onChange={(e) => setApplyToCurrentMonth(e.target.checked)}
               className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
            />
            <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">Terapkan juga untuk bulan {namaBulan}</span>
               <span className="text-[10px] text-slate-500">Jika dicentang, target mingguan bulan ini akan langsung diperbarui.</span>
            </div>
         </label>
      </div>

      <form onSubmit={handleSave} className="flex gap-4 w-full flex-col sm:flex-row">
        <div className="flex-1">
           <label className="text-xs text-slate-400 mb-1.5 block font-bold uppercase tracking-wider ml-1">Nominal / Minggu</label>
           <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-bold">Rp</span>
              <input 
                type="number" 
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-sm font-bold rounded-xl pl-10 pr-4 py-3.5 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none shadow-inner transition-colors"
                placeholder="Contoh: 2000"
                required
              />
           </div>
        </div>
        <div className="flex items-end">
           <button 
             type="submit" 
             disabled={loading}
             className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
           >
             {loading ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <Save className="w-4 h-4" />
             )}
             {loading ? 'Menyimpan...' : 'Update Tarif'}
           </button>
        </div>
      </form>
      
      {success && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2 animate-pulse shadow-lg shadow-emerald-500/5">
           <CheckCircle2 className="w-4 h-4" /> Tarif berhasil diperbarui dan diterapkan!
        </div>
      )}
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
