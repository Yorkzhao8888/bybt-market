// API 客户端：统一封装与类型映射（X-MARKET-05 两套系统 + 三方链路）
// 视图类型统一从 shared/types 导入（单一来源），client 只做别名与请求封装
import type {
  BoothRow, Container, DemoAccount, DomainCode, DomainMeta, FulfillmentReceipt, GovernanceCase, GovernThresholds, HatLine, HatRow, Inquiry, JobSystem,
  Listing, MarketPowerAuditRow, Order, OrderRow, PowerDashboard, ProfessionalMarket, SessionUser, SupplyContract, SupplierApplication,
  SupplierProduct, SupplyMallItem, Unit, HatRole, SupplyHubData, SupplyHubEntry, SupplyHubBooth,
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
  // DU 采购合同（DU 与供给方之间，仅经营台可见；客户 403）
  supplyContracts: () => req<SupplyContract[]>('/api/market/supply-contracts'),

  // ---- 订单 ----
  orders: () => req<OrderRow[]>('/api/orders'),
  orderFamilies: () => req<OrderFamilyMeta[]>('/api/orders/families'),
  createOrder: (payload: { boothId?: string; listingId?: string; amountCents?: number; side?: 'C' | 'B'; inquiryId?: string; supplierProductId?: string; qty?: number }) =>
    req<Order>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  // X-MARKET-15 大额采购治理审批（治位帽 V*M；DU 不可自批 403）
  approveOrder: (id: string, payload: { action: 'approve' | 'reject'; note?: string }) =>
    req<OrderRow>(`/api/orders/${id}/approval`, { method: 'POST', body: JSON.stringify(payload) }),
  // X-MARKET-15 治理阈值（规则模块配置存储；GET 登录可见，POST 治位可改）
  governThresholds: () => req<GovernThresholds>('/api/govern/thresholds'),
  updateThresholds: (payload: { procurementAmountCents: number }) =>
    req<GovernThresholds>('/api/govern/thresholds', { method: 'POST', body: JSON.stringify(payload) }),
  // X-MARKET-16 执行帽穿透追责：履约执行（DU 发起，服务端按族映射执行帽，回执含 actor_user/actor_hat）
  fulfillOrder: (id: string, note?: string) =>
    req<{ order: OrderRow; receipt: FulfillmentReceipt }>(`/api/orders/${id}/fulfill`, { method: 'POST', body: JSON.stringify({ note }) }),
  /* ============ X-MARKET-08 供应商准入 + DU 采购商城 ============ */
  submitApplication: (payload: { categories: string; capacity?: string; qualification: string; priceIntent?: string }) =>
    req<SupplierApplication>('/api/supply/applications', { method: 'POST', body: JSON.stringify(payload) }),
  myApplication: () => req<SupplierApplication | null>('/api/supply/applications/mine'),
  allApplications: () => req<SupplierApplication[]>('/api/supply/applications'),
  reviewApplication: (id: string, payload: { action: 'approve' | 'reject'; rejectReason?: string }) =>
    req<SupplierApplication>(`/api/supply/applications/${id}/review`, { method: 'POST', body: JSON.stringify(payload) }),
  myProducts: () => req<SupplierProduct[]>('/api/supply/products/mine'),
  allProducts: () => req<SupplierProduct[]>('/api/supply/products'),
  addProduct: (payload: { name: string; category: string; spec?: string; priceCents: number; unit?: string; stock?: number }) =>
    req<SupplierProduct>('/api/supply/products', { method: 'POST', body: JSON.stringify(payload) }),
  toggleProduct: (id: string) => req<SupplierProduct>(`/api/supply/products/${id}/toggle`, { method: 'POST' }),
  takeDownProduct: (id: string) => req<SupplierProduct>(`/api/supply/products/${id}/take-down`, { method: 'POST' }),
  supplyMall: () => req<SupplyMallItem[]>('/api/supply/mall'),
  /* ============ X-Supply 供给四源集市（X-SUPPLY-01；XU/CU 一律 403） ============ */
  supplyHub: () => req<SupplyHubData>('/api/supply/hub'),
  supplyRegister: (payload: { boothId: string; qualification: string; note?: string }) =>
    req<SupplyHubEntry>('/api/supply/register', { method: 'POST', body: JSON.stringify(payload) }),
  supplyBoothMaintain: (boothId: string, payload: { frontDesc?: string; backDesc?: string }) =>
    req<SupplyHubBooth>(`/api/supply/booths/${boothId}/maintain`, { method: 'POST', body: JSON.stringify(payload) }),
  // X-MARKET-13 三权审计：治位帽全量 / 其余本人留痕；action / result 可选筛选（无参默认行为不变）
  powerAudit: (query?: { action?: string; result?: 'allowed' | 'denied' }) => {
    const p = new URLSearchParams();
    if (query?.action) p.set('action', query.action);
    if (query?.result) p.set('result', query.result);
    const qs = p.toString();
    return req<MarketPowerAuditRow[]>(`/api/power/audit${qs ? `?${qs}` : ''}`);
  },
  // X-MARKET-14 治-管-办运行看板聚合（治位帽 only；403 带权位口径）
  powerDashboard: () => req<PowerDashboard>('/api/power/dashboard'),
};
