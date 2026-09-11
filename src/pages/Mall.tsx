// Mall = C 端买家商城（CU 自然人），承载 CDX（门店销）零售商品；EDX/YDX/HDX/TDX 在 Market B 端。
// X-MARKET-UE-02：商品卡营销化（价格/准入/店铺归属/库存归属）+ 立即购买确认弹层（P0 防误触下单）+ 双称呼试行。
// XMK-MALL-RICH-01：逛购升级——分类筛选+关键词搜索+价格排序+商品详情弹层+逛→买动线接客集 F2/F3/供集 buyer（未登录引导不静默）。
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileClock, ShoppingCart, ShieldCheck, Minus, Plus, X, CheckCircle2, ArrowRight, Users, Search, ShoppingBag, ClipboardList, Building2, AlertCircle, Boxes } from 'lucide-react';
import { api, req } from '../api/client';
import type { MallListing, DecoratedBooth } from '../api/client';
import { customerApi } from '../api/customer';
import type { XSupplyOrder } from '../../shared/x-supply';
import PowerAuditList from '../components/PowerAuditList';
import MarketLayerNav from '../components/MarketLayerNav';
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

/** XMK-MALL-RICH-01 品类筛选元数据（与 Listing.category 对齐，渐变色与 sku 图一致） */
const CAT_META: Array<{ code: '' | 'food' | 'grain' | 'specialty' | 'daily'; label: string; color: string }> = [
  { code: '', label: '全部品类', color: '#17181d' },
  { code: 'food', label: '食品生鲜', color: '#15803D' },
  { code: 'grain', label: '粮油调味', color: '#B45309' },
  { code: 'specialty', label: '地方特产', color: '#9F1239' },
  { code: 'daily', label: '日用百货', color: '#334155' },
];
const catLabel = (c?: string): string => CAT_META.find((m) => m.code === c)?.label ?? '其他';

/** 动线成功回执：文案 + 跳转（客集工作台） */
interface DoneMsg {
  text: string;
  linkText: string;
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
  // XMK-MALL-RICH-01：逛购三件套 + 详情弹层 + 动线回执
  const [cat, setCat] = useState<'' | 'food' | 'grain' | 'specialty' | 'daily'>('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'' | 'price_asc' | 'price_desc'>('');
  const [detail, setDetail] = useState<MallListing | null>(null);
  const [doneMsg, setDoneMsg] = useState<DoneMsg | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => { void api.mallBooths().then(setBooths); }, []);
  useEffect(() => {
    void api.mallListings(active || undefined).then(setListings).catch(() => setListings([]));
  }, [active]);

  const domains = useMemo(() => ['DE', 'Y', 'H', 'E', 'T'], []);
  const mallBooths = booths.filter((b) => b.clientFace === 'mall' && (!active || b.marketCode === active));

  /** 逛购管线：域（服务端）→ 品类 → 关键词 → 排序 */
  const filtered = useMemo(() => {
    let list = listings;
    if (cat) list = list.filter((l) => l.category === cat);
    const kw = q.trim();
    if (kw) list = list.filter((l) => l.title.includes(kw) || (l.desc ?? '').includes(kw) || l.tags.some((t) => t.includes(kw)));
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    return list;
  }, [listings, cat, q, sort]);

  const openConfirm = (l: MallListing): void => {
    if (!user) { setDetail(null); setNeedLogin(true); return; }
    setNotice('');
    setErr('');
    setDoneMsg(null);
    setDoneOrder(null);
    setDetail(null);
    setBuyTarget({ listing: l, qty: 1 });
  };

  /** 确认下单：服务端按 amountCents 记账（CU 直购无治理门槛），成功后关层回执 */
  const confirmBuy = (): void => {
    if (!buyTarget) return;
    const { listing: l, qty } = buyTarget;
    setBuying(true);
    api.createOrder({ boothId: l.boothId, listingId: l.id, amountCents: l.priceCents * qty, side: 'C' })
      .then((o) => { setDoneOrder({ code: o.code, amountCents: o.amountCents }); setNotice(''); setErr(''); setDoneMsg(null); setBuyTarget(null); setDetail(null); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '下单失败'))
      .finally(() => setBuying(false));
  };

