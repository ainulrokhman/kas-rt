import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'KAS' | 'JIMPITAN' | 'TABUNGAN';
  action: string;
  petugas_id: string;
  nominal: number;
  keterangan: string;
}

export class LogService {
  /**
   * Placeholder untuk addLog jika dibutuhkan di masa depan.
   * Saat ini log ditarik dinamis dari koleksi transaksi masing-masing.
   */
  static async addLog(petugasId: string, type: string, action: string) {
    console.log(`[Log] ${type} - ${action} by ${petugasId}`);
    // Untuk saat ini kita tidak menulis ke koleksi khusus log 
    // karena LogService.getRecentLogs menarik langsung dari koleksi transaksi.
  }

  static async getRecentLogs(limitCount: number = 50): Promise<AuditLogEntry[]> {
    if (!db) return [];

    // Fetch Kas Transactions
    const kasQuery = query(
      collection(db, "kas_transactions"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const kasSnapshot = await getDocs(kasQuery);
    const kasLogs: AuditLogEntry[] = kasSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.createdAt?.toMillis() || 0,
        type: 'KAS',
        action: data.jenis === 'MASUK' ? 'Kas Masuk' : 'Kas Keluar',
        petugas_id: data.petugas_id,
        nominal: data.nominal,
        keterangan: data.keterangan
      };
    });

    // Fetch Jimpitan Transactions
    const jimpitanQuery = query(
      collection(db, "jimpitan_transactions"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const jimpitanSnapshot = await getDocs(jimpitanQuery);
    const jimpitanLogs: AuditLogEntry[] = jimpitanSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.createdAt || 0,
        type: 'JIMPITAN',
        action: 'Tarikan Jimpitan',
        petugas_id: data.petugas_id,
        nominal: data.nominal,
        keterangan: `Penarikan jimpitan warga`
      };
    });

    // Fetch Tabungan Transactions
    const tabunganQuery = query(
      collection(db, "tabungan_transactions"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const tabunganSnapshot = await getDocs(tabunganQuery);
    const tabunganLogs: AuditLogEntry[] = tabunganSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.createdAt?.toMillis() || 0,
        type: 'TABUNGAN',
        action: data.jenis === 'SETOR' ? 'Setoran Tabungan' : 'Penarikan Tabungan',
        petugas_id: data.petugas_id,
        nominal: data.nominal,
        keterangan: data.keterangan || (data.jenis === 'SETOR' ? 'Setoran masal/individu' : 'Penarikan tabungan')
      };
    });

    // Merge and sort
    return [...kasLogs, ...jimpitanLogs, ...tabunganLogs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitCount);
  }
}
