// X-MARKET-05：Market = B 端交易平台/铺面层。五大专业市场 + Booth 双层权属 + B2B 询价闭环。
// P1/P2：客户无铺主操作；P3：按身份过滤；P4/P5：开铺约束与权属校验。
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, Briefcase, ArrowRight, Plus, Send, Factory, Network } from 'lucide-react';
import { api } from '../api/client';
import type { MarketGroup } from '../api/client';
import type { BoothRow, Container, HatRow, InquiryRow } from '../../shared/types';
import { useAuth } from '../Auth';
import { colorOf, marketLabel, canOperate, canOpenMarket, isAdminRole, hatLabel, roleLabel, PRO_MARKET_ORDER } from '../lib/domain';

function kindLabel(kind: string): string {
  return kind === 'supply' ? '供给方实体铺' : 'DU 经营实体铺';
}

export default function Market() {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<MarketGroup[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [hats, setHats] = useState<HatRow[]>([]);
  const [inq, setInq] = useState<InquiryRow[]>([]);
  const [active, setActive] = useState<string>('Y');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'du' | 'supply'>('du');
  const [msg, setMsg] = useState('');

  // B2B 询价面板
  const [inqBooth, setInqBooth] = useState('');
  const [inqItem, setInqItem] = useState('');
  const [inqMsg, setInqMsg] = useState('');

  const mayOperate = canOperate(user?.hatRole);
  const isAdmin = isAdminRole(user?.hatRole);

  useEffect(() => {
    void api.markets().then((r) => setMarkets(r.markets));
    void api.marketBooths().then(setBooths);
    void api.containers().then(setContainers);
    void api.units().then(setHats);
    void api.inquiries().then(setInq);
  }, []);

  const ordered = useMemo(
    () => PRO_MARKET_ORDER.map((c) => markets.find((m) => m.code === c)).filter((m): m is MarketGroup => Boolean(m)),
    [markets],
  );
  const current = ordered.find((m) => m.code === active);
  const marketBooths = booths.filter((b) => b.marketCode === active);
  const supplyBooths = marketBooths.filter((b) => b.kind === 'supply');
  const duBooths = marketBooths.filter((b) => b.kind === 'du');

  // DU 多店：当前 DU 名下所有经营实体铺
  const myStores = booths.filter((b) => user?.hatRole === 'DU' && b.kind === 'du' && b.ownerUnitId === user.hatId);

  const containerName = (id: string): string => containers.find((u) => u.id === id)?.name ?? id;
  const hatOf = (id: string): HatRow | undefined => hats.find((h) => h.id === id);

  const canOpen = current ? canOpenMarket(current.code, kind, user?.hatRole) : false;

  const createBooth = (): void => {
    if (!current || !user?.hatId) return;
    setMsg('');
    api.createBooth({ domain: current.code, kind, name, franchise: 'direct' })
      .then((r) => {
        setMsg(`已开新铺 ${r.code}（${r.kindLabel}，权属：${r.ownerUnitId}）`);
        setName(''); setOpen(false);
        return api.marketBooths();
      })
      .then(setBooths)
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : '开铺失败'));
  };

  const refreshInq = (): void => { void api.inquiries().then(setInq); };

  const submitInquiry = (): void => {
    if (!inqBooth || !inqItem) return;
    setInqMsg('');
    api.createInquiry({ boothId: inqBooth, title: inqItem, detail: inqMsg })
      .then(() => { setInqMsg('询价已发送，等待铺主报价'); setInqItem(''); setInqBooth(''); return api.inquiries(); })
      .then(setInq)
      .catch((e: unknown) => setInqMsg(e instanceof Error ? e.message : '询价失败'));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-serif-display text-2xl font-black">Market · 企业采购中心（B 端交易平台）</p>
            <p className="mt-1 text-sm text-[#6b665a]">
              五大专业市场各自独立。Market 只做交易（询价/报价/合同/订单），不经营、不持资源、不执行作业；作业系统归属 Booth 实体系统。
            </p>
          </div>
          {mayOperate && (
            <button onClick={() => setOpen((v) => !v)} className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#17181d] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
              <Plus className="h-4 w-4" /> 新开铺
            </button>
          )}
        </div>
        {!mayOperate && (
          <p className="mt-2 rounded-md bg-[#f3eee3] px-3 py-2 text-xs text-[#8a6d3b]">
            客户视角（{user?.hat ? roleLabel(user.hatRole ?? '') : '未登录'}）：可浏览与询价，不展示开铺/上架等铺主操作（P1/P2）。
          </p>
        )}
      </div>

      {/* 专业市场 tab（P4：后缀按各选项自身分类） */}
      <div className="flex flex-wrap gap-2">
        {ordered.map((m) => (
          <button key={m.code} onClick={() => setActive(m.code)}
            className={`rounded-lg border px-4 py-2 text-left transition ${active === m.code ? 'border-transparent text-white shadow-[4px_4px_0_rgba(23,24,29,0.18)]' : 'bg-white hover:bg-[#efeae0]'}`}
            style={active === m.code ? { backgroundColor: colorOf(m.code) } : undefined}>
            <span className="flex items-center gap-2 font-serif-display text-base font-black">
              <Store className="h-4 w-4" /> Market-{m.code}
            </span>
            <span className={`text-xs ${active === m.code ? 'text-white/85' : 'text-[#8a8577]'}`}>{m.marketTitle} · 摊 {m.supplyCount + m.duCount}</span>
          </button>
        ))}
      </div>

      {current && (
        <div className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="font-semibold">铺主：</span>
            <span>{current.supplyOwner} / DU{current.canFranchise ? '（可加盟）' : '（仅平台直营）'}</span>
            <span><b>运营方</b> {current.operatorRole}</span>
            <span><b>项目线</b> {current.projectLine}</span>
            <span className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs">客户界面：{current.clientFace === 'mall' ? 'Mall(C端)' : 'Market(B端)'}</span>
          </div>
        </div>
      )}

      {/* Booth 双层权属：供给方实体铺 / DU 经营实体铺 */}
      {current && (
        <div className="grid gap-4 md:grid-cols-2">
          <BoothGroup title="上游 · 供给方实体铺" icon={<Factory className="h-4 w-4" />} booths={supplyBooths} color={colorOf(active)} containerName={containerName} />
          <BoothGroup title="中游 · DU 经营实体铺" icon={<Briefcase className="h-4 w-4" />} booths={duBooths} color={colorOf(active)} containerName={containerName}
            onInquire={(id) => setInqBooth(id)} canBuy />
        </div>
      )}

      {/* DU 多店经营台 */}
      {user?.hatRole === 'DU' && myStores.length > 0 && (
        <div className="rounded-xl border bg-[#17181d] p-5 text-[#f5f2eb]">
          <p className="flex items-center gap-2 font-serif-display text-lg font-black"><Network className="h-5 w-5" /> 经营台 · 一个 DU 多店总览</p>
          <p className="mt-1 text-xs text-white/70">DU 为唯一经营主体，直营/加盟；跨店经营不分裂主体，执行帽分管各店（店铺 tab 切换进铺面）。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {myStores.map((b) => (
              <Link key={b.id} to={`/market/booth/${b.id}`} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
                <span className="font-mono text-xs">{b.code}</span> {b.name}
                <span className="rounded bg-white/15 px-1.5 text-[10px]">{marketLabel(b.marketCode)}·{b.execHat}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* B2B 询价（客户 XU 用，P6） */}
      {current && !mayOperate && (
        <div className="rounded-xl border bg-white p-5">
          <p className="flex items-center gap-2 font-serif-display text-lg font-black"><Send className="h-4 w-4" /> B2B 采购询价</p>
          <p className="mt-1 text-xs text-[#8a8577]">询价 → 铺主报价 → 合同 → 下单（企业采购走 Market，不走 Mall 个人购买）。</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <select value={inqBooth} onChange={(e) => setInqBooth(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
              <option value="">选择询价铺面</option>
              {duBooths.concat(supplyBooths).map((b) => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}
            </select>
            <input value={inqItem} onChange={(e) => setInqItem(e.target.value)} placeholder="采购品类/规格" className="rounded-md border px-3 py-2 text-sm" />
            <input value={inqMsg} onChange={(e) => setInqMsg(e.target.value)} placeholder="数量/交期/备注" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <button onClick={submitInquiry} className="mt-3 rounded-md bg-[#b8862b] px-4 py-2 text-sm font-medium text-white hover:opacity-90">发送询价</button>
          {inqMsg && <p className="mt-2 text-xs text-[#8a6d3b]">{inqMsg}</p>}
        </div>
      )}

      {/* 询价/报价清单（按身份可见） */}
      <InquiryList inquiries={inq} booths={booths} containerName={containerName} hatOf={hatOf} isAdmin={isAdmin} canOperate={mayOperate} viewerUnit={user?.hatId ?? ''} refresh={refreshInq} />

      {/* 新开铺面板（仅经营/供给/运营方，P2） */}
      {open && mayOperate && current && (
        <div className="rounded-xl border bg-white p-5">
          <p className="font-serif-display text-lg font-black">在 Market-{current.code}（{current.marketTitle}）开新铺</p>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <label className="flex items-center gap-1.5"><input type="radio" checked={kind === 'du'} onChange={() => setKind('du')} /> DU 经营实体铺（{current.duBooth}，执行帽 {current.duExecHat}）</label>
              <label className="flex items-center gap-1.5"><input type="radio" checked={kind === 'supply'} onChange={() => setKind('supply')} /> 供给方实体铺（{current.supplyBooth}）</label>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="铺名（如 云驿·智场空间 3 号店）" className="w-full rounded-md border px-3 py-2 text-sm" />
            {!canOpen ? (
              <p className="rounded-md bg-[#fbeaea] px-3 py-2 text-sm text-[#b0413e]">
                当前身份 {roleLabel(user?.hatRole ?? '')} 不可在该市场开此类铺：
                {kind === 'du'
                  ? (current.canFranchise ? 'DU 直营或加盟可开店' : 'E/T 仅平台直营 DU 可开店（无加盟）')
                  : `供给方实体铺仅 ${current.supplyOwner} 可开`}
              </p>
            ) : (
              <p className="rounded-md bg-[#eef7ee] px-3 py-2 text-sm text-[#2f7d5b]">
                权属固定为当前身份「{hatLabel(user?.hatRole ?? '')} · {containerName(user?.hatId ?? '')}」；跨主体使用他方 Booth 属越权，已禁止（P5）。
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={createBooth} disabled={!canOpen || !name.trim()} className="rounded-md bg-[#17181d] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">提交开铺</button>
              <button onClick={() => setOpen(false)} className="rounded-md border px-4 py-2 text-sm">取消</button>
            </div>
          </div>
          {msg && <p className="mt-2 text-sm text-[#2f7d5b]">{msg}</p>}
        </div>
      )}
    </div>
  );
}

function BoothGroup({ title, icon, booths, color, containerName, onInquire, canBuy }: {
  title: string; icon: ReactNode; booths: BoothRow[]; color: string;
  containerName: (id: string) => string; onInquire?: (id: string) => void; canBuy?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="mb-3 flex items-center gap-2 font-serif-display text-base font-black" style={{ color }}>{icon} {title}</p>
      <div className="space-y-3">
        {booths.length === 0 && <p className="text-sm text-[#8a8577]">暂无铺面</p>}
        {booths.map((b) => (
          <div key={b.id} className="rounded-lg border border-[#e4ded2] p-3 transition hover:shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <div className="flex items-center justify-between">
              <Link to={`/market/booth/${b.id}`} className="font-semibold hover:underline">{b.name}</Link>
              <span className="font-mono text-xs text-[#8a8577]">{b.code}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-[#6b665a]">{b.frontDesc}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8a8577]">
              <span>铺主：{containerName(b.ownerUnitId)}</span>
              {b.execHat && <span className="rounded bg-[#f3eee3] px-1.5 py-0.5">执行帽 {b.execHat}</span>}
              <span className="rounded bg-[#f3eee3] px-1.5 py-0.5">{kindLabel(b.kind)}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Link to={`/market/booth/${b.id}`} className="rounded-md border px-2.5 py-1 text-xs hover:bg-[#efeae0]">进铺面</Link>
              {canBuy && onInquire && <button onClick={() => onInquire(b.id)} className="rounded-md bg-[#b8862b] px-2.5 py-1 text-xs text-white hover:opacity-90">询价</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InquiryList({ inquiries, booths, containerName, hatOf, isAdmin, canOperate, viewerUnit, refresh }: {
  inquiries: InquiryRow[]; booths: BoothRow[]; containerName: (id: string) => string;
  hatOf: (id: string) => HatRow | undefined; isAdmin: boolean; canOperate: boolean; viewerUnit: string;
  refresh: () => void;
}) {
  const visible = inquiries.filter((q) =>
    isAdmin
    || q.buyerContainerId === viewerUnit
    || (canOperate && booths.some((b) => b.id === q.boothId && b.ownerUnitId === viewerUnit)),
  );
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [err, setErr] = useState('');
  const isSeller = (q: InquiryRow): boolean =>
    canOperate && booths.some((b) => b.id === q.boothId && b.ownerUnitId === viewerUnit);
  const isBuyer = (q: InquiryRow): boolean => q.buyerContainerId === viewerUnit;

  const quote = (q: InquiryRow): void => {
    const cents = Math.round(Number(quotePrice) * 100);
    if (!Number.isFinite(cents) || cents <= 0) { setErr('请输入有效报价金额'); return; }
    setErr('');
    api.quoteInquiry(q.id, { quoteCents: cents })
      .then(() => { setQuoteId(''); setQuotePrice(''); refresh(); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '报价失败'));
  };
  const contract = (q: InquiryRow): void => {
    api.contractInquiry(q.id).then(refresh).catch((e: unknown) => setErr(e instanceof Error ? e.message : '合同失败'));
  };
  const placeOrder = (q: InquiryRow): void => {
    api.createOrder({ boothId: q.boothId, amountCents: q.quoteCents, side: 'B', inquiryId: q.id })
      .then((o) => { setErr(''); window.alert(`已下单 ${o.code}（P6 B2B 闭环完成，履约由 Booth 实体系统承接）`); refresh(); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '下单失败'));
  };

  if (visible.length === 0) return null;
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="flex items-center gap-2 font-serif-display text-lg font-black"><ShieldCheck className="h-4 w-4" /> 询价 → 报价 → 合同 → 下单（P6 B2B 闭环 · {visible.length}）</p>
      {err && <p className="mt-2 rounded bg-[#f3eee3] px-2 py-1 text-xs text-[#8a6d3b]">{err}</p>}
      <div className="mt-3 space-y-2">
        {visible.map((q) => {
          const h = hatOf(q.buyerContainerId);
          const stageLabel: Record<string, string> = { inquiry: '询价中', quoted: '已报价', contracted: '已签合同', ordered: '已下单' };
          return (
            <div key={q.id} className="rounded-lg border border-[#e4ded2] p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#17181d] px-2 py-0.5 text-xs text-white">{stageLabel[q.status] ?? q.status}</span>
                <span className="font-medium">{q.title}</span>
                <span className="text-xs text-[#8a8577]">铺面 {booths.find((b) => b.id === q.boothId)?.code ?? q.boothId}</span>
                {q.quoteCents != null && <span className="rounded bg-[#eef7ee] px-1.5 py-0.5 text-xs text-[#2f7d5b]">报价 ¥{(q.quoteCents / 100).toFixed(2)}</span>}
                {q.contractNo && <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-xs">合同 {q.contractNo}</span>}
              </div>
              <p className="mt-1 text-xs text-[#6b665a]">客户：{containerName(q.buyerContainerId)}{h ? `（${hatLabel(h.role)}）` : ''} · {q.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {q.status === 'inquiry' && isSeller(q) && (
                  quoteId === q.id ? (
                    <>
                      <input value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} placeholder="报价金额(元)" className="w-28 rounded border px-2 py-1 text-xs" />
                      <button onClick={() => quote(q)} className="rounded bg-[#b8862b] px-2 py-1 text-xs text-white hover:opacity-90">确认报价</button>
                      <button onClick={() => { setQuoteId(''); setQuotePrice(''); }} className="rounded border px-2 py-1 text-xs">取消</button>
                    </>
                  ) : (
                    <button onClick={() => { setQuoteId(q.id); setQuotePrice(''); }} className="rounded bg-[#b8862b] px-2 py-1 text-xs text-white hover:opacity-90">报价</button>
                  )
                )}
                {q.status === 'quoted' && isBuyer(q) && (
                  <button onClick={() => contract(q)} className="rounded bg-[#17181d] px-2 py-1 text-xs text-white hover:opacity-90">确认合同</button>
                )}
                {q.status === 'contracted' && isBuyer(q) && (
                  <button onClick={() => placeOrder(q)} className="rounded bg-[#2f7d5b] px-2 py-1 text-xs text-white hover:opacity-90">下单（Order-{q.domain} 族）</button>
                )}
                {q.status === 'ordered' && <span className="text-xs text-[#8a8577]">订单已建立，履约由 Booth 实体系统承接</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
