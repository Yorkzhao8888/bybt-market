// X-Market 五域集市系统 · 后端 Express API 路由
// 双入口 Mall(C端) / Market(B端)，五域 Booth 双层（前店售卖面 / 后厂履约面）
// 数据四级：容器(主体)→帽(13U 身份)→角色(域角色)→交易对象(商品/服务/产能)

import { Router } from 'express';
import { DOMAINS, domainByCode, familyOfDomain } from '../domainConfig';
import { getStore, nextSeq, domainStats, containerById } from '../store';
import { createToken, getUserByToken, revokeToken, DEV_PASSWORD } from '../auth';
import type { Container, DemoAccount, DomainCode, HatRole, Order, SessionUser } from '../../shared/types';
import { CONTAINER_TYPE_LABEL, UNIT_ROLE_LABEL } from '../../shared/types';

const router = Router();
const api = Router();

function ok(res: { json: (v: unknown) => void }, data: unknown): void {
  res.json({ success: true, data });
}

/** 授权中间件：从 Authorization: Bearer <token> 还原当前会话 */
function requireAuth(req: { headers: { authorization?: string } }, res: { status: (n: number) => { json: (v: unknown) => void } }, next: () => void): void {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const user = token ? getUserByToken(token) : null;
  if (!user) {
    res.status(401).json({ success: false, error: '未登录或会话已过期' });
    return;
  }
  (req as { user?: SessionUser }).user = user;
  next();
}

// ================= 认证（底座·开发版）=================
// 密码统一 test123；一键登录进入预设身份（C 端 + B 端五域供给帽/经营帽）
/** 帽 → 域视角落位（经营/执行帽归对应 Booth 视角） */
const DEMO_ROUTE: Partial<Record<HatRole, { domain: DomainCode; booth: string }>> = {
  EU: { domain: 'E', booth: 'b-e1' },
  EDU: { domain: 'E', booth: 'b-e1' },
  EDX: { domain: 'E', booth: 'b-e1' },
  HU: { domain: 'H', booth: 'b-h1' },
  YU: { domain: 'Y', booth: 'b-y1' },
  TU: { domain: 'T', booth: 'b-t1' },
  TDU: { domain: 'T', booth: 'b-t1' },
  TDX: { domain: 'T', booth: 'b-t1' },
  DU: { domain: 'DE', booth: 'b-de1' },
};

const DEMO_ALIAS: Record<string, string> = {
  xiaolin: 'u-cu1',
  amay: 'u-cu2',
  hefeng: 'u-op1',
  'eu-qiuchen': 'u-eu1',
  edu: 'u-edu1',
  edx: 'u-edx1',
  'hu-xunche': 'u-hu1',
  'yu-yunjie': 'u-yu1',
  'tu-xingmai': 'u-tu1',
  tdu: 'u-tdu1',
  tdx: 'u-tdx1',
  'de-haowei': 'u-du1',
};

/** 按帽组装会话身份（含域视角/摊位落位） */
function sessionOfHat(hatId: string): SessionUser | null {
  const s = getStore();
  const u = s.units.find(x => x.id === hatId);
  if (!u) return null;
  const c = containerById(u.containerId);
  if (!c) return null;
  const route = DEMO_ROUTE[u.role as HatRole];
  const user: SessionUser = {
    containerId: c.id,
    containerType: c.type,
    containerName: c.name,
    entry: u.side,
    hatId: u.id,
    hatRole: u.role,
    hat: `${u.name} (${u.role} ${UNIT_ROLE_LABEL[u.role]})`,
  };
  if (route) {
    user.domainView = route.domain;
    user.boothTarget = route.booth;
  }
  return user;
}

