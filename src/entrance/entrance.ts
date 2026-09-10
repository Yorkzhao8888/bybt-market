// X-MARKET-ENTRANCE-01 登入端模块 helper：容器映射 / 角色卡目录 / 角色落点
// 独立成组（一角色一登入 P0 框架）；仅依赖底座（lib/domain、shared/types），不反向依赖页面。
import type { HatRole, SessionUser } from '../../shared/types';
import { workbenchOf, WORKBENCH_HOME } from '../lib/domain';

export type ContainerKind = 'personal' | 'enterprise';

/** 容器映射（P0 兼容口径：XU/CU 客户侧走个人容器，经营/供给/治理走企业容器，不做容器数据迁移） */
export const containerOf = (hatRole: string | null | undefined): ContainerKind =>
  hatRole === 'XU' || hatRole === 'CU' ? 'personal' : 'enterprise';

export const CONTAINER_META: Record<ContainerKind, { code: string; name: string; desc: string; accent: string }> = {
  personal: { code: '#xhpz', name: '个人容器', desc: '自然人视角：Mall 买家购物 / 企业客户采购（个人侧兼容入口）', accent: '#1D4ED8' },
  enterprise: { code: '#xepz', name: '企业容器', desc: '单位视角：经营 DU / 供给 *U·EX / 治理 V*M（Market 与 Supply 双面）', accent: '#17181d' },
};

/** 预留容器（本单不开放，仅置灰展示） */
export const RESERVED_CONTAINERS = [
  { code: '#xgpz', name: '政府容器', desc: '政务监管视角：合规巡检 / 报备核验（预留）' },
  { code: '#xopz', name: '平台容器', desc: '平台运营视角：全局运营 / 平台治理（预留）' },
];

export interface RoleBrief {
  face: string; // 所属面（Market 客户/经营/治理 或 Supply 采购/供给/治理）
  duty: string; // 职责一句话
}

/** 角色卡目录（角色·界面归位矩阵 v3 口径） */
export const ROLE_BRIEF: Record<string, RoleBrief> = {
  XU: { face: 'Market · 客户面', duty: '企业采购：五市场浏览 / B2B 询价报价 / 订单跟进；第二身份：客户资源供给方（B端客户资源 · 授权式贡献，不占权位）' },
  CU: { face: 'Mall · 客户面', duty: '买家购物：商城浏览 / 立即购买 / 订单跟进；第二身份：客户资源供给方（C端客户资源 · 授权式贡献，不占权位）' },
  DU: { face: 'Market · 经营面', duty: '分经营号经营（*DU）：铺面管理 / 询价报价 / 采购商城 / 履约衔接' },
  DYX: { face: 'Market · 经营面', duty: '业务执行（*DX·L1）：履约执行回执 / 铺内作业（办位）' },
  DHX: { face: 'Market · 经营面', duty: '业务执行（*DX·L1）：履约执行回执 / 铺内作业（办位）' },
  DTX: { face: 'Market · 经营面', duty: '业务执行（*DX·L1）：履约执行回执 / 铺内作业（办位）' },
  DEX: { face: 'Market · 经营面', duty: '业务执行（*DX·L1）：履约执行回执 / 铺内作业（办位）' },
  DCX: { face: 'Market · 经营面', duty: '业务执行（*DX·L1）：履约执行回执 / 铺内作业（办位）' },
  EU: { face: 'Supply · 供给面', duty: '通货供货商经营：准入登记 / 货品上下架 / 供给单接单报价' },
  HU: { face: 'Supply · 供给面', duty: '人力供货商经营：准入登记 / 货品上下架 / 供给单接单报价' },
  YU: { face: 'Supply · 供给面', duty: '云资源供货商经营：准入登记 / 货品上下架 / 供给单接单报价' },
  TU: { face: 'Supply · 供给面', duty: '技术供货商经营：准入登记 / 货品上下架 / 供给单接单报价' },
  EX: { face: 'Supply · 供给面', duty: '供给执行：物资登记 / 铺面维护 / 看单（办位）' },
  EXX: { face: 'Supply · 供给面', duty: '供给执行：铺内作业 / 看单（办位）' },
  VDM: { face: 'Market · 经营治理面', duty: '治理案件 / 规则 / 全局总账 / 三权审计' },
  VXM: { face: 'Supply · 管家审批面', duty: '总运执行（归 OVM）统筹全域：域内准入审核 / 货品审批 / 大额审批 / 阈值配置' },
  VEM: { face: 'Supply · 管家审批面', duty: 'E 源域内管家审批：通货源准入审核与货品审批（EMX）' },
  VHM: { face: 'Supply · 管家审批面', duty: 'H 源域内管家审批：人力源准入审核与货品审批（HMX）' },
  VYM: { face: 'Supply · 管家审批面', duty: 'Y 源域内管家审批：云资源源准入审核与货品审批（YMX）' },
  VTM: { face: 'Supply · 管家审批面', duty: 'T 源域内管家审批：技术源准入审核与货品审批（TMX · 技术运营管理白名单兼任）' },
};

export const roleBriefOf = (role: string | null | undefined): RoleBrief =>
  (role ? ROLE_BRIEF[role] : undefined) ?? { face: 'Market', duty: '通用视角' };

/** 角色落点：CU 且 entry=C 走 /mall（Mall 买家），其余按 WORKBENCH_HOME（V3 映射口径） */
export const roleHomeOf = (u: Pick<SessionUser, 'hatRole' | 'entry'>): string => {
  const wb = workbenchOf(u.hatRole);
  return u.entry === 'C' && wb === 'client' ? '/mall' : WORKBENCH_HOME[wb];
};

/** 当前账号可担任角色（帽）列表——P0 单帽账号；多帽账号扩展点（数组去重即可） */
export const rolesOf = (user: Pick<SessionUser, 'hatRole'>): HatRole[] =>
  user.hatRole ? [user.hatRole] : [];
