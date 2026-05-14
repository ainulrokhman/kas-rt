"use client";

import React, { useState, useEffect } from "react";
import { PiggyBank, Search, ArrowUpRight, ArrowDownLeft, Info, Wallet } from "lucide-react";
import { TabunganService } from "@/lib/services/tabunganService";
import { TabunganAccount } from "@/types/tabungan";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";

export default function TabunganPage() {
  const [accounts, setAccounts] = useState<TabunganAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useAuth();

  useEffect(() => {
    const unsubscribe = TabunganService.observeDaftarTabungan((data) => {
      setAccounts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredAccounts = accounts.filter(acc => 
    (acc.nama_lengkap || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalSaldo = accounts.reduce((acc, curr) => acc + curr.saldo, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-indigo-400" />
            Tabungan Warga
          </h1>
          <p className="text-slate-400 mt-1">Kelola simpanan dan tabungan warga RT</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/tabungan/tarik-masal"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600/10 border border-rose-500/50 hover:bg-rose-600/20 text-rose-400 rounded-2xl font-bold transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Tarik Masal</span>
          </Link>
          <Link 
            href="/tabungan/masal"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <ArrowUpRight className="w-5 h-5" />
            Setor Masal
          </Link>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Dana Tabungan</p>
              <p className="text-2xl font-bold text-white">
                Rp {totalSaldo.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Jumlah Penabung</p>
              <p className="text-2xl font-bold text-white">
                {accounts.filter(a => a.saldo > 0).length} Warga
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          placeholder="Cari nama warga..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800/40 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* List Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/30 animate-pulse rounded-3xl" />
          ))
        ) : filteredAccounts.length > 0 ? (
          filteredAccounts.map((acc) => (
            <div 
              key={acc.id}
              className="bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 p-5 rounded-3xl transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                    {acc.nama_lengkap}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Saldo Terkini</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${acc.saldo > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {acc.saldo > 0 ? 'AKTIF' : 'KOSONG'}
                </div>
              </div>
              
              <div className="flex items-end justify-between gap-2">
                <p className="text-xl font-black text-white">
                  Rp {acc.saldo.toLocaleString("id-ID")}
                </p>
                <Link
                  href={`/tabungan/${acc.id}`}
                  className="p-2 rounded-xl bg-slate-700/50 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 transition-all"
                  title="Detail & Penarikan"
                >
                  <Info className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
            <p className="text-slate-500">Warga tidak ditemukan atau belum ada data tabungan</p>
          </div>
        )}
      </div>
    </div>
  );
}
