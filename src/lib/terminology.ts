/**
 * X-Market 双称呼体验方案 v1.1 —— 术语常量表（唯一口径）
 *
 * 规则：
 * - 大号(big) = 市面常态称呼（用户看得懂）；小号(sys) = 系统称呼（DU/VXM/DEX 等帽体系标识）
 * - 展示形态：大号为主、小号弱化为副标（DualTerm 组件）；纯短处用「大号」单显
 * - 治理穿透字段（actor_hat/governor/actor_user）保留系统标识原文，禁止大号化
 * - 新增概念：先入本表，再上 UI；禁止页面写死文案
 */
export interface TermPair {
  big: string;
  sys: string;
}

/** 角色/身份称呼映射 */
export const ROLE_TERMS: Record<string, TermPair> = {
  DU: { big: '店主', sys: '经营者 DU' },
  VXM: { big: '平台监管', sys: '治理者 VXM' },
  VEM: { big: '平台监管', sys: '治理者 VEM' },
  VHM: { big: '平台监管', sys: '治理者 VHM' },
  VYM: { big: '平台监管', sys: '治理者 VYM' },
  VTM: { big: '平台监管', sys: '治理者 VTM' },
  VDM: { big: '经营监管', sys: '治理者 VDM' },
  OU: { big: '组织运营', sys: '组织帽 OU' },
  XU: { big: '采购方', sys: '企业客户 XU' },
  CU: { big: '买家', sys: '个人客户 CU' },
  YU: { big: '供货商', sys: '供给帽 YU' },
  EU: { big: '供货商', sys: '供给帽 EU' },
  HU: { big: '供货商', sys: '供给帽 HU' },
  TU: { big: '供货商', sys: '供给帽 TU' },
  EX: { big: '供货店长', sys: '供给执行帽 EX' },
  EXX: { big: '供货店长', sys: '执行端帽 EXX' },
  DYX: { big: '履约店长', sys: '执行帽 DYX' },
  DHX: { big: '履约店长', sys: '执行帽 DHX' },
  DTX: { big: '履约店长', sys: '执行帽 DTX' },
  DEX: { big: '履约店长', sys: '执行帽 DEX' },
  DCX: { big: '门店店长', sys: '执行帽 DCX' },
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
  supplyInbox: { big: '供货收件箱', sys: '供给方收件（仅本铺）' },
  /* X-MARKET-ROLE-01 角色界面归位（A 批） */
  duChild: { big: '店主', sys: '*DU · 分经营号' },
  /* V/D 双系定位（2026-09-10 补充澄清）：V 系=生态方（平台方）运营，D 系=经营体系 */
  vuRoot: { big: '平台方运营', sys: 'VU · 总运营' },
  vuChild: { big: '生态方域运营', sys: 'V*U · 域运营分身' },
  governMarket: { big: '经营治理', sys: '经营管理治理 VDM' },
  governSupplyView: { big: '四源治理台', sys: 'V*M 家族分源治理' },
  ofdCenter: { big: '履约中心', sys: 'X-OFD 只读接入 · 模拟契约期' },
};

/** 分经营号域对照（2026-09-10 定版·补充澄清）：星号=域字母变量记号，实例化不带星号（YDU/EDU/DCU/HDU/TDU）；模板总称 *DU 保留星号；替代原 D*U 实例写法（DYU/DEU 等）。D 系=经营体系（可直营/加盟/合伙） */
export const DU_CHILD_BY_DOMAIN: Record<string, string> = {
  Y: 'YDU · 智场经营',
  E: 'EDU · 产品经营',
  DE: 'EDU · 产品经营',
  H: 'HDU · 人资经营',
  T: 'TDU · 技术经营',
  C: 'DCU · 客户经营',
};

/** 分经营号展示：有域视角给范畴形式（如 EDU · 产品经营），无域兜底通用 *DU · 分经营号（模板总称） */
export const duChildTermOf = (domainView: string | null | undefined): string =>
  (domainView && DU_CHILD_BY_DOMAIN[domainView]) || '*DU · 分经营号';

/** V/D 双系定位（2026-09-10 补充澄清）：V 系列=生态方（平台方）运营体系（VU 总运营 → V*U 域运营分身）；D 系列=经营体系。实例化同口径去星号（VYU/VEU/VHU/VTU/VCU） */
export const VU_CHILD_BY_DOMAIN: Record<string, string> = {
  Y: 'VYU · 智场域运营',
  E: 'VEU · 产品域运营',
  DE: 'VEU · 产品域运营',
  C: 'VCU · 客户域运营',
  H: 'VHU · 人资域运营',
  T: 'VTU · 技术域运营',
};

/** 生态方域运营展示：有域给范畴形式（如 VYU · 智场域运营），无域兜底 V*U 模板总称 */
export const vuChildTermOf = (domainView: string | null | undefined): string =>
  (domainView && VU_CHILD_BY_DOMAIN[domainView]) || 'V*U · 生态方域运营';

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

export const conceptTerm = (key: string): TermPair =>
  CONCEPT_TERMS[key] ?? { big: key, sys: key };

export const statusTerm = (status: string): TermPair =>
  STATUS_TERMS[status] ?? { big: status, sys: status };
