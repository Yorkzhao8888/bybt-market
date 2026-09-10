// X-MARKET-EMBED-01 · ZiwayOS verify mock（联调自测专用，独立进程，不进生产路由）
// 模拟 ZiwayOS POST /api/embed/ticket/verify 语义：
//   - app !== 'market'            -> {ok:false, error:'app_mismatch'}
//   - 票重放（已消费）             -> {ok:false, error:'ticket_replayed'}
//   - zt_bad_role_...             -> ok+role:'DU'（Market 侧应 403）
//   - zt_bad_realm_...            -> ok+realm:'other'（Market 侧应 403）
//   - zt_bad_app_...              -> {ok:false, error:'app_mismatch'}
//   - 其余 zt_ 票首次             -> {ok:true, role:'CU', realm:'market', jti}
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
    res.end(JSON.stringify({ ok: false, error: 'not_found' }));
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
      res.end(JSON.stringify({ ok: false, error: 'app_mismatch' }));
      return;
    }
    if (!ticket.startsWith('zt_') || ticket.length < 8) {
      res.end(JSON.stringify({ ok: false, error: 'invalid_ticket' }));
      return;
    }
    if (consumed.has(ticket)) {
      res.end(JSON.stringify({ ok: false, error: 'ticket_replayed' }));
      return;
    }
    if (ticket.startsWith('zt_bad_role_')) {
      consumed.add(ticket);
      res.end(JSON.stringify({ ok: true, role: 'DU', realm: 'market', jti: `jti-role-${++seq}` }));
      return;
    }
    if (ticket.startsWith('zt_bad_realm_')) {
      consumed.add(ticket);
      res.end(JSON.stringify({ ok: true, role: 'CU', realm: 'other', jti: `jti-realm-${++seq}` }));
      return;
    }
    consumed.add(ticket);
    res.end(JSON.stringify({ ok: true, role: 'CU', realm: 'market', jti: `jti-${++seq}` }));
  });
});

server.listen(PORT, () => console.log(`[EMBED-MOCK] listening :${PORT}`));
