"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JimpitanService } from "@/lib/services/jimpitanService";
import { JimpitanReportRow, JimpitanMonthTarget } from "@/types/jimpitan";
import LaporanBulananTable from "@/components/jimpitan/LaporanBulananTable";
import { LogOut, ChevronLeft, Calendar } from "lucide-react";

export default function LaporanRinciPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Data State
  const [reports, setReports] = useState<JimpitanReportRow[]>([]);
  const [currentTarget, setCurrentTarget] = useState<JimpitanMonthTarget | null>(null);
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isDataLoading, setIsDataLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const hasCookie = document.cookie.includes("kas-rt-public-session=1");
    if (hasCookie) {
      setIsAuthenticated(true);
    }
    setIsCheckingSession(false);
  }, []);

  const fetchLaporan = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const { reports, currentTarget } = await JimpitanService.getLaporanBulanan(monthFilter);
      setReports(reports);
      setCurrentTarget(currentTarget);
    } catch (err) {
      console.error("Gagal ambil laporan:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, [monthFilter]);

  // Fetch data laporan jika sudah authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchLaporan();
    }
  }, [isAuthenticated, monthFilter, fetchLaporan]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/public-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setPin("");
      } else {
        const data = await res.json();
        setError(data.message || "PIN salah");
        setPin("");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [pin]);

  const handleLogout = () => {
    document.cookie = "kas-rt-public-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setIsAuthenticated(false);
    router.push("/");
  };

  useEffect(() => {
    if (pin.length === 6) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6">
        <div className="max-w-xs w-full space-y-10">
          <div className="text-center">
            <button 
              onClick={() => router.push("/")}
              className="text-slate-500 hover:text-slate-300 transition-colors mb-6 flex items-center justify-center mx-auto text-xs font-bold uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali
            </button>
            <h1 className="text-3xl font-black text-white tracking-tight">PIN Akses</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Masukkan PIN Umum untuk melihat laporan rinci jimpitan warga.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length > i
                    ? "bg-indigo-500 border-indigo-500 scale-125 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    : "border-slate-800 bg-slate-900"
                }`}
              ></div>
            ))}
          </div>

          {error && (
            <p className="text-rose-500 text-sm text-center font-bold animate-shake bg-rose-500/10 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                disabled={isLoading}
                className="w-full aspect-square flex items-center justify-center bg-slate-900 border border-slate-800 text-2xl font-black text-white rounded-2xl hover:bg-slate-800 active:scale-90 transition-all shadow-lg"
              >
                {num}
              </button>
            ))}
            <div className="w-full aspect-square"></div>
            <button
              onClick={() => handleKeyPress("0")}
              disabled={isLoading}
              className="w-full aspect-square flex items-center justify-center bg-slate-900 border border-slate-800 text-2xl font-black text-white rounded-2xl hover:bg-slate-800 active:scale-90 transition-all shadow-lg"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full aspect-square flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl hover:bg-slate-800 active:scale-90 transition-all shadow-lg"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const [y, m] = monthFilter.split("-");
  const namaBulanFilter = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-[#0B1120] pb-20">
      <header className="sticky top-0 bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-800 p-4 flex items-center justify-between z-30">
        <button 
          onClick={() => router.push("/")}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
            <h1 className="text-sm font-black text-white uppercase tracking-widest">Laporan Rinci</h1>
            <p className="text-[10px] text-indigo-400 font-bold">{namaBulanFilter}</p>
        </div>
        <button 
           onClick={handleLogout}
           title="Keluar"
           className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Month Picker */}
        <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
           <Calendar className="w-5 h-5 text-indigo-400" />
           <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Pilih Bulan Laporan</p>
              <input 
                 type="month" 
                 value={monthFilter}
                 onChange={(e) => setMonthFilter(e.target.value)}
                 className="bg-transparent text-sm font-bold text-white focus:outline-none w-full"
              />
           </div>
        </div>

        {/* Real Report Table */}
        {isDataLoading ? (
            <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm font-medium">Memuat data laporan...</p>
            </div>
        ) : (
            <LaporanBulananTable 
                reports={reports} 
                totalKamis={currentTarget?.total_kamis || 0}
                thursdaysDates={[]} // Bisa ditingkatkan jika ingin menampilkan tanggal spesifik
                monthFilter={monthFilter}
            />
        )}

        <div className="bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/10 text-center">
          <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
            &quot;Seluruh data di atas adalah riwayat setoran jimpitan warga yang tercatat secara digital oleh pengurus RT.&quot;
          </p>
        </div>
      </div>
    </main>
  );
}
