// X-Supply 供给集市 · 前端数据层归一（X-SUPPLY-01 补充约束：独立成层）
// 依赖单向：仅依赖公共 http 底座（src/api/client 的 req）与 shared/* 公共类型；
// X-08 供给商城（X-Market 面）方法不在此归口——两交易面数据层隔离。

import { req } from '../../api/client';
import type { XSupplyBooth, XSupplyEntry, XSupplyHubData } from '../../../shared/x-supply';
import type { GovernThresholds, OrderRow, SupplierApplication, SupplierProduct } from '../../../shared/types';

/** X-Supply 供给集市 API（x-supply 前缀命名空间） */
export const xSupplyApi = {
  /** 供给列表只读 + 登记台账（XU/CU 403 双保险） */
  hub: (): Promise<XSupplyHubData> => req<XSupplyHubData>('/api/supply/hub'),

  /** 入驻登记（EX/EXX 办位） */
  register: (body: { boothId: string; qualification: string; note?: string }): Promise<XSupplyEntry> =>
    req<XSupplyEntry>('/api/supply/register', { method: 'POST', body: JSON.stringify(body) }),

  /** 铺子维护（EX/EXX 办位，仅本铺 maintainBoothCode） */
  maintain: (
    boothKey: string,
    body: { frontDesc: string; backDesc: string },
  ): Promise<{ id: string; code: string; frontDesc: string; backDesc: string }> =>
    req<{ id: string; code: string; frontDesc: string; backDesc: string }>(`/api/supply/booths/${boothKey}/maintain`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** X-MARKET-ROLE-01 A3：四源治理数据层（V*M 家族分源 + VXM 统筹）——
   * 仅 req 原语直调后端契约路径，不 import client 业务方法（依赖单向白名单）。 */
  govern: {
    /** 准入审核列表（家族仅本源域，VXM 全域；VDM 403 经营治理隔离） */
    applications: (): Promise<SupplierApplication[]> => req<SupplierApplication[]>('/api/supply/applications'),

    /** 准入审核：通过/驳回（家族限本源域，X-MARKET-08 + ROLE-01 分线） */
    reviewApplication: (
      id: string,
      body: { action: 'approve' | 'reject'; rejectReason?: string },
    ): Promise<{ success: boolean; application: SupplierApplication }> =>
      req<{ success: boolean; application: SupplierApplication }>(`/api/supply/applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    /** 治理货品列表（家族仅本源域） */
    products: (): Promise<SupplierProduct[]> => req<SupplierProduct[]>('/api/supply/products'),

    /** 治理下架（仅下架不代上架，X-MARKET-12） */
    takeDown: (id: string): Promise<{ success: boolean; product: SupplierProduct }> =>
      req<{ success: boolean; product: SupplierProduct }>(`/api/supply/products/${id}/take-down`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),

    /** 大额采购审批队列（家族/VXM：仅 pending_approval/rejected；VDM 走 /govern 全局总账） */
    orders: (): Promise<OrderRow[]> => req<OrderRow[]>('/api/orders'),

    /** 大额采购升级审批（X-MARKET-15） */
    approveOrder: (id: string, body: { action: 'approve' | 'reject'; note?: string }) =>
      req<{ success: boolean; order: OrderRow }>(`/api/orders/${id}/approval`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    /** 大额采购阈值配置（threshold_update 治位，supply 面规则） */
    thresholds: (): Promise<GovernThresholds> => req<GovernThresholds>('/api/govern/thresholds'),
    updateThresholds: (procurementAmountCents: number): Promise<{ success: boolean; thresholds: GovernThresholds }> =>
      req<{ success: boolean; thresholds: GovernThresholds }>('/api/govern/thresholds', {
        method: 'POST',
        body: JSON.stringify({ procurementAmountCents }),
      }),
  },
};

export type { XSupplyBooth, XSupplyEntry, XSupplyHubData };
