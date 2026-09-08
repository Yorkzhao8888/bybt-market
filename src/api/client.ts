// API 客户端：统一封装与类型映射
import type {
  Booth, DomainMeta, DomainStats, Fulfillment, Listing, Order, SessionUser, Unit,
} from '../../shared/types';

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

export interface OverviewData {
  stats: DomainStats[];
  domainMeta: DomainMeta[];
  totalListings: number;
  totalBooths: number;
  totalOrders: number;
  totalTurnover: number;
}

export interface MallListing extends Listing {
  booth: Pick<Booth, 'id' | 'name' | 'code' | 'rating'> | null;
}

export interface BoothDetail {
  booth: Booth;
  front: Listing[];
  back: Fulfillment[];
  owner: Unit | null;
  orders?: Order[];
}

export interface MarketBooth extends Booth {
  owner: { id: string; name: string; code: string } | null;
  frontCount: number;
  backCount: number;
  backLoad: number;
}

export interface ContainerView {
  id: string;
  type: string;
  typeLabel: string;
  name: string;
  region: string;
  credit: number;
  hatCount: number;
  boothCount: number;
}

export interface UnitView extends Unit {
  containerName: string;
}

export interface HierarchyContainer {
  id: string;
  type: string;
  typeLabel: string;
  name: string;
  hats: Array<{
    id: string; code: string; name: string; role: string; side: string;
    domainTags: string[]; dispatch?: boolean;
    booths: Array<{ id: string; code: string; name: string; domain: string }>;
  }>;
}

export interface AuthResult { token: string; user: SessionUser; }

export const api = {
  // ---- 认证 ----
  login: (payload: { account: string; password: string; entry?: 'C' | 'B' }) =>
    req<AuthResult>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  oneClick: (entry: 'C' | 'B') =>
    req<AuthResult>('/api/auth/oneclick', { method: 'POST', body: JSON.stringify({ entry }) }),
  me: () => req<SessionUser>('/api/auth/me'),
  logout: () => req<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST', body: '{}' }),

  // ---- 数据模型查询 ----
  containers: () => req<ContainerView[]>('/api/model/containers'),
  container: (id: string) => req<{ container: { id: string; type: string; name: string }; hats: Unit[]; booths: Booth[] }>(`/api/model/containers/${id}`),
  units: (opts?: { role?: string; side?: 'C' | 'B'; containerId?: string }) => {
    const p = new URLSearchParams();
    if (opts?.role) p.set('role', opts.role);
    if (opts?.side) p.set('side', opts.side);
    if (opts?.containerId) p.set('containerId', opts.containerId);
    const q = p.toString();
    return req<UnitView[]>(`/api/model/units${q ? `?${q}` : ''}`);
  },
  hierarchy: () => req<HierarchyContainer[]>('/api/model/hierarchy'),

  // ---- 三流占位 ----
  flows: () => req<Record<string, { caption: string; gate: string; status: string; note: string }>>('/api/flows'),
  flow: (kind: string) => req<{ kind: string; caption: string; gate: string; status: string; items: unknown[] }>(`/api/flows/${kind}`),
  tradables: () => req<{ listingCount: number; categories: string[]; capacityBooths: number }>('/api/tradables'),

  // ---- 集市 ----
  overview: () => req<OverviewData>('/api/overview'),
  meta: () => req<{ domains: DomainMeta[]; stats: DomainStats[] }>('/api/meta'),
  mallListings: (domain?: string) => req<MallListing[]>(`/api/mall/listings${domain ? `?domain=${domain}` : ''}`),
  mallBooths: (domain?: string) => req<Booth[]>(`/api/mall/booths${domain ? `?domain=${domain}` : ''}`),
  mallBooth: (id: string) => req<BoothDetail>(`/api/mall/booths/${id}`),
  marketBooths: (domain?: string) => req<MarketBooth[]>(`/api/market/booths${domain ? `?domain=${domain}` : ''}`),
  marketBooth: (id: string) => req<BoothDetail & { orders: Order[] }>(`/api/market/booths/${id}`),
  createBooth: (payload: { domain: string; name: string; ownerUnitId: string; frontDesc?: string; backDesc?: string }) =>
    req<Booth>('/api/market/booths', { method: 'POST', body: JSON.stringify(payload) }),
  addListing: (id: string, payload: { title: string; spec?: string; unit: string; price: number; stock?: number }) =>
    req<Listing>(`/api/market/booths/${id}/listings`, { method: 'POST', body: JSON.stringify(payload) }),
  addFulfillment: (id: string, payload: { title: string; task?: string; capacity?: number }) =>
    req<Fulfillment>(`/api/market/booths/${id}/fulfillments`, { method: 'POST', body: JSON.stringify(payload) }),
  createOrder: (payload: { type?: 'MALL' | 'MARKET'; listingId: string; buyerUnitId: string; qty?: number }) =>
    req<Order>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  orders: (type?: 'MALL' | 'MARKET') => req<Array<Order & { buyer: string; seller: string }>>(`/api/orders${type ? `?type=${type}` : ''}`),
  advanceOrder: (id: string) => req<Order>(`/api/orders/${id}/advance`, { method: 'POST', body: '{}' }),
};