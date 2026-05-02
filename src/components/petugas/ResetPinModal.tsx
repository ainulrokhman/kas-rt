"use client";

import React, { useState, useRef } from "react";
import { X, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { PetugasWithWarga } from "@/types/petugas";
import { PetugasService } from "@/lib/services/petugasService";

interface ResetPinModalProps {
  petugas: PetugasWithWarga | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPinModal({
  petugas,
  onClose,
  onSuccess,
}: ResetPinModalProps) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!petugas) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pinValue.length < 6 || confirmPinValue.length < 6) {
      setError("Harap isi semua 6 digit PIN.");
      return;
    }
    if (pinValue !== confirmPinValue) {
      setError("PIN dan konfirmasi PIN tidak cocok.");
      setConfirmPin(["", "", "", "", "", ""]);
      confirmPinRefs.current[0]?.focus();
      return;
    }

    setIsLoading(true);
    try {
      await PetugasService.resetPin(petugas.id, pinValue);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mereset PIN.");
    } finally {
      setIsLoading(false);
    }
  };

  const PinRow = ({
    label,
    arr,
    setter,
    refs,
    idPrefix,
  }: {
    label: string;
    arr: string[];
    setter: React.Dispatch<React.SetStateAction<string[]>>;
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    idPrefix: string;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex gap-2">
        {arr.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { refs.current[index] = el; }}
            id={`${idPrefix}-${index}`}
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handlePinChange(arr, setter, refs, index, e.target.value)}
            onKeyDown={(e) => handlePinKeyDown(arr, refs, index, e)}
            disabled={isLoading}
            className={`w-full aspect-square text-center text-base font-bold rounded-xl border transition-all focus:outline-none min-h-[44px]
              ${digit
                ? "bg-indigo-600/20 border-indigo-500/70 text-white"
                : "bg-slate-800/60 border-slate-700/60 text-slate-300"
              }
              focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 disabled:opacity-50`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Reset PIN</p>
              <p className="text-xs text-slate-400 truncate max-w-[180px]">{petugas.nama_lengkap}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PinRow
            label="PIN Baru"
            arr={pin}
            setter={setPin}
            refs={pinRefs}
            idPrefix="new-pin"
          />
          <PinRow
            label="Konfirmasi PIN Baru"
            arr={confirmPin}
            setter={setConfirmPin}
            refs={confirmPinRefs}
            idPrefix="confirm-pin"
          />

          {/* Match indicator */}
          {pinValue.length === 6 && confirmPinValue.length === 6 && (
            <div className={`flex items-center gap-1.5 text-xs ${pinValue === confirmPinValue ? "text-emerald-400" : "text-rose-400"}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {pinValue === confirmPinValue ? "PIN cocok" : "PIN tidak cocok"}
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              id="btn-reset-pin-submit"
              type="submit"
              disabled={isLoading || pinValue.length < 6 || confirmPinValue.length < 6}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Reset PIN
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
