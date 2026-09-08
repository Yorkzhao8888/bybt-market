// X-Market 五域集市系统 · 底座认证（开发版）会话
// 认证口径：密码 test123；一键登录免密直接进入预设身份。

import { randomUUID } from 'node:crypto';
import type { SessionUser } from '../shared/types';

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