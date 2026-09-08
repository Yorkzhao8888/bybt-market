// X-Market 五域集市系统 · 领域常量配置

import type { DomainMeta } from '../shared/types';

/** 五域配置：链路 供应单元 → (调度) → Booth → 交易单码 */
export const DOMAINS: DomainMeta[] = [
  {
    code: 'E',
    name: '物资',
    marketName: 'E-Market',
    unitCode: 'EU',
    mode: 'EU → Booth-E',
    tradeCode: 'EX',
    color: '#C27A1B',
    description: '物料、商品、存货的供给与流转，供应单元 EU 直挂摊位售卖。',
  },
  {
    code: 'H',
    name: '人力',
    marketName: 'H-Market',
    unitCode: 'HU',
    mode: 'HU → HDU → Booth-H',
    tradeCode: 'HX',
    color: '#E4572E',
    description: '人力与技能服务，经人力调度单元 HDU 派单后由摊位承接。',
  },
  {
    code: 'Y',
    name: '空间',
    marketName: 'Y-Market',
    unitCode: 'YU',
    mode: 'YU → YDU → Booth-Y',
    tradeCode: 'YX',
    color: '#17A290',
    description: '场地、席位与空间的租赁交易，由空间调度 YDU 撮合入驻。',
  },
  {
    code: 'T',
    name: '技术',
    marketName: 'T-Market',
    unitCode: 'TU',
    mode: 'TU → Booth-T',
    tradeCode: 'TX',
    color: '#4A5FD5',
    description: '算法、算力与知识产权的交易，技术单元 TU 直接挂牌。',
  },
  {
    code: 'DE',
    name: '门店产能',
    marketName: 'DE-Market',
    unitCode: 'DU',
    mode: 'DU → Booth-DE',
    tradeCode: 'D-OFD',
    color: '#D6366E',
    description: '门店服务与产能时段，门店单元 DU 提供产能，直接面向消费者 B2C。',
  },
];

export const domainByCode = (code: string): DomainMeta =>
  DOMAINS.find(d => d.code === code) ?? DOMAINS[0];