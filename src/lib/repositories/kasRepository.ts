import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  query, 
  where,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { KasTransaction } from "@/types/kas";

export class KasRepository {
  private static collectionName = "kas_transactions";

  /**
   * Menambah transaksi kas baru
   */
  static async addTransaction(data: Omit<KasTransaction, "id" | "createdAt">): Promise<string> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const insertedData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, this.collectionName), insertedData);
    return docRef.id;
  }

  /**
   * Mengambil semua transaksi kas
   * Diurutkan berdasarkan tanggal_timestamp desc
   */
  static async getAllTransactions(): Promise<KasTransaction[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const q = query(
      collection(db, this.collectionName),
      orderBy("tanggal_timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toMillis() || 0
    })) as KasTransaction[];
  }

  /**
   * Mengamati perubahan transaksi kas secara real-time
   */
  static observeTransactions(callback: (txs: KasTransaction[]) => void): () => void {
    if (!db) return () => {};

    const q = query(
      collection(db, this.collectionName),
      orderBy("tanggal_timestamp", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toMillis() || 0
      })) as KasTransaction[];
      callback(results);
    }, (error) => {
      console.error("Error observing kas transactions:", error);
    });
  }

  /**
   * Menghapus transaksi kas berdasarkan ID
   */
  static async deleteTransaction(id: string): Promise<void> {
    if (!db) throw new Error("Firestore instance");
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  /**
   * Mengecek apakah referensi_id sudah ada (untuk mencegah duplikasi sync jimpitan)
   */
  static async isReferenceExists(referensiId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore instance");

    const q = query(
      collection(db, this.collectionName),
      where("referensi_id", "==", referensiId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
}
