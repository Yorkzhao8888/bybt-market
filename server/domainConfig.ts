// X-Market 五域集市系统 · 领域常量配置
// 对齐 ZiwayOS v2.2 拍板定版（X-MARKET-02）：帽体系落地（新增经营帽 EDU/TDU、执行帽 EDX/TDX）

import type { DomainCode, DomainMeta, JobSystem, OrderFamily } from '../shared/types';

/** 五域配置：链路 供给帽 → (调度) → Booth → 交易单码；含经营帽/执行帽/域标签 */
export const DOMAINS: DomainMeta[] = [
  {
    code: 'E',
    name: '物资',
    marketName: 'E-Market',
    unitCode: 'EU',        // 供给帽
    opCode: 'EDU',         // 经营帽（DU 戴 E 域帽，产业经营者·物资域）
    execCode: 'EDX',       // 执行帽（经营执行 DX 系）
    marketTag: 'E_MARKET',
    mode: 'EU → Booth-E',
    tradeCode: 'EX',
    color: '#C27A1B',
    description: '物料、商品、存货的供给与流转，供应单元 EU 直挂摊位售卖，经营帽 EDU 承接售卖面。',
    marketTitle: '通货',
    opRole: 'VEM',
    projectLine: 'EMX',
    ownerRoles: ['EU'],
    hasFranchise: false,
    operationsFamily: 'WH',
  },
  {
    code: 'H',
    name: '人力',
    marketName: 'H-Market',
    unitCode: 'HU',
    opCode: 'HDU',         // 经营帽（人力调度）
    execCode: 'HX',
    marketTag: 'H_MARKET',
    mode: 'HU → HDU → Booth-H',
    tradeCode: 'HX',
    color: '#E4572E',
    description: '人力与技能服务，经人力调度帽 HDU 派单后由摊位承接。',
    marketTitle: '人资',
    opRole: 'VHM',
    projectLine: 'HMX',
    ownerRoles: ['HU', 'HDU'],
    hasFranchise: true,
    operationsFamily: 'SVC',
  },
  {
    code: 'Y',
    name: '空间',
    marketName: 'Y-Market',
    unitCode: 'YU',
    opCode: 'YDU',         // 经营帽（空间调度）
    execCode: 'YX',
    marketTag: 'Y_MARKET',
    mode: 'YU → YDU → Booth-Y',
    tradeCode: 'YX',
    color: '#17A290',
    description: '场地、席位与空间的租赁交易，由空间调度 YDU 撮合入驻（保留捷租 Jezoom 子品牌）。',
    marketTitle: '智场',
    opRole: 'VYM',
    projectLine: 'YMX',
    ownerRoles: ['YU', 'YDU'],
    hasFranchise: true,
    operationsFamily: 'LAB',
  },
  {
    code: 'T',
    name: '技术',
    marketName: 'T-Market',
    unitCode: 'TU',        // 供给帽（13U 基座，仍为 T 域供给帽）
    opCode: 'TDU',         // 经营帽（DU 戴 T 域帽，产业经营者·技术域）
    execCode: 'TDX',       // 执行帽（经营执行 DX 系）
    marketTag: 'T_MARKET',
    mode: 'TU → Booth-T',
    tradeCode: 'TX',
    color: '#4A5FD5',
    description: '算法、算力与知识产权的交易，技术供给帽 TU 挂牌、经营帽 TDU 承接，Order-T 经 Booth-T → X-OFD 汇聚。',
    marketTitle: '技术',
    opRole: 'VTM',
    projectLine: 'TMX',
    ownerRoles: ['TU'],
    hasFranchise: false,
    operationsFamily: 'LAB',
  },
  {
    code: 'DE',
    name: '门店产能',
    marketName: 'DE-Market',
    unitCode: 'DU',
    opCode: 'DU',          // 经营帽即供给帽 DU
    execCode: 'D-OFD',
    marketTag: 'DE_MARKET',
    mode: 'DU → Booth-DE',
    tradeCode: 'D-OFD',
    color: '#D6366E',
    description: '门店服务与产能时段，门店帽 DU 提供产能，直接面向消费者 B2C（Shop）。',
    marketTitle: '产品',
    opRole: 'VDM',
    projectLine: 'DMX',
    ownerRoles: ['DU'],
    hasFranchise: true,
    operationsFamily: 'SVC',
  },
];

export const domainByCode = (code: string): DomainMeta =>
  DOMAINS.find(d => d.code === code) ?? DOMAINS[0];

/** 域交易码 → 订单族（D-OFD 归 D 族；EX→E, HX→H, YX→Y, TX/TDX→T） */
export const ORDER_FAMILY_OF_TRADECODE: Record<string, OrderFamily> = {
  EX: 'E', EDX: 'E',
  HX: 'H',
  YX: 'Y',
  TX: 'T', TDX: 'T',
  'D-OFD': 'D',
};

/** 域 → 订单族（Market 采购按域；Mall C端归 C 族） */
export const familyOfDomain = (domain: DomainCode): OrderFamily =>
  domain === 'DE' ? 'D' : (domain as OrderFamily);

/** 五大作业系统（铺主"拎包经营"内置赋能，占位标注，不实现作业逻辑） */
export const JOB_SYSTEMS: { code: JobSystem['code']; label: string }[] = [
  { code: 'FAB', label: '制造' },
  { code: 'WH', label: '仓储' },
  { code: 'DL', label: '配送' },
  { code: 'SVC', label: '服务' },
  { code: 'LAB', label: '实验' },
];

/** 平台运营方五大职责 */
export const OPERATOR_DUTIES = ['市场秩序建设', '规则制定', '专业 Booth 系统供给'];

/** 五大专业市场（主视角），按 Y/E/H/T/DE 顺序 */
export const PUBLIC_MARKETS: DomainCode[] = ['Y', 'E', 'H', 'T', 'DE'];

export const marketMetaOf = (d: DomainCode | null) =>
  d ? DOMAINS.find((x) => x.code === d) ?? null : null;