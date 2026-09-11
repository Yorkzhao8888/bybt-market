// XMK-EMBED-03-M 真壳层生产域 E2E（禁止 mock 对端）
// 壳层：https://c8w9k9wq2g.coze.site/xhpz/embed/market（ZiwayOS 生产）
// 观察壳层 iframe（生产 Market bundle）内的握手结果：hello→ticket→verify→免登
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const SHELL_URL = 'https://c8w9k9wq2g.coze.site/xhpz/embed/market';
const SHOT_DIR = '/workspace/projects/assets/embed-03';
mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
const ok = (name, cond, extra = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`); };

const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox'] });
// ZiwayOS 生产壳层要求登录态：主 Agent 侧导出 c8w9k9wq2g.coze.site 的 storageState JSON 后
// 以 ZIWAY_STORAGE_STATE=/path/to/state.json node scripts/embed-e2e-real.mjs 注入重跑
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: process.env.ZIWAY_STORAGE_STATE || undefined });
const page = await ctx.newPage();

const shellMsgs = [];
page.on('console', (m) => { const t = m.text(); if (t.includes('ziway-embed') || t.includes('EMBED')) shellMsgs.push(t.slice(0, 160)); });

await page.goto(SHELL_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(12000); // 壳层渲染 + iframe 握手窗口

const frames = page.frames().map((f) => f.url());
console.log('FRAMES:', JSON.stringify(frames, null, 1).slice(0, 500));
const marketFrame = page.frames().find((f) => f.url().includes('/mall') || f.url().includes('embed=ziway') || f.url().includes('db266833') || f.url().includes('localhost:5000'));

if (!marketFrame) {
  ok('market-iframe-present', false, `壳层未注入 Market iframe（当前页=${page.url().slice(0, 80)}${page.url().includes('/login') ? ' · 需 ZiwayOS 会话，请以 ZIWAY_STORAGE_STATE 注入后重跑' : ''}）`);
  await page.screenshot({ path: `${SHOT_DIR}/shell-prod-no-iframe.png`, fullPage: true });
} else {
  ok('market-iframe-present', true, marketFrame.url().slice(0, 90));
  await page.waitForTimeout(6000); // 握手 + verify + 免登态
  const state = await marketFrame.evaluate(() => ({
    token: localStorage.getItem('xm_token'),
    goods: document.querySelectorAll('[class*="group"], [class*="card"]').length,
    gateWaiting: document.body.innerText.includes('等待免登握手'),
    gateFail: document.body.innerText.includes('免登失败') || document.body.innerText.includes('核销失败'),
    headerBrand: document.body.innerText.includes('五域集市') || document.body.innerText.includes('X-Market'),
  })).catch((e) => ({ err: String(e).slice(0, 120) }));
  console.log('FRAME_STATE:', JSON.stringify(state).slice(0, 300));
  ok('embed-token-set', !!state.token, '免登 token 落位（真壳层→真 verify）');
  ok('embed-gate-not-waiting', state.gateWaiting === false, state.gateFail ? 'gate=失败态' : 'gate=收敛');
  ok('embed-goods-visible', (state.goods ?? 0) > 0, `cards=${state.goods}`);
  ok('embed-no-deadlock', !!state.token && state.gateWaiting === false, state.token ? '免登链路打通' : '仍死锁');
  await page.screenshot({ path: `${SHOT_DIR}/shell-prod-e2e.png`, fullPage: false });
  console.log('截图: assets/embed-03/shell-prod-e2e.png');
}
if (shellMsgs.length) console.log('SHELL_CONSOLE:', JSON.stringify(shellMsgs.slice(0, 5)));
console.log(`SUMMARY ${results.filter(Boolean).length}/${results.length} passed`);
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
