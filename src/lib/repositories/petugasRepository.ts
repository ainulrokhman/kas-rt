import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Petugas, PetugasInput } from "@/types/petugas";

const COLLECTION_NAME = "petugas";

export class PetugasRepository {
  /**
   * Mengambil semua data petugas dari Firestore.
   * Filter is_active dilakukan in-memory untuk menghindari kebutuhan composite index.
   */
  static async getAll(): Promise<Petugas[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        warga_id: data.warga_id,
        jabatan: data.jabatan,
        pin: data.pin,
        is_active: data.is_active ?? true,
        createdAt: data.createdAt?.toMillis() || 0,
        updatedAt: data.updatedAt?.toMillis() || 0,
      } as Petugas;
    });
  }

  /**
   * Mencari petugas berdasarkan warga_id.
   * Digunakan saat proses login setelah warga ditemukan via nomor HP.
   * Filter is_active dilakukan in-memory.
   */
  static async findByWargaId(wargaId: string): Promise<Petugas | null> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const q = query(
      collection(db, COLLECTION_NAME),
      where("warga_id", "==", wargaId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      warga_id: data.warga_id,
      jabatan: data.jabatan,
      pin: data.pin,
      is_active: data.is_active ?? true,
      createdAt: data.createdAt?.toMillis() || 0,
      updatedAt: data.updatedAt?.toMillis() || 0,
    } as Petugas;
  }

  /**
   * Membuat data petugas baru.
   * PIN yang diterima sudah dalam bentuk SHA-256 hash (di-hash di service layer).
   */
  static async create(data: Omit<PetugasInput, "pin"> & { pin: string }): Promise<string> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      warga_id: data.warga_id,
      jabatan: data.jabatan,
      pin: data.pin, // sudah dalam bentuk hash
      is_active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * Memperbarui jabatan petugas.
   */
  static async updateJabatan(id: string, jabatan: string): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      jabatan,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Mereset PIN petugas.
   * PIN yang diterima sudah dalam bentuk SHA-256 hash (di-hash di service layer).
   */
  static async resetPin(id: string, hashedPin: string): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      pin: hashedPin,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Mengaktifkan atau menonaktifkan petugas.
   */
  static async setActive(id: string, isActive: boolean): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      is_active: isActive,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Mendengarkan perubahan data semua petugas (Real-time & Offline-First)
   */
  static observeAll(callback: (data: Petugas[]) => void): () => void {
    if (!db) return () => {};
    
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Petugas[];
      callback(data);
    }, (error) => {
      console.error("Error observing petugas:", error);
    });
  }
}
