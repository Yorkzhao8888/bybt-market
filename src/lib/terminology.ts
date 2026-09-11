/**
 * X-Market 双称呼体验方案 v1.1 —— 术语常量表（唯一口径）
 *
 * 规则：
 * - 大号(big) = 市面常态称呼（用户看得懂）；小号(sys) = 系统称呼（DU/VDM/DEX 等帽体系标识）
 * - 展示形态：大号为主、小号弱化为副标（DualTerm 组件）；纯短处用「大号」单显
 * - 治理穿透字段（actor_hat/governor/actor_user）保留系统标识原文，禁止大号化
 * - 新增概念：先入本表，再上 UI；禁止页面写死文案
 */
export interface TermPair {
  big: string;
  sys: string;
  /** 双身份副身份（X-MARKET-18 增补）：如 XU/CU 第二身份「客户资源供给方」，可缺省；不占权位、不登录操作 */
  sub?: { big: string; sys: string };
}

/** 角色/身份称呼映射 */

/* XMK-CONT-01 容器六类定版（2026-09-11）：X?PZ 全谱，简称规则 X?PZ→?P（XHPZ→HP） */
export const CONTAINER_TERMS: Record<string, { code: string; short: string; big: string; sys: string; reserved?: boolean }> = {
  hp: { code: '#xhpz', short: 'HP', big: '个人容器', sys: 'XHPZ · 自然个人' },
  ep: { code: '#xepz', short: 'EP', big: '企业容器', sys: 'XEPZ · 自然企业' },
  dp: { code: '#xdpz', short: 'DP', big: '经营户容器', sys: 'XDPZ · 生态方经营户' },
  vp: { code: '#xvpz', short: 'VP', big: '平台容器', sys: 'XVPZ · 生态方平台', reserved: true },
  op: { code: '#xopz', short: 'OP', big: '治理容器', sys: 'XOPZ · 生态方治理', reserved: true },
  gp: { code: '#xgpz', short: 'GP', big: '政府容器', sys: 'XGPZ · 政府', reserved: true },
};

/* XMK-CONT-01 Booth 六形态中文定名（2026-09-11 凌晨拍板）：尾字字辈 店-台-厂-室-部-场 */
export const BOOTH_FORM_TERMS: Record<string, { en: string; code: string; big: string; sys: string }> = {
  xshop: { en: 'X-Shop', code: 'Booth-CDP', big: '零售店', sys: 'X-Shop · 零售店（店）· Booth-CDP' },
  xdomain: { en: 'X-Domain', code: 'Booth-DDP', big: '项目台', sys: 'X-Domain · 项目台（台）· Booth-DDP' },
  xfactory: { en: 'X-Factory', code: 'Booth-EDP', big: '制造厂', sys: 'X-Factory · 制造厂（厂）· Booth-EDP' },
  xlab: { en: 'X-Lab', code: 'Booth-TDP', big: '研发室', sys: 'X-Lab · 研发室（室）· Booth-TDP' },
  xmate: { en: 'X-Mate', code: 'Booth-HDP', big: '人事部', sys: 'X-Mate · 人事部（部）· Booth-HDP' },
  xplaz: { en: 'X-Plaz', code: 'Booth-YDP', big: '空间场', sys: 'X-Plaz · 空间场（场）· Booth-YDP' },
};

/* ==========================================================================
 * XMK-STRUCT-01 集市三层结构定版 v1.4（2026-09-11 主人契约：集市三分）
 * 契约原件（主 Agent 侧）：集市三层结构定版v1_20260911.md / Ziway_Market_API协议v1_20260911.md
 * 三层 = 客集 X-Customer（谁在买）/ 集市 X-Market（在哪成交）/ 供集 X-Supply（谁在卖）
 * 界面零帽名：本表 big 全部为市面称呼，sys 保留系统代码
 * ========================================================================== */

/** 集市三层模块定义 */
export interface LayerTerm {
  key: string;
  /** 系统代码：X-Customer / X-Market / X-Supply */
  code: string;
  /** 大号：客集 / 集市 / 供集 */
  big: string;
  /** 小号副标 */
  sys: string;
  /** 一句话定位（谁在买/在哪成交/谁在卖） */
  pos: string;
  /** 图标 lucide 名（导航区渲染用） */
  icon: 'users' | 'store' | 'package';
}

