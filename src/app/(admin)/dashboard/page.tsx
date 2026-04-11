"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Users, Wallet, Activity } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
        title: "Total Kas Aktif",
        value: "Rp 12,450,000",
        change: "+2.5% dibanding bulan lalu",
        isPositive: true,
        icon: Wallet,
        color: "from-emerald-500 to-teal-400"
    },
    {
        title: "Iuran Terkumpul (Bulan ini)",
        value: "Rp 3,200,000",
        change: "85% dari target",
        isPositive: true,
        icon: ArrowUpRight,
        color: "from-indigo-500 to-blue-400"
    },
    {
        title: "Pengeluaran (Bulan ini)",
        value: "Rp 850,000",
        change: "-10% dibanding bulan lalu",
        isPositive: false,
        icon: ArrowDownRight,
        color: "from-rose-500 to-pink-400"
    },
    {
        title: "Total KK Aktif",
        value: "42 KK",
        change: "2 KK baru gabung",
        isPositive: true,
        icon: Users,
        color: "from-amber-500 to-orange-400"
    }
  ];

  const recentTransactions = [
    { id: 1, text: "Iuran Bulanan - Bpk. Ahmad (A1/12)", date: "Hari ini, 09:30", amount: "+ Rp 100,000", type: "income" },
    { id: 2, text: "Pembayaran Sampah Komplek", date: "Hari ini, 08:00", amount: "- Rp 350,000", type: "expense" },
    { id: 3, text: "Iuran Bulanan - Bpk. Budi (B2/04)", date: "Kemarin, 14:15", amount: "+ Rp 100,000", type: "income" },
    { id: 4, text: "Beli Perlengkapan Pos Satpam", date: "Kemarin, 10:00", amount: "- Rp 150,000", type: "expense" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Overview Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Ringkasan kas rukun tetangga per hari ini.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/30">
          <Activity size={18} />
          <span>Buat Laporan</span>
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            {/* Background Glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700 group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6 text-slate-200" />
              </div>
            </div>
            
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
              <p className={`text-xs mt-2 flex items-center gap-1 ${stat.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Transactions Card - span 2 cols on wide layout */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Transaksi Terbaru</h2>
              <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Lihat Semua</button>
           </div>
           
           <div className="space-y-4">
             {recentTransactions.map((trx) => (
               <div key={trx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 transition-colors cursor-pointer">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {trx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <h4 className="text-slate-200 font-medium text-sm sm:text-base">{trx.text}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">{trx.date}</p>
                    </div>
                 </div>
                 <div className={`font-semibold ${trx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {trx.amount}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Info Card (Status Kas) */}
        <div className="bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-32 h-32" />
           </div>
           <div>
             <h3 className="text-lg font-semibold text-indigo-200 mb-2">Kesehatan Kas RT</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Saldo Kas RT Bulan ini dalam kondisi stabil. Pastikan pengeluaran bulan ini tidak melebihi 70% dari budget agar ada sisa untuk kas darurat.
             </p>
           </div>
           <div className="mt-8">
              <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2">
                <div className="bg-gradient-to-r from-indigo-500 to-teal-400 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-slate-400 text-right">45% Budget Terpakai</p>
           </div>
        </div>
        
      </div>
    </div>
  );
}
