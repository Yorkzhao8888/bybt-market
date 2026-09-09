// X-Supply 供给四源集市 · 路由域（X-SUPPLY-01）
// 依赖单向：仅公共底座（auth 会话 / power 三权 / store 公共数据 helper / domainConfig / shared 类型）；
// 禁止 import X-Market 业务路由、页面与业务 store 表（未来整体迁出独立服务时零耦合）。

import { Router } from 'express';
import { requireAuth, roleOf, type AuthReq, type AuthRes } from '../auth';
import { checkPower } from '../power';
import { getStore, containerById, unitById, normalizePowerHat } from '../store';
import { boothOwnerRole, isSupplyGovernHat, supplyGovernDomainOf } from '../domainConfig';
import { xSupplyEntries, xSupplyNextEntryId, xSupplyOrders, xSupplyNextOrderId, xSupplyNextOrderCode, xSupplyAppendEvent } from './store';
import type { XSupplyBooth, XSupplyEntry, XSupplyHubData, XSupplyOrder } from '../../shared/x-supply';
import type { PowerHat, HatRole } from '../../shared/types';

const xSupply = Router();

const ok = (res: AuthRes, data: unknown): void => {
  res.json({ success: true, data });
};
const fail = (res: AuthRes, code: number, message: string): void => {
  res.status(code).json({ success: false, error: message });
};

/** 办位执行帽（E 域供给线：EX 驻场执行 / EXX 铺内执行端；后续域扩展 HYX/HYXX 等） */
const isSupplyExecHat = (hat: PowerHat): boolean => hat === 'EX' || hat === 'EXX';

/** 供给集市读权限（EU/HU/YU/TU + EX/EXX + DU + 执行帽 + V*M 四源家族（VXM/VEM/VHM/VYM/VTM）；
 *  X-MARKET-ROLE-01：VDM 归 market 经营治理，不入 supply 面（移除）；XU/CU 一律 403 双保险） */
const isSupplyReader = (hat: PowerHat): boolean =>
  ['EU', 'HU', 'YU', 'TU', 'EX', 'EXX', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VXM', 'VEM', 'VHM', 'VYM', 'VTM'].includes(
    hat,
  );

/* ============ 供给列表只读（XU/CU 403） ============ */
xSupply.get('/hub', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const hat = normalizePowerHat(roleOf(user!));
  if (!isSupplyReader(hat)) {
    fail(res, 403, '供给集市（X-Supply）仅面向供给帽/执行帽/经营者/治理角色；客户界面不对四源露出（隔离口径）');
    return;
  }
  const s = getStore();
  const booths: XSupplyBooth[] = s.booths
    .filter((b) => b.kind === 'supply')
    .map((b) => {
      const ownerUnit = unitById(b.ownerUnitId);
      return {
        id: b.id,
        code: b.code,
        domain: b.domain,
        name: b.name,
        ownerContainerId: ownerUnit?.containerId ?? '',
        ownerName: containerById(ownerUnit?.containerId ?? '')?.name ?? '',
        ownerHatRole: boothOwnerRole(b.domain, b.kind),
        execHat: b.domain === 'E' ? 'EXX' : '',
        frontDesc: b.frontDesc,
        backDesc: b.backDesc,
        rating: b.rating,
        status: b.status,
      };
    });
  const myBooth = booths.find((b) => b.ownerContainerId === user!.containerId);
  // X-MARKET-ROLE-01 四源分线：家族帽（VEM/VHM/VYM/VTM）仅见本源域数据（信息隔离）；VXM 统筹全域
  const govDomain = isSupplyGovernHat(hat as HatRole) ? supplyGovernDomainOf(hat as HatRole) : null;
  const scopedBooths = govDomain ? booths.filter((b) => b.domain === govDomain) : booths;
  const scopedEntries = govDomain ? xSupplyEntries.filter((e) => e.domain === govDomain) : xSupplyEntries;
  const data: XSupplyHubData = {
    viewer: {
      hatRole: roleOf(user!),
      hatId: user!.hatId,
      containerId: user!.containerId,
      containerName: user!.containerName,
    },
    canRegister: isSupplyExecHat(hat),
    canMaintain: isSupplyExecHat(hat) && Boolean(myBooth),
    maintainBoothCode: myBooth?.code ?? '',
    booths: scopedBooths,
    entries: scopedEntries,
  };
  ok(res, data);
});

