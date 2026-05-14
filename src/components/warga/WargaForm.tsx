"use client";

import React, { useState } from "react";
import { Warga, WargaInput } from "@/types/warga";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { X, Save, UserPlus, UserCog } from "lucide-react";

interface WargaFormProps {
  initialData?: Warga;
  onClose: (needsRefresh?: boolean) => void;
}

export default function WargaForm({ initialData, onClose }: WargaFormProps) {
  const [formData, setFormData] = useState<WargaInput>({
    nama_lengkap: initialData?.nama_lengkap || "",
    jenis_kelamin: initialData?.jenis_kelamin || "L",
    nomor_hp: initialData?.nomor_hp || "",
    dikecualikan_jimpitan: !!initialData?.dikecualikan_jimpitan,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.nama_lengkap.trim()) {
      setError("Nama lengkap tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await WargaRepository.update(initialData.id, formData);
      } else {
        await WargaRepository.create(formData);
      }
      onClose(true); // close and refresh list
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={() => onClose(false)}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 rounded-2xl sm:rounded-[2rem] border border-slate-700/60 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Decorative Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              {initialData ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight leading-none mb-1">
                {initialData ? "Edit Data Warga" : "Warga Baru"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {initialData ? "Ubah informasi warga yang sudah ada" : "Tambahkan anggota warga baru ke sistem"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all self-start -mt-1"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:px-8 md:py-7 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400 flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
              {error}
            </div>
          )}

          <form id="wargaForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="nama_lengkap" className="block text-sm font-semibold text-slate-300">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="nama_lengkap"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleChange}
                placeholder="Misal: Budi Santoso"
                className="w-full bg-slate-950/50 border border-slate-700/60 hover:border-slate-500 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 font-medium tracking-wide shadow-inner"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="jenis_kelamin" className="block text-sm font-semibold text-slate-300">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="jenis_kelamin"
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-700/60 hover:border-slate-500 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none font-medium shadow-inner"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="nomor_hp" className="block text-sm font-semibold text-slate-300">
                Nomor WhatsApp <span className="text-slate-500 font-normal ml-1">((Opsional))</span>
              </label>
              <input
                type="text"
                id="nomor_hp"
                name="nomor_hp"
                value={formData.nomor_hp}
                onChange={handleChange}
                placeholder="Misal: 08123456789"
                className="w-full bg-slate-950/50 border border-slate-700/60 hover:border-slate-500 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 font-medium tracking-wide shadow-inner"
                autoComplete="off"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="dikecualikan_jimpitan"
                    name="dikecualikan_jimpitan"
                    checked={formData.dikecualikan_jimpitan}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full border border-slate-700 peer-checked:bg-indigo-600 peer-checked:border-indigo-500 transition-all duration-300"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full peer-checked:translate-x-5 peer-checked:bg-white transition-all duration-300 shadow-sm"></div>
                </div>
                <div className="flex-1">
                  <span className="block text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                    Pengecualian Tarikan Jimpitan
                  </span>
                  <span className="block text-[10px] text-slate-500 font-medium">
                    Aktifkan jika warga dibebaskan dari iuran (misal: rumah kosong)
                  </span>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-5 border-t border-slate-700/50 bg-slate-800/30 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            form="wargaForm"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:ring-4 focus:ring-indigo-500/30 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Simpan Data
          </button>
        </div>
      </div>
    </div>
  );
}
