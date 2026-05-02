"use client";

import React, { useState, useRef, useEffect } from "react";
import { ShieldCheck, Phone, Eye, EyeOff, LogIn, Lock } from "lucide-react";
import { AuthService } from "@/lib/services/authService";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [nomorHp, setNomorHp] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect jika sudah login
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handlePinChange = (index: number, value: string) => {
    // Hanya terima angka
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus ke kotak berikutnya
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newPin = [...pin];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newPin[i] = char;
    });
    setPin(newPin);
    // Focus ke kotak terakhir yang terisi atau yang berikutnya
    const nextEmpty = newPin.findIndex((v) => !v);
    pinRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pinValue = pin.join("");
    if (pinValue.length < 6) {
      setError("Harap isi semua 6 digit PIN.");
      return;
    }
    if (!nomorHp.trim()) {
      setError("Nomor HP tidak boleh kosong.");
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.login({ nomor_hp: nomorHp.trim(), pin: pinValue });
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
      // Reset PIN on error
      setPin(["", "", "", "", "", ""]);
      pinRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const pinValue = pin.join("");

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm">
        {/* Glow border */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/30 to-violet-500/30 rounded-2xl blur-sm" />

        <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
          {/* Top bar gradient */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

          <div className="p-6 sm:p-8">
            {/* Logo & Title */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                <ShieldCheck className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                KasRT Admin
              </h1>
              <p className="text-sm text-slate-400 mt-1 text-center">
                Masuk sebagai Petugas RT
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nomor HP */}
              <div className="space-y-1.5">
                <label
                  htmlFor="nomor_hp"
                  className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  Nomor HP
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="nomor_hp"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Contoh: 081234567890"
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    disabled={isLoading}
                    autoComplete="tel"
                    className="w-full bg-slate-800/60 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all disabled:opacity-50 min-h-[48px]"
                  />
                </div>
              </div>

              {/* PIN Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    PIN 6 Digit
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPin ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>

                <div className="flex gap-1.5 sm:gap-2 justify-between" onPaste={handlePinPaste}>
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { pinRefs.current[index] = el; }}
                      id={`pin-${index}`}
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      disabled={isLoading}
                      className={`w-full aspect-square text-center text-base sm:text-lg font-bold rounded-xl border transition-all focus:outline-none
                        ${digit
                          ? "bg-indigo-600/20 border-indigo-500/70 text-white"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-300"
                        }
                        focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 disabled:opacity-50`}
                    />
                  ))}
                </div>

                {/* PIN progress dots */}
                <div className="flex justify-center gap-1.5 pt-1">
                  {pin.map((d, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${d ? "w-5 bg-indigo-500" : "w-3 bg-slate-700"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl px-4 py-3">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="btn-login"
                type="submit"
                disabled={isLoading || pinValue.length < 6 || !nomorHp.trim()}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl py-3.5 text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-slate-600 mt-6">
              Sistem Manajemen Kas RT • Hanya untuk Petugas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
