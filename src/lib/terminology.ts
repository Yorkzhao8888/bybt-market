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
  XU: { big: '采购方', sys: '企业客户 XU' },
  CU: { big: '买家', sys: '个人客户 CU' },
  YU: { big: '供货商', sys: '供给帽 YU' },
  EU: { big: '供货商', sys: '供给帽 EU' },
  HU: { big: '供货商', sys: '供给帽 HU' },
  TU: { big: '供货商', sys: '供给帽 TU' },
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
  escalation: { big: '大额审批', sys: '超阈值升级审批' },
  inquiry: { big: '采购询价', sys: '询价 RFQ' },
  supplyMall: { big: '供货市场', sys: '采购商城' },
  fulfillment: { big: '交付回执', sys: '履约回执' },
  powerAudit: { big: '操作留痕', sys: '三权审计' },
  workbench: { big: '工作台', sys: '工作台' },
};

export const roleTerm = (hat: string | null | undefined): TermPair =>
  (hat && ROLE_TERMS[hat]) || { big: hat ?? '访客', sys: '未登记身份' };

export const conceptTerm = (key: string): TermPair =>
  CONCEPT_TERMS[key] ?? { big: key, sys: key };
