// XMK-CONT-01 UI 级验证：V1 六卡渲染+简称徽标 / V2 xdpz 一键登录进 DU 视角（截图 assets/cont01/）
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = 'http://localhost:5000';
const exe = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const OUT = '/workspace/projects/assets/cont01';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (name, cond, extra = '') => { results.push([name, !!cond]); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`); };

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// V1: /entrance 六容器卡 + 简称徽标
await page.goto(`${BASE}/entrance`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
for (const code of ['#xhpz', '#xepz', '#xdpz', '#xvpz', '#xopz', '#xgpz']) {
  ok(`v1-card-${code}`, await page.getByText(code, { exact: false }).count() > 0);
}
for (const b of ['HP', 'EP', 'DP', 'VP', 'OP', 'GP']) {
  ok(`v1-badge-${b}`, await page.getByText(b, { exact: true }).count() > 0);
}
ok('v1-op-not-platform', await page.getByText('平台容器', { exact: false }).count() <= 2);
await page.screenshot({ path: `${OUT}/entrance-six-cards.png`, fullPage: true });

// V2: #xdpz 卡 → 登录页 XDPZ 演示账号一键登录 → DU 经营视角
// 容器卡为 onClick 导航（无 href），按卡名点击
await page.getByText('经营户容器', { exact: true }).first().click();
await page.waitForURL('**/entrance/login**');
await page.waitForTimeout(500);
ok('v2-login-page-dp', page.url().includes('container=dp'));
ok('v2-dp-demo-visible', await page.getByText('XDPZ#DU', { exact: false }).count() > 0);
await page.screenshot({ path: `${OUT}/xdpz-login-page.png`, fullPage: true });
await page.getByRole('button', { name: /XDPZ#DU/ }).first().click();
await page.waitForTimeout(1800);
ok('v2-landed-operator', page.url().includes('/operator'), page.url());
ok('v2-operator-header', await page.getByText('店主', { exact: false }).count() > 0);
await page.screenshot({ path: `${OUT}/xdpz-operator-view.png`, fullPage: false });

console.log(`SUMMARY ${results.filter(r => r[1]).length}/${results.length} passed`);
await browser.close();
process.exit(results.every(r => r[1]) ? 0 : 1);
