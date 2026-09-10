// X-Market 五域集市系统 · 底座认证（开发版）会话
// 认证口径：密码 test123；一键登录免密直接进入预设身份。

import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import type { Request, Response } from 'express';
import type { HatRole, SessionUser } from '../shared/types';

interface Session {
  user: SessionUser;
  expiresAt: number;
}

const sessions = new Map<string, Session>();
// X-MARKET-TI-02 ①：登录态 TTL ≥2h 达标（当前 6h）；命中即滑动续期（活跃会话不过期），quick-login/oneclick 通道不变
const TTL = 1000 * 60 * 60 * 6;

// 会话落盘持久化（TI-02 ①：修复「登录态分钟级失效」——真因是内存会话随进程重启/回收清空，TTL 本身 6h 达标）
const SESSION_FILE = process.env.XM_SESSION_FILE || '/tmp/xm-sessions.json';
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persistSessions(): void {
  try {
    const now = Date.now();
    const rows: [string, Session][] = [];
    for (const [k, v] of sessions) {
      if (v.expiresAt > now) rows.push([k, v]);
      if (rows.length >= 2000) break; // 上限防无限膨胀
    }
    writeFileSync(SESSION_FILE, JSON.stringify(rows));
  } catch {
    /* 落盘失败不阻断会话主流程 */
  }
}
function schedulePersist(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persistSessions();
  }, 500);
}
(function loadSessions(): void {
  try {
    const raw = readFileSync(SESSION_FILE, 'utf8');
    const rows = JSON.parse(raw) as [string, Session][];
    if (!Array.isArray(rows)) return;
    for (const [token, s] of rows) {
      if (token && s && typeof s.expiresAt === 'number' && s.user) sessions.set(token, s);
    }
  } catch {
    /* 首次启动/文件损坏 → 空表 */
  }
})();

export function createToken(user: SessionUser): string {
  const token = `xm_${randomUUID().replace(/-/g, '')}`;
  sessions.set(token, { user, expiresAt: Date.now() + TTL });
  schedulePersist();
  return token;
}

export function getUserByToken(token: string): SessionUser | null {
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token);
    schedulePersist();
    return null;
  }
  s.expiresAt = Date.now() + TTL; // 滑动续期：活跃会话命中即顺延（TI-02 ①）
  schedulePersist();
  return s.user;
}

export function revokeToken(token: string): void {
  sessions.delete(token);
  schedulePersist();
}

/** 开发版共享密钥（测试口径） */
export const DEV_PASSWORD = 'test123';

/* ============ 会话请求/响应类型（登录底座公共契约，X-Market 与 X-Supply 共用） ============ */

/** 带会话身份的请求（requireAuth 挂载 req.user 后可用） */
export interface AuthReq extends Request {
  user?: SessionUser;
}

export type AuthRes = Response;

/** 角色取值（会话身份直取，底座级 helper） */
export const roleOf = (user: SessionUser): HatRole => user.hatRole ?? 'OU';

/* ============ 鉴权中间件（底座级：X-Market 与 X-Supply 路由域共用） ============ */

/** 强制鉴权：无有效会话 401；通过后挂 req.user */
export function requireAuth(req: AuthReq, res: AuthRes, next: () => void): void {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const user = token ? getUserByToken(token) : null;
  if (!user) {
    res.status(401).json({ success: false, error: '未登录或会话已过期' });
    return;
  }
  req.user = user;
  next();
}

/** 可选鉴权：匿名放行，req.user 可为空（公开面用） */
export function optionalAuth(req: AuthReq, _res: AuthRes, next: () => void): void {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  req.user = token ? getUserByToken(token) ?? undefined : undefined;
  next();
}