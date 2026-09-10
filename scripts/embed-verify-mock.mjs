// X-MARKET-EMBED-01（EMBED-01-FIX）· ZiwayOS verify mock（联调自测专用，独立进程，不进生产路由）
// 模拟 ZiwayOS POST /api/embed/ticket/verify 真实语义（统一包装格式 {code,data}）：
//   - app !== 'market'            -> {code:400, message:'app_mismatch'}
//   - 票重放（已消费）             -> {code:401, message:'ticket_replayed'}
//   - 非 zt_/过短                 -> {code:400, message:'invalid_ticket'}
//   - zt_bad_role_...             -> {code:200,data:{ok:true,role:'DU',realm:'xhpz',...}}（Market 侧应 403）
//   - zt_bad_realm_...            -> {code:200,data:{ok:true,role:'CU',realm:'other',...}}（Market 侧应 403）
//   - zt_bare_...                 -> 裸 {ok:true,role:'CU',realm:'xhpz',...}（旧裸格式兼容分支覆盖）
//   - 其余 zt_ 票首次             -> {code:200,data:{ok:true,role:'CU',realm:'xhpz',jti}}（真实格式主路径）
// 红线：日志只打 ticket 前缀+长度，禁止明文。
import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT || 9301);
const consumed = new Set();
let seq = 0;

function ticketTag(t) {
  return `${t.slice(0, 6)}…(len=${t.length})`;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.startsWith('/api/embed/ticket/verify')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 404, message: 'not_found' }));
    return;
  }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    let parsed = {};
    try { parsed = JSON.parse(body || '{}'); } catch { /* fallthrough */ }
    const ticket = typeof parsed.ticket === 'string' ? parsed.ticket : '';
    const app = typeof parsed.app === 'string' ? parsed.app : '';
    console.log(`[EMBED-MOCK] verify app=${app || '-'} ticket=${ticketTag(ticket)}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (app !== 'market' || ticket.startsWith('zt_bad_app_')) {
      res.end(JSON.stringify({ code: 400, message: 'app_mismatch' }));
      return;
    }
    if (!ticket.startsWith('zt_') || ticket.length < 8) {
      res.end(JSON.stringify({ code: 400, message: 'invalid_ticket' }));
      return;
    }
    if (consumed.has(ticket)) {
      res.end(JSON.stringify({ code: 401, message: 'ticket_replayed' }));
      return;
    }
    const okData = (role, realm) => ({ ok: true, role, realm, jti: `jti-${++seq}` });
    if (ticket.startsWith('zt_bad_role_')) {
      consumed.add(ticket);
      res.end(JSON.stringify({ code: 200, data: okData('DU', 'xhpz') }));
      return;
    }
    if (ticket.startsWith('zt_bad_realm_')) {
      consumed.add(ticket);
      res.end(JSON.stringify({ code: 200, data: okData('CU', 'other') }));
      return;
    }
    if (ticket.startsWith('zt_bare_')) {
      consumed.add(ticket);
      res.end(JSON.stringify(okData('CU', 'xhpz'))); // 裸格式（mock 旧版形态，verifyTicket 兼容分支）
      return;
    }
    consumed.add(ticket);
    res.end(JSON.stringify({ code: 200, data: okData('CU', 'xhpz') }));
  });
});

server.listen(PORT, () => console.log(`[EMBED-MOCK] listening :${PORT}`));