/* ============ 入驻登记（EX/EXX 办位；EU 管位不可代办 → 403） ============ */
xSupply.post('/register', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const body = (req.body ?? {}) as { boothId?: string; qualification?: string; note?: string };
  const booth = getStore().booths.find((b) => b.id === body.boothId && b.kind === 'supply');
  if (!booth) {
    fail(res, 404, '供给实体铺不存在');
    return;
  }
  if (!checkPower('supply_register', req, res, booth.code)) return;
  const ownerUnit = unitById(booth.ownerUnitId);
  const entry: XSupplyEntry = {
    id: xSupplyNextEntryId(),
    hatRole: roleOf(user!),
    containerId: ownerUnit?.containerId ?? '',
    containerName: containerById(ownerUnit?.containerId ?? '')?.name ?? '',
    boothId: booth.id,
    boothCode: booth.code,
    domain: booth.domain,
    qualification: body.qualification ?? '',
    note: body.note ?? '',
    status: 'registered',
    ts: new Date().toISOString(),
  };
  xSupplyEntries.push(entry);
  ok(res, entry);
});

/* ============ 铺子维护（EX/EXX 办位，仅本铺） ============ */
xSupply.post('/booths/:id/maintain', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const body = (req.body ?? {}) as { frontDesc?: string; backDesc?: string };
  // 兼容 id（b-e1）与铺码（Booth-E-01，来自 hub.maintainBoothCode）双口径
  const key = req.params?.id ?? '';
  const booth = getStore().booths.find((b) => (b.id === key || b.code === key) && b.kind === 'supply');
  if (!booth) {
    fail(res, 404, '非供给实体铺');
    return;
  }
  const ownerUnit = unitById(booth.ownerUnitId);
  if (ownerUnit?.containerId !== user!.containerId) {
    fail(res, 403, '仅可维护本铺（Booth-E 归属供给单位，越权他铺禁止）');
    return;
  }
  if (!checkPower('supply_booth_maintain', req, res, booth.code)) return;
  booth.frontDesc = body.frontDesc ?? booth.frontDesc;
  booth.backDesc = body.backDesc ?? booth.backDesc;
  ok(res, { id: booth.id, code: booth.code, frontDesc: booth.frontDesc, backDesc: booth.backDesc });
});

/* ============ X-SUPPLY-02 供给单（DU 采购发起 → 供给方接单/报价 → DU 确认） ============ */

/** 供给单可见域（读权限 isSupplyReader；XU/CU 403 隔离）：
 *  治理视角 VXM 全域 / 家族本源域；供给方（EU/HU/YU/TU/EX/EXX）名下供给铺收件；DU/执行帽本人发起 */
xSupply.get('/orders', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const hat = normalizePowerHat(roleOf(user!));
  if (!isSupplyReader(hat)) {
    fail(res, 403, '供给单数据仅在 DU/供给方/V*M 间流转；客户界面不可见（隔离口径）');
    return;
  }
  const govDomain = isSupplyGovernHat(hat as HatRole) ? supplyGovernDomainOf(hat as HatRole) : null;
  let list: XSupplyOrder[];
  if (hat === 'VXM') {
    list = [...xSupplyOrders];
  } else if (govDomain) {
    list = xSupplyOrders.filter((o) => o.domain === govDomain);
  } else if (['EU', 'HU', 'YU', 'TU', 'EX', 'EXX'].includes(hat)) {
    const myBoothIds = new Set(
      getStore()
        .booths.filter((b) => b.kind === 'supply' && unitById(b.ownerUnitId)?.containerId === user!.containerId)
        .map((b) => b.id),
    );
    list = xSupplyOrders.filter((o) => myBoothIds.has(o.supplierBoothId));
  } else {
    list = xSupplyOrders.filter((o) => o.buyerContainerId === user!.containerId);
  }
  ok(res, list);
});

