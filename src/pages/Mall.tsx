// Mall = C 端买家商城（CU 自然人），承载 CDX（门店销）零售商品；EDX/YDX/HDX/TDX 在 Market B 端。
// X-MARKET-UE-02：商品卡营销化（价格/准入/店铺归属/库存归属）+ 立即购买确认弹层（P0 防误触下单）+ 双称呼试行。
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileClock, ShoppingCart, ShieldCheck, Minus, Plus, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import type { MallListing, DecoratedBooth } from '../api/client';
import PowerAuditList from '../components/PowerAuditList';
import { DomainChip, SectionTitle, EmptyState } from '../components/ui';
import { colorOf, marketLabel, money } from '../lib/domain';
import { conceptTerm } from '../lib/terminology';
import DualTerm from '../components/DualTerm';
import { useAuth } from '../Auth';

/** UE-02 立即购买确认弹层目标：商品 + 数量（确认后才生成订单，P0 防误触） */
interface BuyTarget {
  listing: MallListing;
  qty: number;
}

export default function Mall() {
  const { user } = useAuth();
  const [active, setActive] = useState<string>('');
  const [booths, setBooths] = useState<DecoratedBooth[]>([]);
  const [listings, setListings] = useState<MallListing[]>([]);
  const [notice, setNotice] = useState('');
  // P0 防误触：点击立即购买先弹确认层
  const [buyTarget, setBuyTarget] = useState<BuyTarget | null>(null);
  const [buying, setBuying] = useState(false);
  // UX-01 FIX1：游客（含嵌入握手未完成）点购买 → 登入引导弹层（严禁静默吞点击）
  const [needLogin, setNeedLogin] = useState(false);
  // UX-01 FIX4：下单成功回执条（含「查看交易单 →」一键跳转）
  const [doneOrder, setDoneOrder] = useState<{ code: string; amountCents: number } | null>(null);

  useEffect(() => { void api.mallBooths().then(setBooths); }, []);
  useEffect(() => {
    void api.mallListings(active || undefined).then(setListings).catch(() => setListings([]));
  }, [active]);

  const domains = useMemo(() => ['DE', 'Y', 'H', 'E', 'T'], []);
  const mallBooths = booths.filter((b) => b.clientFace === 'mall' && (!active || b.marketCode === active));

  const openConfirm = (l: MallListing): void => {
    if (!user) { setNeedLogin(true); return; }
    setNotice('');
    setDoneOrder(null);
    setBuyTarget({ listing: l, qty: 1 });
  };

  /** 确认下单：服务端按 amountCents 记账（CU 直购无治理门槛），成功后关层回执 */
  const confirmBuy = (): void => {
    if (!buyTarget) return;
    const { listing: l, qty } = buyTarget;
    setBuying(true);
    api.createOrder({ boothId: l.boothId, listingId: l.id, amountCents: l.priceCents * qty, side: 'C' })
      .then((o) => { setDoneOrder({ code: o.code, amountCents: o.amountCents }); setNotice(''); setBuyTarget(null); })
      .catch((e: unknown) => setNotice(e instanceof Error ? e.message : '下单失败'))
      .finally(() => setBuying(false));
  };

  return (
    <div>
      <div className="rounded-xl border bg-white p-4 mb-5">
        <p className="font-serif-display text-xl font-black">买家商城</p>
        <p className="mt-1 text-sm text-[#6b665a]">个人买家的零售商城：门店店铺的零售货架在这里，企业客户批量采购请前往「企业采购」市场。</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-serif-display font-bold">{conceptTerm('booth').big}货架</span>
        <DomainChip code="" active={active === ''} onClick={() => setActive('')} />
        {domains.map((d) => (
          <span key={d} onClick={() => setActive(d)} className="cursor-pointer"><DomainChip code={d} active={active === d} /></span>
        ))}
      </div>

      {doneOrder && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#bfe3c8] bg-[#eef8f0] px-4 py-2.5 text-sm text-[#166534]">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> 下单成功 · {doneOrder.code} · {money(doneOrder.amountCents)} · 待店铺交付（演示环境暂不支持在线支付）
          </span>
          <Link to="/orders" className="inline-flex items-center gap-1 rounded-md bg-[#15803D] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
            查看交易单 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {notice && <div className="mb-4 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm font-medium text-[#7a5c16]">{notice}</div>}

      <SectionTitle sub={`${conceptTerm('product').big} · ${listings.length} 件`}>店铺（{mallBooths.length}）</SectionTitle>
      {mallBooths.map((b) => (
        <Link key={b.id} to={`/mall/booth/${b.id}`} className="mb-2 block rounded-lg border bg-white px-3 py-2 text-sm hover:bg-[#efeae0]">
          @{b.name} <span className="font-mono text-xs text-[#8a8577]">{b.code}</span>
          <span className="ml-2 text-xs text-[#8a8577]">{marketLabel(b.marketCode)} · 门店零售</span>
        </Link>
      ))}

      {listings.length === 0 ? <EmptyState text="该分类暂无上架零售商品" /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const b = l.booth;
            const color = colorOf(l.domain);
            const admitted = b?.franchise === 'direct';
            return (
              <div key={l.id} className="paper-card hard-shadow flex flex-col overflow-hidden rounded-lg">
                {/* 营销封面：域色块 + 品名首字 */}
                <div className="flex h-24 items-center justify-center" style={{ background: color }}>
                  <span className="font-serif-display text-3xl font-black text-white/90">{l.title.slice(0, 1)}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color }}>{marketLabel(l.domain)}</span>
                    {admitted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ec] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                        <ShieldCheck className="h-3 w-3" /> {conceptTerm('admission').big}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold">{l.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {l.tags.map((t) => <span key={t} className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[10px] text-[#8a8577]">{t}</span>)}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-serif-display text-2xl font-black" style={{ color }}>{money(l.priceCents)}</span>
                    <span className="text-xs text-[#8a8577]">/ {l.unit}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#8a8577]">
                    {b ? <Link to={`/mall/booth/${b.id}`} className="hover:underline">@{b.name}</Link> : <span>—</span>}
                    <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[10px]">库存 · Booth 实体系统</span>
                  </div>
                  <button onClick={() => openConfirm(l)} className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#b8862b] py-2 text-sm font-semibold text-white hover:opacity-90">
                    <ShoppingCart className="h-4 w-4" /> {conceptTerm('buyNow').big}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {user && (
        <div className="mt-5 rounded-xl border bg-white p-5">
          <p className="flex items-center gap-2 font-serif-display text-lg font-black">
            <FileClock className="h-4 w-4" style={{ color: '#b8862b' }} /> 我的<DualTerm kind="powerAudit" />
          </p>
          <p className="mt-1 text-xs text-[#8a8577]">越权操作与平台治理动作会留痕（购物进度请看上方交易单入口），仅本人可见。</p>
          <PowerAuditList scope="mine" accent="#b8862b" compact />
        </div>
      )}

      {/* UE-02 P0 防误触：立即购买确认弹层（数量 + 合计 + 取消/确认） */}
      {buyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => { if (!buying) setBuyTarget(null); }}>
          <div className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.2)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif-display text-lg font-black">确认下单</p>
              <button onClick={() => { if (!buying) setBuyTarget(null); }} className="rounded p-1 text-[#8a8577] hover:bg-[#efeae0]" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#8a8577]">确认后生成交易单，由店铺履约交付（交付进度见交易单）。</p>
            <div className="mt-3 rounded-lg border border-[#e4ded2] p-3">
              <p className="text-sm font-semibold">{buyTarget.listing.title}</p>
              <p className="mt-0.5 text-xs text-[#8a8577]">
                @{buyTarget.listing.booth?.name ?? '—'} · {marketLabel(buyTarget.listing.domain)}
                {buyTarget.listing.booth?.franchise === 'direct' ? ` · ${conceptTerm('admission').big}` : ''}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm">数量</span>
                <span className="flex items-center gap-2">
                  <button onClick={() => setBuyTarget((t) => (t && t.qty > 1 ? { ...t, qty: t.qty - 1 } : t))} className="rounded border px-1.5 py-0.5 hover:bg-[#efeae0]" aria-label="减少数量"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center font-mono text-sm font-bold">{buyTarget.qty}</span>
                  <button onClick={() => setBuyTarget((t) => (t ? { ...t, qty: Math.min(99, t.qty + 1) } : t))} className="rounded border px-1.5 py-0.5 hover:bg-[#efeae0]" aria-label="增加数量"><Plus className="h-3.5 w-3.5" /></button>
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#f0ebe0] pt-3">
                <span className="text-sm">合计</span>
                <span className="font-serif-display text-xl font-black text-[#b8862b]">{money(buyTarget.listing.priceCents * buyTarget.qty)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setBuyTarget(null)} disabled={buying} className="flex-1 rounded-md border py-2 text-sm hover:bg-[#efeae0] disabled:opacity-50">取消</button>
              <button onClick={confirmBuy} disabled={buying} className="flex-1 rounded-md bg-[#b8862b] py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {buying ? '下单中…' : '确认下单'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UX-01 FIX1：游客/嵌入未登入点购买 → 登入引导弹层（不静默吞点击） */}
      {needLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setNeedLogin(false)}>
          <div className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.2)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="需要登入">
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif-display text-lg font-black">需要登入后下单</p>
              <button onClick={() => setNeedLogin(false)} className="rounded p-1 text-[#8a8577] hover:bg-[#efeae0]" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-[#6b665a]">下单需要先登入买家 / 采购方账号（下单后由店铺直接安排交付，本演示环境无需在线支付）。</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setNeedLogin(false)} className="flex-1 rounded-md border py-2 text-sm hover:bg-[#efeae0]">先逛逛</button>
              <Link
                to="/entrance"
                className="flex flex-1 items-center justify-center gap-1 rounded-md bg-[#17181d] py-2 text-sm font-semibold text-white hover:opacity-90"
                onClick={() => setNeedLogin(false)}
              >
                去登入端 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
