"use client";

import React, { useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// ─── Data Seed ────────────────────────────────────────────────────────────────

const WARGA_SEED = [
  { nama_lengkap: "Ahmad Fauzi", jenis_kelamin: "L", nomor_hp: "081234567890" },
  { nama_lengkap: "Budi Santoso", jenis_kelamin: "L", nomor_hp: "082345678901" },
  { nama_lengkap: "Cahya Rahman", jenis_kelamin: "L", nomor_hp: "083456789012" },
  { nama_lengkap: "Dewi Lestari", jenis_kelamin: "P", nomor_hp: "084567890123" },
  { nama_lengkap: "Eko Prasetyo", jenis_kelamin: "L", nomor_hp: "085678901234" },
  { nama_lengkap: "Fitri Handayani", jenis_kelamin: "P", nomor_hp: "086789012345" },
  { nama_lengkap: "Gunawan Saputra", jenis_kelamin: "L", nomor_hp: "087890123456" },
  { nama_lengkap: "Hani Rahmawati", jenis_kelamin: "P", nomor_hp: "088901234567" },
] as const;

// Petugas yang akan dibuat dari warga di atas (berdasarkan index)
// PIN default: 123456
const PETUGAS_SEED = [
  { warga_index: 0, jabatan: "Ketua RT" },       // Ahmad Fauzi
  { warga_index: 1, jabatan: "Sekretaris" },     // Budi Santoso
  { warga_index: 2, jabatan: "Bendahara" },      // Cahya Rahman
  { warga_index: 4, jabatan: "Penarik Jimpitan" }, // Eko Prasetyo
] as const;

const DEFAULT_PIN = "123456";

// ─── Hash Utility ─────────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Log Item ─────────────────────────────────────────────────────────────────

type LogStatus = "info" | "success" | "error" | "skip";

interface LogItem {
  id: number;
  message: string;
  status: LogStatus;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SeederPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  let logId = 0;

  const pushLog = (
    setter: React.Dispatch<React.SetStateAction<LogItem[]>>,
    message: string,
    status: LogStatus = "info"
  ) => {
    setter((prev) => [...prev, { id: logId++, message, status }]);
  };

  const runSeeder = async () => {
    if (!db) {
      alert("Firestore belum terinisialisasi.");
      return;
    }
    setLogs([]);
    setIsRunning(true);
    setIsDone(false);
    const setter = setLogs;

    try {
      pushLog(setter, "━━━ Memulai Seeder ━━━", "info");

      // ── Seed Warga ──────────────────────────────────
      pushLog(setter, "📋 Memproses data warga...", "info");
      const wargaIds: string[] = [];

      for (const w of WARGA_SEED) {
        const sanitizedHp = w.nomor_hp.replace(/\D/g, "");
        // Cek apakah nomor HP sudah ada
        const existing = await getDocs(
          query(collection(db, "warga"), where("nomor_hp", "==", sanitizedHp))
        );

        if (!existing.empty) {
          pushLog(setter, `  ⏭ Skip: ${w.nama_lengkap} (${sanitizedHp}) sudah ada`, "skip");
          wargaIds.push(existing.docs[0].id);
          continue;
        }

        const docRef = await addDoc(collection(db, "warga"), {
          nama_lengkap: w.nama_lengkap,
          jenis_kelamin: w.jenis_kelamin,
          nomor_hp: sanitizedHp,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        wargaIds.push(docRef.id);
        pushLog(setter, `  ✓ Warga: ${w.nama_lengkap} (${sanitizedHp}) → ID: ${docRef.id}`, "success");
      }

      pushLog(setter, `✅ Selesai warga: ${wargaIds.length} total`, "success");

      // ── Hash PIN ─────────────────────────────────────
      pushLog(setter, `🔐 Hashing PIN default "${DEFAULT_PIN}"...`, "info");
      const hashedPin = await hashPin(DEFAULT_PIN);
      pushLog(setter, `  ✓ Hash: ${hashedPin.slice(0, 20)}...`, "success");

      // ── Seed Petugas ─────────────────────────────────
      pushLog(setter, "👮 Memproses data petugas...", "info");

      for (const p of PETUGAS_SEED) {
        const wargaId = wargaIds[p.warga_index];
        const wargaNama = WARGA_SEED[p.warga_index].nama_lengkap;
        const wargaNomor = WARGA_SEED[p.warga_index].nomor_hp;

        if (!wargaId) {
          pushLog(setter, `  ✗ Skip: Warga index-${p.warga_index} tidak ditemukan`, "error");
          continue;
        }

        // Cek apakah petugas dengan warga_id ini sudah ada
        const existingPetugas = await getDocs(
          query(collection(db, "petugas"), where("warga_id", "==", wargaId))
        );
        if (!existingPetugas.empty) {
          pushLog(setter, `  ⏭ Skip: ${wargaNama} sudah jadi petugas (${p.jabatan})`, "skip");
          continue;
        }

        await addDoc(collection(db, "petugas"), {
          warga_id: wargaId,
          jabatan: p.jabatan,
          pin: hashedPin,
          is_active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        pushLog(
          setter,
          `  ✓ Petugas: ${wargaNama} → ${p.jabatan} (HP: ${wargaNomor}, PIN: ${DEFAULT_PIN})`,
          "success"
        );
      }

      pushLog(setter, "━━━ Seeder Selesai ━━━", "info");
      pushLog(setter, "", "info");
      pushLog(setter, "📌 Akun Login Petugas:", "info");
      PETUGAS_SEED.forEach((p) => {
        const w = WARGA_SEED[p.warga_index];
        pushLog(setter, `  ${p.jabatan}: HP ${w.nomor_hp} | PIN ${DEFAULT_PIN}`, "success");
      });

      setIsDone(true);
    } catch (err: any) {
      pushLog(setter, `✗ ERROR: ${err.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const statusColor: Record<LogStatus, string> = {
    info: "text-slate-400",
    success: "text-emerald-400",
    error: "text-rose-400",
    skip: "text-amber-400",
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 p-4 sm:p-8 font-mono">
      {/* Header */}
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border border-slate-700/60 rounded-2xl p-5 bg-slate-900/60">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-2xl">🌱</div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">KasRT Database Seeder</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Isi database Firestore dengan data awal untuk development & testing.
              </p>
            </div>
          </div>

          {/* Data preview */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Warga</p>
              <p className="text-xl font-bold text-slate-100">{WARGA_SEED.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">akan dibuat</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Petugas</p>
              <p className="text-xl font-bold text-slate-100">{PETUGAS_SEED.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">PIN default: <span className="text-indigo-400 font-bold">{DEFAULT_PIN}</span></p>
            </div>
          </div>

          {/* Preview table */}
          <div className="mb-5 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Preview Petugas Login</p>
            <div className="bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/40">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/40">
                    <th className="text-left px-3 py-2 text-slate-500 font-medium">Nama</th>
                    <th className="text-left px-3 py-2 text-slate-500 font-medium">HP</th>
                    <th className="text-left px-3 py-2 text-slate-500 font-medium">Jabatan</th>
                    <th className="text-center px-3 py-2 text-slate-500 font-medium">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {PETUGAS_SEED.map((p, i) => {
                    const w = WARGA_SEED[p.warga_index];
                    return (
                      <tr key={i} className="border-b border-slate-700/20 last:border-0">
                        <td className="px-3 py-2 text-slate-200">{w.nama_lengkap}</td>
                        <td className="px-3 py-2 text-slate-400">{w.nomor_hp}</td>
                        <td className="px-3 py-2 text-indigo-300">{p.jabatan}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded px-2 py-0.5">
                            {DEFAULT_PIN}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-amber-400">
              ⚠️ <strong>Development only.</strong> Seeder aman dijalankan berulang kali — data yang sudah ada akan di-skip (tidak duplikat).
            </p>
          </div>

          {/* Run button */}
          <button
            id="btn-run-seeder"
            onClick={runSeeder}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menjalankan Seeder...
              </>
            ) : isDone ? (
              "✅ Selesai — Jalankan Ulang"
            ) : (
              "▶ Jalankan Seeder"
            )}
          </button>
        </div>

        {/* Log Output */}
        {logs.length > 0 && (
          <div className="border border-slate-700/60 rounded-2xl bg-slate-950/80 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-xs text-slate-500 ml-1">seeder output</span>
            </div>
            <div className="p-4 space-y-0.5 max-h-96 overflow-y-auto text-sm leading-relaxed">
              {logs.map((log) =>
                log.message === "" ? (
                  <div key={log.id} className="h-2" />
                ) : (
                  <div key={log.id} className={statusColor[log.status]}>
                    {log.message}
                  </div>
                )
              )}
              {isRunning && (
                <div className="text-slate-500 animate-pulse">█</div>
              )}
            </div>
          </div>
        )}

        {/* Success action */}
        {isDone && (
          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-4 text-center">
            <p className="text-emerald-400 font-semibold mb-3">🎉 Data berhasil di-seed!</p>
            <div className="flex gap-2 justify-center">
              <a
                href="/login"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                Coba Login →
              </a>
              <a
                href="/petugas"
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
              >
                Lihat Petugas →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
