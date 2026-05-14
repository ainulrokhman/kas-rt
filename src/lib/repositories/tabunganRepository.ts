import { 
  collection, 
  getDocs, 
  doc, 
  query, 
  where,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  increment,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TabunganTransaction, TabunganAccount, BulkTabunganInput } from "@/types/tabungan";

export class TabunganRepository {
  private static TX_COLLECTION = "tabungan_transactions";
  private static ACC_COLLECTION = "tabungan_accounts";

  /**
   * Mencatat setoran tabungan secara masal menggunakan Batch Write
   */
  static async addBulkSetoran(
    petugasId: string, 
    inputs: BulkTabunganInput[],
    tanggal: number
  ): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const batch = writeBatch(db);
    const dateObj = new Date(tanggal);
    const bulanTahun = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    for (const input of inputs) {
      if (input.nominal <= 0) continue;

      // 1. Tambah ke riwayat transaksi
      const txRef = doc(collection(db, this.TX_COLLECTION));
      batch.set(txRef, {
        warga_id: input.warga_id,
        petugas_id: petugasId,
        jenis: 'SETOR',
        nominal: input.nominal,
        tanggal_timestamp: tanggal,
        bulan_tahun: bulanTahun,
        createdAt: serverTimestamp(),
      });

      // 2. Update atau Create saldo di tabungan_accounts
      const accRef = doc(db, this.ACC_COLLECTION, input.warga_id);
      batch.set(accRef, {
        warga_id: input.warga_id,
        nama_lengkap: input.nama_lengkap,
        saldo: increment(input.nominal),
        lastUpdatedAt: tanggal,
      }, { merge: true });
    }

    await batch.commit();
  }

  /**
   * Mencatat penarikan tabungan secara masal
   */
  static async addBulkPenarikan(
    petugasId: string,
    inputs: BulkTabunganInput[],
    tanggal: number
  ): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const batch = writeBatch(db);
    const dateObj = new Date(tanggal);
    const bulanTahun = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    for (const input of inputs) {
      if (input.nominal <= 0) continue;

      // 1. Tambah ke riwayat transaksi
      const txRef = doc(collection(db, this.TX_COLLECTION));
      batch.set(txRef, {
        warga_id: input.warga_id,
        petugas_id: petugasId,
        jenis: 'TARIK',
        nominal: input.nominal,
        tanggal_timestamp: tanggal,
        bulan_tahun: bulanTahun,
        keterangan: "Penarikan masal",
        createdAt: serverTimestamp(),
      });

      // 2. Update saldo (dikurangi)
      const accRef = doc(db, this.ACC_COLLECTION, input.warga_id);
      batch.set(accRef, {
        nama_lengkap: input.nama_lengkap,
        saldo: increment(-input.nominal),
        lastUpdatedAt: tanggal,
      }, { merge: true });
    }

    await batch.commit();
  }

  /**
   * Mencatat penarikan tabungan (Tarik Tunai)
   */
  static async addPenarikan(
    petugasId: string,
    wargaId: string,
    namaWarga: string,
    nominal: number,
    keterangan: string
  ): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const batch = writeBatch(db);
    const now = Date.now();
    const dateObj = new Date(now);
    const bulanTahun = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    // 1. Tambah riwayat transaksi
    const txRef = doc(collection(db, this.TX_COLLECTION));
    batch.set(txRef, {
      warga_id: wargaId,
      petugas_id: petugasId,
      jenis: 'TARIK',
      nominal: nominal,
      tanggal_timestamp: now,
      bulan_tahun: bulanTahun,
      keterangan,
      createdAt: serverTimestamp(),
    });

    // 2. Kurangi saldo
    const accRef = doc(db, this.ACC_COLLECTION, wargaId);
    batch.set(accRef, {
      nama_lengkap: namaWarga,
      saldo: increment(-nominal),
      lastUpdatedAt: now,
    }, { merge: true });

    await batch.commit();
  }

  /**
   * Mengamati perubahan akun tabungan secara real-time
   */
  static observeAccounts(callback: (accounts: TabunganAccount[]) => void): () => void {
    if (!db) return () => {};

    // Ambil semua tanpa orderBy untuk menghindari kebutuhan index manual
    const q = query(collection(db, this.ACC_COLLECTION));

    return onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as TabunganAccount[];

      // Sort in-memory: saldo terbanyak di atas
      results.sort((a, b) => b.saldo - a.saldo);
      
      callback(results);
    }, (error) => {
      console.error("Error observing tabungan accounts:", error);
    });
  }

  /**
   * Mendapatkan saldo spesifik warga
   */
  static async getAccount(wargaId: string): Promise<TabunganAccount | null> {
    if (!db) throw new Error("Firestore instance");
    const docRef = doc(db, this.ACC_COLLECTION, wargaId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as TabunganAccount;
  }

  /**
   * Mengambil riwayat transaksi spesifik warga
   */
  static async getHistoryByWarga(wargaId: string): Promise<TabunganTransaction[]> {
    if (!db) throw new Error("Firestore instance");
    
    // Gunakan query sederhana tanpa orderBy untuk menghindari kebutuhan composite index
    const q = query(
      collection(db, this.TX_COLLECTION),
      where("warga_id", "==", wargaId)
    );
    
    const snap = await getDocs(q);
    const results = snap.docs.map(d => {
      const data = d.data();
      return { 
        id: d.id, 
        ...data,
        createdAt: data.createdAt?.toMillis() || 0
      };
    }) as TabunganTransaction[];
    
    // Sort in-memory: input terbaru di atas (sesuai urutan input sistem)
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }
}
