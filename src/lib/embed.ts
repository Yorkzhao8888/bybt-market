// X-MARKET-EMBED-01 · ZiwayOS 嵌入握手 adapter（前端）
// 协议 v1：hello -> parent 回票（origin 白名单）-> /api/embed/exchange 换会话
// 生产默认白名单 = ZiwayOS 宿主域（硬编码，拒绝通配）；
// VITE_ZIWAY_EMBED_ORIGIN 仅为本地联调/E2E 覆盖口（构建期注入，dev 与生产构建均不设置该变量）。
export const ZIWAY_EMBED_ORIGIN =
  import.meta.env?.VITE_ZIWAY_EMBED_ORIGIN || 'https://ebb131cf-37e1-493f-8717-36c8905a080a.dev.coze.site';

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
  if (ev.origin !== ZIWAY_EMBED_ORIGIN) return false; // 白名单，拒绝通配
  const d = ev.data as EmbedTicketMsg | null;
  return !!d && d.type === EMBED_TICKET && typeof d.ticket === 'string' && d.ticket.startsWith('zt_');
}