  /** 逛→买动线守卫：未登录一律弹登入引导（不静默）；非 CU 由服务端 403 以红条呈现 */
  const guardLogin = (): boolean => {
    if (!user) { setDetail(null); setNeedLogin(true); return false; }
    return true;
  };

  /** 客集 F3：发起采购意向 */
  const runIntent = (l: MallListing): void => {
    if (!guardLogin()) return;
    setErr(''); setDoneMsg(null);
    customerApi.postIntent({ title: `采购意向：${l.title}`, desc: `逛集市发起 · ${money(l.priceCents)}/${l.unit} · ${l.desc ?? ''}` })
      .then(() => { setDoneMsg({ text: `已提交${conceptTerm('customerIntent').big}：${l.title}`, linkText: '查看客集工作台' }); setDetail(null); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '提交失败'));
  };

  /** 客集 F2：提交需求单 */
  const runDemand = (l: MallListing): void => {
    if (!guardLogin()) return;
    setErr(''); setDoneMsg(null);
    customerApi.postDemand({ title: `需求：${l.title}`, desc: `逛集市发起 · 想买「${l.title}」，参考价 ${money(l.priceCents)}/${l.unit}，欢迎供货方对接` })
      .then(() => { setDoneMsg({ text: `已提交${conceptTerm('customerDemand').big}：${l.title}`, linkText: '查看客集工作台' }); setDetail(null); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '提交失败'));
  };

  /** 供集 buyer：企业采购动线（XEPZ 入驻主体可下单；XHPZ#CU 由服务端 403 红条呈现——身份矩阵不变） */
  const runSupplyBuy = (l: MallListing): void => {
    if (!guardLogin()) return;
    setErr(''); setDoneMsg(null);
    req<XSupplyOrder>('/api/supply/orders', { method: 'POST', body: JSON.stringify({ boothId: l.supplyBoothId ?? 'b-e1', title: l.title, qty: 1, unit: l.unit }) })
      .then((o) => { setDoneMsg({ text: `供集采购单已发起：${o.code}（待供给方接单报价）`, linkText: '查看供给单时间线' }); setDetail(null); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '企业采购发起失败'));
  };

