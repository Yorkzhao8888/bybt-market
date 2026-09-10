/**
 * scripts/ux01-tour-skip-check.mjs — X-MARKET-UX-01 FIX3 验证：
 * 「跳过引导（不再自动弹出）」写 localStorage 后，同账号下次登录不再弹出。
 * 流程：小林（CU u-cu1）登录 → 弹层出现 → 点跳过 → localStorage 留痕 → 同账号二次登录 → 不再弹出。
 */
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5000';
const EXE = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const results = [];
const ok = (name, cond) => { results.push([name, !!cond]); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`); };

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });

// 第一次登录
const r1 = await ctx.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId: 'xiaolin' } });
const token1 = (await r1.json()).data.token;
await ctx.addInitScript(([t]) => { try { localStorage.setItem('xm_token', t); } catch {} }, [token1]);
const p1 = await ctx.newPage();
await p1.goto(`${BASE}/mall`, { waitUntil: 'networkidle' });
await p1.waitForTimeout(1600);
ok('first-login-tour-shown', await p1.locator('[role="dialog"]').count() > 0);
await p1.getByText('跳过引导（不再自动弹出）').click();
await p1.waitForTimeout(400);
ok('skip-dismissed', await p1.locator('[role="dialog"]').count() === 0);
const stored = await p1.evaluate(() => localStorage.getItem('xm_tour_v1'));
ok('skip-persisted', !!stored && stored.includes('u-cu1') && stored.includes('skipped'));
await p1.close();

// 第二次登录（同账号）
const r2 = await ctx.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId: 'xiaolin' } });
const token2 = (await r2.json()).data.token;
await ctx.addInitScript(([t]) => { try { localStorage.setItem('xm_token', t); } catch {} }, [token2]);
const p2 = await ctx.newPage();
await p2.goto(`${BASE}/mall`, { waitUntil: 'networkidle' });
await p2.waitForTimeout(1600);
ok('second-login-tour-hidden', await p2.locator('[role="dialog"]').count() === 0);

console.log(`SUMMARY ${results.filter((r) => r[1]).length}/${results.length} passed`);
await browser.close();
process.exit(results.every((r) => r[1]) ? 0 : 1);
