// 域/角色前端映射（X-MARKET-05 三方链路与 Booth 权属定版）
// 两套系统：Market=铺面层（交易平台，不经营/不持资源/不执行作业）；Booth 实体=作业层（经营实体+五作业系统）。
// 价值链：供给方 Booth-Y/E/H/T（源头产能）→ DU 经营实体 Booth-DY/DH/DT/DE/DC（组织经营）→ Market/Mall（客户界面）。
// 客户双身份（X-MARKET-18 增补）：XU/CU 主身份=采购/消费（B/C 端），第二身份=客户资源供给方（源头侧 · 授权式贡献不占权位）；VCU=平台方运营客户资源（管理侧）。

import { UNIT_ROLE_LABEL } from '../../shared/types';
import type { HatRole } from '../../shared/types';

export const DOMAIN_ORDER: string[] = ['Y', 'E', 'H', 'T', 'DE'];

export const MARKET_TITLES: Record<string, string> = {
  Y: '智场',
  E: '通货',
  H: '人资',
  T: '技术',
  DE: '产品',
};

export const DOMAIN_COLORS: Record<string, string> = {
  E: '#C27A1B',
  H: '#E4572E',
  Y: '#17A290',
  T: '#4A5FD5',
  DE: '#D6366E',
};

export const DOMAIN_NAMES: Record<string, string> = {
  E: '物资',
  H: '人力',
  Y: '空间',
  T: '技术',
  DE: '门店产能',
};

/** 供给方实体铺（源头产能）权属帽 */
export const SUPPLY_OWNER: Record<string, string> = {
  Y: 'YU', E: 'EU', H: 'HU', T: 'TU',
};
/** DU 经营实体铺执行帽（一一对应 Booth-DY/DH/DT/DE/DC） */
export const DU_EXEC_HAT: Record<string, string> = {
  Y: 'DYX', H: 'DHX', T: 'DTX', DE: 'DEX',
};
export const EXEC_HAT_TO_BOOTH: Record<string, string> = {
  DYX: 'Booth-DY', DHX: 'Booth-DH', DTX: 'Booth-DT', DEX: 'Booth-DE', DCX: 'Booth-DC',
};
/** 可加盟域：Y/H/DE；E/T 仅平台直营 */
export const FRANCHISE_DOMAINS = ['Y', 'H', 'DE'];

/** 角色 → 三方角色（下游客户/中游经营/上游供给/平台运营） */
export const PARTY_OF_ROLE: Record<string, string> = {
  // 客户（下游）
  XU: '客户', CU: '客户',
  // 经营（中游，DU 唯一主体）
  DU: '经营', DYX: '经营', DHX: '经营', DTX: '经营', DEX: '经营', DCX: '经营',
  // 供给（上游，源头产能）
  EU: '供给', HU: '供给', YU: '供给', TU: '供给',
  // 平台运营管理方
  VEM: '运营管理方', VHM: '运营管理方', VYM: '运营管理方', VTM: '运营管理方', VDM: '运营管理方',
  OU: '组织管理',
};
export const PARTY_LIST = ['客户', '经营', '供给', '运营管理方', '组织管理'];
export const partyOfRole = (r: string): string => PARTY_OF_ROLE[r] ?? '其他';
export const PARTY_COLORS: Record<string, string> = {
  客户: '#4A5FD5',
  经营: '#D6366E',
  供给: '#C27A1B',
  运营管理方: '#17A290',
  组织管理: '#6b665a',
  其他: '#999',
};
export const partyOf = (role: string): string => PARTY_OF_ROLE[role] ?? '组织管理';

/** 是否客户（下游买家，只读）：CU/XU */
export const isClientRole = (role: string | null | undefined): boolean => role === 'CU' || role === 'XU';
/** 是否运营管理方 */
export const isAdminRole = (role: string | null | undefined): boolean =>
  role === 'VEM' || role === 'VHM' || role === 'VYM' || role === 'VTM' || role === 'VDM';
/** 是否经营/供给（可开铺操作） */
export const isOperatorRole = (role: string | null | undefined): boolean => {
  if (!role) return false;
  return ['DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'EU', 'HU', 'YU', 'TU', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM'].includes(role);
};

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: '#b8862b' },
  paid: { label: '已支付', color: '#17a290' },
  fulfilling: { label: '履约中', color: '#4a5fd5' },
  done: { label: '已完成', color: '#6b665a' },
};

export const JOB_SYSTEM_LABEL: Record<string, string> = {
  FAB: '制造', WH: '仓储', DL: '配送', SVC: '服务', LAB: '实验',
};

/* ============ 通用辅助（页面视图层） ============ */
export const PRO_MARKET_ORDER = DOMAIN_ORDER;
export const colorOf = (code: string | null | undefined): string =>
  (code && DOMAIN_COLORS[code]) || '#17181d';
