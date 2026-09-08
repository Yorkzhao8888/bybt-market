// X-MARKET-09：/operator 经营者工作台（DU + 执行帽专属，驾驶舱型，橙主题 #B45309）。
// 顶部总览 KPI（交易额/订单/铺面数）+ 左侧导航（总览/五域铺面/询价报价/采购商城/采购单/合同/上新铺）+ 主区多铺聚合。
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, Building2, MessagesSquare, ShoppingCart,
  ClipboardList, FileText, Store, Coins, Receipt, Boxes, ChevronRight,
} from 'lucide-react';
import { api, type MarketGroup, type OrderRow } from '../api/client';
import type { BoothRow, SupplyContract, InquiryRow, Container, HatRow, DomainCode, BoothKind } from '../../shared/types';
import { useAuth } from '../Auth';
import { colorOf, canOpenMarket, workbenchOf, WORKBENCH_THEME } from '../lib/domain';
import InquiryList from '../components/InquiryList';

const ACCENT = WORKBENCH_THEME.operator.accent; // #B45309
const SOFT = WORKBENCH_THEME.operator.accentSoft; // #fbf0e0
const TEXT = WORKBENCH_THEME.operator.accentText; // #92400e

type Section = 'overview' | 'booths' | 'inquiries' | 'procurement' | 'contracts' | 'newbooth';

const yuan = (cents: number): string => (cents / 100).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' });