/** 演示账号表（由 13U 帽派生，登录/一键登录共用） */
function demoAccounts(): DemoAccount[] {
  const s = getStore();
  return Object.entries(DEMO_ALIAS)
    .map(([id, hatId]) => {
      const u = s.units.find(x => x.id === hatId);
      if (!u) return null;
      const c = containerById(u.containerId);
      if (!c) return null;
      const route = DEMO_ROUTE[u.role as HatRole];
      const acc: DemoAccount = {
        id,
        entry: u.side,
        hatRole: u.role,
        containerId: c.id,
        hatId: u.id,
        label: `${u.name} · ${UNIT_ROLE_LABEL[u.role]}`,
        note: `${c.name} · ${CONTAINER_TYPE_LABEL[c.type]}`,
      };
      if (route) {
        acc.domainView = route.domain;
        acc.boothTarget = route.booth;
      }
      return acc;
    })
    .filter((x): x is DemoAccount => x !== null);
}

const ACCOUNTS: Record<string, SessionUser> = {};
for (const acc of demoAccounts()) {
  const u = sessionOfHat(acc.hatId);
  if (u) ACCOUNTS[acc.id] = u;
}

function defaultUser(entry: string): SessionUser {
  return entry === 'B' ? ACCOUNTS.hefeng : ACCOUNTS.xiaolin;
}

// 一键登录演示账号清单（C 端 + B 端五域供给帽/经营帽）
api.get('/auth/demos', (_req, res) => {
  ok(res, demoAccounts());
});

// 账号密码登录（口令 test123）
api.post('/auth/login', (req, res) => {
  const body = req.body as { account?: string; password?: string; entry?: 'C' | 'B' };
  if (body.password !== DEV_PASSWORD) {
    res.status(401).json({ success: false, error: '账号或密码错误（开发口径口令 test123）' });
    return;
  }
  const account = (body.account || '').trim().toLowerCase();
  const entry = body.entry === 'B' ? 'B' : 'C';
  const user = account && ACCOUNTS[account] ? ACCOUNTS[account] : defaultUser(entry);
  const token = createToken(user);
  ok(res, { token, user });
});

// 一键登录（免密，进入预设身份；可指定演示账号）
api.post('/auth/oneclick', (req, res) => {
  const body = req.body as { entry?: 'C' | 'B'; demoId?: string };
  if (body.demoId && ACCOUNTS[body.demoId]) {
    const user = ACCOUNTS[body.demoId];
    ok(res, { token: createToken(user), user });
    return;
  }
  const entry = body.entry === 'B' ? 'B' : 'C';
  const user = defaultUser(entry);
  const token = createToken(user);
  ok(res, { token, user });
});

// 当前会话
api.get('/auth/me', requireAuth, (req, res) => {
  ok(res, (req as { user?: SessionUser }).user);
});

// 登出
api.post('/auth/logout', (req, res) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (token) revokeToken(token);
  ok(res, { loggedOut: true });
});

// ================= 数据模型查询（域/帽/容器 三级）=================
api.get('/model/containers', (_req, res) => {
  const s = getStore();
  const data = s.containers.map(c => ({
    ...c,
    typeLabel: CONTAINER_TYPE_LABEL[c.type],
    hatCount: s.units.filter(u => u.containerId === c.id).length,
    boothCount: s.booths.filter(b => b.operatorContainerId === c.id).length,
  }));
  ok(res, data);
});

api.get('/model/containers/:id', (req, res) => {
  const s = getStore();
  const c = s.containers.find(x => x.id === req.params.id);
  if (!c) {
    res.status(404).json({ success: false, error: '容器不存在' });
    return;
  }
  const container: Container = c;
  const hats = s.units.filter(u => u.containerId === container.id);
  const booths = s.booths.filter(b => b.operatorContainerId === container.id);
  ok(res, { container, hats, booths });
});

