// X-MARKET-EMBED-01（EMBED-01-FIX）· 真票端到端验证（主 Agent 执行）
// 用法：node scripts/embed-real-verify-check.mjs <zt_真票> [exchange基址]
//   基址默认 http://localhost:5000（本地 dev 默认 ZIWAY_EMBED_BASE 指真实 ZiwayOS，
//   服务端到服务端核销，真票在本地 exchange 同样可通；验线上则传线上域基址）。
// 断言：真票 exchange 200 会话（xm_ token + CU）→ token 可用（/api/auth/me 200）→ 同票重放 401。
const ticket = process.argv[2] || '';
const base = (process.argv[3] || 'http://localhost:5000').replace(/\/$/, '');

if (!ticket.startsWith('zt_')) {
  console.error('FAIL 参数缺失：第一个参数必须是 ZiwayOS 签发的 zt_ 真票');
  process.exit(1);
}

const results = [];
function assert(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail ?? '' });
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : ` | ${detail ?? ''}`}`);
}

async function ex(t) {
  const r = await fetch(`${base}/api/embed/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket: t }),
  });
  let j = null;
  try { j = await r.json(); } catch { /* keep null */ }
  return { status: r.status, j };
}

// 1) 真票首次：200 会话（ZiwayOS 统一包装 {code,data:{ok,...}} 由 verifyTicket 下钻解析）
const r1 = await ex(ticket);
const d1 = r1.j?.data;
assert('real-ticket-200-session', r1.status === 200 && typeof d1?.token === 'string' && d1.token.startsWith('xm_') && d1.user?.hatRole === 'CU' && d1.embed?.role === 'CU',
  `status=${r1.status} reason=${r1.j?.reason} error=${r1.j?.error} role=${d1?.user?.hatRole} embed=${JSON.stringify(d1?.embed)}`);

// 2) 会话可用：token 调 /api/auth/me 200
let meOk = false;
let meDetail = '';
if (d1?.token) {
  const me = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${d1.token}` } });
  meOk = me.status === 200;
  meDetail = `status=${me.status}`;
} else {
  meDetail = 'no token from step1';
}
assert('session-token-usable', meOk, meDetail);

// 3) 同票重放：401（票单次消费在 ZiwayOS verify，message 透出）
const r3 = await ex(ticket);
assert('real-ticket-replay-401', r3.status === 401, `status=${r3.status} reason=${r3.j?.reason} error=${r3.j?.error}`);

const fails = results.filter((r) => !r.ok).length;
console.log(`SUMMARY ${results.length - fails}/${results.length} passed`);
process.exit(fails > 0 ? 1 : 0);
