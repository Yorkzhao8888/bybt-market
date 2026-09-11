// X-Supply 供给集市 · 独立数据层（X-SUPPLY-01 补充约束：供给表与 X-Market 经营数据隔离，未来可迁独立库）
// 口径与主仓一致：内存 store，重启清空。

import type { VendorStatus, XSupplyEntry, XSupplyOrder, XSupplyOrderEvent, XSupplyProfile } from '../../shared/x-supply';

/** 入驻登记台账（EX/EXX 办位登记记录） */
export const xSupplyEntries: XSupplyEntry[] = [];

export function xSupplyNextEntryId(): string {
  return `se-${xSupplyEntries.length + 1}`;
}

/* ============ X-SUPPLY-02 供给单（独立数据层：与 X-Market 订单表隔离，未来可迁独立库） ============ */

/** 供给单表（DU 采购发起） */
export const xSupplyOrders: XSupplyOrder[] = [];

export function xSupplyNextOrderId(): string {
  return `xo-${xSupplyOrders.length + 1}`;
}

/** 供给单号：XS-2026-xxxx（独立单号体系，不占 X-Market 六族码段） */
export function xSupplyNextOrderCode(): string {
  return `XS-2026-${String(xSupplyOrders.length + 1).padStart(4, '0')}`;
}

let xSupplyEventSeq = 0;

/** 流转留痕 id（全局递增） */
export function xSupplyNextEventId(): string {
  xSupplyEventSeq += 1;
  return `xe-${xSupplyEventSeq}`;
}

/** 供给单流转留痕辅助：追加事件并回写 updatedAt */
export function xSupplyAppendEvent(
  order: XSupplyOrder,
  action: XSupplyOrderEvent['action'],
  actorUser: string,
  actorHat: string,
  boothCode: string,
  note: string,
): XSupplyOrderEvent {
  const ev: XSupplyOrderEvent = {
    id: xSupplyNextEventId(),
    order_id: order.id,
    action,
    actor_user: actorUser,
    actor_hat: actorHat as XSupplyOrderEvent['actor_hat'],
    booth_code: boothCode,
    note,
    ts: new Date().toISOString(),
  };
  order.events.push(ev);
  order.updatedAt = ev.ts;
  return ev;
}

/* ============ XMK-API-01 入驻主体资料（独立数据层；内存 store，重启清空） ============ */

/** 入驻主体资料表（key=container_id） */
export const xSupplyProfiles = new Map<string, XSupplyProfile>();

/** 演示入驻主体 seed（仅演示容器；真实主体走 PUT 自助维护；vendor_status 见 XMK-GOV-01） */
xSupplyProfiles.set('c-qc', {
  container_id: 'c-qc',
  container_name: '启辰物资',
  identity_id: 'u-eu1',
  contact_name: '陈启',
  contact_phone: '13800000001',
  intro: '启辰物资 · Booth-E 源头产能入驻主体（SCM 供域）',
  updated_at: '2026-09-11T00:00:00.000Z',
  vendor_status: 'approved',
  vendor_note: '',
  governance_events: [],
});
xSupplyProfiles.set('c-eu01', {
  container_id: 'c-eu01',
  container_name: '恒晟物资',
  identity_id: 'u-cu-ep1',
  contact_name: '恒晟入驻办',
  contact_phone: '13800000002',
  intro: '恒晟物资 · 企业入驻主体（XEPZ#CU 供给动线样板）',
  updated_at: '2026-09-11T00:00:00.000Z',
  vendor_status: 'approved',
  vendor_note: '',
  governance_events: [],
});
xSupplyProfiles.set('c-dp1', {
  container_id: 'c-dp1',
  container_name: '合和经营',
  identity_id: 'u-dp1',
  contact_name: '合和经营办',
  contact_phone: '13800000003',
  intro: '合和经营 · 经营铺供给入驻主体（XDPZ#DU）',
  updated_at: '2026-09-11T00:00:00.000Z',
  vendor_status: 'approved',
  vendor_note: '',
  governance_events: [],
});
/* XMK-GOV-01 待审入驻申请者（VEM audit 打样用；无演示账号，仅名录状态迁移） */
xSupplyProfiles.set('c-ep2', {
  container_id: 'c-ep2',
  container_name: '新恒达物资',
  identity_id: 'u-ep2-eu',
  contact_name: '新恒达入驻办',
  contact_phone: '13800000004',
  intro: '新恒达物资 · Booth-E 入驻申请（待市管方审核）',
  updated_at: '2026-09-11T00:00:00.000Z',
  vendor_status: 'pending',
  vendor_note: '',
  governance_events: [],
});
/** 入驻主体准入状态机（XMK-GOV-01：pending→approved→frozen→approved；非法迁移 409） */
export const VENDOR_STATUS_TRANSITIONS: Record<VendorStatus, VendorStatus[]> = {
  pending: ['approved'],
  approved: ['frozen'],
  frozen: ['approved'],
  rejected: [],
};