export const MARKET_LAYERS: Record<string, LayerTerm> = {
  customer: {
    key: 'customer',
    code: 'X-Customer',
    big: '客集',
    sys: 'X-Customer · 客户集市',
    pos: '谁在买——客户进店选货，需求从这里进来',
    icon: 'users',
  },
  market: {
    key: 'market',
    code: 'X-Market',
    big: '集市',
    sys: 'X-Market · 通货集市',
    pos: '在哪成交——询价报价签约下单，交易在这里完成',
    icon: 'store',
  },
  supply: {
    key: 'supply',
    code: 'X-Supply',
    big: '供集',
    sys: 'X-Supply · 供给集市',
    pos: '谁在卖——供给方摆货上架，货源从这里进来',
    icon: 'package',
  },
};

/** 三层模块词条：key 未命中返回 undefined（调用方自行兜底） */
export const layerTerm = (key: string): LayerTerm | undefined => MARKET_LAYERS[key];

/** XMK-STRUCT-01 资源集别名表（322 全景图 v3 终版）：一客集挂 CRM；四供集挂 SCM/TAMS/HRM/FAMS */
export const RESOURCE_SET_TERMS: Record<
  string,
  { alias: string; layer: 'customer' | 'supply'; domain: string; big: string; sys: string }
> = {
  crm: { alias: 'CRM', layer: 'customer', domain: 'C', big: '客户资源', sys: 'CRM · 客集 X-Customer（客域 C）' },
  scm: { alias: 'SCM', layer: 'supply', domain: 'E', big: '供应链', sys: 'SCM · 供集 X-Supply（供域 E）' },
  tams: { alias: 'TAMS', layer: 'supply', domain: 'T', big: '技术资产', sys: 'TAMS · 供集 X-Supply（技域 T）' },
  hrm: { alias: 'HRM', layer: 'supply', domain: 'H', big: '人力资源', sys: 'HRM · 供集 X-Supply（人域 H）' },
  fams: { alias: 'FAMS', layer: 'supply', domain: 'Y', big: '场地资产', sys: 'FAMS · 供集 X-Supply（场域 Y）' },
};

/** 按层取资源集别名（customer→CRM；supply→SCM/TAMS/HRM/FAMS；market 层无别名） */
export const resourceSetsOfLayer = (layer: string) =>
  Object.values(RESOURCE_SET_TERMS).filter((r) => r.layer === layer);

/* XMK-STRUCT-01 Plat 族定名（322 全景图 v3 终版别名）：集市域内六大 Plat，模块≠客户端 */
export const PLAT_TERMS: Record<
  string,
  { plat: string; market: string; domain: string; big: string; sys: string; route?: string }
> = {
  mall: {
    plat: 'X-Mall',
    market: 'C-Market',
    domain: 'C',
    big: '商城',
    sys: 'X-Mall = C-Market · 客域通货集市',
    route: '/mall',
  },
  goods: {
    plat: 'X-Goods',
    market: 'E-Market',
    domain: 'E',
    big: '通货集市',
    sys: 'X-Goods = E-Market · 供域通货集市',
    route: '/goods',
  },
  tech: {
    plat: 'X-Tech',
    market: 'T-Market',
    domain: 'T',
    big: '技术集市',
    sys: 'X-Tech = T-Market · 技域集市',
  },
  cajob: {
    plat: 'X-Cajob',
    market: 'H-Market',
    domain: 'H',
    big: '人事集市',
    sys: 'X-Cajob = H-Market · 人域集市',
  },
  jezoom: {
    plat: 'X-Jezoom',
    market: 'Y-Market',
    domain: 'Y',
    big: '空间集市',
    sys: 'X-Jezoom = Y-Market · 场域集市',
  },
  ofd: {
    plat: 'X-OFD',
    market: '履约中心 Plat',
    domain: '-',
    big: '履约中心',
    sys: 'X-OFD · 履约中心 Plat',
  },
};

/** Plat 词条：key 未命中返回 undefined */
export const platTerm = (key: string): (typeof PLAT_TERMS)[string] | undefined => PLAT_TERMS[key];

/* XMK-GOV-01 市管方角色表（集市三层结构定版 v1.1 第四视角：市场管理方 = XVPZ 平台方，分治制）
   仅已裁定 Plat 开治理口——E 域 X-Goods/E-Market → VEM 打样；其余 Plat 未裁定，不开治理口 */
