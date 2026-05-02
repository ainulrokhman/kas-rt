"use client";

import { JimpitanReportRow, JimpitanMonthTarget } from "@/types/jimpitan";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react";

interface Props {
  reports: JimpitanReportRow[];
  totalKamis: number;
  currentTarget?: JimpitanMonthTarget | null;
  thursdaysDates?: string[];
  onLocationChange?: (minggu_ke: number, loc: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(angka);

// StatusBadge dihapus sesuai permintaan (tidak perlu informasi lunas/parsial)

// ─── Summary Row (footer totals) ─────────────────────────────────────────────

function SummaryBar({
  reports,
  weeksHeader,
  thursdaysDates,
  currentTarget,
  onLocationChange,
}: {
  reports: JimpitanReportRow[];
  weeksHeader: number[];
  thursdaysDates?: string[];
  currentTarget?: JimpitanMonthTarget | null;
  onLocationChange?: (minggu_ke: number, loc: string) => void;
}) {
  const totalPerWeek = weeksHeader.map((w) => {
    let sum = 0;
    reports.forEach((r) => {
      const st = r.status_mingguan.find((s) => s.minggu_ke === w);
      if (st) sum += st.nominal_asli_transaksi || 0;
    });
    return sum;
  });

  const grandTotal = totalPerWeek.reduce((a, b) => a + b, 0);

  return (
    <div className="mt-3 bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Total Terkumpul
        </span>
        <span className="text-sm font-bold text-emerald-400">
          Rp {formatRupiah(grandTotal)}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {weeksHeader.map((w, i) => (
          <div
            key={w}
            className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-2.5 text-center"
          >
            <p className="text-[10px] text-indigo-300 font-semibold mb-0.5">
              {thursdaysDates?.[i] ?? `M${w}`}
            </p>
            <p className="text-xs font-bold text-emerald-400">
              {totalPerWeek[i] > 0 ? `Rp ${formatRupiah(totalPerWeek[i])}` : "-"}
            </p>
            {currentTarget && (
              <input
                className="mt-1.5 w-full text-center bg-slate-800 border border-slate-700/60 rounded text-[9px] px-1 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-normal"
                placeholder="Lokasi Tahlil..."
                value={currentTarget.lokasi_tahlil?.[w] ?? ""}
                onChange={(e) => onLocationChange?.(w, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Card ─────────────────────────────────────────────────────────────

function MobileCard({
  row,
  thursdaysDates,
}: {
  row: JimpitanReportRow;
  thursdaysDates?: string[];
}) {
  const [expanded, setExpanded] = useState(false);


  return (
    <div
      className="rounded-xl border border-slate-800/50 bg-slate-900/40 transition-colors"
    >
      {/* Card header — always visible */}
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left min-h-[56px]"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border bg-slate-800 text-slate-300 border-slate-700/50"
        >
          {row.nama_warga.substring(0, 2).toUpperCase()}
        </div>

        {/* Name + inline status pills */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
            {row.nama_warga}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] text-slate-500">
              Riwayat setoran bulan ini
            </span>
          </div>
        </div>

        {/* Total + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p
              className={`text-xs font-bold ${
                row.total_masuk_bulan_ini > 0 ? "text-emerald-400" : "text-slate-600"
              }`}
            >
              {row.total_masuk_bulan_ini > 0
                ? `+Rp${formatRupiah(row.total_masuk_bulan_ini)}`
                : "Rp 0"}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-800/50 pt-3">
          {/* Per-week breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {row.status_mingguan.map((s, i) => {
              const label = thursdaysDates?.[i] ?? `Minggu ${s.minggu_ke}`;
              const nominal = s.nominal_asli_transaksi ?? 0;
              return (
                <div
                  key={s.minggu_ke}
                  className="rounded-lg p-2.5 border border-slate-800/40 bg-slate-900/30"
                >
                <div className="mb-1.5">
                  <span className="text-[10px] font-semibold text-indigo-300">
                    {label}
                  </span>
                </div>
                  <p
                    className={`text-sm font-bold ${
                      nominal > 0 ? "text-slate-100" : "text-slate-600"
                    }`}
                  >
                    {nominal > 0 ? `Rp ${formatRupiah(nominal)}` : "-"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Target: Rp {formatRupiah(s.target)}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Desktop Row ─────────────────────────────────────────────────────────────

function DesktopRow({
  row,
  idx,
}: {
  row: JimpitanReportRow;
  idx: number;
}) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-800/30 ${
        idx % 2 === 0 ? "bg-transparent" : "bg-slate-900/30"
      }`}
    >
      {/* Warga name */}
      <td className="px-4 py-3.5 font-medium text-slate-200 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-slate-700/50 flex-shrink-0">
            {row.nama_warga.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-tight">
              {row.nama_warga}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Total:{" "}
              <span className="text-emerald-400/80">
                Rp {formatRupiah(row.total_masuk_bulan_ini)}
              </span>
            </p>
          </div>
        </div>
      </td>

      {/* Per-week cells */}
      {row.status_mingguan.map((s) => {
        const nominal = s.nominal_asli_transaksi ?? 0;
        return (
          <td key={s.minggu_ke} className="px-2 py-3.5 text-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`text-[11px] font-medium ${
                  nominal > 0 ? "text-slate-200" : "text-slate-700"
                }`}
              >
                {nominal > 0 ? `Rp ${formatRupiah(nominal)}` : "-"}
              </span>
            </div>
          </td>
        );
      })}

    </tr>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function LaporanBulananTable({
  reports,
  totalKamis,
  currentTarget,
  thursdaysDates,
  onLocationChange,
}: Props) {
  const weeksHeader = Array.from({ length: totalKamis }, (_, i) => i + 1);

  // Summary stats
  const totalMasuk = reports.reduce((s, r) => s + r.total_masuk_bulan_ini, 0);

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/60 p-10 text-center">
        <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">
          Belum ada data laporan untuk bulan ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Summary chips ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3 text-center col-span-1">
          <p className="text-xs text-slate-500 mb-1">Total Masuk</p>
          <p className="text-sm font-bold text-emerald-400">
            Rp {formatRupiah(totalMasuk)}
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3 text-center col-span-1">
          <p className="text-xs text-slate-500 mb-1">Warga Terdata</p>
          <p className="text-sm font-bold text-indigo-400">
            {reports.length} Warga
          </p>
        </div>
      </div>

      {/* ── MOBILE: Card list (hidden on md+) ── */}
      <div className="md:hidden space-y-2">
        {reports.map((row) => (
          <MobileCard
            key={row.warga_id}
            row={row}
            thursdaysDates={thursdaysDates}
          />
        ))}
      </div>

      {/* ── DESKTOP: Traditional table (hidden below md) ── */}
      <div className="hidden md:block bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar pb-1">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-4 min-w-[160px] font-semibold tracking-wider"
                >
                  Warga
                </th>
                {weeksHeader.map((w) => (
                  <th
                    key={w}
                    scope="col"
                    className="px-2 py-4 text-center min-w-[90px] font-semibold tracking-wider"
                  >
                    <div className="text-[11px] text-indigo-300 font-bold tracking-widest">
                      {thursdaysDates?.[w - 1] ?? `M${w}`}
                    </div>
                    {currentTarget && (
                      <input
                        className="mt-1.5 w-full text-center bg-slate-900 border border-slate-700/80 rounded text-[9px] px-1 py-1 text-indigo-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-normal shadow-inner"
                        placeholder="Lokasi Tahlil..."
                        value={currentTarget.lokasi_tahlil?.[w] ?? ""}
                        onChange={(e) => onLocationChange?.(w, e.target.value)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {reports.map((row, idx) => (
                <DesktopRow
                  key={row.warga_id}
                  row={row}
                  idx={idx}
                />
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-700/50 bg-slate-800/20">
              <tr>
                <td className="px-4 py-3.5 font-semibold text-slate-300 text-right text-xs uppercase tracking-wider">
                  Total:
                </td>
                {weeksHeader.map((w) => {
                  let sum = 0;
                  reports.forEach((r) => {
                    const st = r.status_mingguan.find((s) => s.minggu_ke === w);
                    if (st) sum += st.nominal_asli_transaksi ?? 0;
                  });
                  return (
                    <td
                      key={w}
                      className="px-2 py-3.5 text-center font-bold text-emerald-400 text-[11px] whitespace-nowrap bg-emerald-500/5"
                    >
                      {sum > 0 ? `Rp ${formatRupiah(sum)}` : "-"}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Totals per week (mobile+desktop, below the table) ── */}
      <SummaryBar
        reports={reports}
        weeksHeader={weeksHeader}
        thursdaysDates={thursdaysDates}
        currentTarget={currentTarget}
        onLocationChange={onLocationChange}
      />
    </div>
  );
}
