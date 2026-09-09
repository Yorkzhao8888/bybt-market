// P7 运营治理页骨架：V*M 市场秩序 / 规则制定 / 专业 Booth 系统供给
// X-MARKET-08：VXM 云中心运营审批统筹 —— 供应商准入审核（通过/驳回可重提）+ 违规货品治理下架
// X-MARKET-09：治理者工作台 —— 紫色管控型：顶部全局统计 + 左侧导航（供应商审核/治理案件/治理规则/全局数据）
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, ScrollText, Boxes, ArrowRight, BadgeCheck, XCircle, PackageMinus, CloudCog, Gavel, Database, Ban, Lock, FileClock, SlidersHorizontal, ClipboardList } from 'lucide-react';
import { api, type GovernData, type OrderRow } from '../api/client';
import { useAuth } from '../Auth';
import { colorOf, marketLabel, hatLabel, workbenchThemeOf } from '../lib/domain';
import type { GovernThresholds, SupplierApplication, SupplierProduct } from '../../shared/types';
import PowerAuditList from '../components/PowerAuditList';
import PowerDashboardBoard from '../components/PowerDashboard';
import PowerBadge from '../components/PowerBadge';

const PURPLE = '#6d28d9';
const PURPLE_SOFT = '#f0e9fc';

// 云中心审核统筹（仅 VXM）：登记评估 + 货品治理
function CloudReview() {
  const [apps, setApps] = useState<SupplierApplication[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [msg, setMsg] = useState('');
  const [msgErr, setMsgErr] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    void Promise.all([api.allApplications(), api.allProducts()])
      .then(([a, ps]) => { setApps(a); setProducts(ps); })
      .catch(() => { setApps([]); setProducts([]); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const review = (id: string, action: 'approve' | 'reject'): void => {
    setMsg(''); setMsgErr('');
    api.reviewApplication(id, { action, rejectReason: action === 'reject' ? reason : undefined })
      .then((a) => {
        setApps((s) => s.map((x) => (x.id === a.id ? a : x)));
        setMsg(action === 'approve' ? `${a.supplierName} 已准入为合格供应商，纳入 DU 采购商城` : `已驳回 ${a.supplierName}（附原因，可重新提交）`);
        setRejectingId(null); setReason('');
      })
      .catch((e: unknown) => setMsgErr(e instanceof Error ? e.message : '审核失败'));
  };

  const takeDown = (id: string): void => {
    setMsg(''); setMsgErr('');
    api.takeDownProduct(id)
      .then((p) => { setProducts((s) => s.map((x) => (x.id === p.id ? p : x))); setMsg(`已治理下架：${p.name}`); })
      .catch((e: unknown) => setMsgErr(e instanceof Error ? e.message : '下架失败'));
  };

  const statusBadge = (s: SupplierApplication['status']): ReactNode =>
    s === 'approved'
      ? <span className="flex items-center gap-1 rounded bg-[#e8f4ee] px-1.5 py-0.5 text-[11px] font-bold text-[#2e7d54]"><BadgeCheck className="h-3 w-3" />合格</span>
      : s === 'rejected'
        ? <span className="flex items-center gap-1 rounded bg-[#fdeaea] px-1.5 py-0.5 text-[11px] font-bold text-[#b4402e]"><XCircle className="h-3 w-3" />驳回</span>
        : <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[11px] font-bold text-[#8a6d3b]">待评估</span>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#6d28d940] bg-[#f0e9fc] px-3 py-2 text-xs text-[#5b21b6]">
        <PowerBadge kind="govern" />
        <span><b>只审不落</b>：评估 ≠ 下单、治理下架 ≠ 经营——治位只做审批与审计，不直接经营（下单/上架归管位 DU / *U）。</span>
      </div>
      <div className="space-y-2">
        {apps.map((a) => (
          <div key={a.id} className="rounded-md border border-[#e4ded2] px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#17181d]">{a.supplierName}</span>
              <span className="font-mono text-xs text-[#8a8577]">{a.boothCode ?? a.boothId}</span>
              {statusBadge(a.status)}
              {(a.resubmitCount ?? 0) > 0 && <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[11px] font-bold text-[#8a6d3b]">驳回重提 {a.resubmitCount} 次</span>}
              {a.escalated && <span className="rounded bg-[#fdf3e0] px-1.5 py-0.5 text-[11px] font-bold text-[#b45309]">升级待复核（VYM）</span>}
              <span className="text-xs text-[#6b665a]">品类：{a.categories}</span>
              <span className="text-xs text-[#6b665a]">产能：{a.capacity}</span>
              <span className="text-xs text-[#6b665a]">报价意向：{a.priceIntent}</span>
            </div>
            <p className="mt-0.5 text-xs text-[#8a8577]">资质：{a.qualification}</p>
            {a.status === 'rejected' && a.rejectReason && <p className="mt-0.5 text-xs text-[#b4402e]">驳回原因：{a.rejectReason}</p>}
            {a.status === 'pending' && (
              rejectingId === a.id ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="驳回原因（必填，将反馈给供给方重新提交）" className="min-w-64 flex-1 rounded-md border px-2 py-1 text-xs" />
                  <button onClick={() => review(a.id, 'reject')} disabled={!reason.trim()} className="rounded-md bg-[#b4402e] px-3 py-1 text-xs font-medium text-white disabled:opacity-40">确认驳回</button>
                  <button onClick={() => { setRejectingId(null); setReason(''); }} className="rounded-md border px-3 py-1 text-xs">取消</button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <PowerBadge kind="govern" text={false} />
                  <button onClick={() => review(a.id, 'approve')} className="flex items-center gap-1 rounded-md bg-[#2e7d54] px-3 py-1 text-xs font-medium text-white hover:opacity-90"><BadgeCheck className="h-3.5 w-3.5" /> 通过准入</button>
                  <button onClick={() => { setRejectingId(a.id); setReason(''); }} className="flex items-center gap-1 rounded-md border border-[#b4402e] px-3 py-1 text-xs font-medium text-[#b4402e] hover:bg-[#fdeaea]"><XCircle className="h-3.5 w-3.5" /> 驳回</button>
                </div>
              )
            )}
          </div>
        ))}
        {apps.length === 0 && <div className="rounded-md border border-dashed border-[#e4ded2] px-3 py-4 text-center text-sm text-[#8a8577]">暂无供应商登记申请</div>}
      </div>

      <p className="flex items-center gap-1.5 text-sm font-bold text-[#17181d]"><PackageMinus className="h-4 w-4" /> 违规货品治理（平台运营侧可强制下架；上架权在供给方）<PowerBadge kind="govern" /></p>
      <div className="space-y-1.5">
        {products.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-md border border-[#e4ded2] px-3 py-1.5 text-sm">
            <span className="font-semibold">{p.name}</span>
            <span className="text-xs text-[#6b665a]">{p.category}{p.spec ? ` · ${p.spec}` : ''}</span>
            <span className="ticker-font text-xs font-bold">¥{(p.priceCents / 100).toLocaleString()}/{p.unit}</span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${p.status === 'on' ? 'bg-[#e8f4ee] text-[#2e7d54]' : 'bg-[#f3eee3] text-[#8a6d3b]'}`}>{p.status === 'on' ? '在架' : '已下架'}</span>
            {p.status === 'on' && <button onClick={() => takeDown(p.id)} className="ml-auto rounded-md border border-[#b4402e] px-2.5 py-0.5 text-xs font-medium text-[#b4402e] hover:bg-[#fdeaea]">治理下架</button>}
          </div>
        ))}
        {products.length === 0 && <div className="rounded-md border border-dashed border-[#e4ded2] px-3 py-3 text-center text-xs text-[#8a8577]">暂无货品</div>}
      </div>
      {msg && <p className="rounded-md bg-[#e8f4ee] px-3 py-2 text-xs text-[#2e7d54]">{msg}</p>}
      {msgErr && <p className="rounded-md border-l-4 border-l-[#b4402e] bg-[#fdeaea] px-3 py-2 text-xs text-[#b4402e]">{msgErr}</p>}
    </div>
  );
}

function Section({
  icon,
  title,
  sub,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md text-[#f5f2eb]" style={{ backgroundColor: PURPLE }}>{icon}</span>
        <div>
          <h2 className="text-base font-bold text-[#17181d]">{title}</h2>
          <p className="text-xs text-[#8a8577]">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ============ X-MARKET-15 阈值自动升级（治理触达） ============ */

/** 订单状态中文口径（含 15 新增 pending_approval/rejected） */
export function orderStatusLabel(s: OrderRow['status']): string {
  return s === 'pending' ? '待履约' : s === 'paid' ? '已支付' : s === 'fulfilling' ? '履约中' : s === 'done' ? '已完成'
    : s === 'pending_approval' ? '待治理审批' : s === 'rejected' ? '已驳回' : s;
}

/** 采购单笔阈值配置卡（规则模块；治位可改，改后下一次下单即时生效） */
function ThresholdCard() {
  const [th, setTh] = useState<GovernThresholds | null>(null);
  const [val, setVal] = useState('');
  const [msg, setMsg] = useState('');
  const [msgErr, setMsgErr] = useState('');

  const load = useCallback(() => {
    api.governThresholds()
      .then((t) => { setTh(t); setVal(String(t.procurementAmountCents / 100)); })
      .catch((e: Error) => setMsgErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = (): void => {
    setMsg(''); setMsgErr('');
    const yuan = Number(val);
    if (!Number.isFinite(yuan) || yuan <= 0) { setMsgErr('阈值须为正数（单位：元）'); return; }
    api.updateThresholds({ procurementAmountCents: Math.round(yuan * 100) })
      .then((t) => {
        setTh(t);
        setMsg(`采购单笔阈值已更新为 ¥${(t.procurementAmountCents / 100).toLocaleString()}，下一次下单即按新阈值判定`);
      })
      .catch((e: Error) => setMsgErr(e.message));
  };

  return (
    <div className="rounded-md border border-[#e4ded2] bg-white p-4">
      <p className="flex items-center gap-2 font-bold text-[#17181d]"><SlidersHorizontal className="h-4 w-4" style={{ color: PURPLE }} />采购单笔阈值（X-MARKET-15 阈值自动升级）<PowerBadge kind="govern" /></p>
      <p className="mt-1.5 text-xs leading-relaxed text-[#6b665a]">
        DU 采购商城一键下单单笔金额（单价 × 数量）超过阈值时，采购单自动升级为「待治理审批」：V*M 批准后生效（回待履约），驳回则不生效；未超阈值不受影响。阈值可配、即时生效。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#6b665a]">当前阈值</span>
        <span className="ticker-font rounded bg-[#f0e9fc] px-2 py-0.5 text-sm font-black" style={{ color: PURPLE }}>
          ¥{th ? (th.procurementAmountCents / 100).toLocaleString() : '—'}
        </span>
        <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" placeholder="如 5000" className="w-32 rounded-md border px-2 py-1 text-xs" />
        <span className="text-xs text-[#8a8577]">元</span>
        <button onClick={save} className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: PURPLE }}><SlidersHorizontal className="h-3.5 w-3.5" /> 保存并生效</button>
      </div>
      {th?.updatedAt && <p className="mt-2 text-[11px] text-[#8a8577]">最近修改：{th.updatedBy || '—'} · {new Date(th.updatedAt).toLocaleString('zh-CN')}</p>}
      {msg && <p className="mt-2 rounded-md bg-[#e8f4ee] px-3 py-2 text-xs text-[#2e7d54]">{msg}</p>}
      {msgErr && <p className="mt-2 rounded-md border-l-4 border-l-[#b4402e] bg-[#fdeaea] px-3 py-2 text-xs text-[#b4402e]">{msgErr}</p>}
    </div>
  );
}

/** 大额采购审批队列（治位帽；VXM 批准/驳回，DU 不可自批 403） */
function ApprovalList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [msg, setMsg] = useState('');
  const [msgErr, setMsgErr] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(() => { api.orders().then(setOrders).catch(() => setOrders([])); }, []);
  useEffect(() => { load(); }, [load]);

  const act = (id: string, action: 'approve' | 'reject'): void => {
    setMsg(''); setMsgErr('');
    api.approveOrder(id, { action, note: action === 'reject' ? note : undefined })
      .then((o) => {
        setMsg(action === 'approve'
          ? `采购单 ${o.code} 已批准生效（回待履约，供给方自此可见）`
          : `采购单 ${o.code} 已治理驳回，不生效`);
        setRejectingId(null); setNote(''); load();
      })
      .catch((e: unknown) => setMsgErr(e instanceof Error ? e.message : '审批失败'));
  };

  const pending = orders.filter((o) => o.supplierId && o.status === 'pending_approval');
  const judged = orders.filter((o) => o.supplierId && o.approvalNote).slice(-5).reverse();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#6d28d940] bg-[#f0e9fc] px-3 py-2 text-xs text-[#5b21b6]">
        <PowerBadge kind="govern" />
        <span><b>阈值自动升级</b>：单笔超阈值的采购单在此批准/驳回（order_approval 属治位）；DU 仅可提交不可自批。审批动作全量入审计。</span>
      </div>
      <div className="space-y-2">
        {pending.map((o) => (
          <div key={o.id} className="rounded-md border border-[#e4ded2] px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ticker-font font-bold text-[#17181d]">{o.code}</span>
              <span className="rounded bg-[#f0e9fc] px-1.5 py-0.5 text-[11px] font-bold" style={{ color: PURPLE }}>待治理审批</span>
              <span className="text-xs text-[#6b665a]">{o.boothCode} ← {o.sellerName}</span>
              <span className="ticker-font text-sm font-black" style={{ color: PURPLE }}>¥{(o.amountCents / 100).toLocaleString()}</span>
            </div>
            {o.note && <p className="mt-0.5 text-xs text-[#8a8577]">{o.note}</p>}
            {rejectingId === o.id ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="驳回意见（可空，默认「治理审批驳回」）" className="min-w-64 flex-1 rounded-md border px-2 py-1 text-xs" />
                <button onClick={() => act(o.id, 'reject')} className="rounded-md bg-[#b4402e] px-3 py-1 text-xs font-medium text-white">确认驳回</button>
                <button onClick={() => { setRejectingId(null); setNote(''); }} className="rounded-md border px-3 py-1 text-xs">取消</button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <PowerBadge kind="govern" text={false} />
                <button onClick={() => act(o.id, 'approve')} className="flex items-center gap-1 rounded-md bg-[#2e7d54] px-3 py-1 text-xs font-medium text-white hover:opacity-90"><BadgeCheck className="h-3.5 w-3.5" /> 批准生效</button>
                <button onClick={() => { setRejectingId(o.id); setNote(''); }} className="flex items-center gap-1 rounded-md border border-[#b4402e] px-3 py-1 text-xs font-medium text-[#b4402e] hover:bg-[#fdeaea]"><XCircle className="h-3.5 w-3.5" /> 驳回</button>
              </div>
            )}
          </div>
        ))}
        {pending.length === 0 && <div className="rounded-md border border-dashed border-[#e4ded2] px-3 py-4 text-center text-sm text-[#8a8577]">暂无待治理审批的采购单（超阈值下单后进入此队列）</div>}
      </div>
      {judged.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#8a8577]"><ClipboardList className="h-3.5 w-3.5" /> 最近审批留痕</p>
          {judged.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-2 rounded-md border border-[#e4ded2] px-3 py-1.5 text-xs">
              <span className="ticker-font font-bold">{o.code}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${o.status === 'rejected' ? 'bg-[#fdeaea] text-[#b4402e]' : 'bg-[#e8f4ee] text-[#2e7d54]'}`}>{orderStatusLabel(o.status)}</span>
              <span className="text-[#6b665a]">{o.approvalNote}</span>
            </div>
          ))}
        </div>
      )}
      {msg && <p className="rounded-md bg-[#e8f4ee] px-3 py-2 text-xs text-[#2e7d54]">{msg}</p>}
      {msgErr && <p className="rounded-md border-l-4 border-l-[#b4402e] bg-[#fdeaea] px-3 py-2 text-xs text-[#b4402e]">{msgErr}</p>}
    </div>
  );
}

