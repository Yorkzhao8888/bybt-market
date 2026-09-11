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
  unitCode: string; // 供给帽码（源头产能），如 EU
  supplyBoothCode: string; // 供给方实体铺，如 Booth-E
  duBoothCode: string; // DU 经营实体铺，如 Booth-DE（无则空串）
  duExecCode: string; // DU 经营执行帽，如 DEX
  marketTag: MarketTag; // 域标签
  mode: string; // 链路
  tradeCode: string; // 交易单编码前缀，如 EX
  color: string; // 域主题色
  description: string;
  // ===== X-MARKET-04 五大专业市场 =====
  marketTitle: string; // 专业市场标题，如 智场/通货/人资/技术/产品
  opRole: string; // 平台运营方帽，如 VYM/VEM/VHM/VTM/VDM
  projectLine: string; // 项目线，如 YMX/EMX/HMX/TMX/DMX
  ownerRoles: string[]; // 铺主帽（可开铺），如 YU/YDU
  hasFranchise: boolean; // 有无平台加盟（加盟执业帽）
  operationsFamily: string; // 作业系统族：FAB/WH/DL/SVC/LAB
  // ===== X-MARKET-05 三方链路 =====
  clientFace: 'market' | 'mall'; // 该域客户界面：Market(B端 XU) / Mall(C端 CU)
  duCanFranchise: boolean; // DU 是否可加盟开店（E/T 仅平台直营）
}

/** Booth 实体两类（X-MARKET-05 两套系统）：
 * supply = 供给方实体铺（源头产能，归 YU/EU/HU/TU/DU-产品）；
 * du = DU 经营实体铺（组织经营，归 DU，执行帽 DYX/DHX/DTX/DEX/DCX） */
export type BoothKind = 'supply' | 'du';

/** Booth 归属系统：market=铺面层（交易/展示），entity=作业层（经营实体/作业系统） */
export type BoothSystem = 'market' | 'entity';

/** 五大专业市场（Y/E/H/T/DE）主视角（/api/model/markets 单项，服务端口径） */
export interface ProfessionalMarket {
  code: DomainCode;
  marketTitle: string; // 智场/通货/人资/技术/产品
  marketName: string; // Y-Market 等
  name: string; // 空间/物资/人力/技术/产品
  clientFace: 'market' | 'mall'; // 客户界面：Market B 端 / Mall C 端
  supplyBooth: string; // Booth-Y（供给方实体铺前缀）
  supplyOwner: string; // YU（供给铺主帽）
  supplyBoothCodes: string[]; // 已有供给实体铺编码
  duBooth: string; // Booth-DY（DU 经营实体铺前缀）
  duExecHat: string; // DYX（经营执行帽）
  duBoothCodes: string[]; // 已有 DU 经营实体铺编码
  canFranchise: boolean; // Y/H/DE 可加盟；E/T 仅直营
  operatorRole: string; // 平台运营方 V*M
  projectLine: string; // 项目线 *MX
  orderFamily: OrderFamily;
  color: string;
  summary: string; // 专业市场一句话定位
  supplyCount: number;
  duCount: number;
}

/** 铺主内置五大作业系统（拎包经营赋能） */
export interface JobSystem {
  code: 'FAB' | 'WH' | 'DL' | 'SVC' | 'LAB';
  label: string; // 中文名
  scene: string; // 场景说明
}
export const JOB_SYSTEMS: JobSystem[] = [
  { code: 'FAB', label: '制造', scene: '生产/制作作业系统' },
  { code: 'WH', label: '仓储', scene: '库存/仓配作业系统' },
  { code: 'DL', label: '配送', scene: '物流/履约配送系统' },
  { code: 'SVC', label: '服务', scene: '服务/履约作业系统' },
  { code: 'LAB', label: '实验', scene: '研发/测试实验系统' },
];

/** 双入口标识 */
export type Side = 'C' | 'B'; // Mall(C端 CU 消费者) / Market(B端 经营·企业采购中心)

