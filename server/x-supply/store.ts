// X-Supply 供给集市 · 独立数据层（X-SUPPLY-01 补充约束：供给表与 X-Market 经营数据隔离，未来可迁独立库）
// 口径与主仓一致：内存 store，重启清空。

import type { XSupplyEntry, XSupplyOrder, XSupplyOrderEvent } from '../../shared/x-supply';

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