export const marketLabel = (code: string | null | undefined): string =>
  code ? `Market-${code}·${MARKET_TITLES[code] ?? DOMAIN_NAMES[code] ?? ''}` : '—';
export const jobSystemName = (code: string): string => JOB_SYSTEM_LABEL[code] ?? code;
export const kindLabelSafe = (kind: string | null | undefined): string =>
  kind === 'supply' ? '供给方实体' : kind === 'du' ? 'DU 经营实体' : '—';
export const hatLabel = (role: string | null | undefined): string => {
  if (!role) return '未激活';
  return UNIT_ROLE_LABEL[role as HatRole] ?? role;
};
export const roleLabel = hatLabel;
/** 可经营/操作（非客户）：DU/执行帽/供给帽/运营方 */
export const canOperate = isOperatorRole;
/** 是否可操作该铺：必须是经营/供给身份，且为该铺权属帽本人（跨主体=越权，P5） */
export const canOperateBooth = (
  role: string | null | undefined,
  hatId: string | null | undefined,
  ownerUnitId: string | null | undefined,
): boolean => canOperate(role) && !!hatId && hatId === ownerUnitId;
/** 开新铺约束（P5）：supply 仅该域供给帽；du 仅 DU（Y/H/DE 可加盟，E/T 仅直营） */
export const canOpenMarket = (
  marketCode: string,
  kind: 'supply' | 'du',
  role: string | null | undefined,
): boolean => {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  if (kind === 'supply') return SUPPLY_OWNER[marketCode] === role;
  return role === 'DU';
};

/* ============ X-MARKET-09 四类角色工作台 ============ */
/** X-MARKET-ROLE-01 工作台五类：governSupply=域内管家审批（V*M 家族，supply 面，X-MARKET-18）；govern=经营治理（VDM 专属，market 面） */
export type WorkbenchKind = 'client' | 'supplier' | 'operator' | 'govern' | 'governSupply';

const WORKBENCH_SUPPLY_HATS = ['EU', 'HU', 'YU', 'TU', 'EX', 'EXX'];
const WORKBENCH_OPERATOR_HATS = ['DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX'];
/** V*M 管家审批家族（X-MARKET-18 v1.2 终版）：落 supply 审批视图（VEM/VYM/VHM/VTM 各审本源；VDM 总经营管理执行统筹全域） */
const WORKBENCH_GOVERN_SUPPLY_HATS = ['VEM', 'VHM', 'VYM', 'VTM'];

/* ============ X-MARKET-ROLE-01 治理分线（前端口径，与 server/domainConfig 对齐） ============ */
/** 管家审批家族 → 本源域映射（X-MARKET-18：VEM 审 E/VYM 审 Y/VHM 审 H/VTM 审 T）；VDM 统筹全域返回 null（v1.2 合并口径） */
const GOVERN_SUPPLY_DOMAIN_OF: Partial<Record<string, string>> = { VEM: 'E', VYM: 'Y', VHM: 'H', VTM: 'T' };
export const supplyGovernDomainOf = (role: string | null | undefined): string | null =>
  role ? GOVERN_SUPPLY_DOMAIN_OF[role] ?? null : null;
/** supply 面治理席位（前端）：VDM 统筹 + 四家族（v1.2 终版；workbenchOf 中 VDM 仍落 /govern 经营治理大本营） */
export const isSupplyGovernHat = (role: string | null | undefined): boolean =>
  role === 'VDM' || (!!role && (WORKBENCH_GOVERN_SUPPLY_HATS as readonly string[]).includes(role));

/** 角色类别映射：客户/供应商/经营者/治理者（治理分线：V*M 家族→supply 面，VDM→market 面） */
export const workbenchOf = (role: string | null | undefined): WorkbenchKind => {
  const r = role ?? '';
  if (r === 'XU' || r === 'CU') return 'client';
  if (WORKBENCH_SUPPLY_HATS.includes(r)) return 'supplier';
  if (WORKBENCH_OPERATOR_HATS.includes(r)) return 'operator';
  if (WORKBENCH_GOVERN_SUPPLY_HATS.includes(r)) return 'governSupply';
  if (isAdminRole(r)) return 'govern';
  return 'client';
};

export const WORKBENCH_HOME: Record<WorkbenchKind, string> = {
  client: '/market',
  // X-SUPPLY-01：供给面登录落点迁至供给四源集市 /supply；/supplier 保留渲染供给工作台（旧链兼容不 404）
  supplier: '/supply',
  operator: '/operator',
  govern: '/govern',
  // X-MARKET-ROLE-01：V*M 四源家族落 supply 治理视图；VDM 独占 /govern（market 经营治理）
  governSupply: '/supply',
};

export interface WorkbenchTheme {
  kind: WorkbenchKind;
  label: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  desc: string;
}