// 五域帽表（供给帽/经营帽/执行帽，含线归属）——由 domainConfig 驱动
api.get('/model/hats', (_req, res) => {
  ok(res, {
    base13U: ['CU', 'DU', 'TU', 'EU', 'HU', 'OU', 'GU', 'AU', 'FU', 'IU', 'VU', 'SU', 'YU'],
    opExt: ['EDU', 'TDU'],
    execExt: ['EDX', 'TDX'],
    domains: DOMAINS.map(d => ({
      code: d.code,
      name: d.name,
      supplyHat: d.unitCode,
      opHat: d.opCode,
      execHat: d.execCode,
      booth: `Booth-${d.code}`,
      tradeCode: d.tradeCode,
      line: `${d.unitCode} → ${d.opCode === d.unitCode ? '—' : `${d.opCode} →`} Booth-${d.code} [${d.tradeCode}]`,
    })),
  });
});

api.get('/model/units', (req, res) => {
  const s = getStore();
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const side = typeof req.query.side === 'string' ? req.query.side : undefined;
  const containerId = typeof req.query.containerId === 'string' ? req.query.containerId : undefined;
  let list = s.units;
  if (role) list = list.filter(u => u.role === role);
  if (side === 'C' || side === 'B') list = list.filter(u => u.side === side);
  if (containerId) list = list.filter(u => u.containerId === containerId);
  const containerMap = new Map(s.containers.map(c => [c.id, c.name]));
  ok(res, list.map(u => ({
    ...u,
    containerName: containerMap.get(u.containerId) ?? '',
  })));
});

// 三级结构：容器 → 帽(身份) → 域角色(交易对象)
api.get('/model/hierarchy', (_req, res) => {
  const s = getStore();
  const containers = s.containers.map(c => ({
    id: c.id,
    type: c.type,
    typeLabel: CONTAINER_TYPE_LABEL[c.type],
    name: c.name,
    hats: s.units
      .filter(u => u.containerId === c.id)
      .map(u => ({
        id: u.id,
        code: u.code,
        name: u.name,
        role: u.role,
        side: u.side,
        domainTags: u.domainTags,
        dispatch: u.dispatch,
        booths: s.booths.filter(b => b.operatorContainerId === c.id || b.ownerUnitId === u.id).map(b => ({ id: b.id, code: b.code, name: b.name, domain: b.domain })),
      })),
  }));
  ok(res, containers);
});

// ================= 三流占位（订单流/资源流/资金流 → XCASE 收口）=================
api.get('/flows', (_req, res) => {
  ok(res, {
    ORDER: { caption: '订单流', gate: 'XCASE', status: 'stub', note: '待对接 ERP 与 XCASE 收口' },
    RESOURCE: { caption: '资源流', gate: 'XCASE', status: 'stub', note: '履约资源调度台账占位' },
    FUND: {
      caption: '资金流',
      gate: 'XCASE → ERP → X-FIN',
      status: 'stub',
      note: '结算收口、总账入账、财务分析三段分工',
      segments: [
        { id: 'XCASE', label: '结算流水（收口结算）', owner: 'XCASE', note: '订单/退款/回款实时结算流水，收口资金口径' },
        { id: 'ERP', label: '总账/资产（管账）', owner: 'ERP', note: '结算对账入总账、应收应付与资产台账' },
        { id: 'X-FIN', label: '财务分析（分析）', owner: 'X-FIN', note: '现金流/毛利率/产能收益等财务分析' },
      ],
    },
  });
});

api.get('/flows/:kind', (req, res) => {
  const kind = String(req.params.kind).toUpperCase();
  const s = getStore();
  const meta: Record<string, string> = { ORDER: '订单流', RESOURCE: '资源流', FUND: '资金流' };
  if (!meta[kind]) {
    res.status(404).json({ success: false, error: '未知三流类型' });
    return;
  }
  const rows = kind === 'ORDER'
    ? s.orders.map(o => ({ id: o.id, tradeCode: o.tradeCode, domain: o.domain, amount: o.amount, status: o.status }))
    : [];
  ok(res, { kind, caption: meta[kind], gate: 'XCASE', status: 'stub', items: rows });
});

