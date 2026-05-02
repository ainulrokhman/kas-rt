"use client";

import { useState, useEffect } from "react";
import { SystemRepository } from "@/lib/repositories/systemRepository";
import { AuthService } from "@/lib/services/authService";
import { Key, Save, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SettingSistem() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      const allowedRoles = ["Ketua RT", "Sekretaris", "Bendahara"];
      setIsAuthorized(allowedRoles.includes(session.jabatan));
    }
  }, []);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;

    if (pin.length !== 6 || isNaN(Number(pin))) {
      setMessage({ type: "error", text: "PIN harus 6 digit angka." });
      return;
    }

    if (pin !== confirmPin) {
      setMessage({ type: "error", text: "Konfirmasi PIN tidak cocok." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Kita lakukan hashing di client sebelum kirim? 
      // AuthService.hashPin menggunakan Web Crypto API.
      const hashedPin = await AuthService.hashPin(pin);
      
      // Update langsung via repository (karena ini client component di protected route)
      // Idealnya via API, tapi di project ini nampaknya repository dipanggil langsung di client.
      await SystemRepository.updatePublicPin(hashedPin);
      
      setMessage({ type: "success", text: "PIN Umum berhasil diperbarui." });
      setPin("");
      setConfirmPin("");
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Gagal memperbarui PIN." });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mt-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 text-amber-500 mb-2">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-lg font-bold">Pengaturan Sistem</h2>
        </div>
        <p className="text-slate-400 text-sm italic">
          Hanya Ketua RT, Sekretaris, dan Bendahara yang dapat mengubah pengaturan sistem ini.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6 shadow-xl relative overflow-hidden group">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
      
      <div className="flex items-center gap-3 text-emerald-400 mb-6 relative">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">PIN Akses Publik</h2>
          <p className="text-xs text-slate-500">Kelola PIN yang digunakan warga untuk melihat laporan rinci</p>
        </div>
      </div>

      <form onSubmit={handleUpdatePin} className="space-y-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">PIN Baru (6 Digit)</label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-center tracking-[0.5em]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Konfirmasi PIN</label>
            <input
              type="password"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••••"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-center tracking-[0.5em]"
            />
          </div>
        </div>

        {message.text && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !pin || !confirmPin}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Perbarui PIN Publik
            </>
          )}
        </button>
      </form>
    </div>
  );
}
