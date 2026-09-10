// ================= X-MARKET-EMBED-01 ZiwayOS 嵌入握手（服务端票核销桥） =================
// 信任锚 = ZiwayOS verify（不自建 JWT/密钥）；票单次消费由 ZiwayOS verify 端点负责（重放在此被拒）。
// 红线：ticket 不落日志明文（仅前缀+长度）；realm/app 不匹配不签会话；失败/超时一律 401 不造假会话。

const ZIWAY_BASE = process.env.ZIWAY_EMBED_BASE || 'https://ebb131cf-37e1-493f-8717-36c8905a080a.dev.coze.site';
const ZIWAY_APP = 'market';
const EXPECTED_REALM = process.env.ZIWAY_EMBED_REALM || 'market';
const CONSUMER_ROLES = new Set(['CU', 'GU']);

export interface EmbedVerifyOk {
  ok: true;
  role: string;
  realm: string;
  jti: string;
}
export interface EmbedVerifyFail {
  ok: false;
  reason: string;
}
export type EmbedVerifyResult = EmbedVerifyOk | EmbedVerifyFail;

function ticketTag(ticket: string): string {
  return `${ticket.slice(0, 6)}…(len=${ticket.length})`;
}

/** 服务端到服务端调用 ZiwayOS 票核销。8s 超时；网络失败返回 fail 不抛出（上层统一 401）。 */
export async function verifyTicket(ticket: string): Promise<EmbedVerifyResult> {
  try {
    const res = await fetch(`${ZIWAY_BASE}/api/embed/ticket/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, app: ZIWAY_APP }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[EMBED] verify http=${res.status} app=${ZIWAY_APP} ticket=${ticketTag(ticket)}`);
      return { ok: false, reason: `verify_http_${res.status}` };
    }
    const j = (await res.json()) as { ok?: boolean; role?: string; realm?: string; jti?: string; error?: string };
    if (j.ok && typeof j.role === 'string' && typeof j.realm === 'string' && typeof j.jti === 'string') {
      return { ok: true, role: j.role, realm: j.realm, jti: j.jti };
    }
    console.warn(`[EMBED] verify rejected app=${ZIWAY_APP} reason=${j.error ?? 'unknown'} ticket=${ticketTag(ticket)}`);
    return { ok: false, reason: j.error ?? 'verify_rejected' };
  } catch (e) {
    console.warn(`[EMBED] verify unreachable app=${ZIWAY_APP} err=${e instanceof Error ? e.message : 'unknown'} ticket=${ticketTag(ticket)}`);
    return { ok: false, reason: 'verify_unreachable' };
  }
}

export const embedMeta = { base: ZIWAY_BASE, app: ZIWAY_APP, expectedRealm: EXPECTED_REALM, consumerRoles: CONSUMER_ROLES };
