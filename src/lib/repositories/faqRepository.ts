import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Faq, FaqInput, FaqCategory } from "@/types/faq";

const COLLECTION_NAME = "faqs";

export class FaqRepository {
  /**
   * Mengambil semua FAQ yang aktif.
   */
  static async getAllActive(): Promise<Faq[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const q = query(
      collection(db, COLLECTION_NAME),
      where("is_active", "==", true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || 0,
        updatedAt: data.updatedAt?.toMillis() || 0,
      } as Faq;
    });
  }

  /**
   * Mengambil FAQ berdasarkan kategori.
   */
  static async getByCategory(category: FaqCategory): Promise<Faq[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const q = query(
      collection(db, COLLECTION_NAME),
      where("category", "==", category),
      where("is_active", "==", true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || 0,
        updatedAt: data.updatedAt?.toMillis() || 0,
      } as Faq;
    });
  }

  /**
   * Menambah FAQ baru.
   */
  static async create(data: FaqInput): Promise<string> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      order: data.order ?? 0,
      is_active: data.is_active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * Update FAQ.
   */
  static async update(id: string, data: Partial<FaqInput>): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Hapus FAQ.
   */
  static async delete(id: string): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  }

  /**
   * Real-time listener untuk FAQ berdasarkan kategori.
   */
  static observeByCategory(category: FaqCategory, callback: (data: Faq[]) => void): () => void {
    if (!db) return () => {};

    const q = query(
      collection(db, COLLECTION_NAME),
      where("category", "==", category),
      where("is_active", "==", true)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          createdAt: d.createdAt?.toMillis() || 0,
          updatedAt: d.updatedAt?.toMillis() || 0,
        } as Faq;
      });
      callback(data);
    }, (error) => {
      console.error(`Error observing FAQ for ${category}:`, error);
    });
  }
}
