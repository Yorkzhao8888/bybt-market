/* XMK-CRM-UI-01 客集 UI 自检：F1-F5 验收点 + 身份矩阵负向用例（UI 侧守卫，API 已保）
 * 断言：DOM 文本 + URL 跳转 + API 409 重复 confirm；截图 assets/crm01/
 * 前置：dev 服务 5000 带 env（ZIWAY_EMBED_BASE/VITE_ZIWAY_EMBED_ORIGIN）
 */
import { chromium } from 'playwright-core';

const BASE = process.env.CRM01_BASE ?? 'http://localhost:5000';
const EXE = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
let pass = 0;
const fails = [];

function check(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`PASS ${name}`);
  } else {
    fails.push(`${name} ${detail}`);
    console.log(`FAIL ${name} ${detail}`);
  }
}

async function raw(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
}

const oneclick = async (id) => {
  const r = await raw('POST', '/api/auth/oneclick', { body: { demoId: id } });
  return r.j?.data?.token ?? '';
};

/** 页面文本是否出现（含等待） */
async function waitText(page, text, timeout = 8000) {
  try {
    await page.waitForFunction((t) => document.body?.innerText.includes(t), text, { timeout });
    return true;
  } catch {
    return false;
  }
}

/** 会话注入：xm_token（登录态）+ entrance.activeRole（一角色一登入选帽态，sessionStorage） */
async function newSession(page, token, role) {
  await page.addInitScript(
    ({ t, r }) => {
      localStorage.setItem('xm_token', t);
      sessionStorage.setItem('entrance.activeRole', r);
    },
    { t: token, r: role },
  );
}

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

/* ---- N1 匿名 /customer → 跳登录 ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/customer`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  check('N1 匿名 /customer 跳登录', page.url().includes('/entrance'), `url=${page.url()}`);
  await page.close();
}

/* ---- U1/F2/F3 xiaolin（XHPZ#CU）全区块 + 需求单/意向动线 ---- */
const xl = await oneclick('xiaolin');
check('A0 xiaolin oneclick', Boolean(xl));
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  await newSession(page, xl, 'CU');
  await page.goto(`${BASE}/customer`, { waitUntil: 'networkidle' });
  check('F1 三区块标题', (await waitText(page, '客集工作台')) && (await waitText(page, '需求单')) && (await waitText(page, '采购意向')) && (await waitText(page, '客户档案')));
  check('F1 工作台副标三层定位', await waitText(page, '谁在买'));
  check('F4 档案 OAS 派生只读声明', await waitText(page, '档案由 OAS 派生，不可编辑'));
  check('F4 档案 identity_id=u-cu1', await waitText(page, 'u-cu1'));
  /* F2 空标题 → 红条 */
  await page.fill('input[placeholder*="标题"]', '');
  const publishBtns = page.locator('button:has-text("发布")');
  await publishBtns.first().click();
  check('F2 空 title 拒绝红条', await waitText(page, '标题必填'));
  /* F2 有效发布 → XCD 即时可见 */
  await page.fill('input[placeholder*="标题"]', 'crm-ui 验收测试需求');
  await publishBtns.first().click();
  check('F2 发布后 XCD 即时可见', await waitText(page, 'XCD-'));
  check('F2 发布成功提示', await waitText(page, '已发布，列表已即时更新'));
  /* F3 意向发布 + 关联需求单 */
  const intentInput = page.locator('input[placeholder*="标题"]').nth(1);
  await intentInput.fill('crm-ui 验收测试意向');
  await publishBtns.nth(1).click();
  check('F3 发布后 XCI 即时可见', await waitText(page, 'XCI-'));
  const sel = page.locator('select').first();
  const selCount = await sel.count();
  if (selCount > 0) {
    await sel.selectOption({ index: 1 });
    check('F3 关联需求单已关联展示', await waitText(page, '已关联'));
  } else {
    check('F3 关联需求单已关联展示', false, 'select 未找到');
  }
  await page.screenshot({ path: 'assets/crm01/xiaolin-workbench.png', fullPage: true });
  await page.close();
}

/* ---- G1 dp1（XDPZ#DU）→ 拒绝页 ---- */
{
  const dp = await oneclick('dp1');
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await newSession(page, dp, 'DU');
  await page.goto(`${BASE}/customer`, { waitUntil: 'networkidle' });
  check('G1 DU 403 守卫页', (await waitText(page, '准入不通过')));
  check('G1 拒绝页返回工作台', await waitText(page, '返回我的工作台'));
  await page.screenshot({ path: 'assets/crm01/guard-du.png', fullPage: true });
  await page.close();
}

/* ---- G2 vem-1（XVPZ#VEM）→ 引导治理台 ---- */
{
  const vem = await oneclick('vem-1');
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await newSession(page, vem, 'VEM');
  await page.goto(`${BASE}/customer`, { waitUntil: 'networkidle' });
  check('G2 XVPZ 引导页', (await waitText(page, '平台方治理身份')));
  const gov = page.locator('a[href="/governance"]');
  check('G2 前往治理台链接', (await gov.count()) > 0);
  await page.screenshot({ path: 'assets/crm01/guard-xvpz.png', fullPage: true });
  await page.close();
}

/* ---- F5 cu-ep1（XEPZ#CU）供给单时间线 + confirm 动线 + 409 ---- */
{
  const ep = await oneclick('cu-ep1');
  const eu = await oneclick('eu-qiuchen');
  /* API 构单到 quoted */
  let r = await raw('POST', '/api/supply/orders', { token: ep, body: { boothId: 'b-e1', title: 'crm-ui F5 确认动线验收单', qty: 1, unit: '件' } });
  const oid = r.j?.data?.id ?? '';
  check('F5 构单 initiated', Boolean(oid));
  r = await raw('POST', `/api/supply/orders/${oid}/accept`, { token: eu });
  check('F5 EU accept', r.status === 200);
  r = await raw('POST', `/api/supply/orders/${oid}/quote`, { token: eu, body: { quotedCents: 9900, note: '验收单报价' } });
  check('F5 EU quote', r.status === 200);

  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  await newSession(page, ep, 'CU');
  await page.goto(`${BASE}/customer`, { waitUntil: 'networkidle' });
  check('F5 时间线区块', (await waitText(page, '供给单时间线')));
  check('F5 buyer 单可见', await waitText(page, 'crm-ui F5 确认动线验收单'));
  check('F5 已报价徽标', await waitText(page, '已报价'));
  check('F5 知情提示责任转移', await waitText(page, '责任转移'));
  check('F5 知情提示结算', await waitText(page, '触发结算'));
  const btn = page.locator('button:has-text("确认报价成单")').first();
  check('F5 confirm 按钮在 quoted 态', (await btn.count()) > 0);
  await btn.click();
  await page.waitForTimeout(1500);
  check('F5 confirm 后状态已确认', await waitText(page, '已确认'));
  check('F5 confirm 后按钮消失', (await page.locator('button:has-text("确认报价成单")').count()) === 0);
  /* API 层重复 confirm → 409 正确呈现（UI 红条已由状态徽标变化覆盖） */
  r = await raw('POST', `/api/supply/orders/${oid}/confirm`, { token: ep });
  check('F5 重复 confirm 409', r.status === 409 && r.j?.success === false, `got ${r.status}`);
  await page.screenshot({ path: 'assets/crm01/cuep1-timeline.png', fullPage: true });
  await page.close();
}

await browser.close();
console.log(`\ncrm-ui-check: ${pass} pass, ${fails.length} fail`);
if (fails.length) {
  console.log('FAILED:\n' + fails.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
