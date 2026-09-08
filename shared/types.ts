// X-Market 五域集市系统 · 共享领域类型与常量

/** 五域标识 */
export type DomainCode = 'E' | 'H' | 'Y' | 'T' | 'DE';

/** 域元信息 */
export interface DomainMeta {
  code: DomainCode;
  name: string; // 域中文名，如 物资
  marketName: string; // E-Market
  unitCode: string; // 供应单元码，如 EU
  mode: string; // Ei→Booth 链路描述
  tradeCode: string; // 交易单编码前缀，如 EX
  color: string; // 域主题色
  description: string;
}

/** 单元类型 */
export type UnitRole = 'CU' | 'XU' | 'EU' | 'HU' | 'HDU' | 'YU' | 'YDU' | 'TU' | 'DU';
export type Side = 'C' | 'B'; // C端消费者 / B端经营

export interface Unit {
  id: string;
  code: string;
  name: string;
  role: UnitRole;
  side: Side;
  domain: DomainCode | 'MIX';
  tier: 'L1' | 'L2' | 'L3';
  region: string;
  credit: number;
}

/** 摊位（双层） */
export interface Booth {
  id: string;
  code: string; // Booth-E-01
  domain: DomainCode;
  name: string;
  ownerUnitId: string; // 负责经营的 XU/DU
  mode: string; // 链路: EU → Booth-E
  frontDesc: string; // 售卖面说明
  backDesc: string; // 履约面说明
  status: 'open' | 'closed';
  rating: number;
  listingCount: number;
}

/** 货架商品（售卖面前店条目） */
export interface Listing {
  id: string;
  boothId: string;
  domain: DomainCode;
  title: string;
  spec: string;
  unit: string; // 计量单位
  price: number;
  stock: number;
  supplierUnitId: string;
  category: string;
}

/** 履约任务（后厂条目） */
export interface Fulfillment {
  id: string;
  boothId: string;
  domain: DomainCode;
  title: string;
  task: string; // 履约动作
  capacity: number; // 产能/配额
  used: number;
  status: 'ready' | 'processing' | 'done';
}

/** 交易单 */
export interface Order {
  id: string;
  type: 'MALL' | 'MARKET'; // 入口
  tradeCode: string; // EX-2024-0001 / D-OFD-...
  domain: DomainCode;
  buyerUnitId: string;
  sellerUnitId: string;
  boothId: string | null;
  listingId: string | null;
  title: string;
  qty: number;
  amount: number;
  status: 'pending' | 'paid' | 'fulfilling' | 'done';
  createdAt: string;
}

/** 统计视图 */
export interface DomainStats {
  domain: DomainCode;
  booths: number;
  listings: number;
  orders: number;
  turnover: number; // 成交金额
}