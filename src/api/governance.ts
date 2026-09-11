// XMK-GOV-01 市管方治理面 API（/api/governance/* 新命名空间，仅 XVPZ#VEM）
// 依赖 client.ts 的 req 原语（token 注入 + {success,data} 外壳解包），禁改既有 API 文件
import type { GovernanceOverview, GovernanceOrdersView, GovernanceVendor } from '../../shared/governance';
import { req } from './client';

export const governanceApi = {
  overview: () => req<GovernanceOverview>('/api/governance/overview'),
  vendors: () => req<GovernanceVendor[]>('/api/governance/supply/vendors'),
  audit: (id: string, body: { action: 'approve' | 'freeze'; note?: string }) =>
    req<GovernanceVendor>(`/api/governance/supply/vendors/${encodeURIComponent(id)}/audit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  orders: () => req<GovernanceOrdersView>('/api/governance/supply/orders'),
};


