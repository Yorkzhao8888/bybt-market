// 域/角色前端映射（X-MARKET-05 三方链路与 Booth 权属定版）
// 两套系统：Market=铺面层（交易平台，不经营/不持资源/不执行作业）；Booth 实体=作业层（经营实体+五作业系统）。
// 价值链：供给方 Booth-Y/E/H/T（源头产能）→ DU 经营实体 Booth-DY/DH/DT/DE/DC（组织经营）→ Market/Mall（客户界面）。

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
  role === 'VEM' || role === 'VHM' || role === 'VYM' || role === 'VTM' || role === 'VDM' || role === 'VXM';
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
export type WorkbenchKind = 'client' | 'supplier' | 'operator' | 'govern';

const WORKBENCH_SUPPLY_HATS = ['EU', 'HU', 'YU', 'TU'];
const WORKBENCH_OPERATOR_HATS = ['DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX'];

/** 角色类别映射：客户/供应商/经营者/治理者 */
export const workbenchOf = (role: string | null | undefined): WorkbenchKind => {
  const r = role ?? '';
  if (r === 'XU' || r === 'CU') return 'client';
  if (WORKBENCH_SUPPLY_HATS.includes(r)) return 'supplier';
  if (WORKBENCH_OPERATOR_HATS.includes(r)) return 'operator';
  if (isAdminRole(r)) return 'govern';
  return 'client';
};

export const WORKBENCH_HOME: Record<WorkbenchKind, string> = {
  client: '/market',
  supplier: '/supplier',
  operator: '/operator',
  govern: '/govern',
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
  govern: { kind: 'govern', label: '治理者工作台', accent: '#6D28D9', accentSoft: '#f0e9fc', accentText: '#5b21b6', desc: '治理权威 · 管控' },
};

export const workbenchThemeOf = (role: string | null | undefined): WorkbenchTheme =>
  WORKBENCH_THEME[workbenchOf(role)];

/** X-MARKET-11 三权标识（治在云 · 管在端 · 办在端）：DU=经营号唯一主体，D*U=主 DU 号上的分经营号 */
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
    short: '治',
    text: '云审批',
    color: '#6D28D9',
    bg: '#F0E9FC',
    desc: '治在云：VXM/O*M 审批审计（只审不落：评估≠下单、治理下架≠经营）',
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
    desc: '办在端：执行帽（DYX/DHX/DTX/DEX/DCX）作业落地，操作归执行帽',
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
