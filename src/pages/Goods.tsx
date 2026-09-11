/**
 * XMK-STRUCT-01 X-Goods（E-Market 通货集市）占位页 → XMK-MALL-RICH-01 轻升级：
 * 同源商品列表只读——与 /mall 共用同一份 mallListings 数据源（GET /mall/listings，DCX 门店货架），
 * 只读浏览 + 发起采购意向入口；不含 B 端完整采购流程（询价→报价→合约→下单由后续工单交付）。
 * 消歧红线：模块≠客户端——X-Goods 是集市面 Plat（E-Market），不是某个客户端；
 *          Booth-E≠Booth-EDP——供给实体铺（Booth-E）与通货集市 Booth 形态（制造厂 Booth-EDP）是两个概念。
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, ArrowRight, Search, ShoppingBag, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import MarketLayerNav from '../components/MarketLayerNav';
import { SectionTitle } from '../components/ui';
import { api } from '../api/client';
import type { MallListing } from '../api/client';
import type { SupplyMallItem } from '../../shared/types';
import type { Order } from '../../shared/types';
import { customerApi } from '../api/customer';
import { platTerm, layerTerm, RESOURCE_SET_TERMS, BOOTH_FORM_TERMS, conceptTerm } from '../lib/terminology';
import { marketLabel, money, colorOf } from '../lib/domain';
import { useAuth } from '../Auth';

export default function Goods() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const plat = platTerm('goods');
  const marketLayer = layerTerm('market');
  const scm = RESOURCE_SET_TERMS.scm;
  const factory = BOOTH_FORM_TERMS.xfactory;
  const [listings, setListings] = useState<MallListing[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [err, setErr] = useState('');
  const [bItems, setBItems] = useState<SupplyMallItem[]>([]);
  const [bErr, setBErr] = useState('');
  const [bDone, setBDone] = useState('');
  const [bQty, setBQty] = useState<Record<string, number>>({});
  const [bLoaded, setBLoaded] = useState(false);
  const [bBusy, setBBusy] = useState('');

  useEffect(() => {
    void api.supplyMall()
      .then((d) => { setBItems(d); setBLoaded(true); })
      .catch((e: unknown) => { setBErr(e instanceof Error ? e.message : '企业采购专区加载失败'); setBLoaded(true); });
  }, []);

  /** C（EU-CHAIN-01）：B 端企业采购一键下单——orders POST 族码口径（EX-/YX-…），mall C 端与 goods B 端双轨并存 */
  const runBOrder = (it: SupplyMallItem): void => {
    if (!user) { navigate('/entrance'); return; }
    setBErr(''); setBDone('');
    setBBusy(it.id);
    const qty = bQty[it.id] ?? 1;
    api.createOrder({ supplierProductId: it.id, qty })
      .then((o: Order) => setBDone(`企业采购单已生成：${o.code}（${it.name} × ${qty}${it.unit}，按 ${it.domain} 域族码口径落库）`))
      .catch((e: unknown) => setBErr(e instanceof Error ? e.message : '下单失败'))
      .finally(() => setBBusy(''));
  };

  useEffect(() => { void api.mallListings().then(setListings).catch(() => setListings([])); }, []);

  const cats = useMemo(() => ([
    { code: '', label: '全部品类' },
    { code: 'food', label: '食品生鲜' },
    { code: 'grain', label: '粮油调味' },
    { code: 'specialty', label: '地方特产' },
    { code: 'daily', label: '日用百货' },
  ]), []);
  const filtered = useMemo(() => {
    let list = listings;
    if (cat) list = list.filter((l) => l.category === cat);
    const kw = q.trim();
    if (kw) list = list.filter((l) => l.title.includes(kw) || (l.desc ?? '').includes(kw));
    return list;
  }, [listings, cat, q]);

  /** 只读页唯一动线：发起采购意向（未登录跳登入端引导；非 CU 服务端 403 红条呈现） */
  const runIntent = (l: MallListing): void => {
    if (!user) { navigate('/entrance'); return; }
    setErr(''); setDoneMsg('');
    customerApi.postIntent({ title: `采购意向：${l.title}`, desc: `自 ${plat?.plat} 只读列表发起 · ${money(l.priceCents)}/${l.unit}` })
      .then(() => setDoneMsg(`已提交${conceptTerm('customerIntent').big}：${l.title}（去客集工作台查看）`))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '提交失败'));
  };

  return (
    <div>
      <MarketLayerNav active="market" />

      {/* Plat 头卡 */}
      <div className="mb-5 rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex flex-wrap items-center gap-2">
          <Boxes className="h-5 w-5 text-[#8a8577]" />
          <p className="font-serif-display text-xl font-black">
            {plat?.plat} · {plat?.big}
          </p>
          <span className="rounded border border-[#e4ded2] bg-[#faf8f3] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#6b665a]">
            {plat?.plat} = {plat?.market}
          </span>
          <span className="text-xs text-[#8a8577]">{marketLayer?.sys}</span>
        </div>
        <p className="mt-1.5 text-sm text-[#6b665a]">
          {scm?.sys}——{scm?.big}资源在{marketLayer?.big}成交：{marketLayer?.pos}。
          本页为同源商品只读列表（与{layerTerm('customer')?.big}共用 DCX 门店货架数据）+ 企业采购专区（B 端，XMK-EU-CHAIN-01）。
        </p>
      </div>

      {/* 只读筛选：品类 + 关键词 */}
      <div className="mb-4 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-serif-display font-bold">通货货源</span>
          {cats.map((m) => (
            <button
              key={m.code}
              onClick={() => setCat(m.code)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${cat === m.code ? 'border-[#17181d] bg-[#17181d] text-white' : 'border-[#e4ded2] bg-[#faf7f0] text-[#6b665a] hover:border-[#17181d]'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e4ded2] bg-[#faf7f0] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#8a8577]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜货源标题 / 描述"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#b0aa9c]"
            aria-label="搜索货源"
          />
          <span className="font-mono text-xs text-[#8a8577]">{filtered.length} 件</span>
        </div>
      </div>

      {doneMsg && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#c7d7f5] bg-[#eef3fc] px-4 py-2.5 text-sm text-[#1D4ED8]">
          <span className="flex items-center gap-1.5 font-semibold"><CheckCircle2 className="h-4 w-4" /> {doneMsg}</span>
          <Link to="/customer" className="inline-flex items-center gap-1 rounded-md bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
            {conceptTerm('customerWorkbench').big} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#f3c9c9] bg-[#fdf0f0] px-4 py-2.5 text-sm font-medium text-[#b91c1c]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {/* 同源商品只读网格（无下单/报价/合约入口） */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c9c2b2] bg-[#faf8f3] p-6 text-sm text-[#6b665a]">没有匹配的货源，换个关键词或品类试试。</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((l) => (
            <div key={l.id} className="paper-card overflow-hidden rounded-lg">
              {l.img ? (
                <img src={l.img} alt={l.title} loading="lazy" className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-20 items-center justify-center" style={{ background: colorOf(l.domain) }}>
                  <span className="font-serif-display text-2xl font-black text-white/90">{l.title.slice(0, 1)}</span>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold" style={{ color: colorOf(l.domain) }}>{marketLabel(l.domain)}</span>
                  {l.booth?.franchise === 'direct' && (
                    <span className="inline-flex items-center gap-1 font-bold text-[#15803D]"><ShieldCheck className="h-3 w-3" />{conceptTerm('admission').big}</span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm font-semibold" title={l.title}>{l.title}</p>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="font-serif-display text-lg font-black text-[#b8862b]">{money(l.priceCents)}<span className="ml-0.5 text-[10px] font-normal text-[#8a8577]">/{l.unit}</span></span>
                  <button
                    onClick={() => runIntent(l)}
                    className="inline-flex items-center gap-1 rounded border border-[#c7d7f5] px-2 py-1 text-[11px] font-semibold text-[#1D4ED8] hover:bg-[#eef3fc]"
                    title="发起采购意向（客集）"
                  >
                    <ShoppingBag className="h-3 w-3" /> 采购意向
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 企业采购专区（XMK-EU-CHAIN-01 C：B 端 EX-/YX- 采购单口径，mall C 端与 goods B 端双轨并存） */}
      <div className="mt-6">
        <SectionTitle>
          企业采购专区
          <span className="ml-2 align-middle text-xs font-normal text-[#8a8577]">B 端 · 供集在架货品 · EX-/YX- 采购单口径</span>
        </SectionTitle>
        {bErr ? (
          <div className="mt-3 rounded-lg border border-[#f3c1c1] bg-[#fdf1f1] p-4 text-sm font-semibold text-[#b91c1c]">
            {bErr}
            {!user && (
              <Link to="/entrance" className="ml-2 inline-flex items-center underline">
                去登入端 <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ) : bItems.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-[#c9c2b2] bg-[#faf8f3] p-4 text-sm text-[#8a8577]">供集暂无在架货品（合格供应商上架后此处承接）。</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bItems.map((p) => (
              <div key={p.id} className="paper-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: colorOf(p.domain) }}>{marketLabel(p.domain)}</span>
                  <span className="text-[11px] font-semibold text-[#8a8577]">{p.boothCode || p.boothId}</span>
                </div>
                <p className="mt-1.5 truncate text-sm font-bold" title={p.name}>{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-[#8a8577]">{p.spec || '标准规格'} · 库存 {p.stock ?? '—'}{p.supplierName ? ` · ${p.supplierName}` : ''}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-serif-display text-lg font-black text-[#b8862b]">{money(p.priceCents)}<span className="ml-0.5 text-[10px] font-normal text-[#8a8577]">/{p.unit}</span></span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={bQty[p.id] ?? 1}
                      onChange={(e) => setBQty({ ...bQty, [p.id]: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-14 rounded border border-[#d8d2c2] px-1.5 py-1 text-right text-xs"
                      aria-label={`采购数量 ${p.name}`}
                    />
                    <button
                      onClick={() => runBOrder(p)}
                      disabled={bBusy === p.id}
                      className="inline-flex items-center gap-1 rounded bg-[#17181d] px-2.5 py-1.5 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <ShoppingBag className="h-3 w-3" /> {bBusy === p.id ? '下单中…' : '一键下单'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {bDone && (
          <div className="mt-3 rounded-lg border border-[#bfe3c8] bg-[#f0faf3] p-3 text-sm font-bold text-[#166534]">
            {bDone}
          </div>
        )}
      </div>

      {/* 品牌露出（XMK-EU-CHAIN-01 D：百泰OS） */}
      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[#a49e8f]">
        <Boxes className="h-3.5 w-3.5" /> 百泰OS · 知味数智生态驱动
      </p>
      {/* 占位说明卡（保留 STRUCT-01 消歧内容） */}
      <div className="mt-5 rounded-xl border border-dashed border-[#c9c2b2] bg-[#faf8f3] p-6">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-[#b0aa9c]" />
          <p className="font-serif-display text-sm font-bold">只读浏览 · B 端完整采购流程后续工单交付</p>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-[#6b665a]">
          <li>· 集市形态：{factory?.sys}</li>
          <li>· 资源集别名：{scm?.alias}（{scm?.big}）· 挂{layerTerm('supply')?.big}</li>
          <li>· 成交链路：询价 → 报价 → 合约 → 下单 → 交付回执</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/mall"
            className="inline-flex items-center gap-1 rounded-md bg-[#17181d] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            前往{layerTerm('customer')?.big}（商城 {platTerm('mall')?.plat}） <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/market"
            className="inline-flex items-center gap-1 rounded-md border border-[#17181d] px-3 py-1.5 text-xs font-bold text-[#17181d] hover:bg-[#f5f2eb]"
          >
            返回集市（企业采购中心） <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