const RULES: Array<{ icon: ReactNode; title: string; desc: string }> = [
  { icon: <Ban className="h-4 w-4" />, title: '交易单向（P0）', desc: '供给实体铺唯一交易对手 = DU；客户越权采购 403。采购商城数据只在 DU/供给方/V*M 间流转。' },
  { icon: <ShieldCheck className="h-4 w-4" />, title: '信息隔离（TRUST_EXPOSURE）', desc: '客户界面仅露出质检/脱敏产地/服务等级/交付时效/售后；严禁露出供给方名称/报价/产能/联系方式/DU 采购合同。' },
  { icon: <Gavel className="h-4 w-4" />, title: '域开店限制', desc: 'Y/H/DE 域可加盟 DU；E/T 域仅平台直营 DU。开铺按域校验铺主帽（canOpenMarket）。' },
  { icon: <Lock className="h-4 w-4" />, title: 'Booth 权属（LOCKED）', desc: '供给实体归各自供给帽；五类 DU 经营实体全部归 DU；跨主体使用他方 Booth = 越权禁止。' },
];

type GovernSec = 'review' | 'cases' | 'rules' | 'data' | 'audit';

export default function Govern() {
  const { user } = useAuth();
  const [data, setData] = useState<GovernData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [apps, setApps] = useState<SupplierApplication[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const isVxm = user?.hatRole === 'VXM';
  const [sec, setSec] = useState<GovernSec>(isVxm ? 'review' : 'cases');
  const theme = workbenchThemeOf(user?.hatRole);

  useEffect(() => {
    api.governCases().then(setData).catch((e: Error) => setErr(e.message));
    api.orders().then(setOrders).catch(() => setOrders([]));
    api.allApplications().then(setApps).catch(() => setApps([]));
    api.allProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  if (err) return <div className="py-16 text-center text-sm text-[#b4402e]">{err}</div>;
  if (!data) return <div className="py-16 text-center text-sm text-[#8a8577]">载入治理数据…</div>;

  const open = data.cases.filter((c) => c.status === 'open');
  const closed = data.cases.filter((c) => c.status === 'closed');
  const approved = apps.filter((a) => a.status === 'approved');
  const onProducts = products.filter((p) => p.status === 'on');
  const gmv = orders.reduce((sum, o) => sum + o.amountCents, 0);

  const kpis: Array<{ label: string; value: string }> = [
    { label: '供应商申请', value: String(apps.length) },
    { label: '合格供应商', value: String(approved.length) },
    { label: '在架货品', value: String(onProducts.length) },
    { label: '全局订单', value: String(orders.length) },
    { label: '交易总额', value: `¥${(gmv / 100).toLocaleString()}` },
  ];

  const NAV: Array<{ key: GovernSec; label: string; icon: ReactNode; show?: boolean }> = [
    { key: 'review', label: '供应商审核', icon: <CloudCog className="h-4 w-4" />, show: isVxm },
    { key: 'cases', label: '治理案件', icon: <Scale className="h-4 w-4" /> },
    { key: 'rules', label: '治理规则', icon: <ScrollText className="h-4 w-4" /> },
    { key: 'data', label: '全局数据', icon: <Database className="h-4 w-4" /> },
    { key: 'audit', label: '三权审计', icon: <FileClock className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* 工作台头部 + 全局统计 */}
      <div className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: PURPLE }}>治理者工作台</span>
            <div>
              <h1 className="text-xl font-black text-[#17181d]">运营治理台 · {data.domain ?? '平台全域'}</h1>
              <p className="mt-0.5 text-xs text-[#6b665a]">
                {user ? `${hatLabel(user.hatRole)} · ${user.containerName} —— ` : ''}平台运营方只治理，不经营（Market=交易平台）
              </p>
            </div>
          </div>
          <Link to="/orders" className="flex items-center gap-1 text-sm" style={{ color: PURPLE }}>全局交易单 <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-md border p-3" style={{ backgroundColor: PURPLE_SOFT, borderColor: '#e4ded2' }}>
              <p className="text-xs text-[#6b665a]">{k.label}</p>
              <p className="ticker-font mt-1 text-lg font-black" style={{ color: PURPLE }}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[168px_1fr]">
        {/* 左侧导航 */}
        <aside className="h-fit rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-2 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
          <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b0aa9b]">治理导航</p>
          {NAV.filter((n) => n.show !== false).map((n) => (
            <button key={n.key} onClick={() => setSec(n.key)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium ${sec === n.key ? 'text-white' : 'text-[#17181d] hover:bg-[#f3eee3]'}`}
              style={sec === n.key ? { backgroundColor: PURPLE } : undefined}>
              {n.icon}{n.label}
            </button>
          ))}
          <div className="mt-1 border-t border-[#e4ded2] px-2.5 pt-2 text-[11px] leading-relaxed text-[#8a8577]" style={{ color: theme.accentText }}>
            管控型工作台：审核队列 / 案件 / 规则 / 数据
          </div>
        </aside>

        {/* 主区 */}
        <main className="min-w-0 space-y-4">
          {sec === 'review' && isVxm && (
            <>
              <Section icon={<CloudCog className="h-5 w-5" />} title="云中心 · 供应商准入评估与货品治理（VXM）" sub="登记评估：通过 → 合格纳入 DU 采购商城；驳回附原因可重提。交易单向：供给方唯一交易对手 = DU。">
                <CloudReview />
              </Section>
              <Section icon={<Gavel className="h-5 w-5" />} title="大额采购审批（X-MARKET-15 阈值自动升级）" sub="超阈值采购单批准后生效、驳回不生效；审批动作入三权审计（governor=VXM）。">
                <ApprovalList />
              </Section>
            </>
          )}
          {sec === 'audit' && (
            <Section icon={<FileClock className="h-5 w-5" />} title="三权审计（治-管-办全量留痕）" sub="越权 → 403 → 审计 → 可查闭环：10 个写入口的 allowed/denied 全量记录，govern 位动作回填治理人；按动作/结果筛选，时间倒序。">
              <PowerAuditList scope="all" accent={PURPLE} />
            </Section>
          )}
          {sec === 'cases' && (
            <Section icon={<Scale className="h-5 w-5" />} title={`治理案件（在办 ${open.length} / 办结 ${closed.length}）`} sub="先落管理页骨架与数据接口，处置动作由运营方在案卷内推进">
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-md bg-[#17181d] px-3 py-2 text-xs font-semibold text-[#f5f2eb]">
                  <span>案卷</span><span>管辖</span><span>状态</span>
                </div>
                {[...open, ...closed].map((c) => (
                  <div key={c.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border border-[#e4ded2] px-3 py-2 text-sm">
                    <span className="text-[#17181d]">
                      <span className="mr-2 font-mono text-xs text-[#8a8577]">{c.kind}</span>
                      {c.desc}
                    </span>
                    <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: colorOf(c.domain) }}>
                      {marketLabel(c.domain)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === 'open' ? 'bg-[#fdeaea] text-[#b4402e]' : 'bg-[#e8f4ee] text-[#2e7d54]'}`}>
                      {c.status === 'open' ? '在办' : '办结'}
                    </span>
                  </div>
                ))}
                {data.cases.length === 0 && (
                  <div className="rounded-md border border-dashed border-[#e4ded2] px-3 py-6 text-center text-sm text-[#8a8577]">
                    当前身份无管辖案件（仅 V*M 运营方可见；VDM 兼看全部案卷）
                  </div>
                )}
              </div>
            </Section>
          )}
          {sec === 'rules' && (
            <Section icon={<ScrollText className="h-5 w-5" />} title="治理规则（平台红线）" sub="定版口径：规则由治理方制定与执法，规则本身对全平台生效">
              <div className="space-y-3">
                <ThresholdCard />
                <div className="grid gap-3 md:grid-cols-2">
                  {RULES.map((r) => (
                    <div key={r.title} className="rounded-md border border-[#e4ded2] bg-white p-4">
                      <p className="flex items-center gap-2 font-bold text-[#17181d]"><span style={{ color: PURPLE }}>{r.icon}</span>{r.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#6b665a]">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
          {sec === 'data' && (
            <div className="space-y-4">
              <PowerDashboardBoard />
              <Section icon={<Database className="h-5 w-5" />} title="全局数据 · 交易总账" sub="V*M 全域订单总账（服务端按身份下发）；资金流三段 XCASE→ERP→X-FIN">
              <div className="overflow-x-auto">
                <table className="ticker-font w-full min-w-[560px] text-left text-xs">
                  <thead><tr className="border-b text-[#8a8577]"><th className="py-2">单号</th><th>族</th><th>买方</th><th>卖方</th><th className="text-right">金额</th><th className="text-right">状态</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-2 font-bold">{o.code}</td>
                        <td><span className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: colorOf(o.family) }}>{o.family}</span></td>
                        <td className="text-[#6b665a]">{o.buyerContainerId === 'c-du' ? 'DU 经营' : o.buyerContainerId}</td>
                        <td className="text-[#6b665a]">{o.supplierId ? '合格供应商' : o.sellerContainerId === 'c-du' ? 'DU 经营' : o.sellerContainerId}</td>
                        <td className="text-right font-bold">¥{(o.amountCents / 100).toLocaleString()}</td>
                        <td className="text-right">{orderStatusLabel(o.status)}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-[#8a8577]">暂无总账数据</td></tr>}
                  </tbody>
                </table>
              </div>
              </Section>
            </div>
          )}
        </main>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.duties.map((d, i) => (
          <div key={d} className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <div className="mb-2 flex items-center gap-2" style={{ color: PURPLE }}>
              {i === 0 && <ShieldCheck className="h-5 w-5" />}
              {i === 1 && <ScrollText className="h-5 w-5" />}
              {i === 2 && <Boxes className="h-5 w-5" />}
              <h3 className="font-bold text-[#17181d]">{d}</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#8a8577]">
              {i === 0 && '巡查五专业市场秩序：跨主体用铺、越权开铺、身份错挂等违规即时处置。'}
              {i === 1 && '维护开铺规则（Y/H/DE 可加盟，E/T 仅直营）与交易规则（Order-T 六族）。'}
              {i === 2 && '向铺主供给专业 Booth 实体系统：FAB/WH/DL/SVC/LAB，拎包经营。'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
