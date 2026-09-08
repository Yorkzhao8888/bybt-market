// API 客户端：统一封装与类型映射（X-MARKET-05 两套系统 + 三方链路）
// 视图类型统一从 shared/types 导入（单一来源），client 只做别名与请求封装
import type {
  BoothRow, Container, DemoAccount, DomainCode, DomainMeta, GovernanceCase, HatLine, HatRow, Inquiry, JobSystem,
  Listing, Order, OrderRow, ProfessionalMarket, SessionUser, Unit, HatRole,
} from '../../shared/types';

export type DecoratedBooth = BoothRow;
export type MarketGroup = ProfessionalMarket;
export type InquiryRow = Inquiry;
export type { OrderRow, GovernanceCase };

const TOKEN_KEY = 'xm_token';

export function getToken(): string | null {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: () => void): void {
  onUnauthorized = fn;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { headers, ...init });
  if (res.status === 401 && path !== '/api/auth/login') {
    onUnauthorized?.();
  }
  const json = (await res.json().catch(() => ({ success: false, error: '解析失败' }))) as { success: boolean; data?: T; error?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.error || `请求失败 ${res.status}`);
  }
  return json.data as T;
}

/* ============ 视图类型（shared 单一来源；此处仅保留 server 专属组合视图） ============ */

export interface MarketsData {
  markets: MarketGroup[];
  jobSystems: JobSystem[];
  jobSystemNote: string;
  operatorDuties: string[];
  valueChain: string;
}

export interface BoothDetail {
  booth: DecoratedBooth;
  owner: Unit | null;
  exec: Unit | null;
  operatorRole: string;
  projectLine: string;
  canFranchise: boolean;
  clientFace: 'market' | 'mall';
  listings: Listing[];
  jobSystems: JobSystem[];
  jobSystemNote: string;
}

export interface MallListing extends Listing {
  booth: DecoratedBooth | null;
}

export interface OrderFamilyMeta {
  family: string;
  name: string;
  desc: string;
}

export interface HatsModel {
  base13U: HatRole[];
  duExecHats: HatRole[];
  clients: HatRole[];
  suppliers: HatRole[];
  duEntity: HatRole[];
  execHats: HatRole[];
  operators: HatRole[];
  removedIndependent: string[];
  execHatToBooth: Record<string, string>;
  mallExecHat: HatRole;
  parties: Record<string, { label: string; line: string; hats: string[]; desc: string }>;
  domains: DomainMeta[];
  jobSystems: JobSystem[];
  jobSystemNote: string;
}

export interface AuthResult { token: string; user: SessionUser; }

export interface GovernData {
  cases: GovernanceCase[];
  duties: string[];
  domain: string | null;
}

export interface OverviewStat {
  domain: DomainCode;
  booths: number;
  turnover: number;
}
export interface OverviewData {
  domainMeta: DomainMeta[];
  totalBooths: number;
  totalListings: number;
  totalOrders: number;
  totalTurnover: number;
  stats: OverviewStat[];
}

export const api = {
  overview: () => req<OverviewData>('/api/overview'),
  // ---- 认证 ----
  login: (payload: { account: string; password: string }) =>
    req<AuthResult>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  oneClickById: (demoId: string) =>
    req<AuthResult>('/api/auth/oneclick', { method: 'POST', body: JSON.stringify({ demoId }) }),
  demos: () => req<DemoAccount[]>('/api/auth/demos'),
  me: () => req<SessionUser>('/api/auth/me'),
  logout: () => req<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST', body: '{}' }),

  // ---- 数据模型查询 ----
  units: () => req<HatRow[]>('/api/model/units'),
  hierarchy: () => req<Array<Record<string, unknown>>>('/api/model/hierarchy'),
  containers: () => req<Array<Container & { containerTypeLabel: string }>>('/api/model/containers'),
  hats: () => req<HatsModel>('/api/model/hats'),
  markets: () => req<MarketsData>('/api/model/markets'),

  // ---- 三流占位 ----
  flows: () => req<Array<Record<string, unknown>>>('/api/flows'),

  // ---- Mall（C 端 CU）----
  mallListings: (domain?: string) => req<MallListing[]>(`/api/mall/listings${domain ? `?domain=${domain}` : ''}`),
  mallBooths: () => req<DecoratedBooth[]>('/api/mall/booths'),

  // ---- Market（B 端 XU/DU/供给）----
  marketBooths: (opts?: { domain?: string; kind?: 'supply' | 'du' }) => {
    const p = new URLSearchParams();
    if (opts?.domain) p.set('domain', opts.domain);
    if (opts?.kind) p.set('kind', opts.kind);
    const q = p.toString();
    return req<DecoratedBooth[]>(`/api/market/booths${q ? `?${q}` : ''}`);
  },
  marketBooth: (id: string) => req<BoothDetail>(`/api/market/booths/${id}`),
  createBooth: (payload: { domain: string; kind: 'supply' | 'du'; name: string; franchise?: 'direct' | 'franchise' }) =>
    req<DecoratedBooth>('/api/market/booths', { method: 'POST', body: JSON.stringify(payload) }),

  // ---- B2B 闭环：询价/报价/合同 ----
  createInquiry: (payload: { boothId: string; domain?: string; title: string; detail: string }) =>
    req<InquiryRow>('/api/market/inquiries', { method: 'POST', body: JSON.stringify(payload) }),
  inquiries: () => req<InquiryRow[]>('/api/market/inquiries'),
  quoteInquiry: (id: string, payload: { quoteCents: number; quoteNote?: string }) =>
    req<InquiryRow>(`/api/market/inquiries/${id}/quote`, { method: 'POST', body: JSON.stringify(payload) }),
  contractInquiry: (id: string) =>
    req<InquiryRow>(`/api/market/inquiries/${id}/contract`, { method: 'POST', body: '{}' }),

  // ---- 运营治理 ----
  governCases: () => req<GovernData>('/api/govern/cases'),

  // ---- 订单 ----
  orders: () => req<OrderRow[]>('/api/orders'),
  orderFamilies: () => req<OrderFamilyMeta[]>('/api/orders/families'),
  createOrder: (payload: { boothId: string; listingId?: string; amountCents?: number; side?: 'C' | 'B'; inquiryId?: string }) =>
    req<Order>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
};