// ================= Mall · C端 =================
api.get('/mall/listings', (req, res) => {
  const s = getStore();
  const dom = typeof req.query.domain === 'string' ? req.query.domain : undefined;
  let list = s.listings;
  if (dom) list = list.filter(l => l.domain === dom);
  const boothMap = new Map(s.booths.map(b => [b.id, b]));
  const data = list.map(l => ({
    ...l,
    booth: boothMap.get(l.boothId) ? { id: boothMap.get(l.boothId)!.id, name: boothMap.get(l.boothId)!.name, code: boothMap.get(l.boothId)!.code, rating: boothMap.get(l.boothId)!.rating } : null,
  }));
  ok(res, data);
});

api.get('/mall/booths', (req, res) => {
  const s = getStore();
  const dom = typeof req.query.domain === 'string' ? req.query.domain : undefined;
  let list = s.booths;
  if (dom) list = list.filter(b => b.domain === dom);
  ok(res, list);
});

// 摊位详情（双层：前店售卖面 + 后厂履约面）
api.get('/mall/booths/:id', (req, res) => {
  const s = getStore();
  const booth = s.booths.find(b => b.id === req.params.id);
  if (!booth) {
    res.status(404).json({ success: false, error: 'Booth not found' });
    return;
  }
  ok(res, {
    booth,
    front: s.listings.filter(l => l.boothId === booth.id),
    back: s.fulfillments.filter(f => f.boothId === booth.id),
    owner: s.units.find(u => u.id === booth.ownerUnitId) ?? null,
  });
});

// ================= Market · B端 =================
api.get('/market/units', (req, res) => {
  const s = getStore();
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  let list = s.units;
  if (role) list = list.filter(u => u.role === role);
  const containerMap = new Map(s.containers.map(c => [c.id, c.name]));
  ok(res, list.map(u => ({ ...u, containerName: containerMap.get(u.containerId) ?? '' })));
});

// 摊位列表（含双层聚合）
api.get('/market/booths', (req, res) => {
  const s = getStore();
  const dom = typeof req.query.domain === 'string' ? req.query.domain : undefined;
  let list = s.booths;
  if (dom) list = list.filter(b => b.domain === dom);
  const unitMap = new Map(s.units.map(u => [u.id, u]));
  const data = list.map(b => {
    const frontCount = s.listings.filter(l => l.boothId === b.id).length;
    const backTasks = s.fulfillments.filter(f => f.boothId === b.id);
    return {
      ...b,
      owner: unitMap.get(b.ownerUnitId) ? { id: unitMap.get(b.ownerUnitId)!.id, name: unitMap.get(b.ownerUnitId)!.name, code: unitMap.get(b.ownerUnitId)!.code } : null,
      frontCount,
      backCount: backTasks.length,
      backLoad: backTasks.reduce((acc, t) => acc + t.used, 0),
    };
  });
  ok(res, data);
});

// 摊位详情（B端经营视角：前店+后厂+经营单元）
api.get('/market/booths/:id', (req, res) => {
  const s = getStore();
  const booth = s.booths.find(b => b.id === req.params.id);
  if (!booth) {
    res.status(404).json({ success: false, error: 'Booth not found' });
    return;
  }
  ok(res, {
    booth,
    front: s.listings.filter(l => l.boothId === booth.id),
    back: s.fulfillments.filter(f => f.boothId === booth.id),
    owner: s.units.find(u => u.id === booth.ownerUnitId) ?? null,
    ops: booth.opsUnitId ? s.units.find(u => u.id === booth.opsUnitId) ?? null : null,
    orders: s.orders.filter(o => o.boothId === booth.id),
  });
});

