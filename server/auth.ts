// X-Market 五域集市系统 · 底座认证（开发版）会话
// 认证口径：密码 test123；一键登录免密直接进入预设身份。

import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { HatRole, SessionUser } from '../shared/types';

interface Session {
  user: SessionUser;
  expiresAt: number;
}

const sessions = new Map<string, Session>();
const TTL = 1000 * 60 * 60 * 6; // 6h

export function createToken(user: SessionUser): string {
  const token = `xm_${randomUUID().replace(/-/g, '')}`;
  sessions.set(token, { user, expiresAt: Date.now() + TTL });
  return token;
}

export function getUserByToken(token: string): SessionUser | null {
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return s.user;
}

export function revokeToken(token: string): void {
  sessions.delete(token);
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