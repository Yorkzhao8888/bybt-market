// MARKET-CONN-01 V1 渲染验证：注入 Booth timeline API 真实结构（节点取自真 API），断言四节点 UI 渲染
import { chromium } from 'playwright-core';
const BASE = 'http://localhost:5000';
const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const login = await page.request.post(`${BASE}/api/auth/oneclick`, { data: { demoId: 'du-hehe' } });
const token = (await login.json()).data.token;
await ctx.addInitScript(([t]) => { try { localStorage.setItem('xm_token', t); } catch {} }, [token]);
// 注入与 Booth 真实 API 同构的响应（节点数据取自 M20260909142124423 实测）
await page.route('**/api/orders/o-2001/booth-timeline*', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        matched: true,
        orderCode: 'EX-2026-1001',
        boothOrderNo: 'M20260909142124423',
        timeline: {
          fulfillmentId: 1187,
          orderNo: 'M20260909142124423',
          nodes: [
            { key: 'placed', label: 'Market 下单', at: '2026-09-09T06:21:24.947Z', state: 'done', actor: 'XEPZ-****001' },
            { key: 'accepted', label: '供给铺接单', at: '2026-09-09T06:25:10.000Z', state: 'done', actor: 'Booth-E' },
            { key: 'fulfilling', label: 'DU 履约', at: '2026-09-09T06:30:00.000Z', state: 'doing', actor: 'DEX-****001' },
            { key: 'delivered', label: '交付确认', at: null, state: 'pending', actor: null },
          ],
        },
        deepLink: 'https://cbpbgkdbvs.coze.site/fulfillment-track?token=x.demo',
        fetchedAt: Date.now(),
      },
    }),
  }),
);
await page.goto(`${BASE}/orders`, { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.getByText('EX-2026-1001').first().click();
await page.waitForTimeout(1200);
const txt = await page.evaluate(() => document.body.innerText);
const checks = {
  '卡标题(履约时间线)': txt.includes('履约时间线'),
  'Booth 履约单号': txt.includes('M20260909142124423'),
  '节点1 Market 下单': txt.includes('Market 下单'),
  '节点2 供给铺接单': txt.includes('供给铺接单'),
  '节点3 DU 履约': txt.includes('DU 履约'),
  '节点4 交付确认': txt.includes('交付确认'),
  '状态 doing(处理中)': txt.includes('处理中') || txt.includes('进行中'),
  '状态 待推进(pending)': txt.includes('待推进'),
  '操作方脱敏': txt.includes('XEPZ-****001'),
  '深链按钮': txt.includes('在 Booth 中查看'),
};
let pass = true;
for (const [k, v] of Object.entries(checks)) { console.log(`${v ? 'PASS' : 'FAIL'} ${k}`); if (!v) pass = false; }
const href = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href')).find((h) => h && h.includes('cbpbgkdbvs')));
console.log(pass && href ? `深链 href OK: ${href.slice(0, 60)}...` : '深链 href FAIL');
await page.screenshot({ path: 'assets/conn-01/market-timeline-matched.png' });
console.log('截图: assets/conn-01/market-timeline-matched.png');
await browser.close();
process.exit(pass && href ? 0 : 1);