export const MARKET_GOVERNORS: Record<
  string,
  { big: string; sys: string; plat: string; market: string; pos: string; enabled: boolean }
> = {
  vem: {
    big: '市管方',
    sys: 'XVPZ#VEM',
    plat: 'X-Goods',
    market: 'E-Market',
    pos: '市场管理方——入驻准入、供给秩序与经营监察（E-Market 打样）',
    enabled: true,
  },
};

/** 市管方词条：platKey 未命中或未裁定返回 undefined */
export const governorTerm = (platKey: string): (typeof MARKET_GOVERNORS)[string] | undefined => {
  const g = MARKET_GOVERNORS[platKey];
  return g && g.enabled ? g : undefined;
};
export const ROLE_TERMS: Record<string, TermPair> = {
  DU: { big: '店主', sys: '经营者 DU' },
  // X-MARKET-18 v1.2 终版：VXM→VMX→VDM 合并（总经营管理执行，归 OVM）；FMX 总财执行归 OFM（预留，ERP 高频角色）；域内管家审批仍 V*M 系（v4.8 V*U 内嵌管家，不进 ERP）
  VEM: { big: '管家审批', sys: 'EMX · 管家审批（域内）' },
  VHM: { big: '管家审批', sys: 'HMX · 管家审批（域内）' },
  VYM: { big: '管家审批', sys: 'YMX · 管家审批（域内）' },
  VTM: { big: '管家审批', sys: 'TMX · 技术运营管理（白名单兼任，域内）' },
  VDM: { big: '总经营管理执行', sys: 'VDM' },
  OU: { big: '组织运营', sys: '组织帽 OU' },
  XU: { big: '采购方', sys: '企业客户 XU', sub: { big: '客户资源供给方', sys: 'B端客户资源 · 授权式贡献（不占权位）' } },
  CU: { big: '买家', sys: '个人客户 CU', sub: { big: '客户资源供给方', sys: 'C端客户资源 · 授权式贡献（不占权位）' } },
  YU: { big: '供货商', sys: '供给帽 YU' },
  EU: { big: '供货商', sys: '供给帽 EU' },
  HU: { big: '供货商', sys: '供给帽 HU' },
  TU: { big: '供货商', sys: '供给帽 TU' },
  EX: { big: '供货店长', sys: '供给执行帽 EX' },
  EXX: { big: '供货店长', sys: '执行端帽 EXX' },
  DYX: { big: '履约店长', sys: '执行细化 YDX' },
  DHX: { big: '履约店长', sys: '执行细化 HDX' },
  DTX: { big: '履约店长', sys: '执行细化 TDX' },
  DEX: { big: '履约店长', sys: '执行细化 EDX' },
  DCX: { big: '门店店长', sys: '执行细化 CDX' },
};