// 创建摊位（新增域摊位，B端）
api.post('/market/booths', (req, res) => {
  const s = getStore();
  const body = req.body as { domain?: string; name?: string; ownerUnitId?: string; frontDesc?: string; backDesc?: string };
  const domain = body.domain && domainByCode(body.domain).code;
  if (!domain || !body.name || !body.ownerUnitId) {
    res.status(400).json({ success: false, error: 'domain/name/ownerUnitId 为必填项' });
    return;
  }
  const owner = s.units.find(u => u.id === body.ownerUnitId);
  if (!owner) {
    res.status(400).json({ success: false, error: 'owner 经营帽不存在' });
    return;
  }
  const domainInfo = domainByCode(domain);
  const n = s.booths.filter(b => b.domain === domain).length + 1;
  const booth = {
    id: `b-${domain}-${Date.now()}`,
    code: `Booth-${domain}-${String(n).padStart(2, '0')}`,
    domain,
    name: body.name,
    ownerUnitId: body.ownerUnitId,
    operatorContainerId: owner.containerId,
    mode: domainInfo.mode,
    frontDesc: body.frontDesc || '待补充售卖面说明',
    backDesc: body.backDesc || '待补充履约面说明',
    status: 'open',
    rating: 4.5,
    listingCount: 0,
  } as const;
  s.booths.push(booth);
  ok(res, booth);
});

// 上架商品（前店售卖面）
api.post('/market/booths/:id/listings', (req, res) => {
  const s = getStore();
  const booth = s.booths.find(b => b.id === req.params.id);
  if (!booth) {
    res.status(404).json({ success: false, error: 'Booth not found' });
    return;
  }
  const body = req.body as { title?: string; spec?: string; unit?: string; price?: number; stock?: number; supplierUnitId?: string };
  if (!body.title || !body.unit || typeof body.price !== 'number') {
    res.status(400).json({ success: false, error: 'title/unit/price 为必填项' });
    return;
  }
  const listing = {
    id: `l-${booth.id}-${Date.now()}`,
    boothId: booth.id,
    domain: booth.domain,
    title: body.title,
    spec: body.spec || '-',
    unit: body.unit,
    price: body.price,
    stock: body.stock ?? 0,
    supplierUnitId: body.supplierUnitId || booth.ownerUnitId,
    category: '自定义',
  } as const;
  s.listings.push(listing);
  booth.listingCount = s.listings.filter(l => l.boothId === booth.id).length;
  ok(res, listing);
});

// 添加履约任务（后厂履约面）
api.post('/market/booths/:id/fulfillments', (req, res) => {
  const s = getStore();
  const booth = s.booths.find(b => b.id === req.params.id);
  if (!booth) {
    res.status(404).json({ success: false, error: 'Booth not found' });
    return;
  }
  const body = req.body as { title?: string; task?: string; capacity?: number };
  if (!body.title) {
    res.status(400).json({ success: false, error: 'title 为必填项' });
    return;
  }
  const fulfillment = {
    id: `f-${booth.id}-${Date.now()}`,
    boothId: booth.id,
    domain: booth.domain,
    title: body.title,
    task: body.task || '待补充履约动作',
    capacity: body.capacity ?? 0,
    used: 0,
    status: 'ready',
  } as const;
  s.fulfillments.push(fulfillment);
  ok(res, fulfillment);
});

// 交易对象（商品/服务/产能）柜台，预留交易对象台账
api.get('/tradables', (_req, res) => {
  const s = getStore();
  ok(res, {
    listingCount: s.listings.length,
    categories: Array.from(new Set(s.listings.map(l => l.category))),
    capacityBooths: s.fulfillments.length,
  });
});