  return (
    <div>
      {/* XMK-STRUCT-01 集市域内三层导航区（X-Mall=C-Market 落客集层） */}
      <MarketLayerNav active="customer" />
      {/* XMK-CRM-UI-01：三层导航客集区下的客集工作台入口（F1 挂点） */}
      <Link
        to="/customer"
        className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#e4ded2] bg-white px-4 py-3 transition-colors hover:border-[#17181d]"
      >
        <Users className="h-4 w-4 text-[#1D4ED8]" />
        <span className="font-serif-display text-sm font-black text-[#17181d]">{conceptTerm('customerWorkbench').big}</span>
        <span className="text-[11px] text-[#8a8577]">
          {conceptTerm('customerDemand').big} / {conceptTerm('customerIntent').big} / {conceptTerm('customerProfile').big} / {conceptTerm('customerTimeline').big}
        </span>
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#b0aa9c]" />
      </Link>
      <div className="rounded-xl border bg-white p-4 mb-5">
        <p className="font-serif-display text-xl font-black">买家商城</p>
        <p className="mt-1 text-sm text-[#6b665a]">个人买家的零售商城：门店店铺的零售货架在这里，企业客户批量采购请前往「企业采购」市场。</p>
      </div>

      {/* XMK-MALL-RICH-01 逛购三件套：品类筛选 + 关键词搜索 + 价格排序 */}
      <div className="mb-4 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-serif-display font-bold">逛集市</span>
          {CAT_META.map((m) => (
            <button
              key={m.code}
              onClick={() => setCat(m.code)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${cat === m.code ? 'border-transparent text-white' : 'border-[#e4ded2] bg-[#faf7f0] text-[#6b665a] hover:border-[#17181d]'}`}
              style={cat === m.code ? { background: m.color } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-[#e4ded2] bg-[#faf7f0] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#8a8577]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜商品 / 品类 / 描述，如「龙井」「鲜奶」"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#b0aa9c]"
              aria-label="搜索商品"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as '' | 'price_asc' | 'price_desc')}
            className="rounded-lg border border-[#e4ded2] bg-[#faf7f0] px-3 py-2 text-sm outline-none"
            aria-label="排序"
          >
            <option value="">综合排序</option>
            <option value="price_asc">价格从低到高</option>
            <option value="price_desc">价格从高到低</option>
          </select>
          <span className="font-mono text-xs text-[#8a8577]">{filtered.length} 件</span>
        </div>
      </div>

      {/* 域筛选（原有 DomainChip 口径保留） */}
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
      {doneMsg && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#c7d7f5] bg-[#eef3fc] px-4 py-2.5 text-sm text-[#1D4ED8]">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> {doneMsg.text}
          </span>
          <Link to="/customer" className="inline-flex items-center gap-1 rounded-md bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
            {doneMsg.linkText} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {notice && <div className="mb-4 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm font-medium text-[#7a5c16]">{notice}</div>}
      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#f3c9c9] bg-[#fdf0f0] px-4 py-2.5 text-sm font-medium text-[#b91c1c]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      <SectionTitle sub={`${conceptTerm('product').big} · ${filtered.length} 件`}>店铺（{mallBooths.length}）</SectionTitle>
      {mallBooths.map((b) => (
        <Link key={b.id} to={`/mall/booth/${b.id}`} className="mb-2 block rounded-lg border bg-white px-3 py-2 text-sm hover:bg-[#efeae0]">
          @{b.name} <span className="font-mono text-xs text-[#8a8577]">{b.code}</span>
          <span className="ml-2 text-xs text-[#8a8577]">{marketLabel(b.marketCode)} · 门店零售</span>
        </Link>
      ))}

      {filtered.length === 0 ? <EmptyState text={q || cat ? '没有匹配的商品，换个关键词或品类试试' : '该分类暂无上架零售商品'} /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const b = l.booth;
            const color = colorOf(l.domain);
            const admitted = b?.franchise === 'direct';
            return (
              <div key={l.id} className="paper-card hard-shadow flex cursor-pointer flex-col overflow-hidden rounded-lg transition-transform hover:-translate-y-0.5" onClick={() => { setErr(''); setDoneMsg(null); setDetail(l); }}>
                {/* 营销封面：本地 SVG 品类图（禁外链），缺失回落域色首字块 */}
                {l.img ? (
                  <img src={l.img} alt={l.title} loading="lazy" className="h-28 w-full object-cover" />
                ) : (
                  <div className="flex h-24 items-center justify-center" style={{ background: color }}>
                    <span className="font-serif-display text-3xl font-black text-white/90">{l.title.slice(0, 1)}</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color }}>{marketLabel(l.domain)}</span>
                    <span className="flex items-center gap-1.5">
                      {l.category && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: CAT_META.find((m) => m.code === l.category)?.color }}>
                          {catLabel(l.category)}
                        </span>
                      )}
                      {admitted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ec] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                          <ShieldCheck className="h-3 w-3" /> {conceptTerm('admission').big}
                        </span>
                      )}
                    </span>
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
                    {b ? <Link to={`/mall/booth/${b.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>@{b.name}</Link> : <span>—</span>}
                    <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[10px]">库存 · Booth 实体系统</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openConfirm(l); }} className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#b8862b] py-2 text-sm font-semibold text-white hover:opacity-90">
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

      {/* XMK-MALL-RICH-01 商品详情弹层：完整信息 + 逛→买四动线 */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDetail(null)}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-white shadow-[4px_4px_0_rgba(23,24,29,0.2)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="商品详情">
            <div className="relative">
              {detail.img ? (
                <img src={detail.img} alt={detail.title} className="h-44 w-full rounded-t-xl object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center rounded-t-xl" style={{ background: colorOf(detail.domain) }}>
                  <span className="font-serif-display text-5xl font-black text-white/90">{detail.title.slice(0, 1)}</span>
                </div>
              )}
              <button onClick={() => setDetail(null)} className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-[#57534e] hover:bg-white" aria-label="关闭详情">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                {detail.category && (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: CAT_META.find((m) => m.code === detail.category)?.color }}>
                    {catLabel(detail.category)}
                  </span>
                )}
                <span className="text-xs font-bold" style={{ color: colorOf(detail.domain) }}>{marketLabel(detail.domain)}</span>
                {detail.booth?.franchise === 'direct' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ec] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                    <ShieldCheck className="h-3 w-3" /> {conceptTerm('admission').big}
                  </span>
                )}
              </div>
              <p className="mt-2 font-serif-display text-xl font-black">{detail.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#6b665a]">{detail.desc ?? '（暂无描述）'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#8a8577]">
                <span className="font-serif-display text-2xl font-black text-[#b8862b]">{money(detail.priceCents)}<span className="ml-0.5 text-xs font-normal text-[#8a8577]">/ {detail.unit}</span></span>
                <span>库存 {detail.stock ?? '—'} {detail.unit}（Booth 实体系统）</span>
                {detail.booth && <span>门店 @{detail.booth.name} · {detail.booth.code}</span>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => openConfirm(detail)} className="col-span-2 flex items-center justify-center gap-1.5 rounded-md bg-[#b8862b] py-2.5 text-sm font-semibold text-white hover:opacity-90">
                  <ShoppingCart className="h-4 w-4" /> {conceptTerm('buyNow').big}
                </button>
                <button onClick={() => runIntent(detail)} className="flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-semibold hover:bg-[#faf7f0]">
                  <ShoppingBag className="h-4 w-4 text-[#1D4ED8]" /> 发起采购意向
                </button>
                <button onClick={() => runDemand(detail)} className="flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-semibold hover:bg-[#faf7f0]">
                  <ClipboardList className="h-4 w-4 text-[#15803D]" /> 提交需求单
                </button>
                <button onClick={() => runSupplyBuy(detail)} className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-[#c7d7f5] bg-[#f4f8ff] py-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#e8f0fe]">
                  <Building2 className="h-4 w-4" /> 企业采购（供集下单 · 企业入驻主体）
                </button>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-[#8a8577]">
                立即购买=零售交易单（C 端）；采购意向/需求单进入客集工作台（未登入会先引导登入）；企业采购走供集 buyer 动线，需企业入驻主体（XEPZ），自然人客户点按将由服务端拒绝并明示原因。
              </p>
            </div>
          </div>
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
              <p className="font-serif-display text-lg font-black">需要登入后再操作</p>
              <button onClick={() => setNeedLogin(false)} className="rounded p-1 text-[#8a8577] hover:bg-[#efeae0]" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-[#6b665a]">下单 / 发起采购意向 / 提交需求单 / 企业采购都需要先登入账号（本演示环境无需在线支付）。</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setNeedLogin(false)} className="flex-1 rounded-md border py-2 text-sm hover:bg-[#efeae0]">先逛逛</button>
              <Link
                to="/entrance"
                className="flex flex-1 items-center justify-center gap-1 rounded-md bg-[#17181d] py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                去登入端 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-[#c9c2b2] p-3 text-xs text-[#6b6f76]">
        <span className="flex items-center gap-1.5"><Boxes size={13} /> <span className="font-bold text-[#3f434a]">百泰OS</span> · 知味数智生态驱动 —— 五域集市 X-Market</span>
        <span>C 端零售动线 · 企业采购走 /goods（B 端双轨）</span>
      </div>
    </div>
  );
}
