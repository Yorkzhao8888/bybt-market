// XMK-CRM-UI-01 客集工作台 API 层（/api/customer/* 新命名空间，CU only）
// 依赖 client.ts 的 req 原语（token 注入 + {success,data} 外壳解包），禁改既有 API 文件；
// 契约零改动红线：仅消费 XMK-API-01 已有端点，不要求新字段。
import type { CustomerDoc, CustomerProfile } from '../../shared/customer';
import { req } from './client';

export const customerApi = {
  demands: () => req<CustomerDoc[]>('/api/customer/demands'),
  postDemand: (body: { title: string; desc?: string }) =>
    req<CustomerDoc>('/api/customer/demands', { method: 'POST', body: JSON.stringify(body) }),
  intents: () => req<CustomerDoc[]>('/api/customer/intents'),
  postIntent: (body: { title: string; desc?: string }) =>
    req<CustomerDoc>('/api/customer/intents', { method: 'POST', body: JSON.stringify(body) }),
  profile: () => req<CustomerProfile>('/api/customer/profile'),
};
