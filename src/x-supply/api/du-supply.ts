// X-Supply 供给集市 · 前端数据层归一（X-SUPPLY-01 补充约束：独立成层）
// 依赖单向：仅依赖公共 http 底座（src/api/client 的 req）与 shared/x-supply 契约；
// X-08 供给商城（X-Market 面）方法不在此归口——两交易面数据层隔离。

import { req } from '../../api/client';
import type { XSupplyBooth, XSupplyEntry, XSupplyHubData } from '../../../shared/x-supply';

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
};

export type { XSupplyBooth, XSupplyEntry, XSupplyHubData };
