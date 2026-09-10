// X-MARKET-UE-01 DU 三端体验·现场看板（展·状态）
// Booth 大屏：深色主题大字远观。今日履约进度 + 本月成交额 + 待办数（只展示不提醒）+ 在架货品 + 实时订单流。
// 数据同源 /api/orders + /api/market/booths，10s 轮询；手机履约（exec_fulfill）→ 状态/进度即时反映。
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Radio } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../Auth';
import { money, orderStatusMeta } from '../lib/domain';
import OrderStatusBadge from '../components/OrderStatusBadge';
import type { BoothRow, Listing, OrderRow } from '../../shared/types';

export default function Board() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [beat, setBeat] = useState('');

  const pull = useCallback(() => {
    void api.orders().then((r) => setOrders(r)).catch(() => undefined);
    void api.marketBooths().then((r) => setBooths(r)).catch(() => undefined);
    void api.mallListings().then((r) => setListings(r)).catch(() => undefined);
    setBeat(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
  }, []);

  useEffect(() => {
    pull();
    const t = setInterval(pull, 10_000);
    return () => clearInterval(t);
  }, [pull]);

  const today = new Date().toISOString().slice(0, 10);
  const todayFulfilled = orders.flatMap((o) => o.fulfillments ?? []).filter((f) => f.ts.slice(0, 10) === today);
  const fulfillPending = orders.filter((o) => o.status === 'pending').length;
  const progress = todayFulfilled.length + fulfillPending > 0 ? Math.round((todayFulfilled.length / (todayFulfilled.length + fulfillPending)) * 100) : 0;
  const totalAmount = orders.reduce((s, o) => s + (o.amountCents ?? 0), 0);
  const todoCount = orders.filter((o) => o.status === 'pending' || o.status === 'pending_approval').length;
  const stream = [...orders].reverse().slice(0, 12);
  const mainBooth = booths[0];
  const boardTitle = user && (user.hatRole === 'VDM' || user.hatRole?.startsWith('V')) ? '五域集市 · 全域运行' : mainBooth ? `${mainBooth.code} 现场运行` : '五域集市 · 现场运行';
  const myBoothIds = new Set(booths.map((b) => b.id));
  const myLs = user && (user.hatRole === 'VDM' || user.hatRole?.startsWith('V')) ? listings : listings.filter((l) => l.boothId !== null && myBoothIds.has(l.boothId));

  return (
    <div className="min-h-screen bg-[#17181d] text-[#f5f2eb]">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif-display text-4xl font-black tracking-tight">{boardTitle}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#b8b2a4]">
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[#16A34A]" />
              LIVE 实时同步 · 数据同源 /api/orders · 刷新 {beat || '—'}
            </p>
          </div>
          <Link to={user ? '/operator' : '/login'} className="flex items-center gap-1.5 rounded-lg border border-[#3a3b42] px-3 py-2 text-xs text-[#b8b2a4] hover:bg-[#26272d]">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回工作台
          </Link>
        </div>

        {/* 核心区：履约进度 / 本月成交 / 待办（只展示） */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#3a3b42] bg-[#212228] p-5">
            <p className="text-xs font-semibold tracking-widest text-[#b8b2a4]">今日履约进度</p>
            <p className="mt-2 font-mono text-4xl font-black">{progress}<span className="text-xl text-[#8a8577]">%</span></p>
            <p className="mt-1 text-xs text-[#8a8577]">今日履约回执 {todayFulfilled.length} · 待履约 {fulfillPending}</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#3a3b42]">
              <div className="h-full rounded-full bg-[#16A34A] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#3a3b42] bg-[#212228] p-5">
            <p className="text-xs font-semibold tracking-widest text-[#b8b2a4]">累计成交额</p>
            <p className="mt-2 font-mono text-4xl font-black text-[#E8B54D]">{money(totalAmount)}</p>
            <p className="mt-1 text-xs text-[#8a8577]">累计 · 全部订单族</p>
          </div>
          <div className="rounded-2xl border border-[#3a3b42] bg-[#212228] p-5">
            <p className="text-xs font-semibold tracking-widest text-[#b8b2a4]">待办数（只展示）</p>
            <p className="mt-2 font-mono text-4xl font-black">{todoCount}</p>
            <p className="mt-1 text-xs text-[#8a8577]">待履约 + 待治理审批 · 提醒分端至 PC / 手机</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
          {/* 在架货品库存条 */}
          <div className="rounded-2xl border border-[#3a3b42] bg-[#212228] p-5">
            <p className="text-xs font-semibold tracking-widest text-[#b8b2a4]">在架货品 · 库存陈列</p>
            <div className="mt-3 space-y-2.5">
              {myLs.length === 0 && <p className="rounded-lg border border-dashed border-[#3a3b42] p-4 text-center text-xs text-[#8a8577]">名下铺面暂无在架货品</p>}
              {myLs.slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg bg-[#2b2c33] px-3 py-2">
                  <span className="truncate text-sm">{l.title}</span>
                  <span className="font-mono text-sm font-bold text-[#E8B54D]">{money(l.priceCents ?? 0)}<span className="ml-1 text-[10px] text-[#8a8577]">/{l.unit}</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* 实时订单流 */}
          <div className="rounded-2xl border border-[#3a3b42] bg-[#212228] p-5">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#b8b2a4]"><Radio className="h-3.5 w-3.5" /> 实时订单流</p>
            <div className="mt-3 space-y-2">
              {stream.length === 0 && <p className="rounded-lg border border-dashed border-[#3a3b42] p-4 text-center text-xs text-[#8a8577]">暂无订单流</p>}
              {stream.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg bg-[#2b2c33] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold">{o.code}</p>
                    <p className="truncate text-[11px] text-[#8a8577]">{orderStatusMeta(o.status).label} · {o.boothCode ?? '—'} · {o.buyerContainerId ?? ''}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#E8B54D]">{money(o.amountCents ?? 0)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#6b6c73]">
          现场看板只展示状态，不做提醒；待审批提醒在 PC 驾驶舱、待履约提醒在手机作业端（X-MARKET-UE-01 提醒分端）
        </p>
      </div>
    </div>
  );
}
