/* XMK-API-01 自检：客集+供集 API v1
 * 断言口径：content-type 必须 application/json + 统一外壳（{success:true,data} / {success:false,error}）——HTTP 200 不算通过
 * 覆盖：准入矩阵逐格（401/403 正反例）+ 状态机全链路（initiated→confirmed）+ 非法迁移 409 + 事件流 snake_case + profile identity_id 复用
 */
const BASE = process.env.API01_BASE ?? 'http://localhost:5000';
let pass = 0;
const fails = [];

async function raw(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') ?? '';
  const j = await r.json().catch(() => null);
  return { status: r.status, ct, j };
}

function check(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`PASS ${name}`);
  } else {
    fails.push(`${name} ${detail}`);
    console.log(`FAIL ${name} ${detail}`);
  }
}

const okShell = (r) => r.ct.includes('application/json') && r.j && r.j.success === true && 'data' in r.j;
const errShell = (r) => r.ct.includes('application/json') && r.j && r.j.success === false && typeof r.j.error === 'string';

async function oneclick(id) {
  const r = await raw('POST', '/api/auth/oneclick', { body: { demoId: id } });
  return r.j?.data?.token ?? '';
}

(async () => {
  const xl = await oneclick('xiaolin'); // XHPZ#CU 消费侧
  const ep = await oneclick('cu-ep1'); // XEPZ#CU 企业入驻主体
  const dp = await oneclick('dp1'); // XDPZ#DU
  const eu = await oneclick('eu-qiuchen'); // EU 启辰（Booth-E-01）
  check('oneclick 四账号', Boolean(xl && ep && dp && eu));

  /* ---- 匿名 401 ---- */
  let r = await raw('POST', '/api/customer/demands', { body: { title: '匿名' } });
  check('匿名 POST demands 401', r.status === 401 && errShell(r), `got ${r.status}`);
  r = await raw('GET', '/api/customer/profile');
  check('匿名 GET customer/profile 401', r.status === 401 && errShell(r), `got ${r.status}`);
  r = await raw('POST', '/api/supply/orders', { body: { boothId: 'b-e1', title: '匿名' } });
  check('匿名 POST supply/orders 401', r.status === 401 && errShell(r), `got ${r.status}`);
  r = await raw('GET', '/api/supply/profile');
  check('匿名 GET supply/profile 401', r.status === 401 && errShell(r), `got ${r.status}`);

  /* ---- 客集写矩阵 ---- */
  r = await raw('POST', '/api/customer/demands', { token: xl, body: { title: '小林需要一台咖啡机', desc: 'XHPZ#CU 消费侧需求' } });
  check('XHPZ#CU 客集写 demands 200+外壳', r.status === 200 && okShell(r) && r.j.data.code?.startsWith('XCD-') && r.j.data.identity_id === 'u-cu1', JSON.stringify(r.j).slice(0, 90));
  const xlDemandId = r.j?.data?.id;
  r = await raw('GET', '/api/customer/demands', { token: xl });
  check('XHPZ#CU GET demands 200 含本人单', r.status === 200 && okShell(r) && Array.isArray(r.j.data) && r.j.data.some((d) => d.id === xlDemandId));
  r = await raw('POST', '/api/customer/intents', { token: xl, body: { title: '小林意向采购办公椅' } });
  check('XHPZ#CU intents 200', r.status === 200 && okShell(r) && r.j.data.code?.startsWith('XCI-'));
  r = await raw('POST', '/api/customer/demands', { token: ep, body: { title: '恒晟需补充包装耗材', desc: 'XEPZ#CU 企业客集写' } });
  check('XEPZ#CU 客集写 demands 200', r.status === 200 && okShell(r), `got ${r.status}`);
  r = await raw('POST', '/api/customer/demands', { token: dp, body: { title: 'DU 不可写客集' } });
  check('XDPZ#DU 客集写 403', r.status === 403 && errShell(r), `got ${r.status}`);
  r = await raw('POST', '/api/customer/demands', { token: eu, body: { title: 'EU 不可写客集' } });
  check('EU 客集写 403', r.status === 403 && errShell(r), `got ${r.status}`);
  // 入参校验：缺 title 400
  r = await raw('POST', '/api/customer/demands', { token: xl, body: {} });
  check('demands 缺 title 400', r.status === 400 && errShell(r), `got ${r.status}`);

  /* ---- 供集写矩阵 ---- */
  r = await raw('POST', '/api/supply/orders', { token: xl, body: { boothId: 'b-e1', title: '消费侧越权采购' } });
  check('XHPZ#CU 供集写 403', r.status === 403 && errShell(r), `got ${r.status}`);
  r = await raw('PUT', '/api/supply/profile', { token: xl, body: { contact_name: '不应成功', contact_phone: '13800000000' } });
  check('XHPZ#CU PUT supply/profile 403', r.status === 403 && errShell(r), `got ${r.status}`);
  r = await raw('POST', '/api/supply/orders', { token: dp, body: { boothId: 'b-e1', title: 'XDPZ#DU 经营铺供给采购', qty: 2, unit: '箱' } });
  check('XDPZ#DU 供集写 200', r.status === 200 && okShell(r) && r.j.data.status === 'initiated', `got ${r.status} ${JSON.stringify(r.j).slice(0, 80)}`);
  r = await raw('POST', '/api/supply/orders', { token: ep, body: { boothId: 'b-e1', title: '恒晟企业主体采购', qty: 3, unit: '件' } });
  check('XEPZ#CU 供集写 200', r.status === 200 && okShell(r) && r.j.data.status === 'initiated' && r.j.data.buyerContainerId === 'c-eu01', `got ${r.status} ${JSON.stringify(r.j).slice(0, 80)}`);
  const chainOrderId = r.j?.data?.id;
  check('供给单号 XS 前缀', typeof chainOrderId === 'string' && r.j.data.code?.startsWith('XS-'));

  /* ---- 跨容器越权 403 ---- */
  r = await raw('POST', `/api/supply/orders/${chainOrderId}/confirm`, { token: xl });
  check('跨容器越权 confirm 403', r.status === 403 && errShell(r), `got ${r.status}`);
  r = await raw('POST', `/api/supply/orders/${chainOrderId}/accept`, { token: dp });
  check('跨容器越权 accept（DU 非供给方容器）403', r.status === 403 && errShell(r), `got ${r.status}`);

  /* ---- 状态机全链路 initiated→accepted→quoted→confirmed ---- */
  r = await raw('POST', `/api/supply/orders/${chainOrderId}/accept`, { token: eu });
  check('EU accept 200→accepted', r.status === 200 && okShell(r) && r.j.data.status === 'accepted', `got ${r.status}`);
  r = await raw('POST', `/api/supply/orders/${chainOrderId}/quote`, { token: eu, body: { quotedCents: 12800, note: '含运费' } });
  check('EU quote 200→quoted', r.status === 200 && okShell(r) && r.j.data.status === 'quoted' && r.j.data.quotedCents === 12800, `got ${r.status}`);
  r = await raw('POST', `/api/supply/orders/${chainOrderId}/confirm`, { token: ep });
  check('采购主体 confirm 200→confirmed', r.status === 200 && okShell(r) && r.j.data.status === 'confirmed', `got ${r.status}`);

  /* ---- GET orders 含时间线 + 事件流 snake_case ---- */
  r = await raw('GET', '/api/supply/orders', { token: ep });
  const chain = (r.j?.data ?? []).find((o) => o.id === chainOrderId);
  const ev = chain?.events ?? [];
  const evOk = ev.length >= 4 && ev.every((e) => ['order_id', 'action', 'actor_user', 'actor_hat', 'booth_code', 'note', 'ts'].every((k) => k in e) && !('orderId' in e) && !('actorUser' in e));
  check('GET supply/orders 时间线 snake_case', r.status === 200 && okShell(r) && evOk, `events=${ev.length}`);
  check('事件 actor_hat 系统标识', ev.some((e) => e.action === 'accept' && e.actor_hat === 'EU') && ev.some((e) => e.action === 'confirm' && e.actor_hat === 'CU'));
  // 跨容器可见性：xiaolin 不见该单
  r = await raw('GET', '/api/supply/orders', { token: xl });
  check('XHPZ#CU GET supply/orders 403（隔离）', r.status === 403 && errShell(r), `got ${r.status}`);

  /* ---- 非法迁移 409 ---- */
  r = await raw('POST', `/api/supply/orders/${chainOrderId}/accept`, { token: eu });
  check('confirmed 再 accept 409', r.status === 409 && errShell(r), `got ${r.status}`);
  r = await raw('POST', `/api/supply/orders/${chainOrderId}/confirm`, { token: ep });
  check('confirmed 再 confirm 409', r.status === 409 && errShell(r), `got ${r.status}`);
  // 找 dp1 的 initiated 单做 initiated→quote 409
  r = await raw('GET', '/api/supply/orders', { token: dp });
  const dpInit = (r.j?.data ?? []).find((o) => o.status === 'initiated');
  r = dpInit ? await raw('POST', `/api/supply/orders/${dpInit.id}/quote`, { token: eu, body: { quotedCents: 100 } }) : { status: 0, ct: '', j: null };
  check('initiated 直接 quote 409', r.status === 409 && errShell(r), `got ${r.status}`);

  /* ---- profile（复用 OAS identity_id） ---- */
  r = await raw('GET', '/api/supply/profile', { token: ep });
  check('XEPZ#CU GET supply/profile 200+identity_id', r.status === 200 && okShell(r) && r.j.data.identity_id === 'u-cu-ep1' && r.j.data.container_id === 'c-eu01', JSON.stringify(r.j).slice(0, 90));
  r = await raw('PUT', '/api/supply/profile', { token: ep, body: { contact_name: '恒晟入驻办', contact_phone: '13800000002', intro: '矩阵 v3 企业入驻主体' } });
  check('XEPZ#CU PUT supply/profile 200 回读', r.status === 200 && okShell(r) && r.j.data.intro === '矩阵 v3 企业入驻主体', `got ${r.status}`);
  r = await raw('PUT', '/api/supply/profile', { token: dp, body: { contact_name: 'DP 经营户', contact_phone: '13900000001' } });
  check('XDPZ#DU PUT supply/profile 200', r.status === 200 && okShell(r), `got ${r.status}`);
  r = await raw('PUT', '/api/supply/profile', { token: ep, body: { contact_name: '', contact_phone: 'x' } });
  check('profile 缺 contact_name 400', r.status === 400 && errShell(r), `got ${r.status}`);
  r = await raw('GET', '/api/customer/profile', { token: xl });
  check('GET customer/profile 派生 identity_id', r.status === 200 && okShell(r) && r.j.data.identity_id === 'u-cu1' && r.j.data.container_type === 'XHPZ', JSON.stringify(r.j).slice(0, 90));

  console.log(`\n=== api01-check: ${pass} passed, ${fails.length} failed ===`);
  fails.forEach((f) => console.log(`  FAILED: ${f}`));
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error('SCRIPT ERROR', e);
  process.exit(1);
});
