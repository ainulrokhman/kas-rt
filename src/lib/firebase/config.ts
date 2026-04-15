import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from "firebase/firestore";

// Konfigurasi aplikasi web Firebase Anda
// Pastikan untuk mengisi nilai-nilai ini di dalam file .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi Firebase App
// Menggunakan singleton pattern untuk menghindari re-inisialisasi karena Fast Refresh (HMR) oleh Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let db: Firestore | null = null;

// Inisialisasi Firestore dengan offline persistence (persistent cache via IndexedDB)
// Pastikan kode ini hanya berjalan di sisi client/browser, karena persistence IndexedDB 
// tidak berfungsi / bisa error jika dijalankan di sisi server (SSR)
if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    console.log("Firebase Firestore initialized with offline persistence.");
  } catch (err) {
    console.error("Gagal menginisialisasi Firestore offline persistence:", err);
  }
} else {
  // Fallback inisialisasi Firestore normal di server (SSR), jika diperlukan.
  // getFirestore() otomatis akan mengambil instance dari default app.
  const { getFirestore } = require("firebase/firestore");
  db = getFirestore(app);
}

// Ekspor instance untuk digunakan di seluruh aplikasi (Service Layer)
export { app, db };
