// MARKET-CONN-01：Booth 履约时间线连接底座（server 代理持有 OAS token，不落地浏览器）
// - token 来源：环境变量 BOOTH_OAS_TOKEN（主 Agent 线上注入优先）；否则向 OAS 站 dev-token 换取（RS256，kid=oas-rsa-001）
// - token 内存缓存至到期前 5 分钟，过期自动重签； Booth API 失败（faas 冷启动 503 常见）自动重试一次
// - 契约单 v1.1 协议不动：本模块只读消费，不透传/不回写
import type { BoothFulfillmentOrder } from '../shared/types';

const OAS_BASE = process.env.BOOTH_OAS_BASE || 'https://62j75kfyn3.coze.site';
const BOOTH_BASE = process.env.BOOTH_BASE || 'https://cbpbgkdbvs.coze.site';
const OAS_ROLE = process.env.BOOTH_OAS_ROLE || 'SU';

let cached: { token: string; exp: number } | null = null;

export function boothBase(): string {
  return BOOTH_BASE;
}

async function obtainToken(): Promise<string> {
  if (process.env.BOOTH_OAS_TOKEN) return process.env.BOOTH_OAS_TOKEN;
  const res = await fetch(`${OAS_BASE}/api/v1/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: OAS_ROLE, expires_minutes: 45 }),
    signal: AbortSignal.timeout(8000),
  });
  const j = (await res.json()) as { code?: number; data?: { token?: string; expires_at?: string } };
  const d = j?.data;
  const token = d?.token;
  if (!token) throw new Error('oas_token_issue_failed');
  const parsed = d?.expires_at ? Date.parse(d.expires_at) : NaN;
  cached = { token, exp: Number.isFinite(parsed) ? parsed : Date.now() + 40 * 60 * 1000 };
  return token;
}

/** 获取（并缓存）Booth 侧 OAS RS256 token —— 仅 server 内存持有 */
export async function getBoothToken(): Promise<string> {
  if (cached && cached.exp - 5 * 60 * 1000 > Date.now()) return cached.token;
  return obtainToken();
}

/** 拉取 Booth 全链履约时间线（全量，Booth API 无过滤参数；按单号在调用侧匹配） */
export async function fetchBoothTimeline(): Promise<BoothFulfillmentOrder[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const token = await getBoothToken();
      const res = await fetch(`${BOOTH_BASE}/api/booth/fulfillment/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) throw new Error(`booth_http_${res.status}`);
      const j = (await res.json()) as { success?: boolean; data?: { orders?: BoothFulfillmentOrder[] } };
      if (j?.success && Array.isArray(j.data?.orders)) return j.data.orders as BoothFulfillmentOrder[];
      throw new Error('booth_bad_payload');
    } catch (e) {
      lastErr = e;
      cached = null; // token 可能失效/冷启动，重签后重试
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('booth_unreachable');
}

/** 「在 Booth 中查看」深链（工单口径：带 OAS token query，新窗口落 Booth 履约视角） */
export function boothDeepLink(token: string, orderNo?: string | null): string {
  const q = new URLSearchParams({ token });
  if (orderNo) q.set('orderNo', orderNo);
  return `${BOOTH_BASE}/fulfillment-track?${q.toString()}`;
}
