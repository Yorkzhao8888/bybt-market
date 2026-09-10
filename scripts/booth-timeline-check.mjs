// MARKET-CONN-01 验收：订单详情 Booth 履约时间线卡 UI 渲染实证
// 用法：node scripts/booth-timeline-check.mjs
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5000';
const EXEC = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const OUT = 'assets/booth-conn-01/timeline-render.png';

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const res = await page.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId: 'du-hehe' } });
const j = await res.json();
if (!j?.data?.token) throw new Error('oneclick failed: ' + JSON.stringify(j).slice(0, 120));
await ctx.addInitScript(([t]) => { try { localStorage.setItem('xm_token', t); } catch {} }, [j.data.token]);

await page.goto(`${BASE}/orders`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
// 展开含 o-2001（EX-2026-1001）的订单行
await page.getByText('EX-2026-1001').first().click();
await page.waitForSelector('text=Booth 履约时间线', { timeout: 9000 });
await page.waitForTimeout(1200);

const nodeLabels = await page.locator('[data-booth-node]').count();
const deepLink = await page.locator('a[data-booth-deeplink]').first().getAttribute('href');
const bodyText = await page.evaluate(() => document.body.innerText);
const hasNodes = ['Market 下单', '供给铺接单', 'DU 履约', '交付确认'].every((s) => bodyText.includes(s));
const hasState = ['已完成', '进行中', '待处理'].some((s) => bodyText.includes(s));
console.log(`RENDER: nodes=${nodeLabels} labels-ok=${hasNodes} state-ok=${hasState} deeplink-token=${deepLink?.includes('token=')}`);
console.log('deeplink-host=' + (deepLink ? new URL(deepLink).host : 'none'));
await page.screenshot({ path: OUT, fullPage: false });
console.log('shot saved: ' + OUT);
await browser.close();
