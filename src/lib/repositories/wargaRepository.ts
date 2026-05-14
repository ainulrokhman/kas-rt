import { 
  collection, 
  getDocs,
  getDoc,
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where,
  limit,
  serverTimestamp,
  onSnapshot
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
    
    // Filter warga yang belum dihapus. 
    // Sorting dilakukan in-memory untuk menghindari kebutuhan composite index di Firestore.
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("isDeleted", "==", false)
    );
    const snapshot = await getDocs(q);
    
    const results = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nama_lengkap: data.nama_lengkap,
        jenis_kelamin: data.jenis_kelamin,
        nomor_hp: data.nomor_hp,
        dikecualikan_jimpitan: !!data.dikecualikan_jimpitan,
        createdAt: data.createdAt?.toMillis() || 0,
        updatedAt: data.updatedAt?.toMillis() || 0,
        isDeleted: !!data.isDeleted,
      } as Warga;
    });

    // Sort in-memory: createdAt DESC
    return results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  /**
   * Mengambil semua data warga termasuk yang sudah dihapus (soft-delete)
   */
  static async getAllIncludingDeleted(): Promise<Warga[]> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    
    const results = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nama_lengkap: data.nama_lengkap,
        jenis_kelamin: data.jenis_kelamin,
        nomor_hp: data.nomor_hp,
        dikecualikan_jimpitan: !!data.dikecualikan_jimpitan,
        createdAt: data.createdAt?.toMillis() || 0,
        updatedAt: data.updatedAt?.toMillis() || 0,
        isDeleted: !!data.isDeleted,
      } as Warga;
    });

    return results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  /**
   * Mengambil data warga berdasarkan ID secara langsung
   */
  static async getById(id: string): Promise<Warga | null> {
    if (!db || !id) return null;
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      createdAt: data.createdAt?.toMillis() || 0,
      updatedAt: data.updatedAt?.toMillis() || 0,
    } as Warga;
  }

  /**
   * Mengambil data warga berdasarkan daftar ID
   */
  static async getByIds(ids: string[]): Promise<Warga[]> {
    if (!db || ids.length === 0) return [];

    // Firestore query 'in' maksimal 10 item per query.
    // Namun untuk mempermudah dan karena jumlah warga kecil, kita bisa ambil semua dan filter in-memory
    // atau melakukan chunking. Di sini kita ambil semua dan filter untuk kestabilan.
    const all = await this.getAllIncludingDeleted();
    const idSet = new Set(ids);
    return all.filter(w => idSet.has(w.id));
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
      dikecualikan_jimpitan: !!data.dikecualikan_jimpitan,
      isDeleted: false,
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

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.nama_lengkap !== undefined) updateData.nama_lengkap = data.nama_lengkap.trim();
    if (data.jenis_kelamin !== undefined) updateData.jenis_kelamin = data.jenis_kelamin;
    if (data.nomor_hp !== undefined) updateData.nomor_hp = data.nomor_hp ? data.nomor_hp.replace(/\D/g, "") : "";
    if (data.dikecualikan_jimpitan !== undefined) updateData.dikecualikan_jimpitan = !!data.dikecualikan_jimpitan;

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updateData);
  }

  /**
   * Menghapus data warga
   */
  static async delete(id: string): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: Date.now(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Mencari warga berdasarkan nomor HP.
   * Digunakan untuk proses autentikasi petugas (lookup username).
   * Nomor HP di-sanitasi (strip non-digit) sebelum query.
   */
  static async findByNomorHp(nomorHp: string): Promise<Warga | null> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    // Sanitasi nomor HP: hapus semua karakter non-angka
    const sanitized = nomorHp.replace(/\D/g, "");
    if (!sanitized) return null;

    const q = query(
      collection(db, COLLECTION_NAME),
      where("nomor_hp", "==", sanitized),
      where("isDeleted", "==", false),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      nama_lengkap: data.nama_lengkap,
      jenis_kelamin: data.jenis_kelamin,
      nomor_hp: data.nomor_hp,
      dikecualikan_jimpitan: !!data.dikecualikan_jimpitan,
      createdAt: data.createdAt?.toMillis() || 0,
      updatedAt: data.updatedAt?.toMillis() || 0,
    } as Warga;
  }

  /**
   * Mendengarkan perubahan data semua warga (Real-time & Offline-First)
   */
  static observeAll(callback: (data: Warga[]) => void): () => void {
    if (!db) return () => {};
    
    // Filter warga yang belum dihapus. 
    // Sorting dilakukan in-memory untuk menghindari kebutuhan composite index di Firestore.
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("isDeleted", "==", false)
    );
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          dikecualikan_jimpitan: !!d.dikecualikan_jimpitan,
          createdAt: d.createdAt?.toMillis() || 0,
          updatedAt: d.updatedAt?.toMillis() || 0,
        };
      }) as Warga[];

      // Sort in-memory: nama_lengkap ASC
      data.sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));
      
      callback(data);
    }, (error) => {
      console.error("Error observing warga:", error);
    });
  }

  /**
   * Migrasi data warga lama untuk menambahkan field isDeleted: false
   */
  static async migrateIsDeleted(): Promise<{ total: number; updated: number }> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");

    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    let updated = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.isDeleted === undefined) {
        await updateDoc(docSnap.ref, {
          isDeleted: false,
          updatedAt: serverTimestamp(),
        });
        updated++;
      }
    }

    return { total: snapshot.size, updated };
  }
}
