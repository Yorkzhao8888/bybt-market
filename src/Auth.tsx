// 全局认证上下文（底座·开发版）
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { SessionUser } from '../shared/types';
import { api, getToken, setToken, setOnUnauthorized } from './api/client';

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  isAuthed: boolean;
  login: (account: string, password: string, entry?: 'C' | 'B') => Promise<void>;
  oneClick: (entry: 'C' | 'B') => Promise<void>;
  loginDemo: (demoId: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(clear);
  }, [clear]);

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const u = await api.me();
        setUser(u);
      } catch {
        clear();
      } finally {
        setLoading(false);
      }
    })();
  }, [clear]);

  const login = useCallback(async (account: string, password: string, entry?: 'C' | 'B') => {
    const res = await api.login({ account, password, entry });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const oneClick = useCallback(async (entry: 'C' | 'B') => {
    const res = await api.oneClick(entry);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const loginDemo = useCallback(async (demoId: string) => {
    const res = await api.oneClickById(demoId);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    clear();
  }, [clear]);

  return (
    <Ctx.Provider value={{ user, loading, isAuthed: !!user, login, oneClick, loginDemo, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}