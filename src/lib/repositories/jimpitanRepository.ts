import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  setDoc,
  doc, 
  query, 
  where,
  orderBy,
  deleteDoc,
  serverTimestamp,
  waitForPendingWrites,
  onSnapshot,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { 
  JimpitanGlobalSetting, 
  JimpitanMonthTarget, 
  JimpitanTransaction 
} from "@/types/jimpitan";

export class JimpitanRepository {
  /**
   * Mengambil Setting Global. Jika belum ada, kembalikan default.
   */
  static async getGlobalSetting(): Promise<JimpitanGlobalSetting> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const docRef = doc(db, "jimpitan_settings", "global_config");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        nominal_default: docSnap.data().nominal_default
      } as JimpitanGlobalSetting;
    } else {
      // Default fallback jika belum pernah disubmit
      return {
        id: "global_config",
        nominal_default: 2000
      };
    }
  }

  /**
   * Mengupdate Setting Global
   */
  static async updateGlobalSetting(nominal: number): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const docRef = doc(db, "jimpitan_settings", "global_config");
    await setDoc(docRef, {
      nominal_default: nominal,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Mendengarkan perubahan Setting Global
   */
  static observeGlobalSetting(callback: (setting: JimpitanGlobalSetting) => void): () => void {
    if (!db) return () => {};
    const docRef = doc(db, "jimpitan_settings", "global_config");
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as JimpitanGlobalSetting);
      } else {
        callback({ id: "global_config", nominal_default: 2000 });
      }
    });
  }

  /**
   * Mengambil Target Bulan tertentu. 
   * Jika tidak ada, di Create secara otomatis menggunakan Global Config saat ini (Locking Snapshot).
   */
  static async getMonthTarget(yearMonth: string, autoLock: boolean = true): Promise<JimpitanMonthTarget | null> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = doc(db, "jimpitan_targets", yearMonth);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nominal_mingguan: data.nominal_mingguan,
        total_kamis: data.total_kamis,
        lokasi_tahlil: data.lokasi_tahlil || {},
        createdAt: data.createdAt?.toMillis() || 0
      } as JimpitanMonthTarget;
    }
    
    if (!autoLock) return null;

    // Hitung jumlah hari kamis manual jika ini pertama kali
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    
    let total_kamis = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 4) { // 4 is Thursday
        total_kamis++;
      }
      date.setDate(date.getDate() + 1);
    }

    // Ambil rate default saat ini
    const globalSetting = await this.getGlobalSetting();
    
    // Save snapshot 
    const newTarget: any = {
      nominal_mingguan: globalSetting.nominal_default,
      total_kamis: total_kamis,
      createdAt: serverTimestamp()
    };
    
    await setDoc(docRef, newTarget);
    
    return {
      id: yearMonth,
      nominal_mingguan: newTarget.nominal_mingguan,
      total_kamis: newTarget.total_kamis,
      lokasi_tahlil: {},
      createdAt: Date.now()
    } as JimpitanMonthTarget;
  }

  /**
   * Mengupdate lokasi tahlil untuk target bulan tertentu
   */
  static async updateMonthTargetLocation(yearMonth: string, lokasi_tahlil: Record<number, string>): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const docRef = doc(db, "jimpitan_targets", yearMonth);
    await setDoc(docRef, {
      lokasi_tahlil: lokasi_tahlil,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Mengupdate nominal mingguan untuk target bulan tertentu
   */
  static async updateMonthTargetNominal(yearMonth: string, nominal: number): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const docRef = doc(db, "jimpitan_targets", yearMonth);
    await setDoc(docRef, {
      nominal_mingguan: nominal,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Mengambil semua Snapshot target dari awal sampai target bulan yang diminta.
   * Supaya kalkulasi saldo masa lalu bisa memotong dengan rule target masing-masing bulannya.
   */
  static async getAllTargetsUpToMonth(yearMonth: string): Promise<JimpitanMonthTarget[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const q = query(
      collection(db, "jimpitan_targets"),
      where("__name__", "<=", yearMonth) // __name__ adalah document ID (yaitu YYYY-MM)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as JimpitanMonthTarget[];
  }

  /**
   * Mencatat kas masuk jimpitan
   */
  static async addTransaction(data: Omit<JimpitanTransaction, "id" | "createdAt">): Promise<string> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const insertedData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "jimpitan_transactions"), insertedData);
    return docRef.id;
  }

  /**
   * Mengambil semua transaksi hingga bulan tertentu
   * Kita butuh riwayat semua bulan SEBELUM dan PADA yearMonth 
   * untuk keperluan kalkulasi saldo berkelanjutan.
   */
  static async getTransactionsUpToMonth(yearMonth: string): Promise<JimpitanTransaction[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    // Karena format YYYY-MM berurut abjad, kita bisa querystring <= yearMonth
    // Firebase melempar error "requires an index" jika ada multiple orderBy + where. 
    // Solusi tercepat tanpa repot bikin index di console: hapus orderBy dari query, lalu sort in-memory.
    const q = query(
      collection(db, "jimpitan_transactions"), 
      where("bulan_tahun", "<=", yearMonth)
    );
    
    const snapshot = await getDocs(q);
    
    const results = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        warga_id: data.warga_id,
        petugas_id: data.petugas_id,
        nominal: data.nominal,
        tanggal_bayar: data.tanggal_bayar,
        bulan_tahun: data.bulan_tahun,
        createdAt: data.createdAt?.toMillis() || 0
      } as JimpitanTransaction;
    });

    // Sort manual in-memory
    results.sort((a, b) => {
      if (a.bulan_tahun === b.bulan_tahun) {
        return a.tanggal_bayar - b.tanggal_bayar;
      }
      return a.bulan_tahun.localeCompare(b.bulan_tahun);
    });

    return results;
  }

  /**
   * (Opsional) jika kita butuh spesifik 1 warga
   */
    static async getTransactionsByWargaId(wargaId: string): Promise<JimpitanTransaction[]> {
      if (!db) throw new Error("Firestore instance belum terinisialisasi");
  
      const q = query(
        collection(db, "jimpitan_transactions"), 
        where("warga_id", "==", wargaId)
      );
      
      const snapshot = await getDocs(q);
      
      const results = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          warga_id: data.warga_id,
          petugas_id: data.petugas_id,
          nominal: data.nominal,
          tanggal_bayar: data.tanggal_bayar,
          bulan_tahun: data.bulan_tahun,
          createdAt: data.createdAt?.toMillis() || 0
        } as JimpitanTransaction;
      });

      results.sort((a, b) => a.tanggal_bayar - b.tanggal_bayar);
      return results;
    }

  /**
   * Mengambil semua transaksi pada rentang hari tertentu (berdasarkan timestamp start dan end of day)
   * [FIXED] Tambahan in-memory sort untuk memastikan urutan data konsisten.
   */
    static async getTransactionsByDateBound(startTs: number, endTs: number): Promise<JimpitanTransaction[]> {
      if (!db) throw new Error("Firestore instance");
  
      const q = query(
        collection(db, "jimpitan_transactions"), 
        where("tanggal_bayar", ">=", startTs),
        where("tanggal_bayar", "<=", endTs)
      );
      
      const snapshot = await getDocs(q);
      
      const results = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          warga_id: data.warga_id,
          petugas_id: data.petugas_id,
          nominal: data.nominal,
          tanggal_bayar: data.tanggal_bayar,
          bulan_tahun: data.bulan_tahun,
          createdAt: data.createdAt?.toMillis() || 0
        } as JimpitanTransaction;
      });

      results.sort((a, b) => a.tanggal_bayar - b.tanggal_bayar);
      return results;
    }

  /**
   * Mendengarkan transaksi pada rentang hari tertentu (Real-time & Offline-First)
   */
  static observeTransactionsByDateBound(startTs: number, endTs: number, callback: (txs: JimpitanTransaction[]) => void): () => void {
    if (!db) return () => {};

    const q = query(
      collection(db, "jimpitan_transactions"), 
      where("tanggal_bayar", ">=", startTs),
      where("tanggal_bayar", "<=", endTs)
    );

    return onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          warga_id: data.warga_id,
          petugas_id: data.petugas_id,
          nominal: data.nominal,
          tanggal_bayar: data.tanggal_bayar,
          bulan_tahun: data.bulan_tahun,
          createdAt: data.createdAt?.toMillis() || 0
        } as JimpitanTransaction;
      });
      results.sort((a, b) => a.tanggal_bayar - b.tanggal_bayar);
      callback(results);
    }, (error) => {
      console.error("Error observing transactions:", error);
    });
  }

  /**
   * Menghapus transaksi berdasarkan ID
   */
  static async deleteTransaction(id: string): Promise<void> {
    if (!db) throw new Error("Firestore instance");
    const docRef = doc(db, "jimpitan_transactions", id);
    await deleteDoc(docRef);
  }

  /**
   * Menunggu semua proses antrian offline (pending writes) tersinkronisasi dengan server.
   */
  static async syncPendingWrites(): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    await waitForPendingWrites(db);
  }

  /**
   * Mendengarkan apakah ada data yang sedang menunggu untuk diupload (pending writes).
   * Berguna untuk menampilkan indikator sinkronisasi.
   */
  static observePendingWrites(callback: (hasPending: boolean) => void): () => void {
    if (!db) return () => {};

    // Kita pantau collection transactions, cukup ambil 1 data terbaru saja 
    // untuk mengecek metadata.hasPendingWrites secara global di collection tersebut.
    const q = query(collection(db, "jimpitan_transactions"), limit(1));
    
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.metadata.hasPendingWrites);
    }, (error) => {
      console.error("Error observing pending writes:", error);
    });
  }
}
