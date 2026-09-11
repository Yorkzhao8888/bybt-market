// X-MARKET-EMBED-01/03 · ZiwayOS 嵌入握手 adapter（前端）
// 协议 v1：hello(多播白名单) -> parent 回票（origin 白名单数组）-> /api/embed/exchange 换会话
// EMBED-03-M：白名单升数组——ZiwayOS 生产域 + dev 域默认全放行（真浏览器实证：生产壳层
// https://c8w9k9wq2g.coze.site 发票被单值 dev 白名单丢弃导致免登死锁）。
// VITE_ZIWAY_EMBED_ORIGIN 仅为本地联调/E2E 追加口（构建期注入，命中任一即放行；拒绝通配）。
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

export interface EmbedTicketMsg {
  type: string;
  ticket?: unknown;
}

export function isTicketMsg(ev: MessageEvent): ev is MessageEvent & { data: EmbedTicketMsg & { ticket: string } } {
  if (!ZIWAY_EMBED_ORIGINS.includes(ev.origin)) return false; // 白名单数组，命中任一即放行，拒绝通配
  const d = ev.data as EmbedTicketMsg | null;
  return !!d && d.type === EMBED_TICKET && typeof d.ticket === 'string' && d.ticket.startsWith('zt_');
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
