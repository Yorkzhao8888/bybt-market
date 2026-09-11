#!/usr/bin/env node
// XMK-GOV-01 验收：准入矩阵逐格实测 + 审核闭环 + content-type/JSON 结构断言
// 前置：dev(5000) 运行中。用法：node scripts/gov01-check.mjs
const B = 'http://localhost:5000';
let pass = 0, fail = 0; const fails = [];

const raw = async (m, p, tok, body) => {
  const r = await fetch(B + p, {
    method: m,
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = r.headers.get('content-type') ?? '';
  const j = await r.json().catch(() => null);
  return { s: r.status, ct, j };
};
// JSON 结构 + content-type 强断言（200 不算通过，必须外壳合法）
const okShape = (r, label) => {
  const good = r.ct.startsWith('application/json') && r.j && typeof r.j === 'object' && 'success' in r.j;
  mark(good, label + ' [content-type+外壳]', `http=${r.s} ct=${r.ct}`);
};
const one = async (id) => (await raw('POST', '/api/auth/oneclick', null, { demoId: id })).j?.data;
function mark(good, label, detail) {
  if (good) { pass++; console.log('PASS', label, detail ?? ''); }
  else { fail++; fails.push(label + ' ' + (detail ?? '')); console.log('FAIL', label, detail ?? ''); }
}

(async () => {
  console.log('== 1. 匿名矩阵（401 + 结构） ==');
  for (const p of ['/api/governance/overview', '/api/governance/supply/vendors', '/api/governance/supply/orders']) {
    const r = await raw('GET', p, null);
    okShape(r, '匿名 GET ' + p);
    mark(r.s === 401, '匿名 GET ' + p + ' -> 401', 'got ' + r.s);
  }
  const rA = await raw('POST', '/api/governance/supply/vendors/c-eu01/audit', null, { action: 'approve', note: '' });
  okShape(rA, '匿名 POST audit');
  mark(rA.s === 401, '匿名 POST audit -> 401', 'got ' + rA.s);

  console.log('== 2. XVPZ#VEM（vem-1）全端点 200 + 结构 ==');
  const vem = await one('vem-1');
  mark(!!vem?.token && vem?.user?.hatRole === 'VEM' && vem?.user?.containerType === 'XVPZ', 'oneclick vem-1 -> VEM@XVPZ', JSON.stringify({ hatId: vem?.user?.hatId }));
  const t = vem?.token;
  const ov = await raw('GET', '/api/governance/overview', t);
  okShape(ov, 'VEM GET overview');
  mark(ov.s === 200 && ov.j?.data?.market === 'E-Market', 'VEM overview 200+market 标识', JSON.stringify(ov.j?.data?.market));
  const vd = await raw('GET', '/api/governance/supply/vendors', t);
  okShape(vd, 'VEM GET vendors');
  const vRows = vd.j?.data ?? [];
  const vRow = (id) => vRows.find((x) => x.container_id === id);
  mark(vd.s === 200 && Array.isArray(vRows) && vRows.length > 0, 'VEM vendors 200+名录非空', 'n=' + vRows.length);
  const wo = await raw('GET', '/api/governance/supply/orders', t);
  okShape(wo, 'VEM GET orders');
  mark(wo.s === 200 && wo.j?.data?.stats && typeof wo.j?.data?.stats === 'object' && Array.isArray(wo.j?.data?.orders), 'VEM orders 200+stats 聚合', JSON.stringify(wo.j?.data?.stats));

  console.log('== 3. 非市管方矩阵（403） ==');
  for (const who of ['vdm', 'vem-e', 'xiaolin', 'eu-hengsheng', 'dp1']) {
    const u = await one(who);
    const r = await raw('GET', '/api/governance/overview', u?.token);
    okShape(r, who + ' GET overview');
    mark(r.s === 403, who + ' -> 403', 'got ' + r.s + ' ' + (u?.user?.hatRole ?? '?'));
  }

  console.log('== 4. 审核闭环（冻结联动 /api/supply/*） ==');
  const cu = await one('cu-ep1');
  const ctok = cu?.token;
  // 4a 冻结 c-eu01 -> 供给单创建被拦
  const fz = await raw('POST', '/api/governance/supply/vendors/c-eu01/audit', t, { action: 'freeze', note: 'GOV-01 闭环冻结' });
  mark(fz.s === 200 && fz.j?.data?.vendor_status === 'frozen', 'audit freeze c-eu01 -> frozen', 'got ' + fz.s + ' ' + fz.j?.data?.vendor_status);
  const blk = await raw('POST', '/api/supply/orders', ctok, { boothId: 'b-e1', title: 'E-STD-01 标准件采购', qty: 1 });
  okShape(blk, '冻结后 cu-ep1 POST /api/supply/orders');
  mark(blk.s === 403, '冻结主体供给单创建被拦 403', 'got ' + blk.s + ' ' + (blk.j?.error ?? ''));
  // 4b 解冻 -> 恢复可创建
  const unf = await raw('POST', '/api/governance/supply/vendors/c-eu01/audit', t, { action: 'approve', note: 'GOV-01 闭环解冻' });
  mark(unf.s === 200 && unf.j?.data?.vendor_status === 'approved', 'audit approve c-eu01 -> approved', 'got ' + unf.s);
  const ok1 = await raw('POST', '/api/supply/orders', ctok, { boothId: 'b-e1', title: 'E-STD-01 标准件采购', qty: 1 });
  mark(ok1.s === 200 && ok1.j?.data?.id, '解冻后供给单可正常创建 200', 'got ' + ok1.s + ' ' + (ok1.j?.data?.id ?? ''));
  // 4c 状态机：c-ep2 pending -> approve -> 409 重复 -> freeze -> 409 -> 未知动作 400
  const a1 = await raw('POST', '/api/governance/supply/vendors/c-ep2/audit', t, { action: 'approve', note: '打样批准' });
  mark(a1.s === 200 && a1.j?.data?.vendor_status === 'approved', 'c-ep2 pending -> approve -> approved', 'got ' + a1.s);
  const a2 = await raw('POST', '/api/governance/supply/vendors/c-ep2/audit', t, { action: 'approve', note: '重复批准' });
  mark(a2.s === 409, 'approved 再 approve -> 409 非法迁移', 'got ' + a2.s);
  const a3 = await raw('POST', '/api/governance/supply/vendors/c-ep2/audit', t, { action: 'freeze', note: '打样冻结' });
  mark(a3.s === 200 && a3.j?.data?.vendor_status === 'frozen', 'approved -> freeze -> frozen', 'got ' + a3.s);
  const a4 = await raw('POST', '/api/governance/supply/vendors/c-ep2/audit', t, { action: 'freeze', note: '重复冻结' });
  mark(a4.s === 409, 'frozen 再 freeze -> 409', 'got ' + a4.s);
  const a5 = await raw('POST', '/api/governance/supply/vendors/c-ep2/audit', t, { action: 'reject', note: '未知动作' });
  mark(a5.s === 400, '未知审核动作 -> 400', 'got ' + a5.s);
  // 4d 事件流 snake_case 断言
  const vd2 = await raw('GET', '/api/governance/supply/vendors', t);
  const ev = (vd2.j?.data?.find((v) => v.container_id === 'c-ep2')?.governance_events ?? [])[0] ?? {};
  mark(!!ev.ts && ev.actor_hat === 'VEM' && ev.target === 'c-ep2' && typeof ev.action === 'string' && typeof ev.actor_user === 'string'
    && !Object.keys(ev).some((k) => /[A-Z]/.test(k)), '治理事件流 snake_case 七要素', JSON.stringify({ action: ev.action, actor_hat: ev.actor_hat, target: ev.target }));

  console.log('== 5. 三端零回归抽查 ==');
  const xl = await one('xiaolin');
  const d1 = await raw('POST', '/api/customer/demands', xl?.token, { title: 'GOV-01 回归', desc: '客集写不受治理面影响' });
  mark(d1.s === 200 && d1.j?.data?.identity_id === 'u-cu1', '客集写零回归（XHPZ#CU）', 'got ' + d1.s);
  const sm = await raw('GET', '/api/overview', null);
  mark(sm.s === 200, 'market overview 零回归', 'got ' + sm.s);

  console.log('== SUMMARY ==');
  console.log('pass=' + pass + ' fail=' + fail);
  if (fail) { console.log('失败项：\n' + fails.join('\n')); process.exit(1); }
})();
