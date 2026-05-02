import { WargaRepository } from "@/lib/repositories/wargaRepository";
import { PetugasRepository } from "@/lib/repositories/petugasRepository";
import { AuthSession, LoginCredentials } from "@/types/petugas";

const SESSION_KEY = "kas_rt_session";
const SESSION_COOKIE = "kas-rt-session";

export class AuthService {
  /**
   * Melakukan hashing 6-digit PIN menggunakan Web Crypto API (SHA-256).
   * Berjalan di browser (client-side only).
   */
  static async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Proses login petugas.
   * Flow: nomor_hp → cari warga → cari petugas via warga_id → verifikasi PIN hash
   */
  static async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { nomor_hp, pin } = credentials;

    // 1. Cari warga berdasarkan nomor HP
    const warga = await WargaRepository.findByNomorHp(nomor_hp);
    if (!warga) {
      throw new Error("Nomor HP tidak terdaftar sebagai warga.");
    }

    // 2. Cari petugas yang berelasi dengan warga tersebut
    const petugas = await PetugasRepository.findByWargaId(warga.id);
    if (!petugas) {
      throw new Error("Warga ini tidak terdaftar sebagai petugas RT.");
    }

    // 3. Cek status aktif petugas
    if (!petugas.is_active) {
      throw new Error("Akun petugas ini telah dinonaktifkan.");
    }

    // 4. Hash PIN yang diinput lalu bandingkan dengan hash di database
    const hashedInput = await AuthService.hashPin(pin);
    if (hashedInput !== petugas.pin) {
      throw new Error("PIN tidak valid.");
    }

    // 5. Buat session object
    const session: AuthSession = {
      petugas_id: petugas.id,
      warga_id: warga.id,
      nama_lengkap: warga.nama_lengkap,
      jabatan: petugas.jabatan,
      nomor_hp: warga.nomor_hp,
      loginAt: Date.now(),
    };

    // 6. Simpan session ke localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // 7. Set cookie ringan untuk middleware server-side route protection
    // Cookie ini hanya sebagai sinyal "sudah login", bukan menyimpan data sensitif.
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;

    return session;
  }

  /**
   * Menghapus session dan cookie saat logout.
   */
  static logout(): void {
    localStorage.removeItem(SESSION_KEY);
    // Hapus cookie dengan set max-age ke 0
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
  }

  /**
   * Membaca session dari localStorage.
   * Mengembalikan null jika tidak ada session atau session tidak valid.
   */
  static getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  /**
   * Mengecek apakah user sudah dalam keadaan login.
   */
  static isAuthenticated(): boolean {
    return AuthService.getSession() !== null;
  }
}