export const WORKBENCH_THEME: Record<WorkbenchKind, WorkbenchTheme> = {
  client: { kind: 'client', label: '客户工作台', accent: '#1D4ED8', accentSoft: '#e8eefb', accentText: '#1e40af', desc: '采购信任 · 浏览引导' },
  supplier: { kind: 'supplier', label: '供应商工作台', accent: '#15803D', accentSoft: '#e8f5ec', accentText: '#166534', desc: '源头供给 · 业务操作' },
  operator: { kind: 'operator', label: '经营者工作台', accent: '#B45309', accentSoft: '#fbf0e0', accentText: '#92400e', desc: '经营活力 · 驾驶舱' },
  // X-MARKET-ROLE-01 治理分线：govern=VDM 经营治理（market 面）；governSupply=V*M 家族域内管家审批（supply 面，X-MARKET-18）
  govern: { kind: 'govern', label: '经营治理工作台', accent: '#6D28D9', accentSoft: '#f0e9fc', accentText: '#5b21b6', desc: '经营管理治理 · 市场秩序/全局总账' },
  governSupply: { kind: 'governSupply', label: '管家审批工作台', accent: '#6D28D9', accentSoft: '#f0e9fc', accentText: '#5b21b6', desc: 'V*M 家族 · 域内管家审批（准入/货品/大额，X-MARKET-18）' },
};

export const workbenchThemeOf = (role: string | null | undefined): WorkbenchTheme =>
  WORKBENCH_THEME[workbenchOf(role)];

/* ============ X-MARKET-UE-01 状态彩色徽标 ============ */
export interface OrderStatusMeta {
  label: string;
  color: string;
  bg: string;
}

/** 状态统一口径：绿=完成 / 灰棕=待处理 / 蓝=履约中 / 紫=待治理审批 / 红=驳回 */
export const ORDER_STATUS_META: Record<string, OrderStatusMeta> = {
  pending: { label: '待履约', color: '#8a6d3b', bg: '#f3ede0' },
  paid: { label: '已支付', color: '#2563EB', bg: '#e3edfb' },
  fulfilling: { label: '履约中', color: '#2563EB', bg: '#e3edfb' },
  done: { label: '已完成', color: '#16A34A', bg: '#e6f6ea' },
  pending_approval: { label: '待治理审批', color: '#6D28D9', bg: '#f0e9fc' },
  rejected: { label: '已驳回', color: '#DC2626', bg: '#fdeaea' },
};

export function orderStatusMeta(status: string): OrderStatusMeta {
  return ORDER_STATUS_META[status] ?? { label: status, color: '#8a8577', bg: '#f3eee3' };
}

/** 办·执行组强调色（X-MARKET-UE-01 三端一致：办蓝） */
export const EXEC_ACCENT = '#1D4ED8';

/** 金额展示（分 → 元） */
export const money = (cents: number): string => `¥${(cents / 100).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;

/** X-MARKET-11 三权标识（治在云 · 管在端 · 办在端）：DU=经营号唯一主体，*DU=主 DU 号上的分经营号（2026-09-10 定版写法，替代 D*U 实例写法） */
export type PowerKind = 'govern' | 'manage' | 'operate';

export interface PowerBadgeMeta {
  short: string;
  text: string;
  color: string;
  bg: string;
  desc: string;
}

export const POWER_BADGE: Record<PowerKind, PowerBadgeMeta> = {
  govern: {
    short: '审',
    text: '管家审批（域内）',
    color: '#6D28D9',
    bg: '#F0E9FC',
    desc: '审在云：V*M 管家审批（域内审批，X-MARKET-18；总级治理归 OAS O*M——VDM 总运执行归 OVM、FMX 总财执行归 OFM）。只审不落：评估≠下单、治理下架≠经营',
  },
  manage: {
    short: '管',
    text: '端决策',
    color: '#B45309',
    bg: '#FBF0E0',
    desc: '管在端：DU 经营决策 / *U 供给经营（下单、开铺、上架、下架、询价、报价、签约）',
  },
  operate: {
    short: '办',
    text: '端执行',
    color: '#1D4ED8',
    bg: '#E8EEFB',
    desc: '办在端：执行细化层（*DX，展示名 YDX/HDX/TDX/EDX/CDX）作业落地，操作归执行细化帽（帽 ID 口径不变）',
  },
};

/** 按当前路径判定所属工作台（用于顶栏着色与激活态） */
export const workbenchByPath = (path: string): WorkbenchKind | null => {
  if (path.startsWith('/supplier')) return 'supplier';
  if (path.startsWith('/operator')) return 'operator';
  if (path.startsWith('/govern')) return 'govern';
  if (path.startsWith('/market') || path.startsWith('/mall')) return 'client';
  return null;
};
