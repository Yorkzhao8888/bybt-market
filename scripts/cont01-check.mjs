// XMK-CONT-01 API 级验证：V2 XDPZ 一键登录/密码登录 + V3 回归（抽样 3 账号 + 全量 oneclick）
const BASE = process.env.MARKET_BASE || 'http://localhost:5000';
const results = [];
const ok = (name, cond, extra = '') => { results.push([name, !!cond]); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`); };

async function j(path, opts) {
  const r = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  let b = null; try { b = await r.json(); } catch { /* noop */ }
  return { status: r.status, body: b };
}

// ---- V2: XDPZ 一键登录（dp1 / acc-dp1 别名）----
const v2a = await j('/api/auth/oneclick', { method: 'POST', body: JSON.stringify({ demoId: 'dp1' }) });
ok('v2-dp1-oneclick-200', v2a.status === 200 && v2a.body?.data?.token, `hatRole=${v2a.body?.data?.user?.hatRole}`);
ok('v2-dp1-du-view', v2a.body?.data?.user?.hatRole === 'DU' && v2a.body?.data?.user?.containerId === 'c-dp1', `container=${v2a.body?.data?.user?.containerId}`);
const dpToken = v2a.body?.data?.token;
const v2me = await j('/api/auth/me', { headers: { Authorization: `Bearer ${dpToken}` } });
ok('v2-dp1-me-du', v2me.status === 200 && v2me.body?.data?.hatRole === 'DU');

const v2b = await j('/api/auth/oneclick', { method: 'POST', body: JSON.stringify({ demoId: 'acc-dp1' }) });
ok('v2-accdp1-alias-200', v2b.status === 200 && v2b.body?.data?.user?.hatId === 'u-dp1');

const v2c = await j('/api/auth/login', { method: 'POST', body: JSON.stringify({ account: 'acc-dp1', password: 'Test1234' }) });
ok('v2-accdp1-password-200', v2c.status === 200 && v2c.body?.data?.token, `hatRole=${v2c.body?.data?.user?.hatRole}`);
const v2d = await j('/api/auth/login', { method: 'POST', body: JSON.stringify({ account: 'acc-dp1', password: 'wrong' }) });
ok('v2-accdp1-wrongpass-401', v2d.status === 401);

// ---- V3: 回归抽样 3 账号（xhpz/xepz 既有链路）----
const samples = [['xiaolin', 'CU'], ['xu-huadong', 'XU'], ['du-hehe', 'DU']];
for (const [id, role] of samples) {
  const r = await j('/api/auth/oneclick', { method: 'POST', body: JSON.stringify({ demoId: id }) });
  ok(`v3-regress-${id}-${role}`, r.status === 200 && r.body?.data?.user?.hatRole === role, `hatRole=${r.body?.data?.user?.hatRole}`);
}

// ---- 红线: 全量 demo 账号 oneclick 全通 ----
const dl = await j('/api/auth/demos');
const demoList = dl.body?.data?.demos ?? dl.body?.data ?? [];
let pass = 0, total = 0;
for (const d of demoList) {
  const id = d?.id ?? d?.demoId; if (!id) continue;
  total += 1;
  const r = await j('/api/auth/oneclick', { method: 'POST', body: JSON.stringify({ demoId: id }) });
  if (r.status === 200 && r.body?.data?.token) pass += 1; else console.log(`  oneclick-fail ${id} -> ${r.status}`);
}
ok('redline-oneclick-all-pass', total > 0 && pass === total, `${pass}/${total}`);

console.log(`SUMMARY ${results.filter(r => r[1]).length}/${results.length} passed`);
process.exit(results.every(r => r[1]) ? 0 : 1);
