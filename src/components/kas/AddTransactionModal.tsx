"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { KasRepository } from "@/lib/repositories/kasRepository";
import { JenisKas, KategoriKas } from "@/types/kas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  petugasId: string;
}

export default function AddTransactionModal({ isOpen, onClose, petugasId }: Props) {
  const [jenis, setJenis] = useState<JenisKas>("MASUK");
  const [kategori, setKategori] = useState<KategoriKas>("LAINNYA");
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [keterangan, setKeterangan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || !keterangan) return;

    setSubmitting(true);
    try {
      await KasRepository.addTransaction({
        jenis,
        kategori,
        nominal: parseInt(nominal),
        tanggal,
        tanggal_timestamp: new Date(tanggal).getTime(),
        keterangan,
        petugas_id: petugasId,
      });
      onClose();
      // Reset form
      setNominal("");
      setKeterangan("");
      setKategori("LAINNYA");
    } catch (err) {
      console.error(err);
      alert("Gagal menambah transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-100">Tambah Transaksi Kas</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Jenis Transaksi */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setJenis("MASUK")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                jenis === "MASUK" ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-slate-500"
              }`}
            >
              KAS MASUK
            </button>
            <button
              type="button"
              onClick={() => setJenis("KELUAR")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                jenis === "KELUAR" ? "bg-rose-500/20 text-rose-400 shadow-sm" : "text-slate-500"
              }`}
            >
              KAS KELUAR
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                Tanggal
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as KategoriKas)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="LAINNYA">Lainnya</option>
                <option value="OPERASIONAL">Operasional</option>
                <option value="SOSIAL">Sosial</option>
                <option value="PEMBANGUNAN">Pembangunan</option>
                <option value="JIMPITAN">Jimpitan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
              Nominal (Rp)
            </label>
            <input
              type="number"
              required
              placeholder="0"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-lg font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
              Keterangan
            </label>
            <textarea
              required
              rows={2}
              placeholder="Contoh: Beli iuran sampah bulan Mei"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Transaksi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
