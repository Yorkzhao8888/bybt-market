/* XMK-MALL-RICH-01 集市内容扩容自检：
 * ① catalog ≥30 SKU 四品类 ② /mall 三件套（筛选/搜索/排序）+详情弹层 ③ 动线身份矩阵（匿名引导/CU 意向需求/XEPZ 供集 buyer/XHPZ 403/DU 403）
 * ④ /goods 同源只读+意向入口；截图 assets/mall01/
 * 前置：dev 5000 带 env（seed 重启已生效）
 */
import { chromium } from 'playwright-core';

const BASE = process.env.MALL01_BASE ?? 'http://localhost:5000';
const EXE = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
let pass = 0;
const fails = [];

function check(name, cond, detail = '') {
  if (cond) { pass += 1; console.log(`PASS ${name}`); }
  else { fails.push(`${name} ${detail}`); console.log(`FAIL ${name} ${detail}`); }
}

async function raw(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
}
const oneclick = async (id) => (await raw('POST', '/api/auth/oneclick', { body: { demoId: id } })).j?.data?.token ?? '';

async function waitText(page, text, timeout = 9000) {
  try { await page.waitForFunction((t) => document.body?.innerText.includes(t), text, { timeout }); return true; }
  catch { return false; }
}
const hasErrBar = (page) => page.evaluate(() => !!document.querySelector('[class*="fdf0f0"]'));

/** 会话注入：xm_token + entrance.activeRole（一角色一登入选帽态） */
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
const SHOT = 'assets/mall01';

/* ---- T1/T2 catalog API + 本地图片资产 ---- */
{
  const r = await raw('GET', '/api/mall/listings');
  const list = r.j?.data ?? [];
  check('T1a catalog >=30 SKU', r.status === 200 && list.length >= 30, `got ${list.length}`);
  const cats = ['food', 'grain', 'specialty', 'daily'];
  const dist = Object.fromEntries(cats.map((c) => [c, list.filter((l) => l.category === c).length]));
  check('T1b 四品类分布', cats.every((c) => dist[c] >= 1), JSON.stringify(dist));
  check('T1c 每件带 img 字段', list.every((l) => typeof l.img === 'string' && l.img.startsWith('/img/mall/')));
  check('T1d desc/stock 落库', list.every((l) => typeof l.desc === 'string' && l.desc.length > 0 && typeof l.stock === 'number'));
  let imgOk = 0;
  for (const i of [1, 9, 24, 32]) {
    const res = await fetch(`${BASE}/img/mall/sku-${i}.svg`);
    const ct = res.headers.get('content-type') ?? '';
    if (res.status === 200 && ct.includes('svg')) imgOk += 1;
  }
  check('T2 本地 SVG 资产可访问', imgOk === 4, `${imgOk}/4`);
}

