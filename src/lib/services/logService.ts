import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'KAS' | 'JIMPITAN';
  action: string;
  petugas_id: string;
  nominal: number;
  keterangan: string;
}

export class LogService {
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
        timestamp: data.createdAt || 0, // Jimpitan uses epoch number
        type: 'JIMPITAN',
        action: 'Tarikan Jimpitan',
        petugas_id: data.petugas_id,
        nominal: data.nominal,
        keterangan: `Penarikan jimpitan warga (ID: ${data.warga_id.substring(0,5)}...)`
      };
    });

    // Merge and sort
    return [...kasLogs, ...jimpitanLogs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitCount);
  }
}
