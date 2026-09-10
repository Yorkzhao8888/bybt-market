// X-MARKET-EMBED-01 · /api/embed/exchange 联调自测（单命令内串行，规避 test_run 乱序并行）
// 前置：mock verify 已在 :9301（scripts/embed-verify-mock.mjs），dev server 已以
//       ZIWAY_EMBED_BASE=http://127.0.0.1:9301 启动。
// 断言六态：合法票 200 会话 / 同票重放 401 / 未知角色 403 / realm 不匹配 403 /
//           app 不匹配 401 / 票格式非法 400。
const EX = process.env.EXCHANGE_BASE || 'http://localhost:5000/api/embed/exchange';

async function ex(ticket) {
  const r = await fetch(EX, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket }),
  });
  let j = null;
  try { j = await r.json(); } catch { /* keep null */ }
  return { status: r.status, j };
}

const results = [];
function assert(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail ?? '' });
}

const stamp = Date.now().toString(36);

// 1) 合法票首次：200 + xm_ token + CU 消费态会话
const t1 = `zt_ok_${stamp}`;
const r1 = await ex(t1);
const d1 = r1.j?.data; // ok() 响应外壳 {success, data}
assert('valid-ticket-200', r1.status === 200 && typeof d1?.token === 'string' && d1.token.startsWith('xm_') && d1.user?.hatRole === 'CU' && d1.embed?.role === 'CU',
  `status=${r1.status} role=${d1?.user?.hatRole} embed=${JSON.stringify(d1?.embed)} token=${d1?.token ? `${d1.token.slice(0, 3)}…` : 'none'}`);

// 2) 同票重放：401 + ticket_replayed（票单次消费，由 ZiwayOS verify 负责）
const r2 = await ex(t1);
assert('replay-401', r2.status === 401 && r2.j?.reason === 'ticket_replayed', `status=${r2.status} reason=${r2.j?.reason}`);

// 3) 未知角色票（verify ok 但 role=DU）：403 非 CU/GU
const r3 = await ex(`zt_bad_role_${stamp}`);
assert('bad-role-403', r3.status === 403 && typeof r3.j?.error === 'string' && r3.j.error.includes('DU'), `status=${r3.status} error=${r3.j?.error}`);

// 4) realm 不匹配票（verify ok 但 realm=other）：403
const r4 = await ex(`zt_bad_realm_${stamp}`);
assert('bad-realm-403', r4.status === 403 && typeof r4.j?.error === 'string' && r4.j.error.includes('realm'), `status=${r4.status} error=${r4.j?.error}`);

// 5) app 不匹配票（verify 拒绝 app_mismatch）：401
const r5 = await ex(`zt_bad_app_${stamp}`);
assert('bad-app-401', r5.status === 401 && r5.j?.reason === 'app_mismatch', `status=${r5.status} reason=${r5.j?.reason}`);

// 6) 票格式非法（非 zt_/过短）：400
const r6 = await ex('zt_');
assert('invalid-ticket-400', r6.status === 400, `status=${r6.status} error=${r6.j?.error}`);

let fails = 0;
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ` | ${r.detail}`}`);
  if (!r.ok) fails += 1;
}
console.log(`SUMMARY ${results.length - fails}/${results.length} passed`);
process.exit(fails > 0 ? 1 : 0);
