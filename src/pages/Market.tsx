// X-MARKET-UE-02：Market = 采购方（XU）工作台（B 端采购首页，浏览引导型，蓝主题）。
// 全局搜索 + 只看准入 + 合格供给卡片（准入徽章/资质摘要/店主店员/在架商品）+ 采购进度流五段 + 我的采购单；
// 双称呼试行：文案一律取 terminology.ts 常量表，禁止写死；供给/经营/治理分属 /supplier /operator /govern 独立工作台。
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Send, Search, ShieldCheck, FileClock, ListChecks, Package } from 'lucide-react';
import { api } from '../api/client';
import type { MarketGroup } from '../api/client';
import type { BoothRow, Container, HatRow, InquiryRow, Listing, OrderRow } from '../../shared/types';
import { TRUST_EXPOSURE } from '../../shared/types';
import { useAuth } from '../Auth';
import { colorOf, canOperate, isAdminRole, roleLabel, PRO_MARKET_ORDER, workbenchOf, WORKBENCH_THEME, money, MARKET_TITLES } from '../lib/domain';
import { conceptTerm, roleTerm } from '../lib/terminology';
import InquiryList from '../components/InquiryList';
import MarketLayerNav from '../components/MarketLayerNav';
import PowerAuditList from '../components/PowerAuditList';
import PowerBadge from '../components/PowerBadge';
import OrderStatusBadge from '../components/OrderStatusBadge';
import DualTerm from '../components/DualTerm';

/** 准入两态（UE-02）：直营=平台直营准入背书；加盟=加盟资质核验（字面真实，不作「准入合格」） */
type AdmitKind = 'admitted' | 'join';
const admitOf = (b: BoothRow): AdmitKind => (b.franchise === 'direct' ? 'admitted' : 'join');

/** 采购进度五段（询价→报价→合同→下单→交付）当前步推导 */
const PROGRESS_STEPS = ['询价', '报价', '合同', '下单', '交付'];
function progressOf(inq: InquiryRow[], orders: OrderRow[]): { step: number; hint: string; alert?: boolean } {
  const activeOrder = orders.find((o) => ['pending', 'pending_approval', 'fulfilling'].includes(o.status));
  if (activeOrder) {
    if (activeOrder.status === 'fulfilling') return { step: 5, hint: `${activeOrder.code} 店铺履约交付中` };
    if (activeOrder.status === 'pending_approval') return { step: 4, hint: `${activeOrder.code} 已下单 · 大额审批中`, alert: true };
    return { step: 4, hint: `${activeOrder.code} 已下单 · 待店铺交付` };
  }
  const latest = [...inq].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).pop();
  if (latest && latest.status !== 'ordered') {
    const s = latest.status === 'inquiry' ? 1 : latest.status === 'quoted' ? 2 : 3;
    return { step: s, hint: `${latest.code} ${latest.title}` };
  }
  if (latest && latest.status === 'ordered') return { step: 5, hint: `${latest.code} 已完成下单交付闭环` };
  const doneOrder = orders.find((o) => o.status === 'done');
  if (doneOrder) return { step: 5, hint: `${doneOrder.code} 已完成` };
  return { step: 0, hint: '尚未发起采购 · 选择店铺发送询价' };
}