/** 业务概念称呼映射（系统称呼 → 市面常态） */
export const CONCEPT_TERMS: Record<string, TermPair> = {
  booth: { big: '店铺', sys: '铺面 Booth' },
  product: { big: '商品', sys: '货品' },
  audit: { big: '留痕台账', sys: '审计' },
  powerAudit: { big: '留痕台账', sys: '三权审计' },
  escalation: { big: '大额审批', sys: '超阈值升级审批' },
  inquiry: { big: '采购询价', sys: '询价 RFQ' },
  supplyMall: { big: '供货市场', sys: '采购商城' },
  fulfillment: { big: '交付回执', sys: '履约回执' },
  workbench: { big: '工作台', sys: '工作台' },
  /* X-MARKET-UE-02 客户双称呼试行 */
  admission: { big: '准入合格', sys: '平台直营准入' },
  admissionJoin: { big: '加盟准入', sys: '加盟资质核验' },
  progress: { big: '采购进度', sys: '询价→报价→合同→下单→交付' },
  myOrders: { big: '我的采购单', sys: '交易单' },
  buyNow: { big: '立即购买', sys: 'C 端直购' },
  search: { big: '搜索', sys: '全局检索' },
  /* X-Supply 供给四源集市（X-SUPPLY-01） */
  supplyHub: { big: '供给集市', sys: 'X-Supply 供给面' },
  supplyRegister: { big: '入驻登记', sys: 'Booth-E 入驻' },
  supplyMaintain: { big: '店铺维护', sys: '铺面维护' },
  supplyEntry: { big: '入驻记录', sys: '登记台账' },
  supplySource: { big: '货源', sys: '供给源 Booth-E' },
  /* X-SUPPLY-02 供给单体系 */
  supplyOrder: { big: '供货单', sys: 'X-Supply 供给单 XS' },
  // 客户资源供给（X-MARKET-18 增补）：需求侧资源，与供给四源严格区分；源头侧=XU/CU 客户本体，管理侧=VCU 平台方运营
  custResource: { big: '客户资源供给', sys: '需求侧资源（客户/流量/需求线索）· 授权式/贡献式，不占权位、不登录操作；区别于供给四源 EU 物资/YU 空间/HU 人力/TU 技术' },
  supplyInbox: { big: '供货收件箱', sys: '供给方收件（仅本铺）' },
  fmx: { big: '总财执行', sys: 'FMX · 归 OFM（ERP 高频角色；总财执行，概念预留不建真帽）' },
  /** X-MARKET-18 v1.2：V*M 管家（术语表 v4.8）= V*U 内嵌管家，域内审批、不独立进 ERP */
  guanjia: {
    big: 'V*M 管家',
    sys: 'V*U 内嵌管家（VTM/VEM/VCM/VHM/VYM）· 域内审批不进 ERP；VDU 激活（VDM 主业管家先行归 VDU），VEU/VCU/VTU 未激活',
  },
  /* X-MARKET-ROLE-01 角色界面归位（A 批） */
  duChild: { big: '店主', sys: '*DU · 分经营号' },
  /* V/D 双系定位（2026-09-10 补充澄清）：V 系=生态方（平台方）运营，D 系=经营体系 */
  vuRoot: { big: '平台方运营', sys: 'VU · 总运营' },
  vuChild: { big: '生态方域运营', sys: 'V*U · 域运营分身' },
  governMarket: { big: '经营治理', sys: '经营管理治理 VDM' },
  governSupplyView: { big: '四源治理台', sys: 'V*M 家族分源治理' },
  ofdCenter: { big: '履约中心', sys: 'X-OFD 只读接入 · 模拟契约期' },
  // XMK-GOV-01：市管方治理面（XVPZ#VEM，E-Market 打样）
  governanceDesk: { big: '市管台', sys: 'XVPZ · 市管方治理面' },
  vendorAudit: { big: '入驻审核', sys: '准入状态机 pending→approved⇄frozen' },
  supplyWatch: { big: '供给单监察', sys: '全域只读 · 状态分布聚合' },
  boothTimeline: { big: '履约时间线', sys: 'Booth · 履约四节点' },
  /* 命名体系 v1.2：执行双线 + 事业部壳 */
  execDualLine: { big: '执行双线', sys: '*MXX 运营（权限链 L2）· DXX 业务细化（权限链 L1）' },
  vduShell: { big: '产品事业部全域壳', sys: 'VDU · 整合六类（DDU 直属 / 五域引用 VDU::EDU）' },
  /* X-MARKET-TI-05 用户教育训练（新手引导） */
  onboarding: { big: '新手引导', sys: 'Onboarding · 分步教学向导' },
  /* XMK-CRM-UI-01：客集工作台（X-Customer 客户集市，CU 全功能面；F1-F5 区块名词典化） */
  customerWorkbench: { big: '客集工作台', sys: 'X-Customer · 客户集市' },
  customerDemand: { big: '需求单', sys: 'XCD · X-Customer 需求单' },
  customerIntent: { big: '采购意向', sys: 'XCI · X-Customer 采购意向' },
  customerProfile: { big: '客户档案', sys: 'CRM 档案 · OAS 派生只读' },
  customerTimeline: { big: '供给单时间线', sys: 'X-Supply · 买家视角' },
};

/** 分经营号域对照（命名体系 v1.2 定版）：经营单元统一「域字母+D+U」，六类 DDU（主业）/YDU/EDU/CDU/HDU/TDU；模板总称 *DU 保留星号；旧 D*U 实例写法（DYU/DEU/DCU 等）废除 */
export const DU_CHILD_BY_DOMAIN: Record<string, string> = {
  D: 'DDU · 主业经营',
  Y: 'YDU · 智场经营',
  E: 'EDU · 产品经营',
  DE: 'EDU · 产品经营',
  H: 'HDU · 人资经营',
  T: 'TDU · 技术经营',
  C: 'CDU · 客户经营',
};

