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
await page.waitForSelector('text=履约时间线', { timeout: 9000 });
await page.waitForTimeout(1200);

const deepLink = await page.locator('a[href*="fulfillment-track"]').first().getAttribute('href');
const bodyText = await page.evaluate(() => document.body.innerText);
const cardOk = bodyText.includes('履约时间线') && bodyText.includes('Booth · 履约四节点');
const nodes = await page.locator('[data-booth-node]').count();
const emptyOk = bodyText.includes('暂未进入履约');
const stateOk = ['已完成', '进行中', '待处理'].some((s) => bodyText.includes(s));
console.log(`RENDER: card=${cardOk} nodes=${nodes} empty-state=${emptyOk} state-ok=${stateOk} deeplink-token=${deepLink?.includes('token=')}`);
console.log('deeplink-host=' + (deepLink ? new URL(deepLink).host : 'none'));
if (!cardOk || !stateOk || !deepLink?.includes('token=')) { console.error('FAIL booth-timeline-check'); process.exit(1); }
console.log('PASS booth-timeline-check');
await page.screenshot({ path: OUT, fullPage: false });
console.log('shot saved: ' + OUT);
await browser.close();
