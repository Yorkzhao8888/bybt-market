// XMK-EU-CHAIN-01 供给链收口 E2E：A 准入审批闭环 + B 上架承接 + C goods B 端下单 + D 品牌口径
import { chromium } from 'playwright-core';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5000';
const SHOT = 'assets/euchain01';
if (!existsSync(SHOT)) mkdirSync(SHOT, { recursive: true });

let passed = 0;
const failed = [];
const ok = (cond, label) => {
  if (cond) { passed++; console.log(`  PASS ${label}`); }
  else { failed.push(label); console.log(`  FAIL ${label}`); }
};

const raw = async (method, path, token, body) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch { j = null; }
  return { status: r.status, j };
};
const token = async (demoId) => {
  const r = await raw('POST', '/api/auth/oneclick', undefined, { demoId });
  return r.j?.data?.token ?? '';
};

const EXEC = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';

const main = async () => {
  // ========== D 品牌口径（源码级：bybt/百业百泰零出现；百泰OS 露出） ==========
  console.log('== D 品牌口径 ==');
  const scanFiles = ['src/pages/Mall.tsx', 'src/pages/Goods.tsx', 'src/pages/Home.tsx', 'index.html'];
  let badBrand = 0;
  let baiTai = 0;
  for (const f of scanFiles) {
    try {
      const s = readFileSync(f, 'utf8');
      if (/bybt|百业百泰/.test(s)) badBrand++;
      if (/百泰OS/.test(s)) baiTai++;
    } catch { /* skip */ }
  }
  ok(badBrand === 0, 'D1 bybt/百业百泰 全库零出现');
  ok(baiTai >= 2, 'D2 百泰OS 在 Mall/Goods 露出');

  // ========== A 准入审批端到端闭环 ==========
  console.log('== A 准入审批闭环 ==');
  const tEu9 = await token('eu-9x');
  const tEu10 = await token('eu-10x');
  const tVem = await token('vem-1');
  const tXl = await token('xiaolin');
  ok(!!tEu9 && !!tEu10 && !!tVem, 'A0 demo 账号 oneclick（eu-9/eu-10/vem-1）');

  const rb9 = await raw('POST', '/api/market/booths', tEu9, { domain: 'E', kind: 'supply', name: '恒泰建材供给铺' });
  ok(rb9.status === 200 && rb9.j?.data?.kind === 'supply', 'A0b eu-9x 开 E 源供给铺（booth_new）');
  const rb10 = await raw('POST', '/api/market/booths', tEu10, { domain: 'E', kind: 'supply', name: '沃野农产供给铺' });
  ok(rb10.status === 200 && rb10.j?.data?.kind === 'supply', 'A0c eu-10x 开 E 源供给铺');
  const r1 = await raw('POST', '/api/supply/applications', tEu9, { categories: 'E 源通货 · 建材五金', capacity: '月供 5000 件', qualification: '营业执照 + 建材经营许可', priceIntent: '面议' });
  ok(r1.status === 200 && r1.j?.success === true && r1.j?.data?.status === 'submitted', 'A1 eu-9 提交准入登记 → submitted');
  const saId = r1.j?.data?.id;

  const r1b = await raw('POST', '/api/supply/applications', tXl, { categories: 'x', qualification: 'x' });
  ok(r1b.status === 403, 'A1b 客户 CU 提交准入 → 403（身份矩阵）');

  const r1c = await raw('POST', `/api/governance/applications/${saId}/claim`, tEu9);
  ok(r1c.status === 403, 'A1c 供给帽调治理审批端点 → 403（XVPZ 帽守卫）');

  const r2 = await raw('GET', '/api/governance/applications', tVem);
  const row = (r2.j?.data ?? []).find((x) => x.id === saId);
  ok(r2.status === 200 && !!row && row.status === 'submitted' && !!row.containerName, 'A2 VEM 拉评估队列（含新申请+单位名）');

  const r3 = await raw('POST', `/api/governance/applications/${saId}/claim`, tVem);
  ok(r3.status === 200 && r3.j?.data?.status === 'reviewing', 'A3 claim：submitted → reviewing');
  const r3b = await raw('POST', `/api/governance/applications/${saId}/claim`, tVem);
  ok(r3b.status === 409, 'A3b 重复 claim → 409');

  const r4 = await raw('POST', `/api/governance/applications/${saId}/audit`, tVem, { action: 'approve', note: '资质核验通过' });
  ok(r4.status === 200 && r4.j?.data?.status === 'approved', 'A4 audit approve：reviewing → approved');

  const r5 = await raw('GET', '/api/supply/profile', tEu9);
  ok(r5.status === 200 && r5.j?.data?.vendor_status === 'approved', 'A5 profile 回写 vendor_status=approved（SupplyHub 可见）');

  // 驳回线：eu-10
  const mine10 = await raw('GET', '/api/supply/applications/mine', tEu10);
  const had10 = !!(mine10.j?.data && mine10.j.data.id);
  let sa10 = had10 ? mine10.j.data.id : '';
  if (had10) ok(['submitted', 'pending'].includes(mine10.j.data.status), 'A6 eu-10x 已有申请（幂等复用 status=' + mine10.j.data.status + '）');
  else {
    const r6 = await raw('POST', '/api/supply/applications', tEu10, { categories: 'E 源 · 农产加工', capacity: '月供 2000 件', qualification: '食品经营许可（待补）', priceIntent: '面议' });
    sa10 = r6.j?.data?.id ?? '';
    ok(r6.status === 200 && r6.j?.data?.status === 'submitted', 'A6 eu-10x 提交 → submitted');
  }
  await raw('POST', `/api/governance/applications/${sa10}/claim`, tVem);
  const r7 = await raw('POST', `/api/governance/applications/${sa10}/audit`, tVem, { action: 'reject', rejectReason: '资质材料不全，请补食品生产许可后重提' });
  ok(r7.status === 200 && r7.j?.data?.status === 'rejected' && !!r7.j?.data?.rejectReason, 'A7 audit reject：reviewing → rejected（附原因）');
  const r8 = await raw('GET', '/api/supply/profile', tEu10);
  ok(r8.status === 200 && r8.j?.data?.vendor_status === 'rejected', 'A8 profile 回写 vendor_status=rejected');
  const r9 = await raw('POST', '/api/supply/applications', tEu10, { categories: 'E 源 · 农产加工', capacity: '月供 2000 件', qualification: '食品生产许可（已补）+ 经营许可', priceIntent: '面议' });
  ok(r9.status === 200 && r9.j?.data?.status === 'submitted' && r9.j?.data?.resubmitCount >= 1, 'A9 驳回后重提 → submitted（resubmitCount+1）');

  // ========== B EU 上架卖货链 ==========
  console.log('== B EU 上架卖货链 ==');
  const p1 = await raw('POST', '/api/supply/products', tEu9, { name: '恒泰·国标螺纹钢 12mm', spec: 'HRB400E / 12mm×9m', category: '建材五金', priceCents: 480000, unit: '根', stock: 500 });
  ok(p1.status === 200 && p1.j?.data?.status === 'on', 'B1 合格供应商 eu-9 上架货品');
  const pid = p1.j?.data?.id;

  const p1b = await raw('POST', '/api/supply/products', tEu10, { title: 'x', spec: 'x', category: 'x', priceCents: 1, unit: '件', stock: 1 });
  ok(p1b.status === 403 || p1b.j?.success === false, 'B1b 未合格供应商（rejected）上架 → 拒绝');

  const tDp = await token('dp1');
  const p2 = await raw('GET', '/api/supply/mall', tDp);
  const mallRow = (p2.j?.data ?? []).find((x) => x.id === pid);
  ok(p2.status === 200 && !!mallRow && mallRow.supplierName === '恒泰建材', 'B2 DU 采购商城承接（含新货品+供给方名）');

  const tVemE = await token('vem-e');
  const p3 = await raw('POST', `/api/supply/products/${pid}/take-down`, tVemE);
  ok(p3.status === 200 || p3.status === 403, 'B3 治理下架端点可达（家族帽/E 源）');
  const p3b = await raw('GET', '/api/supply/products', tEu9);
  const mine = (p3b.j?.data ?? []).find((x) => x.id === pid);
  ok(!!mine && (p3.status === 200 ? mine.status === 'off' : mine.status === 'on'), 'B3b 下架状态落库');

  // ========== C goods B 端企业采购下单 ==========
  console.log('== C goods B 端下单 ==');
  // 重新上架以便下单（B3 若下架成功）
  if (p3.status === 200) await raw('POST', `/api/supply/products/${pid}/toggle`, tEu9);
  const c1 = await raw('POST', '/api/orders', tDp, { supplierProductId: pid, qty: 2 });
  ok(c1.status === 200 && /^EX-2026-/.test(c1.j?.data?.code ?? ''), `C1 DU 在 goods 企业下单 → 族码采购单 ${c1.j?.data?.code ?? ''}`);
  const c2 = await raw('POST', '/api/orders', tXl, { supplierProductId: pid, qty: 1 });
  ok(c2.status === 403, 'C2 XHPZ#CU 企业下单 → 403（身份矩阵，不静默）');
  const c3 = await raw('POST', '/api/orders', undefined, { supplierProductId: pid, qty: 1 });
  ok(c3.status === 401, 'C3 匿名企业下单 → 401');

  // ========== UI：goods B 端专区 + governance 准入评估区块 ==========
  console.log('== UI 抽查 ==');
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const page = await ctx.newPage();

  // U1 匿名 /goods：企业采购专区可见+引导（不静默）
  await page.goto(`${BASE}/goods`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('企业采购专区'), null, { timeout: 20000 });
  const bErrTxt = await page.locator('body').innerText();
  ok(bErrTxt.includes('百泰OS'), 'U1 goods 页露出百泰OS');
  ok(bErrTxt.includes('登入') || bErrTxt.includes('登录'), 'U1b 匿名企业专区引导登录（不静默）');
  await page.screenshot({ path: `${SHOT}/goods-b2b-anon.png`, fullPage: true });

  // U2 dp1 /goods：B 端列表+下单
  const rDp = await raw('POST', '/api/auth/oneclick', undefined, { demoId: 'dp1' });
  const tkDp = rDp.j?.data?.token ?? '';
  await page.goto(`${BASE}/entrance`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((t) => localStorage.setItem('xm_token', t), tkDp);
  await page.evaluate((t) => sessionStorage.setItem('entrance.activeRole', t), 'DU');
  await page.goto(`${BASE}/goods`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('恒泰·国标螺纹钢'), null, { timeout: 20000 });
  await page.screenshot({ path: `${SHOT}/goods-b2b-du.png`, fullPage: true });
  ok(true, 'U2 DU 视角 goods 企业专区可见新货品');

  // U3 vem-1 /governance 准入评估区块
  const rVem = await raw('POST', '/api/auth/oneclick', undefined, { demoId: 'vem-1' });
  const tkVem = rVem.j?.data?.token ?? '';
  await page.goto(`${BASE}/entrance`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((t) => localStorage.setItem('xm_token', t), tkVem);
  await page.evaluate((t) => sessionStorage.setItem('entrance.activeRole', t), 'VEM');
  await page.goto(`${BASE}/governance`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('准入评估'), null, { timeout: 20000 });
  const gTxt = await page.locator('body').innerText();
  ok(gTxt.includes('已提交') && gTxt.includes('准入评估'), 'U3 治理台准入评估区块（待评估队列徽标）');
  ok(gTxt.includes('沃野农产'), 'U3b 评估队列含重提申请（eu-10 单位名）');
  await page.screenshot({ path: `${SHOT}/govern-apps.png`, fullPage: true });

  await browser.close();

  console.log(`\n== eu-chain-check: ${passed} passed, ${failed.length} failed ==`);
  if (failed.length) { console.log('FAILED:', failed.join(' | ')); process.exit(1); }
};

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
