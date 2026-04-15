"use client";

import { JimpitanReportRow } from "@/types/jimpitan";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Props {
  reports: JimpitanReportRow[];
  totalKamis: number;
  currentTarget?: any;
  thursdaysDates?: string[];
  onLocationChange?: (minggu_ke: number, loc: string) => void;
}

export default function LaporanBulananTable({ reports, totalKamis, currentTarget, thursdaysDates, onLocationChange }: Props) {
  // Generate header minggu (M1, M2, dst sesuai jumlah kamis)
  const weeksHeader = Array.from({ length: totalKamis }, (_, i) => i + 1);

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/60 p-8 text-center text-slate-500">
        Belum ada data laporan untuk bulan ini.
      </div>
    );
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/80 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th scope="col" className="px-5 py-4 min-w-[140px] font-semibold tracking-wider">
                Warga
              </th>
              {weeksHeader.map(w => (
                <th key={w} scope="col" className="px-2 py-4 text-center min-w-[70px] font-semibold tracking-wider">
                  <div className="text-[12px] text-indigo-300 font-bold tracking-widest">{thursdaysDates?.[w-1] || `M${w}`}</div>
                  {currentTarget && (
                    <input 
                      className="mt-1.5 w-full text-center bg-slate-900 border border-slate-700/80 rounded block text-[9px] px-1 py-1 text-indigo-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-normal shadow-inner"
                      placeholder="Lokasi Tahlil..."
                      value={currentTarget.lokasi_tahlil?.[w] || ''}
                      onChange={(e) => onLocationChange?.(w, e.target.value)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {reports.map((row, idx) => (
              <tr key={row.warga_id} className={`transition-colors hover:bg-slate-800/30 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/30'}`}>
                <td className="px-5 py-4 font-medium text-slate-200 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                     <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-slate-700/50">
                        {row.nama_warga.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        {row.nama_warga}
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5 tracking-wide">
                          In: <span className="text-emerald-400/80">Rp {formatRupiah(row.total_masuk_bulan_ini)}</span>
                        </div>
                     </div>
                  </div>
                </td>
                
                {row.status_mingguan.map((statusMinggu) => {
                   const asliInt = statusMinggu.nominal_asli_transaksi || 0;
                   const txt = asliInt > 0 ? `Rp${formatRupiah(asliInt)}` : '-';
                   
                   return (
                     <td key={statusMinggu.minggu_ke} className="px-2 py-4 text-center">
                       <div className={`mx-auto w-full max-w-[65px] py-1 text-[12px] ${asliInt > 0 ? 'text-slate-200 font-medium' : 'text-slate-600'}`}>
                          {txt}
                       </div>
                     </td>
                   );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-700/50 bg-slate-800/20">
            <tr>
               <td className="px-5 py-4 font-semibold text-slate-300 text-right text-xs uppercase tracking-wider">
                  Total Terkumpul:
               </td>
               {weeksHeader.map(w => {
                  let sum = 0;
                  reports.forEach(r => {
                     const st = r.status_mingguan.find(s => s.minggu_ke === w);
                     if (st) sum += (st.nominal_asli_transaksi || 0);
                  });
                  return (
                    <td key={w} className="px-2 py-4 text-center font-bold text-emerald-400 text-[11px] whitespace-nowrap bg-emerald-500/5">
                       {sum > 0 ? `Rp ${formatRupiah(sum)}` : '-'}
                    </td>
                  );
               })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
