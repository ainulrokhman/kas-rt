"use client";

import React, { useState, useEffect } from "react";
import { Warga } from "@/types/warga";
import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { Pencil, Trash2, Search, Plus, UserPlus } from "lucide-react";
import WargaForm from "./WargaForm";

import { useAuth } from "@/lib/context/AuthContext";

export default function WargaList() {
  const { user } = useAuth();
  const [warga, setWarga] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState<Warga | undefined>(undefined);

  const fetchWarga = async () => {
    try {
      setLoading(true);
      const data = await WargaRepository.getAll();
      setWarga(data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data warga");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus data warga ${name}?`)) return;
    try {
      await WargaRepository.delete(id);
      fetchWarga();
    } catch (err: unknown) {
      alert("Gagal menghapus: " + (err instanceof Error ? err.message : "Terjadi kesalahan"));
    }
  };

  const openEdit = (w: Warga) => {
    setSelectedWarga(w);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setSelectedWarga(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = (needsRefresh?: boolean) => {
    setIsFormOpen(false);
    if (needsRefresh) fetchWarga();
  };

  const filteredWarga = warga.filter((w) =>
    w.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || 
    w.nomor_hp.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-indigo-400" /> Data Warga
        </h1>
        {user?.jabatan !== 'Penarik Jimpitan' && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Tambah Warga
          </button>
        )}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 lg:p-6 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 border-b border-slate-800/80">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">No</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis Kelamin</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nomor HP</th>
                {user?.jabatan !== 'Penarik Jimpitan' && (
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredWarga.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data warga ditemukan.
                  </td>
                </tr>
              ) : (
                filteredWarga.map((w, index) => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-200">{w.nama_lengkap}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      <span className={`px-2 py-1 rounded-md text-xs border ${w.jenis_kelamin === 'L' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
                        {w.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {w.nomor_hp ? (
                        <a href={`https://wa.me/${w.nomor_hp.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">
                          {w.nomor_hp}
                        </a>
                      ) : '-'}
                    </td>
                    {user?.jabatan !== "Penarik Jimpitan" && (
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(w)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(w.id, w.nama_lengkap)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {loading ? (
            <div className="py-10 flex flex-col justify-center items-center space-y-3 bg-slate-800/20 border border-slate-800/50 rounded-xl">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-slate-400">Memuat data...</span>
            </div>
          ) : filteredWarga.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 bg-slate-800/20 border border-slate-800/50 rounded-xl">
              Tidak ada data warga ditemukan.
            </div>
          ) : (
            filteredWarga.map((w) => (
              <div key={w.id} className="bg-slate-800/30 border border-slate-800/50 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-200 leading-tight">{w.nama_lengkap}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${w.jenis_kelamin === 'L' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
                        {w.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </div>
                  </div>
                  {user?.jabatan !== "Penarik Jimpitan" && (
                    <div className="flex items-center bg-slate-900/60 rounded-lg p-0.5 border border-slate-800">
                      <button
                        onClick={() => openEdit(w)}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-all touch-manipulation"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-800"></div>
                      <button
                        onClick={() => handleDelete(w.id, w.nama_lengkap)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-all touch-manipulation"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-sm">
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Nomor HP</span>
                  {w.nomor_hp ? (
                    <a href={`https://wa.me/${w.nomor_hp.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium">
                      {w.nomor_hp}
                    </a>
                  ) : (
                    <span className="text-slate-600 italic text-sm">-</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isFormOpen && (
        <WargaForm 
          initialData={selectedWarga} 
          onClose={handleFormClose} 
        />
      )}
    </div>
  );
}
