/**
 * X-MARKET-TI-05 新手引导 · 自动化截图（交付凭证）
 * 用法：node scripts/onboarding-shots.mjs   （需 dev 服务运行于 :5000）
 * 产物：assets/onboarding-ti05/*.png（整页视口截图，右下角浮层可见、页面可操作 = 不阻塞业务）
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5000';
const OUT = 'assets/onboarding-ti05';
const EXE = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(10000);

async function loginAs(demoId) {
  const res = await page.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId } });
  const j = ((await res.json()) ?? {}).data ?? {};
  if (!j.token) throw new Error(`login failed(${demoId}): ${JSON.stringify(j).slice(0, 200)}`);
  // 在任何页面脚本执行前注入 token（消除 me() 与 token 写入的竞态），并清空引导完成记录
  await ctx.addInitScript(([t]) => {
    localStorage.setItem('xm_token', t);
    localStorage.removeItem('xm_tour_v1');
  }, [j.token]);
}

async function openTour() {
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  try {
    await page.waitForSelector('aside[role="dialog"]', { timeout: 9000 });
  } catch (e) {
    const dbg = await page.evaluate(() => ({
      token: !!localStorage.getItem('xm_token'),
      tour: localStorage.getItem('xm_tour_v1'),
      hasAside: !!document.querySelector('aside[role="dialog"]'),
      hasPicker: !!document.querySelector('div[role="dialog"]'),
      bodyHint: document.body.innerText.slice(0, 80),
    }));
    console.error('TOUR-DEBUG:', JSON.stringify(dbg));
    throw e;
  }
  await page.waitForTimeout(450);
}

async function shoot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`shot: ${name}.png`);
}

async function walkTour(prefix, steps) {
  for (let i = 1; i <= steps; i++) {
    await shoot(`${prefix}-step${i}`);
    if (i < steps) {
      await page.getByRole('button', { name: /下一步/ }).click();
      await page.waitForTimeout(380);
    }
  }
  await page.getByRole('button', { name: /完成引导/ }).click();
  await page.waitForTimeout(350);
}

async function skipTour() {
  await page.getByRole('button', { name: /跳过引导/ }).click();
  await page.waitForTimeout(300);
}

/* 1) EU 供应商套全 7 步（物资文案） */
await loginAs('eu-hengsheng');
await openTour();
await walkTour('supplier-EU', 7);

/* 2) YU/HU/TU 供应商套首步（空间/人力/技术差异化文案） */
for (const [demo, tag] of [['yu-list-1', 'YU'], ['hu-list-1', 'HU'], ['tu-list-1', 'TU']]) {
  await loginAs(demo);
  await openTour();
  await shoot(`supplier-${tag}-step1`);
  await skipTour();
}

/* 3) DU 经营者套全 6 步 */
await loginAs('ddu');
await openTour();
await walkTour('operator', 6);

/* 4) 客户套（CU 买家）全 3 步 */
await loginAs('xiaolin');
await openTour();
await walkTour('client-CU', 3);

/* 5) 客户套（XU 采购方）首步（Market 路径差异化） */
await loginAs('xu-huadong');
await openTour();
await shoot('client-XU-step1');
await skipTour();

/* 6) 未识别角色（VDM 治理类）→ 三选一入口 → 自选「供货商」进入引导 */
await loginAs('vdm');
await page.goto(`${BASE}/`, { waitUntil: 'load' });
await page.waitForSelector('div[role="dialog"]', { timeout: 9000 });
await page.waitForTimeout(450);
await shoot('picker-identity');
await page.getByRole('button', { name: /供货商/ }).click();
await page.waitForSelector('aside[role="dialog"]', { timeout: 5000 });
await page.waitForTimeout(400);
await shoot('picker-supplier-step1');
await skipTour();

await browser.close();
console.log('DONE');