export default function OperatorDesk() {
  const { user } = useAuth();
  const [sec, setSec] = useState<Section>('overview');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [markets, setMarkets] = useState<MarketGroup[]>([]);
  const [contracts, setContracts] = useState<SupplyContract[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [hats, setHats] = useState<HatRow[]>([]);
  const [inq, setInq] = useState<InquiryRow[]>([]);
  const [msg, setMsg] = useState('');

  // 上新铺表单
  const [nDomain, setNDomain] = useState<DomainCode>('Y');
  const [nKind, setNKind] = useState<BoothKind>('du');
  const [nName, setNName] = useState('');
  const [nMsg, setNMsg] = useState('');

  const role = user?.hatRole ?? '';
  const cid = user?.containerId ?? '';
  const refresh = (): void => {
    void api.orders().then(setOrders);
    void api.marketBooths().then(setBooths);
    void api.supplyContracts().then(setContracts);
    void api.inquiries().then(setInq);
  };

  useEffect(() => {
    refresh();
    void api.markets().then((r) => setMarkets(r.markets));
    void api.containers().then(setContainers);
    void api.units().then(setHats);
  }, []);

  const myStores = booths.filter((b) => b.operatorContainerId === cid);
  const procurement = orders.filter((o) => o.supplierId);
  const gmv = orders.reduce((sum, o) => sum + (o.amountCents ?? 0), 0);
  const procAmount = procurement.reduce((sum, o) => sum + (o.amountCents ?? 0), 0);
  const containerName = (id: string): string => containers.find((u) => u.id === id)?.name ?? id;
  const hatOf = (id: string): HatRow | undefined => hats.find((h) => h.id === id);

  const navs: { key: Section; label: string; icon: ReactNode }[] = [
    { key: 'overview', label: '经营总览', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'booths', label: '五域铺面', icon: <Building2 className="h-4 w-4" /> },
    { key: 'inquiries', label: '询价报价', icon: <MessagesSquare className="h-4 w-4" /> },
    { key: 'procurement', label: '采购单', icon: <ClipboardList className="h-4 w-4" /> },
    { key: 'contracts', label: '采购合同', icon: <FileText className="h-4 w-4" /> },
    { key: 'newbooth', label: '上新铺', icon: <Store className="h-4 w-4" /> },
  ];

  const kpis: { label: string; value: string; icon: ReactNode }[] = [
    { label: '累计交易额', value: yuan(gmv), icon: <Coins className="h-5 w-5" /> },
    { label: '订单总数', value: `${orders.length} 单`, icon: <Receipt className="h-5 w-5" /> },
    { label: '经营铺面', value: `${myStores.length} 间`, icon: <Boxes className="h-5 w-5" /> },
  ];

  const submitBooth = (): void => {
    if (!nName.trim()) { setNMsg('请填写铺面名称'); return; }
    setNMsg('');
    api.createBooth({ domain: nDomain, kind: nKind, name: nName.trim() })
      .then((b) => { setNMsg(`已开铺：${b.code} · ${b.name}`); setNName(''); refresh(); })
      .catch((e: unknown) => setNMsg(e instanceof Error ? e.message : '开铺失败'));
  };

  const navCls = (k: Section): string =>
    `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
      sec === k ? 'font-semibold text-white shadow-[3px_3px_0_rgba(23,24,29,0.15)]' : 'text-[#4a463c] hover:bg-[#f3eee3]'
    }`;

  return (
    <div className="space-y-5">
      {/* 工作台头部（橙主题） */}
      <div className="rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ background: ACCENT }}>
            <Briefcase className="h-3.5 w-3.5" /> 经营者工作台
          </span>
          <p className="font-serif-display text-2xl font-black">DU 经营驾驶舱 · 多店聚合</p>
        </div>
        <p className="mt-1 text-sm text-[#6b665a]">
          {user?.containerName ?? cid}（{role}）· 五域经营实体铺多店经营：市场报价履约 + 向源头供给方集中采购（交易单向：唯一可与供给方交易的主体）。
        </p>
      </div>

      {/* KPI 总览卡 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-white p-4">
            <p className="flex items-center gap-2 text-xs text-[#8a8577]" style={{ color: TEXT }}>
              {k.icon} {k.label}
            </p>
            <p className="mt-1 font-serif-display text-2xl font-black">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
        {/* 左侧导航（橙激活） */}
        <aside className="h-fit rounded-xl border bg-white p-3">
          <p className="px-2 pb-2 text-xs font-semibold text-[#8a8577]">经营者功能</p>
          <div className="space-y-1">
            {navs.map((n) => (
              <button key={n.key} onClick={() => setSec(n.key)} className={navCls(n.key)}
                style={sec === n.key ? { background: ACCENT } : undefined}>
                {n.icon} {n.label}
              </button>
            ))}
            <Link to="/supply-mall" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#4a463c] transition hover:bg-[#f3eee3]">
              <ShoppingCart className="h-4 w-4" /> 采购商城 <ChevronRight className="ml-auto h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>

        {/* 主区 */}
        <main className="space-y-4">
          {sec === 'overview' && (
            <>
              <div className="rounded-xl border bg-white p-5">
                <p className="font-serif-display text-lg font-black">最近订单</p>
                <table className="mt-3 w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-[#8a8577]"><th className="py-2">单号</th><th>摘要</th><th className="text-right">金额</th><th className="text-right">状态</th></tr></thead>
                  <tbody>
                    {orders.slice(0, 6).map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">{o.code}</td>
                        <td className="max-w-[220px] truncate text-xs">{o.note}</td>
                        <td className="text-right font-mono">{yuan(o.amountCents ?? 0)}</td>
                        <td className="text-right text-xs">{o.status}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-xs text-[#8a8577]">暂无订单</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border bg-white p-5" style={{ background: SOFT }}>
                <p className="font-serif-display text-lg font-black" style={{ color: TEXT }}>经营提示</p>
                <p className="mt-1 text-sm text-[#4a463c]">
                  采购商城（合格供应商在架货品）入口在左侧；向供给方采购的唯一入口，报价 1 件起订。客户订单对手始终是 DU（信息隔离）。
                </p>
              </div>
            </>
          )}

          {sec === 'booths' && (
            <div className="grid gap-3 md:grid-cols-2">
              {myStores.map((b) => (
                <Link key={b.id} to={`/market/booths/${b.id}`} className="block rounded-xl border bg-white p-4 transition hover:shadow-[4px_4px_0_rgba(23,24,29,0.18)]" style={{ borderLeft: `4px solid ${colorOf(b.domain)}` }}>
                  <p className="flex items-center gap-2 font-serif-display text-base font-black"><Store className="h-4 w-4" style={{ color: colorOf(b.domain) }} /> {b.code}</p>
                  <p className="mt-1 text-sm">{b.name}</p>
                  <p className="mt-1 text-xs text-[#8a8577]">{b.domain} 域 · 执行帽 {b.execUnitId ?? '—'}</p>
                </Link>
              ))}
              {myStores.length === 0 && <p className="rounded-xl border bg-white p-6 text-sm text-[#8a8577]">名下暂无经营铺面，可前往「上新铺」。</p>}
            </div>
          )}

          {sec === 'inquiries' && (
            <InquiryList inquiries={inq} booths={booths} containerName={containerName} hatOf={hatOf} isAdmin={false} canOperate viewerUnit={user?.hatId ?? ''} refresh={refresh} />
          )}

          {sec === 'procurement' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex items-center gap-2 font-serif-display text-lg font-black"><ClipboardList className="h-4 w-4" style={{ color: ACCENT }} /> DU 采购单（{procurement.length}）</p>
              <p className="mt-1 text-xs text-[#8a8577]">累计采购 {yuan(procAmount)}。供给方名称仅经营台可见，客户界面全程隔离。</p>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-[#8a8577]"><th className="py-2">单号</th><th>供给方</th><th>摘要</th><th className="text-right">金额</th><th className="text-right">状态</th></tr></thead>
                <tbody>
                  {procurement.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{o.code}</td>
                      <td className="text-xs">{containerName(o.supplierId ?? '')}</td>
                      <td className="max-w-[220px] truncate text-xs">{o.note}</td>
                      <td className="text-right font-mono">{yuan(o.amountCents ?? 0)}</td>
                      <td className="text-right text-xs">{o.status}</td>
                    </tr>
                  ))}
                  {procurement.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-xs text-[#8a8577]">暂无采购单，去采购商城下单</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {sec === 'contracts' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex items-center gap-2 font-serif-display text-lg font-black"><FileText className="h-4 w-4" style={{ color: ACCENT }} /> DU 采购合同（仅经营台可见）</p>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-[#8a8577]"><th className="py-2">合同号</th><th>经营铺</th><th>供给方铺</th><th className="text-right">供货范围</th></tr></thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{c.id}</td>
                      <td className="text-xs">{c.duBoothCode}</td>
                      <td className="text-xs">{c.supplyBoothCode}</td>
                      <td className="text-right text-xs">{c.items}</td>
                    </tr>
                  ))}
                  {contracts.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-xs text-[#8a8577]">暂无采购合同</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {sec === 'newbooth' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex items-center gap-2 font-serif-display text-lg font-black"><Store className="h-4 w-4" style={{ color: ACCENT }} /> 上新经营铺</p>
              <p className="mt-1 text-xs text-[#8a8577]">DU 是唯一经营主体；E/T 域仅平台直营 DU，Y/H/DE 域可加盟。</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <select value={nDomain} onChange={(e) => setNDomain(e.target.value as DomainCode)} className="rounded-md border px-3 py-2 text-sm">
                  {markets.map((m) => (
                    <option key={m.code} value={m.code}>
                      Market-{m.code} {canOpenMarket(m.code, nKind, role) ? '' : '（不可开）'} {m.canFranchise ? '' : '· 直营'}
                    </option>
                  ))}
                </select>
                <select value={nKind} onChange={(e) => setNKind(e.target.value as BoothKind)} className="rounded-md border px-3 py-2 text-sm">
                  <option value="du">DU 经营实体铺</option>
                  <option value="supply">供给方实体铺（供给帽专用）</option>
                </select>
                <input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="铺面名称" className="rounded-md border px-3 py-2 text-sm" />
              </div>
              <button onClick={submitBooth} className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: ACCENT }}>创建铺面</button>
              {nMsg && <p className="mt-2 text-xs" style={{ color: TEXT }}>{nMsg}</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
