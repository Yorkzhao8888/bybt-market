// XMK-STRUCT-01 自检截图：三层导航区（Mall/Market）+ X-Goods 占位页
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5000';
const OUT = '/workspace/projects/assets/struct01';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ' | ' + detail : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 一键登录小林（CU 客户）注入 token
  const login = await page.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId: 'xiaolin' } });
  const lj = await login.json();
  const token = lj?.data?.token ?? lj?.token;
  await page.addInitScript((t) => localStorage.setItem('xm_token', t), token);

  // 1. Mall 三层导航区（active=客集，用 pos 唯一文本定位）
  await page.goto(`${BASE}/mall`, { waitUntil: 'networkidle' });
  const custCard = page.locator('a', { hasText: '谁在买' }).first();
  await custCard.waitFor({ timeout: 8000 });
  const mallActive = await custCard.evaluate((el) => el.className.includes('border-[#17181d]'));
  ok('mall-layernav-active-customer', mallActive);
  const mallScm = await page.locator('a', { hasText: 'SCM' }).count();
  ok('mall-layernav-scm-badge', mallScm >= 1, `supply-card with SCM count=${mallScm}`);
  await page.screenshot({ path: `${OUT}/mall-layernav.png`, fullPage: false });

  // 2. Market 三层导航区（active=集市）
  await page.goto(`${BASE}/market`, { waitUntil: 'networkidle' });
  const mktCard = page.locator('a', { hasText: '在哪成交' }).first();
  await mktCard.waitFor({ timeout: 8000 });
  const mktActive = await mktCard.evaluate((el) => el.className.includes('border-[#17181d]'));
  ok('market-layernav-active-market', mktActive);
  await page.screenshot({ path: `${OUT}/market-layernav.png`, fullPage: false });

  // 3. X-Goods 占位页
  await page.goto(`${BASE}/goods`, { waitUntil: 'networkidle' });
  const body = await page.textContent('body');
  ok('goods-page-plat', body.includes('X-Goods') && body.includes('E-Market') && body.includes('通货集市'));
  ok('goods-page-scm', body.includes('SCM') && body.includes('供应链'));
  ok('goods-page-placeholder', body.includes('占位页') && body.includes('后续工单'));
  await page.screenshot({ path: `${OUT}/goods-placeholder.png`, fullPage: false });

  // 4. entrance 六容器卡零改动抽查（匿名 context：已登录会被重定向）——六卡仍渲染，无三层内容混入
  const anon = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const apage = await anon.newPage();
  await apage.goto(`${BASE}/entrance`, { waitUntil: 'networkidle' });
  const ent = await apage.textContent('body');
  const six = ['#xhpz', '#xepz', '#xdpz', '#xvpz', '#xopz', '#xgpz'].every((c) => ent.includes(c));
  ok('entrance-six-cards-untouched', six && !ent.includes('谁在买'));
  await apage.screenshot({ path: `${OUT}/entrance-unchanged.png`, fullPage: false });
  await anon.close();
} finally {
  await browser.close();
}
const p = results.filter((r) => r.pass).length;
console.log(`SUMMARY ${p}/${results.length} passed`);
process.exit(p === results.length ? 0 : 1);
