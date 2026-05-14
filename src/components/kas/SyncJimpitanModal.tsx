"use client";

import { useState } from "react";
import { X, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { KasService } from "@/lib/services/kasService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  petugasId: string;
}

export default function SyncJimpitanModal({ isOpen, onClose, petugasId }: Props) {
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [mingguKe, setMingguKe] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!isOpen) return null;

  // Hitung jumlah minggu (Kamis) di bulan terpilih
  const countWeeks = (yearMonth: string) => {
    const [y, m] = yearMonth.split("-").map(Number);
    let count = 0;
    const date = new Date(y, m - 1, 1);
    while (date.getMonth() === m - 1) {
      if (date.getDay() === 4) count++;
      date.setDate(date.getDate() + 1);
    }
    return count || 1;
  };

  const totalWeeks = countWeeks(month);

  const handleSync = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const result = await KasService.syncJimpitanWeeklyToKas(month, mingguKe, petugasId);
      if (result.success) {
        setStatus({ type: "success", message: result.message });
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 2000);
      } else {
        setStatus({ type: "error", message: result.message });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Terjadi kesalahan sistem saat sinkronisasi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-100">Sync Jimpitan Mingguan</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <RefreshCw className={`w-8 h-8 ${loading ? "animate-spin" : ""}`} />
            </div>
            <p className="text-sm text-slate-400">
              Pilih bulan dan minggu jimpitan yang ingin ditarik rekapitulasinya ke Buku Kas RT.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                  Bulan
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setMingguKe(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                  Minggu Ke
                </label>
                <select
                  value={mingguKe}
                  onChange={(e) => setMingguKe(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>Minggu {w}</option>
                  ))}
                </select>
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                status.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}>
                {status.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-xs font-medium leading-relaxed">{status.message}</p>
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Tarik Rekap Sekarang"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
