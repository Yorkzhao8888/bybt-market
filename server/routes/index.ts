// X-Market 五域集市系统 · 后端 Express API 路由
// 双入口 Mall(C端) / Market(B端)，五域 Booth 双层（前店售卖面 / 后厂履约面）

import { Router } from 'express';
import { DOMAINS, domainByCode } from '../domainConfig';
import { getStore, nextSeq, domainStats } from '../store';
import type { Order } from '../../shared/types';

const router = Router();
const api = Router();

/** 统一异常包裹 */
function ok(res: { json: (v: unknown) => void }, data: unknown): void {
  res.json({ success: true, data });
}

// ---- 元信息 ----
api.get('/meta', (req, res) => {
  ok(res, {
    domains: DOMAINS,
    stats: domainStats(),
  });
});

// ---- 双入口首页看板 ----
api.get('/overview', (req, res) => {
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

// ================= Mall · C端 =================
// 浏览商品（可域过滤）
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

// 浏览摊位（C端视角）
api.get('/mall/booths', (req, res) => {
  const s = getStore();
  const dom = typeof req.query.domain === 'string' ? req.query.domain : undefined;
  let list = s.booths;
  if (dom) list = list.filter(b => b.domain === dom);
  ok(res, list);
});

// 摊位详情（双层模型：前店售卖面 + 后厂履约面）
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
// 经营单元列表
api.get('/market/units', (req, res) => {
  const s = getStore();
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  let list = s.units;
  if (role) list = list.filter(u => u.role === role);
  ok(res, list);
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
    res.status(400).json({ success: false, error: 'owner 单元不存在' });
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

// ================= 交易与订单 =================
// 下单（Mall 交易码 EX/YX/DE-OFD；Market 交易码 HX/TX）
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
  const codeBase = domainInfo.tradeCode; // EX / D-OFD ...
  const seq = nextSeq(domainInfo.code);
  const tradeCode = `${codeBase}-2024-${String(seq).padStart(4, '0')}`;
  const order: Order = {
    id: `o-${Date.now()}`,
    type: body.type === 'MARKET' ? 'MARKET' : 'MALL',
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

router.use('/api', api);

// 兜底 404
router.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API 未找到: ' + req.originalUrl });
});

export default router;