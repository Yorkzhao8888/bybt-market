// X-Supply 供给集市 · 独立数据层（X-SUPPLY-01 补充约束：供给表与 X-Market 经营数据隔离，未来可迁独立库）
// 口径与主仓一致：内存 store，重启清空。

import type { XSupplyEntry } from '../../shared/x-supply';

/** 入驻登记台账（EX/EXX 办位登记记录） */
export const xSupplyEntries: XSupplyEntry[] = [];

export function xSupplyNextEntryId(): string {
  return `se-${xSupplyEntries.length + 1}`;
}
