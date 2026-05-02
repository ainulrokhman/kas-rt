"use client";

import React from "react";
import { PetugasWithWarga, JabatanPetugas } from "@/types/petugas";
import {
  Phone,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  Edit2,
  ShieldCheck,
  Users,
} from "lucide-react";

const JABATAN_COLOR: Record<JabatanPetugas, string> = {
  "Ketua RT": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  Sekretaris: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Bendahara: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Penarik Jimpitan": "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

interface PetugasTableProps {
  data: PetugasWithWarga[];
  isLoading: boolean;
  onEditJabatan: (petugas: PetugasWithWarga) => void;
  onResetPin: (petugas: PetugasWithWarga) => void;
  onToggleActive: (petugas: PetugasWithWarga) => void;
}

export function PetugasTable({
  data,
  isLoading,
  onEditJabatan,
  onResetPin,
  onToggleActive,
}: PetugasTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-slate-800/50 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Users className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-medium">Belum ada petugas terdaftar</p>
        <p className="text-sm mt-1">Tambah petugas pertama via tombol di atas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((petugas) => (
        <div
          key={petugas.id}
          className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all duration-200
            ${
              petugas.is_active
                ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50"
                : "bg-slate-900/40 border-slate-800/30 opacity-60"
            }`}
        >
          {/* Avatar & Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner
              ${petugas.is_active ? "bg-indigo-500/20" : "bg-slate-700/50"}`}
            >
              <ShieldCheck
                className={`w-5 h-5 ${petugas.is_active ? "text-indigo-400" : "text-slate-500"}`}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-100 text-sm truncate">
                {petugas.nama_lengkap}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="text-xs text-slate-400">{petugas.nomor_hp}</span>
              </div>
            </div>
          </div>

          {/* Jabatan badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${JABATAN_COLOR[petugas.jabatan]}`}
            >
              {petugas.jabatan}
            </span>

            {/* Status */}
            <span
              className={`hidden sm:inline text-xs px-2 py-1 rounded-full ${
                petugas.is_active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {petugas.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id={`btn-edit-jabatan-${petugas.id}`}
              onClick={() => onEditJabatan(petugas)}
              title="Ubah jabatan"
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              id={`btn-reset-pin-${petugas.id}`}
              onClick={() => onResetPin(petugas)}
              title="Reset PIN"
              className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              id={`btn-toggle-active-${petugas.id}`}
              onClick={() => onToggleActive(petugas)}
              title={petugas.is_active ? "Nonaktifkan" : "Aktifkan"}
              className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center
                ${
                  petugas.is_active
                    ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                }`}
            >
              {petugas.is_active ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
