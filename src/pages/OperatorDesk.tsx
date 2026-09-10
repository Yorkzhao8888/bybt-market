// X-MARKET-09：/operator 经营者工作台（DU + 执行帽专属，驾驶舱型，橙主题 #B45309）。
// 顶部总览 KPI（交易额/订单/铺面数）+ 左侧导航（总览/五域铺面/询价报价/采购商城/采购单/合同/上新铺）+ 主区多铺聚合。
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, Building2, MessagesSquare, ShoppingCart,
  ClipboardList, FileText, FileClock, Store, Coins, Receipt, Boxes, ChevronRight, Smartphone,
  Landmark, Warehouse, Lock, PackageCheck,
} from 'lucide-react';
import { api, type MarketGroup, type OrderRow } from '../api/client';
import type { BoothRow, SupplyContract, InquiryRow, Container, HatRow, DomainCode, BoothKind, Listing, SupplyMallItem } from '../../shared/types';
import { xSupplyApi } from '../x-supply';
import type { XSupplyOrder } from '../../shared/x-supply';
import { useAuth } from '../Auth';
import { colorOf, canOpenMarket, workbenchOf, WORKBENCH_THEME, POWER_BADGE, orderStatusMeta, EXEC_ACCENT } from '../lib/domain';
import { duChildTermOf, duChildBadgeTextOf, duChildDomainsOf } from '../lib/terminology';
import InquiryList from '../components/InquiryList';
import PowerAuditList from '../components/PowerAuditList';
import PowerBadge from '../components/PowerBadge';
import OrderStatusBadge from '../components/OrderStatusBadge';

const ACCENT = WORKBENCH_THEME.operator.accent; // #B45309
const SOFT = WORKBENCH_THEME.operator.accentSoft; // #fbf0e0
const TEXT = WORKBENCH_THEME.operator.accentText; // #92400e

