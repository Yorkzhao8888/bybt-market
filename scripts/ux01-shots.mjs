/**
 * X-MARKET-UX-01 UI 级验证 + 截图（assets/ux01/）
 * 场景：
 *  A 游客 /mall 点「立即购买」→ 弹「去登入端」引导框（FIX1）
 *  B 登录小林 → /mall 下单成功 → 成功横条「查看交易单 →」→ 点击跳 /orders（FIX4/FIX2）
 *  C /orders 新文案：买家/采购方视角 + 演示环境支付说明 + 订单六族折叠（FIX2/FIX6）
 *  D /entrance 企业容器描述用户语言（FIX6）
 *  E 主界面工程代号清扫：Mall/Orders/entrance 页面文本无 *DU / V*M / 订单六族： / 客户视角（XU/CU）（FIX6）
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5000';
const EXE = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const OUT = '/workspace/projects/assets/ux01';
mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (name, cond, extra = '') => {
  results.push(!!cond);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

try {
  // ---------- A 游客购买弹窗 ----------
  const ctxG = await browser.newContext({ viewport: { width: 420, height: 860 } });
  const pg = await ctxG.newPage();
  await pg.goto(`${BASE}/mall`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(600);
  const buyBtn = pg.locator('button', { hasText: '立即购买' }).first();
  ok('A1 guest-buy-btn-visible', await buyBtn.count() > 0);
  await buyBtn.click();
  await pg.waitForTimeout(400);
  ok('A2 guest-login-prompt-shown', await pg.getByText('需要登入').count() > 0, '弹窗标题');
  ok('A3 prompt-link-to-entrance', await pg.locator('a[href="/entrance"]').count() > 0, '去登入端链接');
  await pg.screenshot({ path: `${OUT}/guest-buy-login-prompt.png`, fullPage: false });
  await ctxG.close();

  // ---------- B 登录下单成功条 + 一键交易单 ----------
  const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
  const r1 = await ctx.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId: 'xiaolin' } });
  const j1 = await r1.json();
  const token = j1?.data?.token;
  ok('B0 login-token', !!token);
  if (token) {
    await ctx.addInitScript((t) => localStorage.setItem('xm_token', t), token);
    const p2 = await ctx.newPage();
    await p2.goto(`${BASE}/mall`, { waitUntil: 'networkidle' });
    await p2.waitForTimeout(1600);
    const buy = p2.locator('button', { hasText: '立即购买' }).first();
    await buy.click();
    await p2.waitForTimeout(300);
    const confirmBtn = p2.locator('button', { hasText: '确认下单' }).first();
    ok('B1 confirm-modal', await confirmBtn.count() > 0);
    await confirmBtn.click();
    await p2.waitForTimeout(1200);
    ok('B2 done-bar-shown', await p2.getByText('下单成功').count() > 0);
    ok('B3 done-bar-view-orders', await p2.locator('a[href="/orders"]', { hasText: '查看交易单' }).count() > 0);
    await p2.screenshot({ path: `${OUT}/order-done-bar.png`, fullPage: false });
    await p2.locator('a[href="/orders"]', { hasText: '查看交易单' }).first().click();
    await p2.waitForURL('**/orders', { timeout: 5000 });
    ok('B4 navigate-to-orders', p2.url().includes('/orders'));
  }
  await ctx.close();

  // ---------- C /orders 文案 ----------
  const ctx2 = await browser.newContext({ viewport: { width: 1100, height: 860 } });
  const r2 = await ctx2.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId: 'xiaolin' } });
  const j2 = await r2.json();
  const t2 = j2?.data?.token;
  if (t2) {
    await ctx2.addInitScript((t) => localStorage.setItem('xm_token', t), t2);
    const p3 = await ctx2.newPage();
    await p3.goto(`${BASE}/orders`, { waitUntil: 'networkidle' });
    await p3.waitForTimeout(900);
    ok('C1 buyer-scope-copy', await p3.getByText('买家 / 采购方视角').count() > 0);
    ok('C2 demo-pay-note', await p3.getByText('演示环境暂不支持在线支付').count() > 0);
    ok('C3 families-folded', await p3.locator('details summary', { hasText: '订单编号规则说明' }).count() > 0);
    const famVisible = await p3.getByText('订单六族').count();
    ok('C4 families-not-exposed', famVisible === 0, `主界面出现次数=${famVisible}`);
    await p3.screenshot({ path: `${OUT}/orders-copy.png`, fullPage: false });
  }
  await ctx2.close();

  // ---------- D /entrance 文案 ----------
  const ctx3 = await browser.newContext({ viewport: { width: 1100, height: 860 } });
  const p4 = await ctx3.newPage();
  await p4.goto(`${BASE}/entrance`, { waitUntil: 'networkidle' });
  await p4.waitForTimeout(600);
  ok('D1 enterprise-desc-userlang', await p4.getByText('单位视角：开店经营 / 供货入驻 / 平台管理').count() > 0);
  const codeCnt = await p4.getByText(/经营 DU|供给 \*U|治理 V\*M/).count();
  ok('D2 no-engineering-codes', codeCnt === 0, `命中=${codeCnt}`);
  await p4.screenshot({ path: `${OUT}/entrance-copy.png`, fullPage: false });
  await ctx3.close();

  // ---------- E 工程代号清扫（Mall 主界面） ----------
  const ctx4 = await browser.newContext({ viewport: { width: 420, height: 860 } });
  const p5 = await ctx4.newPage();
  await p5.goto(`${BASE}/mall`, { waitUntil: 'networkidle' });
  await p5.waitForTimeout(600);
  const mallCodes = await p5.getByText(/\*DU|V\*M|订单六族|客户视角（XU\/CU）/).count();
  ok('E1 mall-no-codes', mallCodes === 0, `命中=${mallCodes}`);
  await ctx4.close();
} finally {
  await browser.close();
}

const passed = results.filter(Boolean).length;
console.log(`SUMMARY ${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