/* ---- T3 /mall 匿名逛购三件套+详情 ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 2400 } });
  await page.goto(`${BASE}/mall`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.paper-card').length >= 30, null, { timeout: 20000 });
  let cards = await page.locator('.paper-card').count();
  check('T3a 匿名网格 >=30 卡', cards >= 30, `got ${cards}`);
  // 分类筛选
  await page.getByRole('button', { name: '食品生鲜', exact: true }).click();
  await page.waitForTimeout(400);
  const foodCards = await page.locator('.paper-card').count();
  check('T3b 品类筛选生效', foodCards > 0 && foodCards < 30, `food=${foodCards}`);
  await page.screenshot({ path: `${SHOT}/mall-filter.png`, fullPage: false });
  // 搜索
  await page.getByRole('button', { name: '全部品类', exact: true }).click();
  await page.getByLabel('搜索商品').fill('龙井');
  await page.waitForTimeout(400);
  const teaCards = await page.locator('.paper-card').count();
  check('T3c 关键词搜索（龙井→1）', teaCards === 1, `got ${teaCards}`);
  await page.getByLabel('搜索商品').fill('');
  // 排序
  await page.getByLabel('排序').selectOption('price_asc');
  await page.waitForTimeout(400);
  const prices = await page.locator('.paper-card .font-serif-display.text-2xl').allInnerTexts();
  const nums = prices.map((t) => parseFloat(t.replace(/[^\d.]/g, ''))).filter((n) => !Number.isNaN(n));
  check('T3d 价格升序', nums.length >= 2 && nums[0] <= nums[1], JSON.stringify(nums.slice(0, 3)));
  await page.getByLabel('排序').selectOption('');
  // 详情弹层
  await page.locator('.paper-card').first().click();
  const dlg = page.getByRole('dialog');
  const dOpen = await dlg.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  const dText = dOpen ? await dlg.innerText() : '';
  check('T3e 详情弹层四动线按钮', dOpen && ['立即购买', '发起采购意向', '提交需求单', '企业采购'].every((k) => dText.includes(k)) && dText.includes('库存'), dText.slice(0, 60));
  await page.screenshot({ path: `${SHOT}/mall-detail.png` });
  // 匿名动线：立即购买 → needLogin 弹层（不静默）
  await dlg.getByRole('button', { name: '立即购买' }).click();
  const guide = await waitText(page, '需要登入后再操作');
  check('T4a 匿名购买→登入引导', guide);
  await page.screenshot({ path: `${SHOT}/mall-guide.png` });
  await page.getByRole('button', { name: '先逛逛' }).click();
  // 匿名意向动线 → 同样引导
  await page.locator('.paper-card').first().click();
  await page.getByRole('dialog').getByRole('button', { name: '发起采购意向' }).click();
  check('T4b 匿名意向→登入引导', await waitText(page, '需要登入后再操作'));
  await page.locator('a:has-text("去登入端")').click().catch(() => {});
  await page.waitForURL((u) => u.pathname.startsWith('/entrance'), { timeout: 10000 });
  check('T4c 引导跳登入端', page.url().includes('/entrance'), page.url());
  await page.close();
}

/* ---- T5 xiaolin（XHPZ#CU）：意向/需求成功+企业采购 403 不静默 ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await newSession(page, await oneclick('xiaolin'), 'CU');
  await page.goto(`${BASE}/mall`, { waitUntil: 'domcontentloaded' });
  await page.locator('.paper-card').first().click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('button', { name: '发起采购意向' }).click();
  check('T5a CU 意向回执+跳客集', await waitText(page, '已提交采购意向') && await waitText(page, '查看客集工作台'));
  await page.screenshot({ path: `${SHOT}/mall-cu-intent.png` });
  await page.locator('.paper-card').first().click();
  await page.getByRole('dialog').getByRole('button', { name: '提交需求单' }).click();
  check('T5b CU 需求单回执', await waitText(page, '已提交需求单'));
  await page.locator('.paper-card').first().click();
  await page.getByRole('dialog').getByRole('button', { name: '企业采购' }).click();
  await page.waitForTimeout(900);
  const e403 = await hasErrBar(page);
  const noDone = !(await page.locator('text=供集采购单已发起').count());
  check('T5c XHPZ#CU 供集 403 红条（身份矩阵不变）', e403 && noDone);
  await page.screenshot({ path: `${SHOT}/mall-cu-xhpz-403.png` });
  await page.close();
}

/* ---- T6 cu-ep1（XEPZ#CU）：供集 buyer 动线成功 ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await newSession(page, await oneclick('cu-ep1'), 'CU');
  await page.goto(`${BASE}/mall`, { waitUntil: 'domcontentloaded' });
  await page.locator('.paper-card').first().click();
  await page.getByRole('dialog').getByRole('button', { name: '企业采购' }).click();
  const ok = await waitText(page, '供集采购单已发起');
  check('T6 XEPZ#CU 供集 buyer 成功', ok);
  await page.screenshot({ path: `${SHOT}/mall-xepz-supply.png` });
  await page.close();
}

/* ---- T7 dp1（XDPZ#DU）：客集写 403 不静默 ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await newSession(page, await oneclick('dp1'), 'DU');
  await page.goto(`${BASE}/mall`, { waitUntil: 'domcontentloaded' });
  await page.locator('.paper-card').first().click();
  await page.getByRole('dialog').getByRole('button', { name: '发起采购意向' }).click();
  await page.waitForTimeout(900);
  check('T7 DU 意向 403 红条不静默', await hasErrBar(page));
  await page.close();
}

/* ---- T8 /goods 同源只读 ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/goods`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const cards = await page.locator('.paper-card').count();
  check('T8a goods 同源 >=32 件', cards >= 32, `got ${cards}`);
  const buyBtns = await page.locator('text=立即购买').count();
  check('T8b goods 只读（无立即购买）', buyBtns === 0, `got ${buyBtns}`);
  const intentBtns = await page.locator('text=采购意向').count();
  check('T8c goods 意向入口存在', intentBtns > 0);
  // 匿名点意向 → 登入端引导（不静默）
  await page.locator('text=采购意向').first().click();
  await page.waitForTimeout(700);
  check('T8d goods 匿名意向→登入端', page.url().includes('/entrance'), page.url());
  await page.goto(`${BASE}/goods`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOT}/goods-readonly.png`, fullPage: true });
  await page.close();
}

await browser.close();
console.log(`\n[mall-check] ${pass} passed, ${fails.length} failed`);
if (fails.length) { console.log(fails.join('\n')); process.exit(1); }
