// X-MARKET-EMBED-01/03/09 · ZiwayOS 嵌入握手 adapter（前端）
// 协议 v1：hello(多播白名单) -> parent 回票（origin 白名单数组）-> /api/embed/exchange 换会话
// EMBED-03-M：白名单升数组——ZiwayOS 生产域 + dev 域默认全放行（真浏览器实证：生产壳层
// https://c8w9k9wq2g.coze.site 发票被单值 dev 白名单丢弃导致免登死锁）。
// VITE_ZIWAY_EMBED_ORIGIN 仅为本地联调/E2E 追加口（构建期注入，命中任一即放行；拒绝通配）。
// EMBED-09：票消息多形态兼容提取（ticket / payload.ticket / data.ticket）+ 全链路 xm:embed 诊断日志
// （收票 origin/形状/exchange 结果可见——「票未送达」与「送达被拒」两类断点可由日志直接区分）。
const ZIWAY_EMBED_PROD_ORIGIN = 'https://c8w9k9wq2g.coze.site';
const ZIWAY_EMBED_DEV_ORIGIN = 'https://ebb131cf-37e1-493f-8717-36c8905a080a.dev.coze.site';

const envOrigin = import.meta.env?.VITE_ZIWAY_EMBED_ORIGIN;

/** origin 白名单数组：ZiwayOS 生产 + dev 默认，VITE_ZIWAY_EMBED_ORIGIN 追加（去重） */
export const ZIWAY_EMBED_ORIGINS: readonly string[] = Array.from(
  new Set([ZIWAY_EMBED_PROD_ORIGIN, ZIWAY_EMBED_DEV_ORIGIN, ...(envOrigin ? [String(envOrigin)] : [])]),
);

/** 向后兼容：首个白名单项（生产域优先） */
export const ZIWAY_EMBED_ORIGIN = ZIWAY_EMBED_ORIGINS[0];

export const EMBED_HELLO = 'ziway-embed-hello';
export const EMBED_TICKET = 'ziway-embed-ticket';
export const EMBED_APP = 'market';

// 检测嵌入环境：在 iframe 内且 URL 显式携带 embed=ziway（双条件，避免误判）
export function detectEmbedMode(): boolean {
  try {
    if (typeof window === 'undefined' || window.parent === window) return false;
    return new URLSearchParams(window.location.search).get('embed') === 'ziway';
  } catch {
    return false;
  }
}

function pickTicket(v: unknown): string | null {
  return typeof v === 'string' && v.startsWith('zt_') ? v : null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

/** 票字段多形态提取：{ticket} | {payload:{ticket}} | {data:{ticket}}（壳侧消息形状演进兼容） */
export function extractTicket(data: unknown): string | null {
  const d = asRecord(data);
  if (!d) return null;
  const payload = asRecord(d.payload);
  const inner = asRecord(d.data);
  return pickTicket(d.ticket) ?? pickTicket(payload?.ticket) ?? pickTicket(inner?.ticket);
}

export type EmbedMsgVerdict =
  | { kind: 'ticket'; ticket: string; origin: string }
  | { kind: 'reject'; reason: string }
  | { kind: 'noise' };

/**
 * 收票判定（EMBED-09）：
 * - type=ziway-embed-ticket 无论 origin 命中与否都参与判定（拒单必带 reason——「票未达前端」与「送达被拒」靠日志区分）
 * - 其余消息归 noise（Vite HMR / devtools / 宿主其他应用消息），不打日志不刷屏
 */
export function inspectEmbedMessage(ev: MessageEvent): EmbedMsgVerdict {
  const d = asRecord(ev.data);
  if (!d) return { kind: 'noise' };
  const type = typeof d.type === 'string' ? d.type : '';
  if (type !== EMBED_TICKET) return { kind: 'noise' };
  if (!ZIWAY_EMBED_ORIGINS.includes(ev.origin)) {
    return { kind: 'reject', reason: `origin 未命中白名单（origin=${ev.origin}，白名单=${ZIWAY_EMBED_ORIGINS.join(' , ')}）` };
  }
  const ticket = extractTicket(d);
  if (!ticket) {
    const keys = Object.keys(d).join(',');
    return { kind: 'reject', reason: `票字段缺失或格式不合规（期望 zt_ 前缀 ticket，消息 keys=${keys}）` };
  }
  return { kind: 'ticket', ticket, origin: ev.origin };
}

/** hello 多播：对白名单逐域 postMessage（origin 不匹配的被浏览器丢弃，命中宿主域的送达；严禁 * 通配） */
export function postHelloToParent(payload: { type: string; app: string }): void {
  try {
    for (const origin of ZIWAY_EMBED_ORIGINS) {
      window.parent?.postMessage({ ...payload }, origin);
    }
  } catch {
    /* parent 不可达则等重试 */
  }
}
