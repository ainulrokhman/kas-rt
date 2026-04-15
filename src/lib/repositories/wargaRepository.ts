import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Warga, WargaInput } from "@/types/warga";

const COLLECTION_NAME = "warga";

export class WargaRepository {
  /**
   * Mengambil semua data warga dari Firestore
   */
  static async getAll(): Promise<Warga[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    // Default sorting berdasarkan tanggal dibuat, dari yang terbaru
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nama_lengkap: data.nama_lengkap,
        jenis_kelamin: data.jenis_kelamin,
        nomor_hp: data.nomor_hp,
        createdAt: data.createdAt?.toMillis() || 0,
        updatedAt: data.updatedAt?.toMillis() || 0,
      } as Warga;
    });
  }

  /**
   * Menambahkan data warga baru
   */
  static async create(data: WargaInput): Promise<string> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    // Sanitasi data: pastikan tidak ada spasi di awal/akhir
    const sanitizedData = {
      nama_lengkap: data.nama_lengkap.trim(),
      jenis_kelamin: data.jenis_kelamin,
      nomor_hp: data.nomor_hp ? data.nomor_hp.replace(/\D/g, "") : "", // Hapus semua karakter non-angka
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizedData);
    return docRef.id;
  }

  /**
   * Mengubah data warga yang sudah ada
   */
  static async update(id: string, data: Partial<WargaInput>): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (data.nama_lengkap !== undefined) updateData.nama_lengkap = data.nama_lengkap.trim();
    if (data.jenis_kelamin !== undefined) updateData.jenis_kelamin = data.jenis_kelamin;
    if (data.nomor_hp !== undefined) updateData.nomor_hp = data.nomor_hp ? data.nomor_hp.replace(/\D/g, "") : "";

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updateData);
  }

  /**
   * Menghapus data warga
   */
  static async delete(id: string): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}
