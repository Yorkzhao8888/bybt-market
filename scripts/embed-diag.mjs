// X-MARKET-EMBED-09 · 收票→exchange 全链路诊断矩阵 E2E
// 断点分类实证：「票未送达前端」与「送达被拒/核销失败」由 [xm:embed] 日志直接区分。
// a/b/c 真浏览器 postMessage（VITE 追加域白名单命中）；d/e/f 为 iframe 内合成 MessageEvent
// 注入异常形状（origin/格式/核销拒），验证判定与失败分支日志可见。
import { chromium } from 'playwright-core';

const BASE = process.env.E2E_BASE || 'http://localhost:5000';
const exe = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

const logs = [];
page.on('console', (m) => {
  const t = m.text();
  if (t.includes('[xm:embed]')) logs.push(t);
});

await page.goto(`${BASE}/model`, { waitUntil: 'networkidle' });
await page.evaluate((src) => {
  const f = document.createElement('iframe');
  f.id = 'diag-frame';
  f.src = src;
  f.style.width = '100%';
  f.style.height = '720px';
  document.body.appendChild(f);
}, `${BASE}/mall?embed=ziway`);

let frame = null;
for (let i = 0; i < 40; i++) {
  frame = page.frames().find((f) => f !== page.mainFrame() && /\/mall\?embed=ziway/.test(f.url()));
  if (frame) break;
  await page.waitForTimeout(250);
}
if (!frame) throw new Error(`iframe not found; frames=${page.frames().map((f) => f.url()).join(' | ')}`);
await frame.waitForSelector('.grid, [class*="grid"]', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2000);

const results = [];
const ok = (name, cond) => {
  results.push([name, !!cond]);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`);
};
const post = (msg) => page.evaluate((m) => document.querySelector('#diag-frame').contentWindow.postMessage(m, '*'), msg);
// 合成 MessageEvent（在 iframe 内派发）：可指定任意 origin —— 用于收票判定矩阵
const inject = (data, origin) => frame.evaluate(([d, o]) => window.dispatchEvent(new MessageEvent('message', { data: d, origin: o })), [data, origin]);
const consoleHas = (kw) => logs.some((l) => l.includes(kw));
// EMBED-L2-R2：收集壳侧（父窗）收到的 ack 消息——验证 Market 验票后回发确认契约
await page.evaluate(() => {
  window.__acks = [];
  window.addEventListener('message', (e) => { if (e.data && e.data.type === 'ziway-embed-ack') window.__acks.push(e.data); });
});

// a. 标准形状（真 postMessage）→ exchange 200 + token 落位
await post({ type: 'ziway-embed-ticket', ticket: `zt_diag_std_${Date.now()}` });
await page.waitForTimeout(1800);
ok('a-std-exchange-ok', consoleHas('exchange 成功'));
ok('a-token-set', await frame.evaluate(() => Boolean(localStorage.getItem('xm_token'))));

// b. payload 包裹
await post({ type: 'ziway-embed-ticket', payload: { ticket: `zt_diag_payload_${Date.now()}` } });
await page.waitForTimeout(1500);
ok('b-payload-wrap-ok', logs.filter((l) => l.includes('exchange 成功')).length >= 2);

// c. data 包裹
await post({ type: 'ziway-embed-ticket', data: { ticket: `zt_diag_data_${Date.now()}` } });
await page.waitForTimeout(1500);
ok('c-data-wrap-ok', logs.filter((l) => l.includes('exchange 成功')).length >= 3);

// d. origin 白名单外（合成）→ 拒单日志可见
await inject({ type: 'ziway-embed-ticket', ticket: `zt_diag_evil_${Date.now()}` }, 'http://evil.example:9999');
await page.waitForTimeout(600);
ok('d-bad-origin-rejected', consoleHas('收到票消息但被拒') && consoleHas('origin=http://evil.example:9999'));

// e. 票字段格式错（合成）→ 拒单日志可见
await inject({ type: 'ziway-embed-ticket', ticket: 'bad_not_zt' }, 'http://localhost:5000');
await page.waitForTimeout(600);
ok('e-bad-format-rejected', consoleHas('票字段缺失或格式不合规'));

// f. 核销拒（mock app_mismatch）→ exchange 失败日志可见
await post({ type: 'ziway-embed-ticket', ticket: `zt_bad_app_diag_${Date.now()}` });
await page.waitForTimeout(1800);
ok('f-verify-rejected-log', consoleHas('exchange 失败'));

// h. 壳侧 ack 契约（EMBED-L2-R2）：成功核销 → 父窗收到 {type:'ziway-embed-ack', ok:true}
const acks1 = await page.evaluate(() => window.__acks);
ok('h-parent-ack-ok', acks1.filter((a) => a.ok === true).length >= 1);

// i. 失败分支 ack：核销拒 → 父窗收到 {ok:false, reason 非空}（壳转 failed 红条，不再琥珀悬挂）
ok('i-parent-ack-fail', acks1.some((a) => a.ok === false && typeof a.reason === 'string' && a.reason.length > 0));

// g 场景独立：纯游客（不发任何票）等 8s guard 超时 → 呈「嵌入免登未完成」游客横条
const gctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const gpage = await gctx.newPage();
const logs2 = [];
gpage.on('console', (m) => { if (m.text().startsWith('[xm:embed]')) logs2.push(m.text()); });
// 顶层页直接开 iframe（parent origin 必须命中白名单才能让握手进行）——用本域 /model 作壳
await gpage.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
// 超时分支 ack：guard 8s 超时 → 父窗收到 {ok:false, reason:'ticket_timeout'}（多播白名单）；须在 goto 之后装（跳转会重置 window）
await gpage.evaluate(() => {
  window.__gacks = [];
  window.addEventListener('message', (e) => { if (e.data && e.data.type === 'ziway-embed-ack') window.__gacks.push(e.data); });
});
await gpage.evaluate((src) => {
  const f = document.createElement('iframe');
  f.id = 'g-frame';
  f.src = src;
  f.style.cssText = 'width:1280px;height:860px;border:0';
  document.body.appendChild(f);
}, `${BASE}/mall?embed=ziway&t=${Date.now()}`);
let gframe = null;
for (let i = 0; i < 30 && !gframe; i++) {
  gframe = gpage.frames().find((fr) => fr.url().includes('/mall?embed=ziway')) ?? null;
  if (!gframe) await gpage.waitForTimeout(500);
}
if (!gframe) throw new Error('g iframe not found');
await gpage.waitForTimeout(9500);
ok('g-guest-bar-shown', (await gframe.getByText('嵌入免登未完成').count()) > 0);
ok('g-guard-timeout-log', logs2.some((l) => l.includes('握手超时')));
const gacks = await gpage.evaluate(() => window.__gacks);
ok('g-parent-ack-timeout', gacks.some((a) => a.ok === false && a.reason === 'ticket_timeout'));
await gpage.screenshot({ path: 'assets/embed-09/guest-bar.png' }).catch(() => {});
await gctx.close();

await page.screenshot({ path: 'assets/embed-09/diag-matrix.png', fullPage: false });

console.log('--- xm:embed logs ---');
for (const l of logs) console.log(l);
console.log(`SUMMARY ${results.filter((r) => r[1]).length}/${results.length} passed`);
await browser.close();
process.exit(results.every((r) => r[1]) ? 0 : 1);
