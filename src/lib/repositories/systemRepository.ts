import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SystemGlobalSetting } from "@/types/system";

const COLLECTION_NAME = "system_settings";
const CONFIG_ID = "config";
const DEFAULT_PIN_HASH = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"; // "123456"

export class SystemRepository {
  /**
   * Mengambil Pengaturan Global Sistem.
   * Jika belum ada, kembalikan default.
   */
  static async getGlobalSetting(): Promise<SystemGlobalSetting> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const docRef = doc(db, COLLECTION_NAME, CONFIG_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        public_pin: data.public_pin || DEFAULT_PIN_HASH,
        updatedAt: data.updatedAt?.toMillis() || 0,
      } as SystemGlobalSetting;
    } else {
      return {
        id: CONFIG_ID,
        public_pin: DEFAULT_PIN_HASH,
      };
    }
  }

  /**
   * Mengupdate PIN Publik
   */
  static async updatePublicPin(hashedPin: string): Promise<void> {
    if (!db) throw new Error("Firestore instance belum terinisialisasi");
    
    const docRef = doc(db, COLLECTION_NAME, CONFIG_ID);
    await setDoc(docRef, {
      public_pin: hashedPin,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
}
