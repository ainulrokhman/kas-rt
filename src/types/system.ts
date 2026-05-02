export interface SystemGlobalSetting {
  id: string; // 'config'
  public_pin: string; // Hashed SHA-256
  updatedAt?: number;
}