/** ===== 主体：容器模型 ===== */
export type ContainerType = 'XEPZ' | 'XHPZ' | 'XGPZ' | 'XOPZ' | 'XDPZ' | 'XVPZ';
export const CONTAINER_TYPE_LABEL: Record<ContainerType, string> = {
  XEPZ: '企业容器',
  XHPZ: '自然人容器',
  XGPZ: '政府容器',
  XOPZ: '治理容器(OP)',
  XDPZ: '经营户容器',
  XVPZ: '平台容器(VP)',
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
 * X-MARKET-05 定版：
 *  - DU 为唯一经营主体（平台直营或加盟），下辖五执行帽 DYX/DHX/DTX/DEX/DCX
 *  - 取消 YDU/HDU/TDU/EDU 独立执业帽语义；EDX/TDX 由 DX 系五执行帽替代
 */
export type UnitRole13 =
  | 'CU' | 'DU' | 'TU' | 'EU' | 'HU' | 'OU' | 'GU'
  | 'AU' | 'FU' | 'IU' | 'VU' | 'SU' | 'YU';

/** B 端客户帽：XU（采购客户/买家，企业容器 XEPZ 或自然人容器 XHPZ 均可挂，按域细分 XU-Y/E/H/T/DE） */
export type ClientHat = 'XU';

/** 平台运营管理方帽（V*M 管家/统筹系）：VDM=总经营管理执行（X-MARKET-18 v1.2 终版 VXM→VDM→VDM 合并，归 OVM），VEM/VHM/VYM/VTM=域内管家审批，挂平台容器 */
export type OperatorHat = 'VEM' | 'VHM' | 'VYM' | 'VTM' | 'VDM';

/** DU 经营实体五执行帽（DX 系，一一对应 Booth-DY/DH/DT/DE/DC） */
export type DuExecHat = 'DYX' | 'DHX' | 'DTX' | 'DEX' | 'DCX';

/** 供给线执行帽（X-Supply，X-SUPPLY-01 起步：E 域先行）——EX=物资供给执行（Booth-E 驻场）、EXX=Booth-E 执行端（铺内作业） */
export type SupplyExecHat = 'EX' | 'EXX';

/** 完整帽角色（基座 13U + DU 五执行帽 + 供给线执行帽 + 客户帽 XU + 运营管理帽 V*M） */
export type HatRole = UnitRole13 | DuExecHat | SupplyExecHat | ClientHat | OperatorHat;

/** 市场四方角色：客户/供应商/平台加盟商/平台运营管理方 */
export type PartyRole = 'client' | 'supplier' | 'franchiser' | 'operator';

/** 角色所属"线"：供给/经营/执行/需求 */
export type HatLine = 'supply' | 'ops' | 'exec' | 'demand' | 'admin';

export const HAT_LINE_LABEL: Record<HatLine, string> = {
  supply: '供给线',
  ops: '经营线',
  exec: '执行线',
  demand: '需求线',
  admin: '运营线',
};

export const UNIT_ROLE_LABEL: Record<HatRole, string> = {
  CU: '顾客',       // Mall C端消费者
  DU: '经营主体',   // 唯一经营主体（平台直营/加盟），下辖五执行帽
  TU: '技术',       // T 技术供给（源头产能）
  EU: '物资',       // E 物资供给（源头产能）
  HU: '人力',       // H 人力供给（源头产能）
  OU: '组织需求',   // 组织/企业类需求帽
  GU: '政府需求',   // 政府类需求帽
  AU: '资产',       // 资产类帽
  FU: '金融',       // 金融类帽
  IU: '信息',       // 信息类帽
  VU: '车辆',       // 运输车辆类帽
  SU: '服务',       // 综合服务类帽
  YU: '空间·域主',  // Y 空间供给（源头产能），兼作域主
  // DU 经营实体五执行帽（DX 系，归经营线）
  DYX: '空间经营执行', // ↔ Booth-DY（Market）
  DHX: '人力经营执行', // ↔ Booth-DH（Market）
  DTX: '技术经营执行', // ↔ Booth-DT（Market）
  DEX: '产品经营执行', // ↔ Booth-DE（Market）
  DCX: '门店经营执行', // ↔ Booth-DC（Mall）
  // 供给线执行帽（X-Supply 供给四源集市，X-SUPPLY-01：E 域先行，归供给线）
  EX: '物资供给执行',  // Booth-E 驻场执行（启辰物资）
  EXX: 'Booth-E 执行端', // Booth-E 铺内作业执行
  // 市场四方角色补充
  XU: '客户', // B 端采购客户帽（买家，走 Market）
  VEM: '通货市场运营长', VHM: '人资市场运营长', VYM: '智场市场运营长',
  VTM: '技术市场运营长', VDM: '总经营管理执行', // V*M：VDM=总经营管理执行（v1.2 终版合并 VXM/VDM，归 OVM），VEM/VHM/VYM/VTM=域内管家审批
};

/** 各帽归属线（供给/经营执行/需求/运营） */
export const HAT_LINE_OF: Record<HatRole, HatLine> = {
  // 供给线（源头产能）
  EU: 'supply', HU: 'supply', YU: 'supply', TU: 'supply', DU: 'supply',
  // 供给线执行帽（X-Supply，X-SUPPLY-01：E 域先行）
  EX: 'supply', EXX: 'supply',
  // 经营线（DU 下辖五执行帽）
  DYX: 'exec', DHX: 'exec', DTX: 'exec', DEX: 'exec', DCX: 'exec',
  // 需求线
  CU: 'demand', OU: 'demand', GU: 'demand',
  AU: 'demand', FU: 'demand', IU: 'demand', VU: 'demand', SU: 'demand',
  // 客户帽（B 端采购客户）
  XU: 'demand',
  // 运营管理方（平台管家/统筹系）
  VEM: 'admin', VHM: 'admin', VYM: 'admin', VTM: 'admin', VDM: 'admin',
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

/** ===== Booth 实体（X-MARKET-05 两套系统） =====
 * 供给方实体铺（Booth-Y/E/H/T）= 源头产能，归 YU/EU/HU/TU；
 * DU 经营实体铺（Booth-DY/DH/DT/DE/DC）= 组织经营，全部归 DU，执行帽 DYX/DHX/DTX/DEX/DCX。
 * Market 铺面仅引用 Booth 实体（铺面展示/询价报价/合同/订单），不实现作业执行。
 */
export interface Booth {
  id: string;
  code: string; // Booth-E-01 / Booth-DY-01
  domain: DomainCode;
  kind: BoothKind; // supply=供给方实体；du=DU 经营实体
  name: string;
  ownerUnitId: string; // 权属帽：supply=YU/EU/HU/TU；du=DU
  execUnitId?: string; // DU 经营实体对应的执行帽（DYX/DHX/DTX/DEX/DCX）
  operatorContainerId: string; // 经营主体容器
  chain?: string; // 价值链层级：source(源头) / du(经营) / face(铺面)
  mode: string; // 链路
  frontDesc: string; // 售卖面说明（铺面）
  backDesc: string; // 履约面说明（Booth 实体作业系统，占位）
  franchise?: 'direct' | 'franchise'; // DU 经营实体：平台直营 / 加盟
  status: 'open' | 'closed';
  rating: number;
  listingCount: number;
}

/** 货架商品（售卖面前店条目；服务端口径） */
export interface Listing {
  id: string;
  boothId: string;
  domain: DomainCode;
  title: string;
  unit: string; // 计量单位
  priceCents: number; // 分
  tags: string[];
  /** XMK-MALL-RICH-01 扩容字段（可选增量，不破既有模型/契约） */
  category?: 'food' | 'grain' | 'specialty' | 'daily'; // 品类：食品生鲜/粮油调味/地方特产/日用百货
  desc?: string; // 商品描述
  img?: string; // 本地图片资产（/img/mall/*.svg，禁外链）
  stock?: number; // 库存（展示用，真实扣减归 Booth 实体系统）
  supplyBoothId?: string; // 供集映射铺（企业采购动线 buyer initiate 用）
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

/** 交易单（订单流，服务端口径；D 族为 D-OFD 门店产能履约汇聚码） */
export interface Order {
  id: string;
  code: string; // C-2026-0001 / EX-2026-0001 / D-OFD-2026-0001
  family: OrderFamily; // 订单六族
  side: Side; // C=Mall CU / B=Market 企业采购
  boothId: string | null;
  listingId: string | null;
  buyerContainerId: string;
  sellerContainerId: string;
  tradeCode: string;
  /** X-MARKET-15：pending_approval=超阈值待治理审批（V*M 批准后转 pending 生效）/rejected=治理驳回终态 */
  status: 'pending' | 'paid' | 'fulfilling' | 'done' | 'pending_approval' | 'rejected';
  amountCents: number;
  settledAt?: string;
  paid?: boolean;
  note?: string;
  /** X-MARKET-08：DU 采购单关联的合格供应商容器 id（仅 DU 采购单携带；客户订单无此字段） */
  supplierId?: string;
  /** X-MARKET-15：治理审批意见（批准/驳回理由；pending_approval 单审批后回填） */
  approvalNote?: string;
  /** X-MARKET-16：执行帽履约回执（Booth 实体系统契约：actor_user/actor_hat 穿透追责，snake_case 与审计对齐） */
  fulfillments?: FulfillmentReceipt[];
}

/** X-MARKET-16 执行帽履约回执（Booth 实体系统接口契约层：任何作业动作可追溯真实登录人+执行帽） */
export interface FulfillmentReceipt {
  id: string; // fr-1 自增
  order_id: string;
  /** 真实登录人（DU 账号 hatId，穿透字段） */
  actor_user: string;
  /** 实际执行帽（按订单域映射 DYX/DHX/DTX/DEX/DCX，非登录帽 DU） */
  actor_hat: HatRole;
  booth_code: string;
  note: string;
  ts: string;
}

/** 订单装饰行（/api/orders 返回：附带 booth/listing/买卖方名称） */
export interface OrderRow extends Order {
  boothCode: string;
  boothName: string;
  boothKind: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
}

/** B2B 询价→报价→合同→下单（Market 铺面层占位） */
export interface Inquiry {
  id: string;
  code: string; // RFQ-0001
  domain: string;
  boothId: string;
  buyerContainerId: string;
  title: string;
  detail: string;
  status: 'inquiry' | 'quoted' | 'contracted' | 'ordered';
  quoteCents?: number;
  quoteNote?: string;
  contractNo?: string;
  createdAt: string;
}
export type InquiryRow = Inquiry;

/** 运营治理案件（V*M 市场秩序/规则/Booth 供给） */
export interface GovernanceCase {
  id: string;
  domain: string;
  opRole: string;
  kind: string;
  desc: string;
  status: 'open' | 'closed';
}

/** 铺面视图行（Booth 装饰后返回行） */
export interface BoothRow extends Booth {
  marketCode: DomainCode;
  kindLabel: string;
  chainLabel: string;
  ownerRoleLabel: string;
  ownerName: string;
  execHat: HatRole | null;
  execName: string | null;
  jobSystems: JobSystem['code'][];
  franchiseLabel: string;
  projectLine: string;
  operatorRole: string;
  clientFace: 'market' | 'mall';
}

/** 帽视图行（Unit 装饰后） */
export type HatRow = Unit & { line: HatLine | undefined; roleLabel: string };

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
  duChildDomains?: string[]; // X-MARKET-19 复合经营：DU 多挂 *DU 分经营号域列表（纯展示/核算维度，权限链复用 DU 单帽，ERP 只认 DU 主经营号 ERP-HAT-01）
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
  duChildDomains?: string[]; // X-MARKET-19 复合经营：DU 多挂 *DU 分经营号域列表（展示/核算复合维度）
  note: string;
}

/** 三流占位（订单流/资源流/资金流） */
export type FlowKind = 'ORDER' | 'RESOURCE' | 'FUND' | 'INVOICE' | 'AFTER_SALES';

/** 客户界面脱敏露出（X-MARKET-05 补充单2·强隔离+信任锚点）：按域给非价格敏感信任信息 */
export interface TrustExposure {
  quality: string[];      // 质检/认证标识
  originMask: string;     // 脱敏产地（不得含供给方名称）
  serviceLevel: string;   // 服务等级
  leadTime: string;       // 交付时效
  afterSales: string;     // 售后政策（对手=DU）
}

/** DU 采购合同（供给方→DU，仅 DU 经营台/V*M 可见，客户不可见） */
export interface SupplyContract {
  id: string;
  duBoothId: string;      // DU 经营实体铺
  duBoothCode: string;
  supplyBoothCode: string; // 供给方实体铺（DU 可见）
  supplyOwner: string;     // 供给方名称（仅 DU/V*M 可见）
  items: string;
  amountCents: number;
  period: string;
  invoiceFlow: string;     // 发票流：供给方开进项票 → DU 开销售票给客户
}

/* ============ X-MARKET-08 供应商准入 + DU 采购商城 ============ */

/** 供应商准入申请状态：pending 待评估 / approved 合格 / rejected 驳回（可重提） */
export type SupplierAppStatus = 'pending' | 'approved' | 'rejected';

/** 供应商准入登记（供给方提交 → VDM 云中心评估） */
export interface SupplierApplication {
  id: string;
  supplierId: string;        // 供给方容器 id
  boothId: string;           // 名下供给实体铺
  domain: DomainCode;
  categories: string;        // 供货品类
  capacity: string;          // 产能/供货能力
  qualification: string;     // 资质
  priceIntent: string;       // 报价意向
  status: SupplierAppStatus;
  rejectReason?: string;     // 驳回原因（rejected 时必有）
  createdAt: string;
  /** X-MARKET-15 驳回重提计数（每次驳回后重提 +1） */
  resubmitCount?: number;
  /** X-MARKET-15 重提超 3 次升级标记（VYM 复核后续接入，界面提示「升级待复核」） */
  escalated?: boolean;
  supplierName?: string;     // 展示冗余（服务端填充；仅 DU/供给方/V*M 可见，客户不可见）
  boothCode?: string;        // 展示冗余（供给实体铺码）
}

/** 供应商货品（合格供应商上架；仅 DU 采购商城/供给方本人/V*M 可见，客户不可见） */
export interface SupplierProduct {
  id: string;
  supplierId: string;
  boothId: string;
  domain: DomainCode;
  name: string;
  category: string;
  spec: string;
  priceCents: number;
  unit: string;
  stock: number;
  status: 'on' | 'off';      // on 在架 / off 下架（含 VDM 治理下架）
}

/** DU 采购商城行（货品 + 供给方名称，仅对 DU 经营线下发） */
export interface SupplyMallItem extends SupplierProduct {
  supplierName: string;
  boothCode: string;
}

export const TRUST_EXPOSURE: Record<DomainCode, TrustExposure> = {
  E: { quality: ['GB/T 检测合格', 'ISO9001'], originMask: '华东产区', serviceLevel: 'SLA-A（48h 响应）', leadTime: '72h 出仓', afterSales: '由合同对手 DU 承担售后，7 天质量问题包换' },
  H: { quality: ['技能认证库核验', '社保合规'], originMask: '华东人力池', serviceLevel: 'SLA-A（24h 到岗）', leadTime: '48h 组队', afterSales: '由合同对手 DU 承担售后，人员 24h 置换' },
  Y: { quality: ['消防验收', '产权核验'], originMask: '华东园区带', serviceLevel: 'SLA-B（工作日响应）', leadTime: '24h 入驻', afterSales: '由合同对手 DU 承担售后，7 天无理由退租' },
  T: { quality: ['等保二级', '源码托管'], originMask: '华东交付中心', serviceLevel: 'SLA-A（2h 故障响应）', leadTime: '2 周启动', afterSales: '由合同对手 DU 承担售后，90 天质保维护' },
  DE: { quality: ['3C 认证', '批次抽检'], originMask: '华东门店网', serviceLevel: 'SLA-A（24h 上门）', leadTime: '48h 交付', afterSales: '由合同对手 DU 承担售后，门店 15 天退换' },
};

/* ============ X-MARKET-12 三权映射（治-管-办防呆约束） ============ */

/** 权位：govern 治（云审批评估）/ manage 管（经营决策）/ operate 办（作业执行） */
export type PowerBit = 'govern' | 'manage' | 'operate';

/** 动作层级：cloud 云端治理层 / edge 铺面业务层 */
export type PowerTier = 'cloud' | 'edge';

/** 动作作用域：booth 单铺 / cross_tenant 跨租户 / platform 平台 */
export type PowerScope = 'booth' | 'cross_tenant' | 'platform';

/** NONE = 匿名/无帽（登录态必为具体帽）；XU/CU 保留原帽参与 allow/forbid 匹配，管理/治理动作对客户端帽一律 403 */
export type PowerHat = HatRole | 'NONE';

/** 三权映射行：动作 → 权位 → 帽（运行时硬约束来源） */
export interface MarketPowerMapRow {
  action_code: string;
  action_name: string;
  power_bit: PowerBit;
  allow_hats: PowerHat[];
  forbid_hats: PowerHat[];
  tier: PowerTier;
  scope: PowerScope;
  governance: string;      // 治理口径（如 VDM 评估 / 平台治理下架 / 大额升级 V*M）
  escalate_rule: string;   // 升级规则（空=无；大额升级逻辑归 X-MARKET-15）
  enabled: boolean;
}

/** 三权审计（本单建结构+写入通路；查询界面归 X-MARKET-13） */
export interface MarketPowerAuditRow {
  id: string;
  action_code: string;
  power_bit: PowerBit | 'unknown';
  actor_user: string;      // 账号 id（demo id / 匿名 anon）
  actor_hat: PowerHat;     // 规范化帽（客户端帽记 NONE）
  actor_tenant: string;    // 容器 id（租户）
  booth_code: string;      // 关联铺码（可空）
  governor: string;        // 治理位（govern 动作=actor 本身；manage 动作留待升级审批）
  result: 'allowed' | 'denied' | 'escalated';
  detail: string;          // 校验说明（拒绝原因带权位口径）
  ts: string;
}

/** X-MARKET-14 治-管-办运行看板聚合（治位帽 only；数据同源审计表 + 业务 store） */
export interface PowerDashboard {
  volume: { govern: number; manage: number; operate: number };
  volume7d: { govern: number; manage: number; operate: number };
  volume30d: { govern: number; manage: number; operate: number };
  timeliness: {
    approveAvgHours: number | null;
    rejectAvgHours: number | null;
    approveCount: number;
    rejectCount: number;
  };
  coverage: { audited: number; total: number; percent: number };
  todo: { pendingReviews: number; listedProducts: number; governedCount: number };
  generatedAt: string;
}

/** X-MARKET-15 治理阈值配置（规则模块配置存储；采购单笔金额 > procurementAmountCents 时升级 V*M 审批） */
export interface GovernThresholds {
  procurementAmountCents: number;
  updatedAt: string;
  updatedBy: string;
}

/** 帽-权位矩阵（HAT_MATRIX）：交叉校验 market_power_map.allow_hats 的一致性 */
export const HAT_POWER_BITS: Record<PowerHat, PowerBit[]> = {
  VEM: ['govern'], VHM: ['govern'], VYM: ['govern'], VTM: ['govern'], VDM: ['govern'], // VDM=总经营管理执行（v1.2 合并 VXM/VDM）
  DU: ['manage', 'operate'],
  YU: ['manage', 'operate'], EU: ['manage', 'operate'], HU: ['manage', 'operate'], TU: ['manage', 'operate'],
  DYX: ['operate'], DHX: ['operate'], DTX: ['operate'], DEX: ['operate'], DCX: ['operate'],
  // 供给线执行帽（X-Supply 办位，X-SUPPLY-01）
  EX: ['operate'], EXX: ['operate'],
  XU: [], CU: [],
  // 基座其余单元帽（OU/GU/AU/FU/IU/VU/SU）未纳入三权映射，不授任何权位
  OU: [], GU: [], AU: [], FU: [], IU: [], VU: [], SU: [],
  NONE: [],
};

// ============ MARKET-CONN-01：Booth 履约时间线（Market 消费侧展示，server 代理持有 OAS token） ============
/** Booth 端履约节点（placed/accepted/fulfilling/delivered，宽类型防形态漂移） */
export interface BoothFulfillmentNode {
  key: string;
  label: string;
  at: string | null;
  state: string; // done | doing | pending
  actor?: string;
}
/** Booth 端履约单（orderNo 与 Market order.code 透传对齐后自动匹配） */
export interface BoothFulfillmentOrder {
  fulfillmentId: number | string;
  orderNo: string;
  waveNo?: string;
  source?: string; // manual | market（契约单 v1.1 透传来源）
  nodes: BoothFulfillmentNode[];
}
/** GET /api/orders/:id/booth-timeline 响应（代理端点，requireAuth） */
export interface BoothTimelineResp {
  matched: boolean;
  orderCode: string;
  boothOrderNo: string | null;
  timeline: BoothFulfillmentOrder | null;
  deepLink: string;
  fetchedAt: number;
  unreachable?: boolean;
}