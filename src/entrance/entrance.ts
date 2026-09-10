// X-MARKET-ENTRANCE-01 登入端模块 helper：容器映射 / 角色卡目录 / 角色落点
// 独立成组（一角色一登入 P0 框架）；仅依赖底座（lib/domain、shared/types），不反向依赖页面。
import type { HatRole, SessionUser } from '../../shared/types';
import { workbenchOf, WORKBENCH_HOME } from '../lib/domain';

export type ContainerKind = 'personal' | 'enterprise';

/** 容器映射（P0 兼容口径：XU/CU 客户侧走个人容器，经营/供给/治理走企业容器，不做容器数据迁移） */
export const containerOf = (hatRole: string | null | undefined): ContainerKind =>
  hatRole === 'XU' || hatRole === 'CU' ? 'personal' : 'enterprise';

export const CONTAINER_META: Record<ContainerKind, { code: string; name: string; desc: string; accent: string }> = {
  personal: { code: '#xhpz', name: '个人容器', desc: '个人购物与采购：商城买家购物 / 企业客户采购（个人侧兼容入口）', accent: '#1D4ED8' },
  enterprise: { code: '#xepz', name: '企业容器', desc: '单位视角：开店经营 / 供货入驻 / 平台管理（一个企业账号可办理多种业务）', accent: '#17181d' },
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
  XU: { face: '企业采购', duty: '企业采购：浏览市场 / 询价报价 / 订单跟进；第二身份：客户资源供给方（客户资源可授权共享，自愿参与）' },
  CU: { face: '买家商城', duty: '买家购物：逛商城 / 立即购买 / 订单跟进；第二身份：客户资源供给方（客户资源可授权共享，自愿参与）' },
  DU: { face: '店铺经营', duty: '开店经营：铺面管理 / 询价报价 / 采购进货 / 履约衔接' },
  DYX: { face: '店铺执行', duty: '店员执行：履约执行回执 / 铺内作业' },
  DHX: { face: '店铺执行', duty: '店员执行：履约执行回执 / 铺内作业' },
  DTX: { face: '店铺执行', duty: '店员执行：履约执行回执 / 铺内作业' },
  DEX: { face: '店铺执行', duty: '店员执行：履约执行回执 / 铺内作业' },
  DCX: { face: '店铺执行', duty: '店员执行：履约执行回执 / 铺内作业' },
  EU: { face: '供货入驻', duty: '供货商经营：入驻登记 / 货品上下架 / 接单报价' },
  HU: { face: '供货入驻', duty: '供货商经营：入驻登记 / 货品上下架 / 接单报价' },
  YU: { face: '供货入驻', duty: '供货商经营：入驻登记 / 货品上下架 / 接单报价' },
  TU: { face: '供货入驻', duty: '供货商经营：入驻登记 / 货品上下架 / 接单报价' },
  EX: { face: '供货执行', duty: '供货助理：物资登记 / 铺面维护 / 看单' },
  EXX: { face: '供货执行', duty: '供货助理：铺内作业 / 看单' },
  VDM: { face: '平台管理', duty: '平台经营管理：治理案件 / 规则 / 全局总账 / 留痕台账 + 入驻审核 / 货品审批 / 大额订单审批 / 门槛配置' },
  VEM: { face: '入驻审批', duty: '管家审批：物资货源入驻审核与货品审批' },
  VHM: { face: '入驻审批', duty: '管家审批：人力货源入驻审核与货品审批' },
  VYM: { face: '入驻审批', duty: '管家审批：空间货源入驻审核与货品审批' },
  VTM: { face: '入驻审批', duty: '管家审批：技术货源入驻审核与货品审批' },
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
