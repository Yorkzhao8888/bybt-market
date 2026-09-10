// ================= X-MARKET-EMBED-01 ZiwayOS 嵌入握手（服务端票核销桥） =================
// 信任锚 = ZiwayOS verify（不自建 JWT/密钥）；票单次消费由 ZiwayOS verify 端点负责（重放在此被拒）。
// 红线：ticket 不落日志明文（仅前缀+长度）；realm/app 不匹配不签会话；失败/超时一律 401 不造假会话。
// EMBED-01-FIX：真实 verify 响应为 ZiwayOS 统一包装 {code, data:{ok,role,realm,jti}}
//   （401 时 {code:401,message:"ticket 不存在或已过期"}，http 同码）——解析下钻 data 层；
//   兼容裸 {ok:true,...}（mock/联调）；失败分支读顶层 code/message 透出诊断原因。

const ZIWAY_BASE = process.env.ZIWAY_EMBED_BASE || 'https://ebb131cf-37e1-493f-8717-36c8905a080a.dev.coze.site';
const ZIWAY_APP = 'market';
// 真实 ZiwayOS 签发 realm='xhpz'（EMBED-01-FIX 实测）；env ZIWAY_EMBED_REALM 可覆盖
const EXPECTED_REALM = process.env.ZIWAY_EMBED_REALM || 'xhpz';
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

interface VerifyBody {
  code?: number;
  data?: { ok?: boolean; role?: string; realm?: string; jti?: string; message?: string };
  message?: string;
  error?: string;
  ok?: boolean;
  role?: string;
  realm?: string;
  jti?: string;
}

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
    const j = (await res.json().catch(() => null)) as VerifyBody | null;
    // 统一包装 {code,data:{ok,...}} 优先；裸 {ok,...} 兼容（payload=j 自身）
    const payload = j?.data ?? j;
    if (res.ok && payload && payload.ok && typeof payload.role === 'string' && typeof payload.realm === 'string' && typeof payload.jti === 'string') {
      return { ok: true, role: payload.role, realm: payload.realm, jti: payload.jti };
    }
    const reason = j?.message ?? j?.error ?? j?.data?.message ?? `verify_http_${res.status}`;
    console.warn(`[EMBED] verify rejected app=${ZIWAY_APP} http=${res.status} reason=${reason} ticket=${ticketTag(ticket)}`);
    return { ok: false, reason };
  } catch (e) {
    console.warn(`[EMBED] verify unreachable app=${ZIWAY_APP} err=${e instanceof Error ? e.message : 'unknown'} ticket=${ticketTag(ticket)}`);
    return { ok: false, reason: 'verify_unreachable' };
  }
}

export const embedMeta = { base: ZIWAY_BASE, app: ZIWAY_APP, expectedRealm: EXPECTED_REALM, consumerRoles: CONSUMER_ROLES };
