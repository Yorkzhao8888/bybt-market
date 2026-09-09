// 全局认证上下文（底座·开发版）
// X-MARKET-ENTRANCE-01 一角色一登入 P0：activeRole 视角状态（sessionStorage 持久）——
// 账号密码登录成功后清空（强制走角色选择页）；oneclick/loginDemo 一键登录自动携带默认角色直进视角；
// 切换角色 = 清空 activeRole 回角色选择页，清空当前视角会话状态。
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { HatRole, SessionUser } from '../shared/types';
import { api, getToken, setToken, setOnUnauthorized } from './api/client';

const ACTIVE_ROLE_KEY = 'entrance.activeRole';

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  isAuthed: boolean;
  activeRole: HatRole | null;
  setActiveRole: (role: HatRole) => void;
  clearActiveRole: () => void;
  login: (account: string, password: string, entry?: 'C' | 'B') => Promise<SessionUser>;
  oneClick: (entry: 'C' | 'B') => Promise<void>;
  loginDemo: (demoId: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const readActiveRole = (): HatRole | null => {
  try {
    const v = sessionStorage.getItem(ACTIVE_ROLE_KEY);
    return v ? (v as HatRole) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<HatRole | null>(readActiveRole);

  const setActiveRole = useCallback((role: HatRole) => {
    setActiveRoleState(role);
    try { sessionStorage.setItem(ACTIVE_ROLE_KEY, role); } catch { /* ignore */ }
  }, []);

  const clearActiveRole = useCallback(() => {
    // V5 切换角色：清空当前视角会话状态（P0 视角状态 = activeRole 单值；后续单扩展视角内缓存时在此统一清理）
    setActiveRoleState(null);
    try { sessionStorage.removeItem(ACTIVE_ROLE_KEY); } catch { /* ignore */ }
  }, []);

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
    setActiveRoleState(null);
    try { sessionStorage.removeItem(ACTIVE_ROLE_KEY); } catch { /* ignore */ }
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
        // 刷新恢复：activeRole 与登录帽不一致（换号/失效）时清空重选
        if (u.hatRole && activeRole && activeRole !== u.hatRole) clearActiveRole();
      } catch {
        clear();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear]);

  const login = useCallback(async (account: string, password: string): Promise<SessionUser> => {
    const res = await api.login({ account, password });
    setToken(res.token);
    setUser(res.user);
    clearActiveRole(); // 表单登录 → 强制走角色选择页（一角色一登入闭环）
    return res.user;
  }, [clearActiveRole]);

  const oneClick = useCallback(async (_entry: 'C' | 'B') => {
    const res = await api.oneClickById('xiaolin');
    setToken(res.token);
    setUser(res.user);
    if (res.user.hatRole) setActiveRole(res.user.hatRole); // V6 oneclick 直带默认角色
  }, [setActiveRole]);

  const loginDemo = useCallback(async (demoId: string) => {
    const res = await api.oneClickById(demoId);
    setToken(res.token);
    setUser(res.user);
    if (res.user.hatRole) setActiveRole(res.user.hatRole); // V6 一键登录直带默认角色
    return res.user;
  }, [setActiveRole]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    clear();
  }, [clear]);

  return (
    <Ctx.Provider value={{ user, loading, isAuthed: !!user, activeRole, setActiveRole, clearActiveRole, login, oneClick, loginDemo, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
