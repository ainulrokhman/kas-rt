"use client";

import { useEffect, useState } from "react";
import { LogService, AuditLogEntry } from "@/lib/services/logService";
import { PetugasService } from "@/lib/services/petugasService";
import { PetugasWithWarga } from "@/types/petugas";
import { formatRupiah } from "@/lib/utils/exportUtils";
import { ClipboardList, Filter, History, User } from "lucide-react";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [petugasMap, setPetugasMap] = useState<Record<string, PetugasWithWarga>>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'KAS' | 'JIMPITAN'>('ALL');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [logData, petugasList] = await Promise.all([
          LogService.getRecentLogs(100),
          PetugasService.getAll()
        ]);
        setLogs(logData);
        const map: Record<string, PetugasWithWarga> = {};
        petugasList.forEach(p => { map[p.id] = p; });
        setPetugasMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredLogs = logs.filter(log => filterType === 'ALL' || log.type === filterType);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight">
          Audit Log Aktivitas
        </h1>
        <p className="text-slate-400 font-medium tracking-wide text-sm mt-1">
          Jejak aktivitas petugas jimpitan dan pengelolaan kas
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'ALL' | 'KAS' | 'JIMPITAN')}
            className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="ALL">Semua Aktivitas</option>
            <option value="KAS">Khusus Buku Kas</option>
            <option value="JIMPITAN">Khusus Jimpitan Keliling</option>
          </select>
        </div>
        <div className="text-xs text-slate-500 font-medium px-2">
          Menampilkan {filteredLogs.length} aktivitas terbaru
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-slate-900/30 rounded-3xl border border-slate-800/30 shadow-inner">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-sm font-medium tracking-wide">Memuat jejak audit...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const petugas = petugasMap[log.petugas_id];
            return (
              <div key={log.id} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-900/80 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    log.type === 'KAS' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {log.type === 'KAS' ? <History className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        log.type === 'KAS' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {log.type}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <p className="font-bold text-slate-100 text-sm">{log.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{log.keterangan}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pl-14 sm:pl-0 border-t sm:border-t-0 border-slate-800/50 pt-3 sm:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Oleh Petugas</p>
                    <p className="text-xs font-bold text-slate-200">{petugas?.nama_lengkap || "Sistem"}</p>
                    <p className="text-[10px] text-indigo-400 font-medium">{petugas?.jabatan || "-"}</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Nominal</p>
                    <p className="text-xs font-black text-slate-100">{formatRupiah(log.nominal)}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-20 text-center">
               <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
               <p className="text-slate-500 font-medium">Tidak ada data log aktivitas yang ditemukan.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
