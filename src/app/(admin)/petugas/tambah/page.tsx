"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, UserPlus, UserCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { PetugasService } from "@/lib/services/petugasService";
import { Warga } from "@/types/warga";
import { JabatanPetugas, JABATAN_OPTIONS } from "@/types/petugas";

export default function TambahPetugasPage() {
  const router = useRouter();
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [search, setSearch] = useState("");
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
  const [jabatan, setJabatan] = useState<JabatanPetugas>("Ketua RT");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [isLoadingWarga, setIsLoadingWarga] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    WargaRepository.getAll()
      .then(setWargaList)
      .finally(() => setIsLoadingWarga(false));
  }, []);

  const filtered = wargaList.filter(
    (w) =>
      w.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      w.nomor_hp.includes(search)
  );

  const handlePinChange = (
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    value: string
  ) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...arr];
    next[index] = value;
    setter(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (
    arr: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const pinValue = pin.join("");
  const confirmPinValue = confirmPin.join("");
  const pinMatch = pinValue.length === 6 && confirmPinValue.length === 6 && pinValue === confirmPinValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedWarga) return setError("Pilih warga terlebih dahulu.");
    if (pinValue.length < 6) return setError("PIN harus 6 digit.");
    if (pinValue !== confirmPinValue) return setError("PIN dan konfirmasi tidak cocok.");

    setIsSubmitting(true);
    try {
      await PetugasService.create(selectedWarga.id, jabatan, pinValue);
      router.push("/petugas");
    } catch (err: any) {
      setError(err.message || "Gagal menambah petugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/petugas"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Tambah Petugas</h1>
          <p className="text-sm text-slate-400">Daftarkan warga sebagai petugas RT</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Pilih Warga */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
            Pilih Warga
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all min-h-[44px]"
            />
          </div>

          {/* Warga list */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
            {isLoadingWarga ? (
              <div className="text-center py-4 text-slate-500 text-sm">Memuat data warga...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">Tidak ada warga ditemukan</div>
            ) : (
              filtered.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWarga(w)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all min-h-[44px]
                    ${selectedWarga?.id === w.id
                      ? "bg-indigo-600/20 border border-indigo-500/50"
                      : "hover:bg-slate-800/60 border border-transparent"
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-300">
                    {w.nama_lengkap.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{w.nama_lengkap}</p>
                    <p className="text-xs text-slate-400">{w.nomor_hp}</p>
                  </div>
                  {selectedWarga?.id === w.id && (
                    <UserCheck className="w-4 h-4 text-indigo-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {selectedWarga && (
            <div className="flex items-center gap-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-300">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium">{selectedWarga.nama_lengkap} dipilih</span>
            </div>
          )}
        </div>

        {/* Step 2: Pilih Jabatan */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
            Pilih Jabatan
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {JABATAN_OPTIONS.map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setJabatan(j)}
                className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all min-h-[48px]
                  ${jabatan === j
                    ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                  }`}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Set PIN */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
              Set PIN (6 Digit)
            </h2>
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPin ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>

          {/* PIN Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">PIN Baru</label>
            <div className="flex gap-2">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { pinRefs.current[i] = el; }}
                  id={`pin-${i}`}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(pin, setPin, pinRefs, i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(pin, pinRefs, i, e)}
                  className={`w-full aspect-square text-center text-base font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all min-h-[44px]
                    ${digit ? "bg-indigo-600/20 border-indigo-500/70 text-white" : "bg-slate-800/60 border-slate-700/60"}`}
                />
              ))}
            </div>
          </div>

          {/* Confirm PIN */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">Konfirmasi PIN</label>
            <div className="flex gap-2">
              {confirmPin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { confirmPinRefs.current[i] = el; }}
                  id={`confirm-pin-${i}`}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(confirmPin, setConfirmPin, confirmPinRefs, i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(confirmPin, confirmPinRefs, i, e)}
                  className={`w-full aspect-square text-center text-base font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all min-h-[44px]
                    ${digit ? "bg-indigo-600/20 border-indigo-500/70 text-white" : "bg-slate-800/60 border-slate-700/60"}`}
                />
              ))}
            </div>
          </div>

          {/* Match indicator */}
          {pinValue.length === 6 && confirmPinValue.length === 6 && (
            <p className={`text-xs ${pinMatch ? "text-emerald-400" : "text-rose-400"}`}>
              {pinMatch ? "✓ PIN cocok" : "✗ PIN tidak cocok"}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          id="btn-submit-petugas"
          type="submit"
          disabled={isSubmitting || !selectedWarga || !pinMatch}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed min-h-[52px]"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Daftarkan Petugas
            </>
          )}
        </button>
      </form>
    </div>
  );
}
