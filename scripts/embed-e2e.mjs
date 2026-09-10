// X-MARKET-EMBED-01 · iframe 嵌入握手 E2E + 非嵌入回归（playwright-core）
// 前置：dev server 已以两个 env 启动——
//   ZIWAY_EMBED_BASE=http://127.0.0.1:9301        （后端 verify 指向 mock）
//   VITE_ZIWAY_EMBED_ORIGIN=http://localhost:5000 （前端白名单覆盖为本地宿主，仅 E2E）
// E2E 宿主模拟：parent 停在同源公开页 /model（真实 origin），动态注入 iframe /mall?embed=ziway；
//   监听 hello -> 回票（targetOrigin 精确 iframe origin，不用 *）。
// 断言：hello 送达 / 免登 token 落位 / 嵌入态无自家 Header / EmbedGate 提示消失 / 商品渲染；
//       非嵌入顶层 /mall：Header 存在 + 无握手提示（行为不变）。
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const EXE = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const BASE = 'http://localhost:5000';
const OUT = '/workspace/projects/assets/embed-01';
mkdirSync(OUT, { recursive: true });

const results = [];
function assert(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail ?? '' });
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : ` | ${detail ?? ''}`}`);
}

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // —— 嵌入态 ——
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  const ticket = `zt_e2e_${Date.now().toString(36)}`;
  await page.evaluate((tk) => {
    window.__helloCount = 0;
    window.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'ziway-embed-hello') {
        window.__helloCount += 1;
        ev.source.postMessage({ type: 'ziway-embed-ticket', ticket: tk }, 'http://localhost:5000');
      }
    });
  }, ticket);

  await page.evaluate(() => {
    const f = document.createElement('iframe');
    f.id = 'embed-frame';
    f.src = '/mall?embed=ziway';
    f.style.cssText = 'width:440px;height:760px;border:1px solid #ccc;';
    document.body.appendChild(f);
  });

  // frame 就绪
  let frame = null;
  for (let i = 0; i < 60 && !frame; i += 1) {
    frame = page.frames().find((f) => f.url().includes('/mall?embed=ziway')) ?? null;
    if (!frame) await page.waitForTimeout(250);
  }
  assert('iframe-present', !!frame, frame ? '' : 'frame not found');
  if (frame) {
    // 1) hello 送达宿主
    try {
      await page.waitForFunction(() => window.__helloCount >= 1, null, { timeout: 20000 });
      assert('hello-delivered', true);
    } catch {
      assert('hello-delivered', false, `helloCount=${await page.evaluate(() => window.__helloCount)}`);
    }
    // 2) 免登成功：exchange 后 token 落位
    try {
      await frame.waitForFunction(() => localStorage.getItem('xm_token') !== null, null, { timeout: 20000 });
      assert('embed-token-set', true);
    } catch {
      assert('embed-token-set', false, 'xm_token not set in frame');
    }
    // 3) 嵌入态无自家 Header
    await frame.waitForTimeout(800);
    const headerCount = await frame.locator('header').count();
    assert('embed-no-header', headerCount === 0, `header count=${headerCount}`);
    // 4) EmbedGate 提示条已收敛（握手完成后组件不渲染）
    const gateText = await frame.getByText('免登握手').count();
    assert('embed-gate-converged', gateText === 0, `gate text count=${gateText}`);
    // 5) 商品渲染（免登后 Mall 正常业务可见）
    let goodsVisible = false;
    try {
      await frame.getByText('立即购买').first().waitFor({ state: 'visible', timeout: 15000 });
      goodsVisible = true;
    } catch { /* keep false */ }
    assert('embed-goods-visible', goodsVisible);
    await page.screenshot({ path: `${OUT}/embed-iframe-mall.png`, fullPage: false });
  }

  // —— 非嵌入回归（行为完全不变） ——
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page2.goto(`${BASE}/mall`, { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(1200);
  const topHeader = await page2.locator('header').count();
  assert('nonembed-header-present', topHeader >= 1, `header count=${topHeader}`);
  const gateInTop = await page2.getByText('免登握手').count();
  assert('nonembed-no-gate', gateInTop === 0, `gate text count=${gateInTop}`);
  await page2.screenshot({ path: `${OUT}/nonembed-mall.png`, fullPage: false });
  await page2.close();

  const fails = results.filter((r) => !r.ok).length;
  console.log(`SUMMARY ${results.length - fails}/${results.length} passed`);
  process.exitCode = fails > 0 ? 1 : 0;
} finally {
  await browser.close();
}