// ================= 交易与订单 =================
api.post('/orders', (req, res) => {
  const s = getStore();
  const body = req.body as {
    type?: 'MALL' | 'MARKET';
    listingId?: string;
    buyerUnitId?: string;
    qty?: number;
  };
  const listing = s.listings.find(l => l.id === body.listingId);
  if (!listing) {
    res.status(400).json({ success: false, error: 'listing 不存在' });
    return;
  }
  if (!body.buyerUnitId) {
    res.status(400).json({ success: false, error: 'buyerUnitId 为必填项' });
    return;
  }
  const qty = body.qty ?? 1;
  if (qty <= 0 || qty > listing.stock) {
    res.status(400).json({ success: false, error: '数量超出库存' });
    return;
  }
  const booth = s.booths.find(b => b.id === listing.boothId);
  const domainInfo = domainByCode(listing.domain);
  const seq = nextSeq(domainInfo.code);
  const tradeCode = `${domainInfo.tradeCode}-2024-${String(seq).padStart(4, '0')}`;
  const order: Order = {
    id: `o-${Date.now()}`,
    type: body.type === 'MARKET' ? 'MARKET' : 'MALL',
    family: body.type === 'MARKET' ? familyOfDomain(listing.domain) : 'C',
    tradeCode,
    domain: listing.domain,
    buyerUnitId: body.buyerUnitId,
    sellerUnitId: listing.supplierUnitId,
    boothId: booth?.id ?? null,
    listingId: listing.id,
    title: listing.title,
    qty,
    amount: listing.price * qty,
    status: 'paid',
    createdAt: new Date().toISOString(),
  };
  s.orders.push(order);
  listing.stock -= qty;
  ok(res, order);
});

// 订单六族占位（C/D/H/E/Y/T）
api.get('/orders/families', (_req, res) => {
  const s = getStore();
  const FAMILY_META = [
    { family: 'C', caption: '客户订单族', lead: 'C 端消费者直购（Shop B2C）' },
    { family: 'D', caption: '门店产能订单族', lead: 'DU → Booth-DE → D-OFD 履约' },
    { family: 'H', caption: '人力订单族', lead: 'HU → HDU → Booth-H → HX' },
    { family: 'E', caption: '物资订单族', lead: 'EU → Booth-E → EX' },
    { family: 'Y', caption: '空间订单族', lead: 'YU → YDU → Booth-Y → YX' },
    { family: 'T', caption: '技术订单族 Order-T', lead: 'TU/TDU → Booth-T → TDX，经 X-OFD 汇聚（占位）' },
  ] as const;
  const withCount = FAMILY_META.map(m => ({
    ...m,
    count: s.orders.filter(o => o.family === m.family).length,
    status: m.family === 'T' ? 'placeholder' : 'active',
  }));
  ok(res, {
    families: withCount,
    mapping: { C: '客户端', D: '门店产能', H: '人力', E: '物资', Y: '空间', T: '技术(Order-T)' },
  });
});

// 订单列表
api.get('/orders', (req, res) => {
  const s = getStore();
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  let list = s.orders;
  if (type) list = list.filter(o => o.type === type);
  const unitMap = new Map(s.units.map(u => [u.id, u.name]));
  const data = list.map(o => ({
    ...o,
    buyer: unitMap.get(o.buyerUnitId) ?? o.buyerUnitId,
    seller: unitMap.get(o.sellerUnitId) ?? o.sellerUnitId,
  }));
  ok(res, data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

// 订单状态推进
api.post('/orders/:id/advance', (req, res) => {
  const s = getStore();
  const order = s.orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  const flow: Record<Order['status'], Order['status']> = {
    pending: 'paid',
    paid: 'fulfilling',
    fulfilling: 'done',
    done: 'done',
  };
  order.status = flow[order.status];
  ok(res, order);
});

// ---- 元信息 ----
api.get('/meta', (_req, res) => {
  ok(res, { domains: DOMAINS, stats: domainStats() });
});

// ---- 双入口首页看板 ----
api.get('/overview', (_req, res) => {
  const s = getStore();
  ok(res, {
    stats: domainStats(),
    domainMeta: DOMAINS,
    totalListings: s.listings.length,
    totalBooths: s.booths.length,
    totalOrders: s.orders.length,
    totalTurnover: s.orders.filter(o => o.status !== 'pending').reduce((a, o) => a + o.amount, 0),
  });
});

router.use('/api', api);

// 兜底 404
router.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API 未找到: ' + req.originalUrl });
});

export default router;