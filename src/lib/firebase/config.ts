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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore
let db: Firestore;

if (typeof window !== "undefined") {
  try {
    // Inisialisasi persistence. Ini akan throw error jika dipanggil 2x (saat Next.js HMR)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    console.log("Firebase Firestore initialized with offline persistence.");
  } catch (err: any) {
    // Jika error karena sudah terinisialisasi (HMR), ambil instance yang sudah ada
    if (err.message && err.message.includes("already been started")) {
      const { getFirestore } = require("firebase/firestore");
      db = getFirestore(app);
      console.log("Firestore connected to existing instance (HMR).");
    } else {
      console.error("Gagal menginisialisasi Firestore offline persistence:", err);
      const { getFirestore } = require("firebase/firestore");
      db = getFirestore(app);
    }
  }
} else {
  // Fallback untuk SSR (Server Side Rendering)
  const { getFirestore } = require("firebase/firestore");
  db = getFirestore(app);
}

// Ekspor instance
export { app, db };
