"use client";

import { useState } from "react";
import { JimpitanRepository } from "@/lib/repositories/jimpitanRepository";
import { Save, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  initialNominal: number;
  onSaved: (newNominal: number) => void;
}

export default function SettingJimpitan({ initialNominal, onSaved }: Props) {
  const [nominal, setNominal] = useState(initialNominal.toString());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await JimpitanRepository.updateGlobalSetting(val);
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
         <h3 className="font-semibold text-slate-200 text-lg">Setting Tarif Global</h3>
      </div>
      
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 mt-4 flex gap-3 text-amber-400/90 text-xs leading-relaxed font-medium">
         <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
         <p>Perubahan tarif hanya akan memengaruhi target di bulan yang masih belum berjalan. Jika bulan ini sudah ditarik, tidak akan berubah. Laporan masa lalu kebal terhadap perubahan ini.</p>
      </div>

      <form onSubmit={handleSave} className="flex gap-3 w-full flex-col sm:flex-row">
        <div className="flex-1">
           <label className="text-xs text-slate-400 mb-1.5 block font-medium ml-1">Nominal (Rp) / Minggu</label>
           <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-medium">Rp</span>
              <input 
                type="number" 
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none shadow-inner transition-colors"
                required
              />
           </div>
        </div>
        <div className="flex items-end mt-2 sm:mt-0">
           <button 
             type="submit" 
             disabled={loading}
             className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
           >
             {loading ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <Save className="w-4 h-4" />
             )}
             {loading ? 'Menyimpan...' : 'Simpan Setelan'}
           </button>
        </div>
      </form>
      
      {success && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-2 animate-pulse">
           <CheckCircle2 className="w-4 h-4" /> Konfigurasi berhasil diterapkan secara global!
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