export default function Market() {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<MarketGroup[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [hats, setHats] = useState<HatRow[]>([]);
  const [inq, setInq] = useState<InquiryRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [listingsByBooth, setListingsByBooth] = useState<Record<string, Listing[]>>({});
  const [active, setActive] = useState<string>('Y');
  // UE-02 全局搜索 + 只看准入
  const [query, setQuery] = useState('');
  const [admitOnly, setAdmitOnly] = useState(false);

  // B2B 询价面板
  const [inqBooth, setInqBooth] = useState('');
  const [inqItem, setInqItem] = useState('');
  const [inqMsg, setInqMsg] = useState('');
  const [inqErr, setInqErr] = useState('');

  const mayOperate = canOperate(user?.hatRole);
  const isAdmin = isAdminRole(user?.hatRole);
  const isClient = !!user && workbenchOf(user.hatRole) === 'client';

  useEffect(() => {
    void api.markets().then((r) => setMarkets(r.markets));
    void api.containers().then(setContainers);
    void api.units().then(setHats);
    void api.inquiries().then(setInq).catch(() => undefined);
    void api.orders().then(setOrders).catch(() => undefined);
  }, []);

  useEffect(() => {
    void api.marketBooths().then((bs) => {
      setBooths(bs);
      // UE-02 在架商品预览：客户视角仅 du 铺下发，逐铺拉取前店条目（种子量小可接受）
      void Promise.all(
        bs.filter((b) => b.kind === 'du').map((b) =>
          api.marketBooth(b.id).then((d) => [b.id, d.listings] as const).catch(() => [b.id, [] as Listing[]] as const),
        ),
      ).then((pairs) => setListingsByBooth(Object.fromEntries(pairs)));
    });
  }, []);

  const ordered = useMemo(
    () => PRO_MARKET_ORDER.map((c) => markets.find((m) => m.code === c)).filter((m): m is MarketGroup => Boolean(m)),
    [markets],
  );
  const current = ordered.find((m) => m.code === active);
  const duBooths = booths.filter((b) => b.kind === 'du');

  const containerName = (id: string): string => containers.find((u) => u.id === id)?.name ?? id;
  const hatOf = (id: string): HatRow | undefined => hats.find((h) => h.id === id);

  const refreshInq = (): void => { void api.inquiries().then(setInq); };

  const submitInquiry = (): void => {
    if (!inqBooth || !inqItem) return;
    setInqMsg('');
    setInqErr('');
    api.createInquiry({ boothId: inqBooth, title: inqItem, detail: inqMsg })
      .then(() => { setInqMsg('询价已发送，等待店主报价'); setInqItem(''); setInqBooth(''); return api.inquiries(); })
      .then(setInq)
      .catch((e: unknown) => setInqErr(e instanceof Error ? e.message : '询价失败'));
  };

  /* UE-02 全局搜索：商品（名称/标签）+ 店铺（名称/编码/店主）跨域匹配 */
  const q = query.trim().toLowerCase();
  const searchListings = useMemo(() => {
    if (!q) return [];
    return duBooths.flatMap((b) =>
      (listingsByBooth[b.id] ?? [])
        .filter((l) => l.title.toLowerCase().includes(q) || l.tags.some((t) => t.toLowerCase().includes(q)))
        .map((l) => ({ listing: l, booth: b })),
    );
  }, [q, duBooths, listingsByBooth]);
  const searchBooths = useMemo(() => {
    if (!q) return [];
    return duBooths.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (MARKET_TITLES[b.marketCode] ?? '').includes(query.trim()) ||
        containerName(b.ownerUnitId).toLowerCase().includes(q),
    );
  // containers 为匹配数据源（店主单位名），未列入依赖不影响正确性（登录后一次拉齐）
  }, [q, duBooths, containers]);

  const progress = progressOf(inq, orders);
  const boothListings = (id: string): Listing[] => listingsByBooth[id] ?? [];

  return (
    <div className="space-y-6">
      {/* XMK-STRUCT-01 集市域内三层导航区（X-Market 落集市层） */}
      <MarketLayerNav active="market" />
      {/* 顶部欢迎卡：双称呼徽标（采购方 · 企业客户 XU） */}
      <div className="rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-serif-display text-2xl font-black">Market · 企业采购中心（B 端交易平台）
                <span className="ml-2 inline-block align-middle rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[11px] font-semibold text-[#2563eb]">v0.1</span>
              </p>
              {isClient && (
                <span className="rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ background: WORKBENCH_THEME.client.accent }}>
                  <DualTerm hat={user?.hatRole} accent="#ffffff" />
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6b665a]">
              五大专业市场各自独立。Market 只做交易（询价/报价/合同/订单），不经营、不持资源、不执行作业；作业系统归属 Booth 实体系统。
            </p>
          </div>
        </div>
        {!mayOperate && (
          <p className="mt-2 rounded-md px-3 py-2 text-xs text-[#1e40af]" style={{ background: WORKBENCH_THEME.client.accentSoft }}>
            {user?.hatRole ? `${roleTerm(user.hatRole).big}（${roleTerm(user.hatRole).sys}）视角` : `未登录 · 游客视角（${roleLabel(user?.hatRole ?? '')}）`}：
            可浏览与询价；店主操作分属供应商 / 经营者工作台（越权由服务端 403 兜底）。
          </p>
        )}
      </div>

      {/* UE-02 全局搜索 + 只看准入 */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8577]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`搜索${conceptTerm('product').big} / 品类 / 店铺（跨五域）`}
              className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1D4ED8]"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm select-none">
            <input type="checkbox" checked={admitOnly} onChange={(e) => setAdmitOnly(e.target.checked)} className="accent-[#15803D]" />
            <ShieldCheck className="h-4 w-4 text-[#15803D]" />
            只看准入<span className="text-[10px] text-[#8a8577]">（{conceptTerm('admission').sys}）</span>
          </label>
        </div>
        {q && (
          <div className="mt-3 space-y-2 border-t border-[#e4ded2] pt-3">
            <p className="text-xs text-[#8a8577]">
              「{query.trim()}」命中 {conceptTerm('product').big} {searchListings.length} 件 · {conceptTerm('booth').big} {searchBooths.length} 间
            </p>
            {searchBooths
              .filter((b) => !admitOnly || admitOf(b) === 'admitted')
              .map((b) => (
                <Link key={b.id} to={`/market/booth/${b.id}`} className="flex items-center justify-between rounded-md border border-[#e4ded2] px-3 py-1.5 text-sm hover:bg-[#efeae0]">
                  <span>{b.name} <span className="font-mono text-xs text-[#8a8577]">{b.code}</span></span>
                  <span className="text-xs text-[#8a8577]">Market-{b.marketCode} · {containerName(b.ownerUnitId)}</span>
                </Link>
              ))}
            {searchListings
              .filter(({ booth: b }) => !admitOnly || admitOf(b) === 'admitted')
              .map(({ listing: l, booth: b }) => (
                <Link key={l.id} to={`/market/booth/${b.id}`} className="flex items-center justify-between rounded-md border border-[#e4ded2] px-3 py-1.5 text-sm hover:bg-[#efeae0]">
                  <span className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" style={{ color: colorOf(l.domain) }} />
                    {l.title}
                    <span className="text-xs text-[#8a8577]">@{b.name}</span>
                  </span>
                  <span className="font-mono text-sm font-bold" style={{ color: colorOf(l.domain) }}>{money(l.priceCents)}</span>
                </Link>
              ))}
            {searchListings.length === 0 && searchBooths.length === 0 && (
              <p className="text-sm text-[#8a8577]">无匹配结果</p>
            )}
          </div>
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
            <span className="font-semibold"><DualTerm kind="booth" />主：</span>
            <span>{current.supplyOwner} / DU{current.canFranchise ? '（可加盟）' : '（仅平台直营）'}</span>
            <span><b>运营方</b> {current.operatorRole}</span>
            <span><b>项目线</b> {current.projectLine}</span>
            <span className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs">客户界面：{current.clientFace === 'mall' ? 'Mall(C端)' : 'Market(B端)'}</span>
          </div>
        </div>
      )}

      {/* UE-02 采购进度流：询价→报价→合同→下单→交付 五段显性化 */}
      <div className="rounded-xl border bg-white p-5">
        <p className="flex items-center gap-2 font-serif-display text-lg font-black">
          <ListChecks className="h-4 w-4" style={{ color: WORKBENCH_THEME.client.accent }} /> <DualTerm kind="progress" />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {PROGRESS_STEPS.map((label, i) => {
            const n = i + 1;
            const done = progress.step > n;
            const activeNow = progress.step === n;
            return (
              <span key={label} className="flex items-center gap-1">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${done || activeNow ? 'text-white' : 'bg-[#f3eee3] text-[#8a8577]'}`}
                  style={done || activeNow ? { background: progress.alert && activeNow ? '#D97706' : WORKBENCH_THEME.client.accent } : undefined}
                >
                  {done ? '✓' : n} {label}
                </span>
                {n < PROGRESS_STEPS.length && <span className="text-[#c9c2b2]">→</span>}
              </span>
            );
          })}
        </div>
        <p className={`mt-2 text-xs ${progress.alert ? 'font-semibold text-[#B45309]' : 'text-[#6b665a]'}`}>{progress.hint}</p>
      </div>

      {/* UE-02 合格供给卡片（中游 DU 店铺网格）：准入徽章 + 资质摘要 + 店主/店员 + 在架商品 */}
      {current && (
        <BoothGroup
          title={`中游 · DU 经营${conceptTerm('booth').big}`}
          booths={duBooths.filter((b) => b.marketCode === active).filter((b) => !admitOnly || admitOf(b) === 'admitted')}
          color={colorOf(active)}
          containerName={containerName}
          listingsByBooth={listingsByBooth}
          onInquire={(id) => setInqBooth(id)}
        />
      )}

      {/* 经营/供给/治理操作分属专属工作台：/operator · /supplier · /govern（X-MARKET-09） */}

      {/* B2B 询价面板（采购方工作台主功能区） */}
      {current && !mayOperate && (
        <div className="rounded-xl border bg-white p-5">
          <p className="flex items-center gap-2 font-serif-display text-lg font-black"><Send className="h-4 w-4" /> <DualTerm kind="inquiry" /> <PowerBadge kind="manage" /></p>
          <p className="mt-1 text-xs text-[#8a8577]">询价 → 店主报价 → 合同 → 下单（企业采购走 Market，不走 Mall 个人购买）。发起询价属 <b>管·端决策</b> 权位动作。</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <select value={inqBooth} onChange={(e) => setInqBooth(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
              <option value="">选择询价店铺</option>
              {duBooths.filter((b) => b.marketCode === active).map((b) => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}
            </select>
            <input value={inqItem} onChange={(e) => setInqItem(e.target.value)} placeholder="采购品类/规格" className="rounded-md border px-3 py-2 text-sm" />
            <input value={inqMsg} onChange={(e) => setInqMsg(e.target.value)} placeholder="数量/交期/备注" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={submitInquiry} className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: WORKBENCH_THEME.client.accent }}>发送询价</button>
            <PowerBadge kind="manage" />
          </div>
          {inqMsg && <p className="mt-2 text-xs text-[#1e40af]">{inqMsg}</p>}
          {inqErr && <p className="mt-2 rounded border-l-4 border-l-[#b4402e] bg-[#fdeaea] px-2 py-1 text-xs text-[#b4402e]">{inqErr}</p>}
        </div>
      )}

      {/* UE-02 我的采购单表格：彩色状态徽标 + 大号状态名（双称呼） */}
      {user && orders.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <p className="font-serif-display text-lg font-black"><DualTerm kind="myOrders" accent={WORKBENCH_THEME.client.accent} /></p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#e4ded2] text-left text-xs text-[#8a8577]">
                  <th className="py-2 pr-3 font-medium">单号</th>
                  <th className="py-2 pr-3 font-medium">店铺 / 商品</th>
                  <th className="py-2 pr-3 font-medium">金额</th>
                  <th className="py-2 pr-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-b border-[#f0ebe0]">
                    <td className="py-2 pr-3 font-mono text-xs">{o.code}</td>
                    <td className="py-2 pr-3">
                      {o.boothName}
                      {o.listingTitle ? <span className="text-xs text-[#8a8577]"> · {o.listingTitle}</span> : null}
                    </td>
                    <td className="py-2 pr-3 font-mono">{money(o.amountCents)}</td>
                    <td className="py-2 pr-3"><OrderStatusBadge status={o.status} note={o.approvalNote} dual /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[#8a8577]">完整单据与交付回执见「交易单」页。</p>
        </div>
      )}

      {/* 询价/报价清单（按身份可见） */}
      <InquiryList inquiries={inq} booths={booths} containerName={containerName} hatOf={hatOf} isAdmin={isAdmin} canOperate={mayOperate} viewerUnit={user?.hatId ?? ''} refresh={refreshInq} />

      {/* 我的留痕台账（X-MARKET-13：询价/签约/下单与越权尝试全留痕，仅本人可见） */}
      {user && (
        <div className="rounded-xl border bg-white p-5">
          <p className="flex items-center gap-2 font-serif-display text-lg font-black">
            <FileClock className="h-4 w-4" style={{ color: WORKBENCH_THEME.client.accent }} /> 我的<DualTerm kind="powerAudit" />
          </p>
          <p className="mt-1 text-xs text-[#8a8577]">询价/签约/下单等交易动作与越权尝试全部留痕，仅本人可见。</p>
          <PowerAuditList scope="mine" accent={WORKBENCH_THEME.client.accent} compact />
        </div>
      )}
    </div>
  );
}

/** UE-02 合格供给卡片：准入徽章（直营/加盟两态）+ 域资质摘要（TRUST_EXPOSURE 脱敏露出）+ 店主/店员 + 在架商品 */
function BoothGroup({ title, booths, color, containerName, listingsByBooth, onInquire }: {
  title: string; booths: BoothRow[]; color: string;
  containerName: (id: string) => string;
  listingsByBooth: Record<string, Listing[]>;
  onInquire?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="mb-3 flex items-center gap-2 font-serif-display text-base font-black" style={{ color }}>{title}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {booths.length === 0 && <p className="text-sm text-[#8a8577]">暂无符合条件的店铺</p>}
        {booths.map((b) => {
          const admitted = admitOf(b) === 'admitted';
          const trust = TRUST_EXPOSURE[b.marketCode];
          const list = listingsByBooth[b.id] ?? [];
          return (
            <div key={b.id} className="rounded-lg border border-[#e4ded2] p-3 transition hover:shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/market/booth/${b.id}`} className="font-semibold hover:underline">{b.name}</Link>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${admitted ? 'bg-[#e8f5ec] text-[#15803D]' : 'bg-[#fbf0e0] text-[#B45309]'}`}>
                  <ShieldCheck className="h-3 w-3" />
                  {admitted ? conceptTerm('admission').big : conceptTerm('admissionJoin').big}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs text-[#8a8577]">{b.code}</span>
                <span className="text-[10px] text-[#8a8577]">{b.franchiseLabel}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-[#6b665a]">{b.frontDesc}</p>
              {/* 资质摘要（TRUST_EXPOSURE 脱敏露出：质检认证 / 服务等级 / 交付时效；售后对手=DU） */}
              {trust && (
                <p className="mt-2 rounded bg-[#f3eee3] px-2 py-1 text-[11px] text-[#6b665a]" title={`售后：${trust.afterSales}`}>
                  资质：{trust.quality.join(' · ')} ｜ {trust.serviceLevel} ｜ {trust.leadTime}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8a8577]">
                <span><DualTerm hat="DU" />：{containerName(b.ownerUnitId)}</span>
                {b.execHat && <span className="rounded bg-[#f3eee3] px-1.5 py-0.5">店员 · {b.execHat}</span>}
              </div>
              {/* 在架商品（价格 + 状态） */}
              {list.length > 0 && (
                <div className="mt-2 space-y-1">
                  {list.slice(0, 2).map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded border border-[#f0ebe0] px-2 py-1 text-xs">
                      <span className="truncate">{l.title}</span>
                      <span className="flex items-center gap-2">
                        <span className="rounded bg-[#e8f5ec] px-1 text-[10px] text-[#15803D]">在架</span>
                        <span className="font-mono font-bold" style={{ color }}>{money(l.priceCents)}</span>
                      </span>
                    </div>
                  ))}
                  {list.length > 2 && <p className="text-[10px] text-[#8a8577]">共 {list.length} 件在架 · 进店铺查看全部</p>}
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Link to={`/market/booth/${b.id}`} className="rounded-md border px-2.5 py-1 text-xs hover:bg-[#efeae0]">进店铺</Link>
                {onInquire && <button onClick={() => onInquire(b.id)} className="rounded-md px-2.5 py-1 text-xs text-white hover:opacity-90" style={{ background: WORKBENCH_THEME.client.accent }}>询价</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// InquiryList 已抽至 src/components/InquiryList.tsx（Market 采购方工作台与 OperatorDesk 经营者工作台共用）