/** 分经营号展示：有域视角给范畴形式（如 EDU · 产品经营），无域兜底通用 *DU · 分经营号（模板总称） */
export const duChildTermOf = (domainView: string | null | undefined): string =>
  (domainView && DU_CHILD_BY_DOMAIN[domainView]) || '*DU · 分经营号';

/** X-MARKET-19 复合经营：DU 多挂 *DU 分经营号域列表 → 徽章组（纯展示/核算维度；权限链复用 DU 单帽三权 checkPower/审计，不重复加帽） */
export interface DuChildBadge { domain: string; term: string }

export const duChildDomainsOf = (domains?: string[] | null): DuChildBadge[] =>
  (domains ?? []).filter((d): d is string => !!d && !!DU_CHILD_BY_DOMAIN[d]).map((d) => ({ domain: d, term: DU_CHILD_BY_DOMAIN[d] }));

/** 复合经营号串（多挂给「EDU · 产品经营 / HDU · 人资经营」式串），无多挂回空串（调用方回退 duChildTermOf 单域口径） */
export const duChildBadgeTextOf = (domains?: string[] | null): string =>
  duChildDomainsOf(domains).map((b) => b.term).join(' / ');

/** V/D 双系定位（命名体系 v1.2）：V 系列=生态方（平台方）运营体系（VU 总运营 → V*U 域运营分身）；D 系列=经营体系。V 系无 VTU/VOU——技术域运营由 VTM（技术运营管理）兼任白名单承担 */
export const VU_CHILD_BY_DOMAIN: Record<string, string> = {
  Y: 'VYU · 智场域运营',
  E: 'VEU · 产品域运营',
  DE: 'VEU · 产品域运营',
  C: 'VCU · 客户域运营',
  H: 'VHU · 人资域运营',
};

/** 生态方域运营展示：有域给范畴形式（如 VYU · 智场域运营），无域兜底 V*U 模板总称 */
export const vuChildTermOf = (domainView: string | null | undefined): string =>
  (domainView && VU_CHILD_BY_DOMAIN[domainView]) || 'V*U · 生态方域运营';

/** 执行层展示名映射（命名体系 v1.2，仅展示层）：旧 D*X 前缀式帽 ID → 域字母在前的 DXX 系展示名（DYX→YDX / DEX→EDX / DCX→CDX / DHX→HDX / DTX→TDX；O 域预留 ODX）。
 *  红线：帽 ID/权限逻辑/审计字段不动——穿透字段（actor_hat 等）仍显示帽 ID 原文，本映射仅用于徽标与说明文案 */
export const EXEC_DISPLAY_OF: Record<string, string> = {
  DYX: 'YDX',
  DEX: 'EDX',
  DCX: 'CDX',
  DHX: 'HDX',
  DTX: 'TDX',
};

/** 帽展示名：*DX 系给 DXX 展示名（如 DYX→YDX），其余原样返回 */
export const hatDisplayOf = (hat: string | null | undefined): string =>
  (hat && EXEC_DISPLAY_OF[hat]) || hat || '';

/** 订单状态称呼映射（X-MARKET-UE-02：大号=客户视角市面称呼，小号=系统状态口径） */
export const STATUS_TERMS: Record<string, TermPair> = {
  pending: { big: '待交付', sys: '待履约' },
  paid: { big: '已付款', sys: '已支付' },
  fulfilling: { big: '交付中', sys: '履约中' },
  done: { big: '已完成', sys: '已完成' },
  pending_approval: { big: '大额审批中', sys: '待治理审批' },
  rejected: { big: '已驳回', sys: '已驳回' },
};

export const roleTerm = (hat: string | null | undefined): TermPair =>
  (hat && ROLE_TERMS[hat]) || { big: hat ?? '访客', sys: '未登记身份' };

/** 双身份副称呼（X-MARKET-18 增补）：XU/CU 第二身份「客户资源供给方」；无 sub 返回 undefined（代码与权位不动，纯术语层） */
export const roleSubTermOf = (hat: string | null | undefined): TermPair['sub'] =>
  (hat && ROLE_TERMS[hat]?.sub) || undefined;

export const conceptTerm = (key: string): TermPair =>
  CONCEPT_TERMS[key] ?? { big: key, sys: key };

export const statusTerm = (status: string): TermPair =>
  STATUS_TERMS[status] ?? { big: status, sys: status };
