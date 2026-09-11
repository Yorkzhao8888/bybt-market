// XMK-GOV-01 市管方治理面 API（/api/governance/* 新命名空间，XVPZ 守卫：VEM/VXM）
// XMK-EU-CHAIN-01：准入评估三端点（applications 队列 + claim 评估中 + audit approve/reject）
// 依赖 client.ts 的 req 原语（token 注入 + {success,data} 外壳解包），禁改既有 API 文件
import type { GovernanceOverview, GovernanceOrdersView, GovernanceVendor, GovernanceApplicationRow } from '../../shared/governance';
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
  // —— 准入评估（XMK-EU-CHAIN-01 A：submitted→reviewing→approved/rejected，VXM 统筹口径 · XVPZ 治理面承接）——
  applications: () => req<GovernanceApplicationRow[]>('/api/governance/applications'),
  claimApplication: (id: string) =>
    req<GovernanceApplicationRow>(`/api/governance/applications/${encodeURIComponent(id)}/claim`, { method: 'POST' }),
  auditApplication: (id: string, body: { action: 'approve' | 'reject'; rejectReason?: string; note?: string }) =>
    req<GovernanceApplicationRow>(`/api/governance/applications/${encodeURIComponent(id)}/audit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