type Section = 'overview' | 'booths' | 'erp' | 'inquiries' | 'procurement' | 'contracts' | 'newbooth' | 'audit' | 'exec';

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
  const [listings, setListings] = useState<Listing[]>([]);
  const [erpMall, setErpMall] = useState<SupplyMallItem[]>([]);
  const [erpSupplyOrders, setErpSupplyOrders] = useState<XSupplyOrder[]>([]);
  const [msg, setMsg] = useState('');
  const [execMsg, setExecMsg] = useState('');
  const [execErr, setExecErr] = useState('');
  const [execBusy, setExecBusy] = useState(false);

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
    void api.mallListings().then(setListings);
    void api.supplyMall().then(setErpMall).catch(() => setErpMall([]));
    void xSupplyApi.supplyOrders.list().then(setErpSupplyOrders).catch(() => setErpSupplyOrders([]));
  };

  useEffect(() => {
    refresh();
    void api.markets().then((r) => setMarkets(r.markets));
    void api.containers().then(setContainers);
    void api.units().then(setHats);
  }, []);

  // X-MARKET-ERP-01 经营线 ERP 嵌入（数据同源：Market 既有单据/货品 + 供给单 confirmed 联动）
  const erpConfirmed = erpSupplyOrders.filter((s) => s.status === 'confirmed');
  const erpSales = orders.filter((o) => !o.supplierId);
  const erpStockTotal = erpMall.reduce((sum, m) => sum + (m.stock ?? 0), 0);
  const erpLow = erpMall.filter((m) => (m.stock ?? 0) < 20);

  const myStores = booths.filter((b) => b.operatorContainerId === cid);
  const procurement = orders.filter((o) => o.supplierId);
  const gmv = orders.reduce((sum, o) => sum + (o.amountCents ?? 0), 0);
  const procAmount = procurement.reduce((sum, o) => sum + (o.amountCents ?? 0), 0);
  const fulfillable = orders.filter((o) => o.status === 'pending');
  const receipts = orders
    .flatMap((o) => (o.fulfillments ?? []).map((r) => ({ ...r, code: o.code, family: o.family })))
    .sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const containerName = (id: string): string => containers.find((u) => u.id === id)?.name ?? id;
  const hatOf = (id: string): HatRow | undefined => hats.find((h) => h.id === id);

  const doFulfill = async (id: string): Promise<void> => {
    setExecMsg('');
    setExecErr('');
    setExecBusy(true);
    try {
      const r = await api.fulfillOrder(id, '执行帽履约回执（交付确认，X-MARKET-16）');
      setExecMsg(`回执 ${r.receipt.id}：操作者 ${r.receipt.actor_user} · 帽 ${r.receipt.actor_hat} · ${r.receipt.booth_code}`);
      refresh();
    } catch (e) {
      setExecErr(e instanceof Error ? e.message : '履约执行失败');
    } finally {
      setExecBusy(false);
    }
  };

  const navs: { key: Section; label: string; icon: ReactNode }[] = [
    { key: 'overview', label: '经营总览', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'booths', label: '我的铺面', icon: <Building2 className="h-4 w-4" /> },
    { key: 'inquiries', label: '询价报价', icon: <MessagesSquare className="h-4 w-4" /> },
    { key: 'procurement', label: '采购单', icon: <ClipboardList className="h-4 w-4" /> },
    { key: 'contracts', label: '采购合同', icon: <FileText className="h-4 w-4" /> },
    { key: 'newbooth', label: '上新铺', icon: <Store className="h-4 w-4" /> },
    { key: 'erp', label: 'ERP 经营台', icon: <Landmark className="h-4 w-4" /> },
    { key: 'audit', label: '我的留痕', icon: <FileClock className="h-4 w-4" /> },
  ];

  // X-MARKET-UE-01 待办分级（强提醒红点）
  const myStoreIds = new Set(myStores.map((b) => b.id));
  const pendingInq = inq.filter((i) => i.status === 'inquiry' && myStoreIds.has(i.boothId));
  const pendingApproval = procurement.filter((o) => o.status === 'pending_approval');
  const todos: { label: string; count: number; go: Section }[] = [
    { label: '待报价 RFQ', count: pendingInq.length, go: 'inquiries' },
    { label: '待审批采购单', count: pendingApproval.length, go: 'procurement' },
    { label: '待履约', count: fulfillable.length, go: 'exec' },
  ];
  const todoTotal = todos.reduce((s, t) => s + t.count, 0);
  const hour = new Date().getHours();
  const greeting = hour < 6 ? '凌晨好' : hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';

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
      {/* 工作台头部（橙主题 · UE-01 欢迎区+待办分级条） */}
      <div className="rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ background: ACCENT }}>
                <Briefcase className="h-3.5 w-3.5" /> 经营工作台 · *DU
              </span>
              <p className="font-serif-display text-2xl font-black">{greeting}，{user?.containerName ?? cid}</p>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[#6b665a]">
              {/* X-MARKET-19 复合经营：多挂 *DU 分经营号徽章组（按域呈现经营端归属），无多挂回退单域口径 */}
              {duChildBadgeTextOf(user?.duChildDomains) ? (
                duChildDomainsOf(user?.duChildDomains).map((b) => (
                  <span key={b.domain} className="rounded border px-1.5 py-0.5 text-[11px] font-semibold" style={{ borderColor: ACCENT, color: ACCENT }}>{b.term}</span>
                ))
              ) : (
                <span>{duChildTermOf(user?.domainView)}（分经营号）</span>
              )}
              <span>· {user?.hatId ?? role} · 名下铺面 {myStores.map((b) => b.code).join(' / ') || '—'}</span>
            </p>
            <p className="mt-0.5 text-xs text-[#a39b88]">交易单向：唯一可与供给方交易的主体 · 复合经营核算按 *DU 分经营号维度呈现（X-MARKET-19）；权限复用 DU 单帽三权链，不重复加帽；ERP 只认 DU 主经营号（ERP-HAT-01 边界）</p>
          </div>
          <Link to="/operator/mobile" className="flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-bold transition hover:-translate-y-0.5" style={{ borderColor: EXEC_ACCENT, color: EXEC_ACCENT }}>
            <Smartphone className="h-4 w-4" /> 手机作业端
          </Link>
        </div>
        {/* 待办分级条 */}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {todos.map((t) => (
            <button key={t.label} onClick={() => setSec(t.go)} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition hover:-translate-y-0.5 ${t.count > 0 ? 'border-[#e8b4b8] bg-[#fdf2f2] font-semibold' : 'border-[#eee7d9] bg-[#faf7ef] text-[#8a8577]'}`}>
              <span className="flex items-center gap-2">
                {t.count > 0 && <span className="inline-flex h-2 w-2 rounded-full bg-[#DC2626]" />}
                {t.label}
              </span>
              <span className={t.count > 0 ? 'ticker text-base font-black text-[#DC2626]' : 'ticker text-base'}>{t.count}</span>
            </button>
          ))}
        </div>
        {todoTotal === 0 && <p className="mt-2 text-xs text-[#8a8577]">当前无待办 · 交易与履约链路畅通</p>}
      </div>

      {/* KPI 总览卡 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)] transition hover:-translate-y-0.5 hover:shadow-[5px_6px_0_rgba(23,24,29,0.16)]">
            <p className="flex items-center gap-2 text-xs" style={{ color: TEXT }}>
              {k.icon} {k.label}
            </p>
            <p className="mt-1 font-serif-display text-2xl font-black">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
        {/* 左侧导航（橙激活） */}
        <aside className="h-fit rounded-xl border bg-white p-3">
          <p className="flex items-center gap-1.5 px-2 pb-2 text-xs font-semibold text-[#8a8577]">
            经营决策（管） <PowerBadge kind="manage" text={false} />
          </p>
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
          <p className="mt-3 flex items-center gap-1.5 border-t border-[#eee6d6] px-2 pb-2 pt-3 text-xs font-semibold text-[#8a8577]">
            作业执行（办） <PowerBadge kind="operate" text={false} />
          </p>
          <div className="space-y-1">
            <button onClick={() => setSec('exec')} className={navCls('exec')} style={sec === 'exec' ? { background: ACCENT } : undefined}>
              <Boxes className="h-4 w-4" /> 履约执行（YDX/CDX）
            </button>
            <p className="px-3 text-[10px] leading-relaxed text-[#a39b88]">作业以域映射执行帽（*DX 展示名 YDX/CDX 等）落地，审计穿透真实登录人（X-MARKET-16）；执行双线 *MX/*DX 验证中（X-MARKET-17，本期不迁移）</p>
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
                        <td className="text-right"><OrderStatusBadge status={o.status} note={o.approvalNote} /></td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={4} className="py-5 text-center text-xs text-[#8a8577]">暂无订单 · 可前往<Link to="/supply-mall" className="font-semibold underline" style={{ color: ACCENT }}>采购商城</Link>向供给方下单，或在询价报价中承接客户 RFQ</td></tr>
                    )}
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

          {sec === 'erp' && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-5" style={{ borderLeft: '4px solid #0F766E' }}>
                <p className="flex items-center gap-2 font-serif-display text-lg font-black" style={{ color: TEXT }}>
                  <Landmark className="h-5 w-5 text-teal-700" /> ERP · 经营台（嵌入外壳 · X-MARKET-ERP-01）
                </p>
                <p className="mt-2 text-sm text-[#4a463c]">
                  Market 是 ERP 的新外壳：单据/库存/联动入口在本视角内直接可达（经营线目标 95%）。操作复用既有三权 checkPower 与审计留痕；ERP 独立资源底座不变、不迁移数据、不改主库结构。菜单按「容器 → 帽 → 三权」裁剪（OAS JWT/13U 在 ERP 对接层同源收敛，X-MARKET-ERP-01 V4）。
                </p>
              </div>

              {/* V1 单据四卡 */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <button onClick={() => setSec('procurement')} className="rounded-xl border bg-white p-4 text-left transition hover:shadow-md" style={{ borderLeft: `4px solid ${ACCENT}` }}>
                  <p className="text-xs text-[#8a8577]">采购单 · 可操作</p>
                  <p className="font-serif-display text-2xl font-black" style={{ color: TEXT }}>{procurement.length}</p>
                  <p className="mt-1 text-[11px] font-semibold text-teal-700">打开采购单 →</p>
                </button>
                <button onClick={() => setSec('overview')} className="rounded-xl border bg-white p-4 text-left transition hover:shadow-md" style={{ borderLeft: `4px solid ${ACCENT}` }}>
                  <p className="text-xs text-[#8a8577]">销售单 · 可操作</p>
                  <p className="font-serif-display text-2xl font-black" style={{ color: TEXT }}>{orders.filter((o) => !o.supplierId).length}</p>
                  <p className="mt-1 text-[11px] font-semibold text-teal-700">打开经营总览 →</p>
                </button>
                <div className="rounded-xl border bg-white p-4" style={{ borderLeft: '4px solid #0F766E' }}>
                  <p className="text-xs text-[#8a8577]">入库单 · 联动</p>
                  <p className="font-serif-display text-2xl font-black" style={{ color: TEXT }}>{erpConfirmed.length}</p>
                  <p className="mt-1 text-[11px] text-[#6b665a]">confirmed 供给单联动清单见下</p>
                </div>
                <button onClick={() => setSec('exec')} className="rounded-xl border bg-white p-4 text-left transition hover:shadow-md" style={{ borderLeft: `4px solid ${ACCENT}` }}>
                  <p className="text-xs text-[#8a8577]">出库/履约单 · 可操作</p>
                  <p className="font-serif-display text-2xl font-black" style={{ color: TEXT }}>{fulfillable.length}</p>
                  <p className="mt-1 text-[11px] font-semibold text-teal-700">打开作业执行 →</p>
                </button>
              </div>

              {/* V1 库存总览/预警（供给商城货品 · DU 采购视野） */}
              <div className="rounded-xl border bg-white p-5">
                <p className="flex items-center gap-2 font-serif-display text-lg font-black" style={{ color: TEXT }}>
                  <Warehouse className="h-5 w-5 text-teal-700" /> 库存总览与预警（供给商城货品 · 采购视野）
                </p>
                <p className="mt-1 text-[11px] text-[#8a8577]">库存归属 Booth 实体系统（WH），此处为 Market 侧只读总览；预警阈值 20（演示口径）。</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-[#8a8577]">在架货品</p>
                    <p className="font-serif-display text-xl font-black" style={{ color: TEXT }}>{erpMall.length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-[#8a8577]">库存合计</p>
                    <p className="font-serif-display text-xl font-black" style={{ color: TEXT }}>{erpMall.reduce((n, m) => n + (m.stock ?? 0), 0)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-[#8a8577]">低库存预警</p>
                    <p className="font-serif-display text-xl font-black text-red-600">{erpLow.length}</p>
                  </div>
                </div>
                {erpLow.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {erpLow.map((m) => (
                      <li key={m.id} className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs">
                        <span className="font-semibold text-red-700">{m.name}</span>
                        <span className="text-red-600">库存 {m.stock ?? 0} · {m.supplierName ?? m.boothCode}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 最近单据（抽样可打开） */}
              <div className="rounded-xl border bg-white p-5">
                <p className="flex items-center gap-2 font-serif-display text-lg font-black" style={{ color: TEXT }}>
                  <FileClock className="h-5 w-5 text-teal-700" /> 最近单据（抽样）
                </p>
                <table className="mt-3 w-full text-left text-xs">
                  <thead className="text-[#8a8577]">
                    <tr><th className="py-1.5">单号</th><th>族</th><th className="text-right">金额</th><th>状态</th></tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="border-t">
                        <td className="py-1.5 font-mono">{o.code}</td>
                        <td>{o.family}</td>
                        <td className="text-right font-mono">¥{(o.amountCents / 100).toFixed(2)}</td>
                        <td><OrderStatusBadge status={o.status} dual /></td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-[#8a8577]">暂无单据</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* 链路：confirmed 供给单 → 入库/履约联动入口 */}
              <div className="rounded-xl border bg-white p-5">
                <p className="flex items-center gap-2 font-serif-display text-lg font-black" style={{ color: TEXT }}>
                  <PackageCheck className="h-5 w-5 text-teal-700" /> 供给单 confirmed → 入库/履约联动
                </p>
                <p className="mt-1 text-[11px] text-[#8a8577]">confirmed 为入库输入源（X-SUPPLY-02）；入库登记作业归 Booth 实体系统（WH，另一窗口），Market 侧提供联动清单与去向标注。</p>
                <ul className="mt-3 space-y-1.5">
                  {erpConfirmed.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-xs">
                      <span className="font-mono font-semibold">{s.code}</span>
                      <span className="text-[#6b665a]">{s.supplierContainerName} · {s.supplierBoothCode}</span>
                      <span className="font-mono">¥{((s.quotedCents ?? 0) / 100).toFixed(2)}</span>
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">入库去向：Booth 实体系统（WH）· 待接线</span>
                    </li>
                  ))}
                  {erpConfirmed.length === 0 && <li className="rounded border border-dashed px-3 py-3 text-center text-xs text-[#8a8577]">暂无 confirmed 供给单——在「采购商城」完成供给单闭环后自动进入联动清单</li>}
                </ul>
              </div>

              {/* V5 留守项声明 */}
              <div className="rounded-xl border border-dashed bg-[#faf9f5] p-5">
                <p className="flex items-center gap-2 font-serif-display text-base font-black" style={{ color: TEXT }}>
                  <Lock className="h-4 w-4 text-[#8a8577]" /> 留守 ERP（不进 Market · V5）
                </p>
                <p className="mt-1 text-xs text-[#6b665a]">
                  租户管理 / 适配层 / 月结 / CSV 导出 / 权限矩阵——运维项仍从 ERP 进入，Market 端界面不复制、无入口（X-MARKET-ERP-01）。
                </p>
              </div>
            </div>
          )}

          {sec === 'exec' && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-5" style={{ borderLeft: `4px solid ${POWER_BADGE.operate.color}` }}>
                <p className="flex items-center gap-2 font-serif-display text-lg font-black">
                  <PowerBadge kind="operate" /> 作业执行（办）——执行帽作业层
                </p>
                <p className="mt-2 text-sm text-[#4a463c]">
                  办在端：履约与门店作业由执行细化层（*DX）落地——<b>Y→YDX 履执行</b>、<b>H→HDX 人执行</b>、<b>T→TDX 技执行</b>、
                  <b>E→EDX 物执行</b>（履约衔接，对应 X-OFD 履约中心）、<b>D/C→CDX 销执行</b>（门店销售作业，对应 X-Shop/X-Mall）。
                  执行双线（X-MARKET-17 v1.1 验证结论：运营线 *MX→*MXX 与业务线 *DX→DXX 分工成立，本期先验证不迁移）：六域运营 *MX（DMX 主业/EMX/CMX/TMX/YMX/HMX）→ *MXX（手下）· 业务执行 *DX（DDX 主业/EDX/CDX/TDX/YDX/HDX）→ DXX（其手下），一一对应执行铺面；D*X 废弃旧帽（DYX/DHX/DTX/DEX/DCX）过渡保留、标注办位语义（展示名口径，Booth 码与帽 ID 不变）；执行身份不独立登录，依附经营视角（代办/只读）。
                </p>
                <p className="mt-2 text-xs text-[#8a8577]">
                  穿透追责（X-MARKET-16）：本台履约回执由服务端按订单域自动映射执行帽（客户端不可伪造），审计记
                  <b> actor_user（真实登录人）+ actor_hat（执行帽）</b>双字段，Booth 实体系统契约同字段可追溯。
                </p>
              </div>
              <div className="rounded-xl border bg-white p-5">
                <p className="font-serif-display text-lg font-black">履约执行 · 生效中订单（{fulfillable.length}）</p>
                {execErr && <p className="mt-2 rounded bg-[#fdeaea] px-3 py-2 text-xs text-[#b4402e]">{execErr}</p>}
                {execMsg && <p className="mt-2 rounded bg-[#e8f5ec] px-3 py-2 text-xs text-[#166534]">{execMsg}</p>}
                <table className="mt-3 w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-[#8a8577]"><th className="py-2">单号</th><th>摘要</th><th className="text-right">金额</th><th className="text-right">操作（办）</th></tr></thead>
                  <tbody>
                    {fulfillable.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">{o.code}</td>
                        <td className="max-w-[220px] truncate text-xs">{o.note}</td>
                        <td className="text-right font-mono">{yuan(o.amountCents ?? 0)}</td>
                        <td className="text-right">
                          <button onClick={() => doFulfill(o.id)} disabled={execBusy} className="rounded px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50" style={{ background: POWER_BADGE.operate.color }}>
                            履约回执
                          </button>
                        </td>
                      </tr>
                    ))}
                    {fulfillable.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-xs text-[#8a8577]">暂无生效中（pending）订单</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border bg-white p-5">
                <p className="font-serif-display text-lg font-black">履约回执清单（Booth 契约留痕）</p>
                <table className="mt-3 w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-[#8a8577]"><th className="py-2">回执号</th><th>单号</th><th>真实登录人</th><th>执行帽</th><th>铺面</th><th className="text-right">时间</th></tr></thead>
                  <tbody>
                    {receipts.map((f) => (
                      <tr key={f.id} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">{f.id}</td>
                        <td className="font-mono text-xs">{f.code}</td>
                        <td className="text-xs font-semibold">{f.actor_user}</td>
                        <td><span className="rounded bg-[#e3edfb] px-1.5 py-0.5 text-[11px] font-bold text-[#1d4ed8]">{f.actor_hat}</span></td>
                        <td className="font-mono text-xs">{f.booth_code}</td>
                        <td className="text-right text-xs text-[#8a8577]">{new Date(f.ts).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                    {receipts.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-xs text-[#8a8577]">暂无回执</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sec === 'booths' && (
            <div className="space-y-4">
              {/* UE-01 我的铺面：铺卡 + 货品卡片式陈列（前店售卖面） */}
              <div className="grid gap-3 md:grid-cols-2">
                {myStores.map((b) => {
                  const ls = listings.filter((x) => x.boothId === b.id);
                  return (
                    <div key={b.id} className="rounded-xl border bg-white p-4" style={{ borderLeft: `4px solid ${colorOf(b.domain)}` }}>
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-2 font-serif-display text-base font-black"><Store className="h-4 w-4" style={{ color: colorOf(b.domain) }} /> {b.code}</p>
                        <Link to={`/market/booths/${b.id}`} className="text-xs font-semibold underline" style={{ color: colorOf(b.domain) }}>客户视角</Link>
                      </div>
                      <p className="mt-1 text-sm">{b.name}</p>
                      <p className="mt-0.5 text-xs text-[#8a8577]">{b.domain} 域 · 执行帽 {b.execUnitId ?? '—'}</p>
                      <div className="mt-3 border-t border-dashed border-[#eee6d6] pt-3">
                        <p className="mb-2 text-[11px] font-semibold text-[#8a8577]">在售货品（{ls.length}）· 前店售卖面</p>
                        {ls.length === 0 ? (
                          <p className="rounded-lg border border-dashed bg-[#faf7ef] px-3 py-3 text-center text-xs text-[#8a8577]">
                            该铺面暂无货品陈列 · Booth 实体系统（FAB/WH 作业层）上架后在此展示
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {ls.slice(0, 6).map((l) => (
                              <div key={l.id} className="overflow-hidden rounded-lg border bg-[#faf7ef] transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(23,24,29,0.14)]">
                                <div className="flex h-12 items-center justify-center font-serif-display text-lg font-black" style={{ background: colorOf(b.domain) }}>
                                  <span className="text-white/90">{l.title.slice(0, 2)}</span>
                                </div>
                                <div className="p-2">
                                  <p className="truncate text-xs font-semibold">{l.title}</p>
                                  <p className="mt-0.5 flex items-center justify-between text-[10px] text-[#8a8577]">
                                    <span>{l.unit}</span>
                                    <span className="ticker font-bold" style={{ color: TEXT }}>{yuan(l.priceCents)}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {myStores.length === 0 && (
                  <div className="rounded-xl border border-dashed bg-[#faf7ef] p-8 text-center md:col-span-2">
                    <p className="text-sm font-semibold">名下暂无经营铺面</p>
                    <p className="mt-1 text-xs text-[#8a8577]">DU 是唯一经营主体 · E/T 域仅平台直营</p>
                    <button onClick={() => setSec('newbooth')} className="mt-3 rounded-md px-4 py-2 text-sm font-bold text-white" style={{ background: ACCENT }}>去上新铺</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {sec === 'inquiries' && (
            <div className="space-y-4">
              {/* UE-01 待报价 RFQ 置顶卡 */}
              {pendingInq.length > 0 && (
                <div className="rounded-xl border-2 border-[#e8b4b8] bg-white p-4 shadow-[4px_4px_0_rgba(220,38,38,0.10)]">
                  <p className="flex items-center gap-2 font-serif-display text-base font-black">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#DC2626]" /> 待报价 RFQ（{pendingInq.length}）· 客户在等，优先处理
                  </p>
                  <div className="mt-3 space-y-2">
                    {pendingInq.slice(0, 3).map((q) => (
                      <div key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-[#faf7ef] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{q.title}</p>
                          <p className="text-xs text-[#8a8577]">{containerName(q.buyerContainerId ?? '')} · {new Date(q.createdAt).toLocaleDateString('zh-CN')}</p>
                        </div>
                        <span className="rounded bg-[#f3ede0] px-2 py-0.5 text-[10px] font-bold text-[#8a6d3b]">待报价</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[#8a8577]">在下方列表中直接报价（B2B 双边：XU 询价 → DU 报价 → XU 签约）</p>
                </div>
              )}
              <InquiryList inquiries={inq} booths={booths} containerName={containerName} hatOf={hatOf} isAdmin={false} canOperate viewerUnit={user?.hatId ?? ''} refresh={refresh} />
            </div>
          )}

          {sec === 'procurement' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex items-center gap-2 font-serif-display text-lg font-black"><ClipboardList className="h-4 w-4" style={{ color: ACCENT }} /> DU 采购单（{procurement.length}）</p>
              <p className="mt-1 text-xs text-[#8a8577]">累计采购 {yuan(procAmount)}。供给方名称仅经营台可见，客户界面全程隔离。</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6b665a]">
                <span className="inline-flex items-center gap-1"><OrderStatusBadge status="pending_approval" /> 单笔金额超过治理阈值时自动升级，<Link to="/govern" className="font-semibold underline" style={{ color: POWER_BADGE.govern.color }}>V*M 审批</Link>通过后生效</span>
                <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[10px] text-[#8a8577]">X-MARKET-15 阈值自动升级</span>
              </p>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-[#8a8577]"><th className="py-2">单号</th><th>供给方</th><th>摘要</th><th className="text-right">金额</th><th className="text-right">状态</th></tr></thead>
                <tbody>
                  {procurement.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{o.code}</td>
                      <td className="text-xs">{containerName(o.supplierId ?? '')}</td>
                      <td className="max-w-[220px] truncate text-xs">{o.note}</td>
                      <td className="text-right font-mono">{yuan(o.amountCents ?? 0)}</td>
                      <td className="text-right"><OrderStatusBadge status={o.status} note={o.approvalNote} /></td>
                    </tr>
                  ))}
                  {procurement.length === 0 && (
                    <tr><td colSpan={5} className="py-5 text-center text-xs text-[#8a8577]">暂无采购单 · 前往<Link to="/supply-mall" className="font-semibold underline" style={{ color: ACCENT }}>采购商城</Link>一键向合格供应商下单</td></tr>
                  )}
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
              <p className="flex items-center gap-2 font-serif-display text-lg font-black"><Store className="h-4 w-4" style={{ color: ACCENT }} /> 上新经营铺 <PowerBadge kind="manage" /></p>
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
              <button onClick={submitBooth} className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: ACCENT }}>创建铺面</button> <PowerBadge kind="manage" />
              {nMsg && <p className="mt-2 rounded border-l-4 border-l-[#b4402e] bg-[#fdeaea] px-2 py-1 text-xs text-[#b4402e]">{nMsg}</p>}
            </div>
          )}
          {sec === 'audit' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex items-center gap-2 font-serif-display text-lg font-black"><FileClock className="h-4 w-4" style={{ color: ACCENT }} /> 我的留痕（三权审计）</p>
              <p className="mt-1 text-xs text-[#8a8577]">经营动作（开铺/询价/报价/签约/采购）与越权尝试全部留痕，仅本人可见。</p>
              <PowerAuditList scope="mine" accent={ACCENT} compact />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
