"use client";

import React, { useState, useEffect } from "react";
import { X, UserCog, Save } from "lucide-react";
import { PetugasWithWarga, JabatanPetugas, JABATAN_OPTIONS } from "@/types/petugas";
import { PetugasService } from "@/lib/services/petugasService";

interface PetugasFormModalProps {
  petugas: PetugasWithWarga | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PetugasFormModal({
  petugas,
  onClose,
  onSuccess,
}: PetugasFormModalProps) {
  const [jabatan, setJabatan] = useState<JabatanPetugas>("Ketua RT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (petugas) {
      setJabatan(petugas.jabatan);
    }
  }, [petugas]);

  if (!petugas) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await PetugasService.updateJabatan(petugas.id, jabatan);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui jabatan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Ubah Jabatan</p>
              <p className="text-xs text-slate-400 truncate max-w-[180px]">{petugas.nama_lengkap}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pilih Jabatan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {JABATAN_OPTIONS.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setJabatan(j)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all min-h-[44px]
                    ${
                      jabatan === j
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                    }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

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
              id="btn-save-jabatan"
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
