import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { login as apiLogin, clearAuth, setOnAuthExpired } from '../services/bookingService';

interface AuthState {
  isAuthed: boolean;
  isAdmin: boolean;
  username: string | null;
  role: string | null;
  expiresAt: number | null; // epoch ms
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const logout = useCallback(() => {
    clearAuth();
    setUsername(null);
    setRole(null);
    setExpiresAt(null);
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const res = await apiLogin(u, p);
    if (res.ok) {
      setUsername(res.username || u);
      setRole(res.role || 'user');
      const ttl = (res.expiresInSec || 1800) * 1000;
      setExpiresAt(Date.now() + ttl);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, []);

  // ถ้า mutation เจอ token หมดอายุจาก GAS (code:'AUTH') → เคลียร์ session
  React.useEffect(() => {
    setOnAuthExpired(() => {
      setUsername(null);
      setRole(null);
      setExpiresAt(null);
    });
  }, []);

  const isAuthed = !!username && !!expiresAt && Date.now() < expiresAt;
  const value = useMemo<AuthState>(
    () => ({
      isAuthed,
      isAdmin: isAuthed && role === 'admin',
      username,
      role,
      expiresAt,
      login,
      logout,
    }),
    [isAuthed, username, role, expiresAt, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
