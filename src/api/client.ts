// API 客户端：统一封装与类型映射
import type {
  Booth, DomainMeta, DomainStats, Fulfillment, Listing, Order, Unit,
} from '../../shared/types';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
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

export const api = {
  overview: () => req<OverviewData>('/api/overview'),
  meta: () => req<{ domains: DomainMeta[]; stats: DomainStats[] }>('/api/meta'),
  mallListings: (domain?: string) => req<MallListing[]>(`/api/mall/listings${domain ? `?domain=${domain}` : ''}`),
  mallBooths: (domain?: string) => req<Booth[]>(`/api/mall/booths${domain ? `?domain=${domain}` : ''}`),
  mallBooth: (id: string) => req<BoothDetail>(`/api/mall/booths/${id}`),
  units: (role?: string) => req<Unit[]>(`/api/market/units${role ? `?role=${role}` : ''}`),
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