"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { AuthSession, LoginCredentials } from "@/types/petugas";

interface AuthContextValue {
  user: AuthSession | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session dari localStorage saat mount
  useEffect(() => {
    const session = AuthService.getSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const session = await AuthService.login(credentials);
      setUser(session);
      router.replace("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook untuk mengakses auth context.
 * Harus digunakan di dalam AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus digunakan di dalam <AuthProvider>");
  }
  return ctx;
}
