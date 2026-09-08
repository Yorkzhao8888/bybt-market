// X-Market 五域集市系统 · 共享领域类型与常量
// 数据模型四级结构：主体（容器）→ 身份（帽）→ 角色（域角色）→ 交易对象（商品/服务/产能）

/** 五域交易域标识 */
export type DomainCode = 'E' | 'H' | 'Y' | 'T' | 'DE';

/** 域元信息 */
export interface DomainMeta {
  code: DomainCode;
  name: string; // 域中文名，如 物资
  marketName: string; // E-Market
  unitCode: string; // 供应帽码，如 EU
  mode: string; // 链路: EU → Booth-E
  tradeCode: string; // 交易单编码前缀，如 EX
  color: string; // 域主题色
  description: string;
}

/** 双入口标识 */
export type Side = 'C' | 'B'; // Mall(C端 CU 消费者) / Market(B端 经营)

/** ===== 主体：容器模型 ===== */
export type ContainerType = 'XEPZ' | 'XHPZ' | 'XGPZ' | 'XOPZ';
export const CONTAINER_TYPE_LABEL: Record<ContainerType, string> = {
  XEPZ: '企业容器',
  XHPZ: '自然人容器',
  XGPZ: '政府容器',
  XOPZ: '平台容器(T-PLAT)',
};

export interface Container {
  id: string;
  type: ContainerType;
  name: string; // 主体名称，如 恒丰供应链
  region: string;
  credit: number;
  parentId?: string; // 平台的挂靠容器（可选）
}

/** ===== 身份：13U 帽（09-08 LOCKED） =====
 * 13U = 12U + YU(域主)；PU→TU 退化合并。
 * 完整清单：CU/DU/TU/EU/HU/OU/GU/AU/FU/IU/VU/SU + YU
 */
export type UnitRole13 =
  | 'CU' | 'DU' | 'TU' | 'EU' | 'HU' | 'OU' | 'GU'
  | 'AU' | 'FU' | 'IU' | 'VU' | 'SU' | 'YU';

export const UNIT_ROLE_LABEL: Record<UnitRole13, string> = {
  CU: '顾客',       // Mall C端消费者
  DU: '门店产能',   // DE 门店供给
  TU: '技术',       // T 技术供给（PU→TU 合并）
  EU: '物资',       // E 物资供给
  HU: '人力',       // H 人力供给
  OU: '组织需求',   // 组织/企业类需求帽
  GU: '政府需求',   // 政府类需求帽
  AU: '资产',       // 资产类帽
  FU: '金融',       // 金融类帽
  IU: '信息',       // 信息类帽
  VU: '车辆',       // 运输车辆类帽
  SU: '服务',       // 综合服务类帽
  YU: '空间·域主',  // Y 空间供给，兼作域主
};

/** 身份（帽）：挂在容器下的一顶 13U 帽 */
export interface Unit {
  id: string;
  code: string; // 帽码，如 EU-101
  name: string; // 帽名，如 启辰物资
  role: UnitRole13;
  side: Side; // C/B 端取向
  containerId: string; // 所属主体容器
  domainTags: DomainCode[]; // 域降级为标签（可多域）
  dispatch?: boolean; // 是否为调度身份（如 HDU/YDU 已并入供应链帽）
  tier: 'L1' | 'L2' | 'L3';
  credit: number;
}

/** ===== 交易对象：摊位（双层） ===== */
export interface Booth {
  id: string;
  code: string; // Booth-E-01
  domain: DomainCode;
  name: string;
  ownerUnitId: string; // 经营帽（B端经营者）
  operatorContainerId: string; // 经营主体容器
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

/** 交易单（订单流；D-OFD 为门店产能履约汇聚码） */
export interface Order {
  id: string;
  type: 'MALL' | 'MARKET'; // 双入口
  tradeCode: string; // EX-2024-0001 / D-OFD-2024-0001
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

/** 登录会话中的当前身份（主体容器 + 激活帽） */
export interface SessionUser {
  containerId: string;
  containerType: ContainerType;
  containerName: string;
  entry: Side; // 当前入口 C(mall) / B(market)
  hatId: string | null; // 激活帽（可为空）
  hat: string; // 显示名
  nologin?: boolean;
}

/** 三流占位（订单流/资源流/资金流） */
export type FlowKind = 'ORDER' | 'RESOURCE' | 'FUND';