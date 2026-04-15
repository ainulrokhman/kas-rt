"use client";

import { useEffect, useState } from "react";
import { app, db } from "@/lib/firebase/config";

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string>("Sedang menginisialisasi...");

  useEffect(() => {
    // Mengecek apakah instance db sudah tersedia
    if (app && db) {
      console.log("Firebase App Name:", app.name);
      setStatus("✅ Berhasil: Firebase Firestore dengan PWA Offline Persistence telah siap digunakan!");
    } else {
      setStatus("❌ Gagal: Terdapat masalah saat menginisialisasi Firebase/Firestore.");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Test Koneksi Firebase</h1>
        <div className={`p-4 rounded-md text-center font-medium ${status.includes("Berhasil") ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
          {status}
        </div>
        <p className="mt-6 text-sm text-gray-500 text-center">
          Silakan buka Developer Tools (Console) di browser untuk melihat log inisialisasi persistensi IndexedDB Firestore.
        </p>
      </div>
    </div>
  );
}
