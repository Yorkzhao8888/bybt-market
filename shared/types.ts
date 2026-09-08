// X-Market 五域集市系统 · 共享领域类型与常量
// 数据模型四级结构：主体（容器）→ 身份（帽）→ 角色（域角色）→ 交易对象（商品/服务/产能）
// 本文件对齐 ZiwayOS v2.2 拍板定版（X-MARKET-02）

/** 五域交易域标识 */
export type DomainCode = 'E' | 'H' | 'Y' | 'T' | 'DE';

/** 五域域标签（对应五域容器一一映射） */
export type MarketTag =
  | 'E_MARKET' | 'H_MARKET' | 'Y_MARKET' | 'T_MARKET' | 'DE_MARKET';

/** 域元信息 */
export interface DomainMeta {
  code: DomainCode;
  name: string; // 域中文名，如 物资
  marketName: string; // E-Market
  unitCode: string; // 供应帽码，如 EU
  opCode: string; // 经营帽码，如 EDU
  execCode: string; // 执行帽码，如 EDX
  marketTag: MarketTag; // 域标签
  mode: string; // 链路
  tradeCode: string; // 交易单编码前缀，如 EX
  color: string; // 域主题色
  description: string;
}

/** 双入口标识 */
export type Side = 'C' | 'B'; // Mall(C端 CU 消费者) / Market(B端 经营·企业采购中心)

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
  domainTag?: MarketTag; // 五域容器标识（一一映射五域）
}

/** ===== 身份：帽体系 =====
 * 13U 基座帽（09-08 LOCKED）：12U + YU(域主)，PU→TU 合并。
 * 完整基座清单：CU/DU/TU/EU/HU/OU/GU/AU/FU/IU/VU/SU + YU
 * 拍板新增经营帽/执行帽：EDU/TDU（DU 戴域帽，"人不变帽子变"）与 EDX/TDX（经营执行帽 DX 系）
 */
export type UnitRole13 =
  | 'CU' | 'DU' | 'TU' | 'EU' | 'HU' | 'OU' | 'GU'
  | 'AU' | 'FU' | 'IU' | 'VU' | 'SU' | 'YU';

/** 完整帽角色（基座 13U + 经营帽 + 执行帽） */
export type HatRole = UnitRole13 | 'EDU' | 'EDX' | 'TDU' | 'TDX';

/** 帽线：供给 / 经营 / 执行 / 需求 */
export type HatLine = 'supply' | 'ops' | 'exec' | 'demand';

export const HAT_LINE_LABEL: Record<HatLine, string> = {
  supply: '供给线',
  ops: '经营线',
  exec: '执行线',
  demand: '需求线',
};

export const UNIT_ROLE_LABEL: Record<HatRole, string> = {
  CU: '顾客',       // Mall C端消费者
  DU: '门店产能',   // DE 门店供给
  TU: '技术',       // T 技术供给（PU→TU 合并，仍为 13U 一员）
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
  EDU: '物资域经营', // DU 戴 E 域帽（产业经营者·物资域）
  EDX: '物资域执行', // E 域经营执行帽（DX 系，归经营线）
  TDU: '技术域经营', // DU 戴 T 域帽（产业经营者·技术域）
  TDX: '技术域执行', // T 域经营执行帽（DX 系，归经营线）
};

/** 各帽归属线（供给执行 X 系归 YU/HU/EU/TU/DU；经营执行 DX 系归经营线） */
export const HAT_LINE_OF: Record<HatRole, HatLine> = {
  // 供给线
  EU: 'supply', HU: 'supply', YU: 'supply', TU: 'supply', DU: 'supply',
  // 经营线（DU 戴域帽：产业经营者）
  EDU: 'ops', TDU: 'ops',
  // 执行线（DX 系经营执行）
  EDX: 'exec', TDX: 'exec',
  // 需求线
  CU: 'demand', OU: 'demand', GU: 'demand',
  AU: 'demand', FU: 'demand', IU: 'demand', VU: 'demand', SU: 'demand',
};

/** 身份（帽）：挂在容器下的一顶帽（基座 13U + 经营帽 + 执行帽） */
export interface Unit {
  id: string;
  code: string; // 帽码，如 EU-101
  name: string; // 帽名，如 启辰物资
  role: HatRole;
  side: Side; // C/B 端取向
  containerId: string; // 所属主体容器
  domainTags: Array<DomainCode | MarketTag>; // 域降级为标签（含 _MARKET 标签）
  dispatch?: boolean; // 是否为调度身份（HDU/YDU 已并入供应链帽）
  tier: 'L1' | 'L2' | 'L3';
  credit: number;
}

/** ===== 交易对象：摊位（双层） ===== */
export interface Booth {
  id: string;
  code: string; // Booth-E-01
  domain: DomainCode;
  name: string;
  ownerUnitId: string; // 经营帽（B端经营者，E/T 域为 EDU/TDU）
  operatorContainerId: string; // 经营主体容器
  opsUnitId?: string; // 前店对接的经营帽视角（E→EDU / T→TDU）
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

/** ===== 交易单（订单六族 Order Family） =====
 * 订单族由五族扩展为六族：C / D / H / E / Y / T（新增 Order-T，技术采购订单）
 */
export type OrderFamily = 'C' | 'D' | 'H' | 'E' | 'Y' | 'T';
export const ORDER_FAMILY_LABEL: Record<OrderFamily, string> = {
  C: '消费者直购', // C端 CU 消费者
  D: '门店产能采购', // DE 域
  H: '人力采购',   // H 域
  E: '物资采购',   // E 域
  Y: '空间采购',   // Y 域
  T: '技术采购',   // T 域（Order-T 新增）
};

/** 交易单（订单流；D 族为 D-OFD 门店产能履约汇聚码，T 族经 Booth-T → X-OFD 汇聚占位） */
export interface Order {
  id: string;
  type: 'MALL' | 'MARKET'; // 双入口
  family: OrderFamily; // 订单六族
  tradeCode: string; // EX-2024-0001 / D-OFD-2024-0001 / TDX-2024-0001
  domain: DomainCode | null;
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
  hatRole: HatRole | null;
  hat: string; // 显示名
  domainView?: DomainCode; // 登录落到对应域视角
  boothTarget?: string; // 登录后落到的 Booth
  nologin?: boolean;
}

/** 演示账号（C 端 & B 端五域供给帽+经营帽） */
export interface DemoAccount {
  id: string;          // 用于一键登录
  entry: Side;
  hatRole: HatRole;
  containerId: string;
  hatId: string;
  label: string;       // 展示名
  domainView?: DomainCode;
  boothTarget?: string;
  note: string;
}

/** 三流占位（订单流/资源流/资金流） */
export type FlowKind = 'ORDER' | 'RESOURCE' | 'FUND';