/** DU 发起供给单（采购主体=DU 唯一经营号；D*U 分拨机制预留，本期供给单归属 DU） */
xSupply.post('/orders', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const body = (req.body ?? {}) as { boothId?: string; title?: string; qty?: number; unit?: string; note?: string };
  const key = String(body.boothId ?? '');
  const booth = getStore().booths.find((b) => (b.id === key || b.code === key) && b.kind === 'supply');
  if (!booth) {
    fail(res, 404, '供给实体铺不存在');
    return;
  }
  if (!String(body.title ?? '').trim()) {
    fail(res, 400, '采购内容（title）必填');
    return;
  }
  if (!checkPower('supply_order_initiate', req, res)) return;
  const ownerUnit = unitById(booth.ownerUnitId);
  const now = new Date().toISOString();
  const order: XSupplyOrder = {
    id: xSupplyNextOrderId(),
    code: xSupplyNextOrderCode(),
    domain: booth.domain,
    buyerContainerId: user!.containerId,
    buyerContainerName: user!.containerName,
    buyerHatRole: roleOf(user!),
    supplierBoothId: booth.id,
    supplierBoothCode: booth.code,
    supplierContainerId: ownerUnit?.containerId ?? '',
    supplierContainerName: containerById(ownerUnit?.containerId ?? '')?.name ?? '',
    supplierHatRole: boothOwnerRole(booth.domain, 'supply'),
    title: String(body.title).trim(),
    qty: Math.max(1, Number(body.qty) || 1),
    unit: String(body.unit ?? '件').trim() || '件',
    quotedCents: null,
    note: body.note ?? '',
    status: 'initiated',
    events: [],
    createdAt: now,
    updatedAt: now,
  };
  xSupplyOrders.push(order);
  xSupplyAppendEvent(order, 'initiate', user!.hatId ?? '', roleOf(user!), booth.code, order.title);
  ok(res, order);
});

/** 供给方接单（管位 EU/HU/YU/TU；仅本铺收件；仅 initiated 态） */
xSupply.post('/orders/:id/accept', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const order = xSupplyOrders.find((o) => o.id === req.params?.id);
  if (!order) {
    fail(res, 404, '供给单不存在');
    return;
  }
  if (order.supplierContainerId !== user!.containerId) {
    fail(res, 403, '仅可操作本铺收到的供给单（供给方归属校验）');
    return;
  }
  if (order.status !== 'initiated') {
    fail(res, 400, `仅待接单（initiated）状态可接单，当前 ${order.status}`);
    return;
  }
  if (!checkPower('supply_order_accept', req, res, order.supplierBoothCode)) return;
  order.status = 'accepted';
  xSupplyAppendEvent(order, 'accept', user!.hatId ?? '', roleOf(user!), order.supplierBoothCode, '已接单');
  ok(res, order);
});

/** 供给方报价（仅 accepted 态；quotedCents 必填正数，分） */
xSupply.post('/orders/:id/quote', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const body = (req.body ?? {}) as { quotedCents?: number; note?: string };
  const order = xSupplyOrders.find((o) => o.id === req.params?.id);
  if (!order) {
    fail(res, 404, '供给单不存在');
    return;
  }
  if (order.supplierContainerId !== user!.containerId) {
    fail(res, 403, '仅可操作本铺收到的供给单（供给方归属校验）');
    return;
  }
  if (order.status !== 'accepted') {
    fail(res, 400, `仅已接单（accepted）状态可报价，当前 ${order.status}`);
    return;
  }
  const cents = Math.round(Number(body.quotedCents));
  if (!Number.isFinite(cents) || cents <= 0) {
    fail(res, 400, '报价（quotedCents，分）必填且须为正数');
    return;
  }
  if (!checkPower('supply_order_quote', req, res, order.supplierBoothCode)) return;
  order.status = 'quoted';
  order.quotedCents = cents;
  xSupplyAppendEvent(order, 'quote', user!.hatId ?? '', roleOf(user!), order.supplierBoothCode, body.note ?? `报价 ${(cents / 100).toFixed(2)} 元`);
  ok(res, order);
});

/** DU 确认报价（采购主体本人；仅 quoted 态 → confirmed 基础闭环终态） */
xSupply.post('/orders/:id/confirm', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const order = xSupplyOrders.find((o) => o.id === req.params?.id);
  if (!order) {
    fail(res, 404, '供给单不存在');
    return;
  }
  if (order.buyerContainerId !== user!.containerId) {
    fail(res, 403, '仅采购主体（发起人）可确认报价');
    return;
  }
  if (order.status !== 'quoted') {
    fail(res, 400, `仅已报价（quoted）状态可确认，当前 ${order.status}`);
    return;
  }
  if (!checkPower('supply_order_confirm', req, res, order.supplierBoothCode)) return;
  order.status = 'confirmed';
  xSupplyAppendEvent(order, 'confirm', user!.hatId ?? '', roleOf(user!), order.supplierBoothCode, `确认报价 ${(order.quotedCents ?? 0) / 100} 元成单`);
  ok(res, order);
});

export default xSupply;
