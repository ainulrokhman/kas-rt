"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, RefreshCw, UserCog } from "lucide-react";
import Link from "next/link";
import { PetugasWithWarga } from "@/types/petugas";
import { PetugasService } from "@/lib/services/petugasService";
import { PetugasTable } from "@/components/petugas/PetugasTable";
import { PetugasFormModal } from "@/components/petugas/PetugasFormModal";
import { ResetPinModal } from "@/components/petugas/ResetPinModal";

export default function PetugasPage() {
  const [data, setData] = useState<PetugasWithWarga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<PetugasWithWarga | null>(null);
  const [resetPinTarget, setResetPinTarget] = useState<PetugasWithWarga | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await PetugasService.getAll();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data petugas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleActive = async (petugas: PetugasWithWarga) => {
    setActionLoading(petugas.id);
    try {
      await PetugasService.toggleActive(petugas.id, !petugas.is_active);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = data.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <UserCog className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Manajemen Petugas</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {isLoading ? "Memuat..." : `${activeCount} petugas aktif · ${data.length} total`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-petugas"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/petugas/tambah"
            id="btn-tambah-petugas"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Petugas
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["Ketua RT", "Sekretaris", "Bendahara", "Penarik Jimpitan"] as const).map((jabatan) => {
            const count = data.filter((p) => p.jabatan === jabatan && p.is_active).length;
            return (
              <div key={jabatan} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-100">{count}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{jabatan}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 sm:p-5">
        <PetugasTable
          data={data}
          isLoading={isLoading}
          onEditJabatan={setEditTarget}
          onResetPin={setResetPinTarget}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Modals */}
      {editTarget && (
        <PetugasFormModal
          petugas={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={fetchData}
        />
      )}
      {resetPinTarget && (
        <ResetPinModal
          petugas={resetPinTarget}
          onClose={() => setResetPinTarget(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
