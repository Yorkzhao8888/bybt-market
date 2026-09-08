// P7 运营治理页骨架：V*M 市场秩序 / 规则制定 / 专业 Booth 系统供给
// X-MARKET-08：VXM 云中心运营审批统筹 —— 供应商准入审核（通过/驳回可重提）+ 违规货品治理下架
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, ScrollText, Boxes, ArrowRight, BadgeCheck, XCircle, PackageMinus, CloudCog } from 'lucide-react';
import { api, type GovernData } from '../api/client';
import { useAuth } from '../Auth';
import { colorOf, marketLabel, hatLabel } from '../lib/domain';
import type { SupplierApplication, SupplierProduct } from '../../shared/types';

// 云中心审核统筹（仅 VXM）：登记评估 + 货品治理
function CloudReview() {
  const [apps, setApps] = useState<SupplierApplication[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [msg, setMsg] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    void Promise.all([api.allApplications(), api.allProducts()])
      .then(([a, ps]) => { setApps(a); setProducts(ps); })
      .catch(() => { setApps([]); setProducts([]); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const review = (id: string, action: 'approve' | 'reject'): void => {
    setMsg('');
    api.reviewApplication(id, { action, rejectReason: action === 'reject' ? reason : undefined })
      .then((a) => {
        setApps((s) => s.map((x) => (x.id === a.id ? a : x)));
        setMsg(action === 'approve' ? `${a.supplierName} 已准入为合格供应商，纳入 DU 采购商城` : `已驳回 ${a.supplierName}（附原因，可重新提交）`);
        setRejectingId(null); setReason('');
      })
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : '审核失败'));
  };

  const takeDown = (id: string): void => {
    setMsg('');
    api.takeDownProduct(id)
      .then((p) => { setProducts((s) => s.map((x) => (x.id === p.id ? p : x))); setMsg(`已治理下架：${p.name}`); })
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : '下架失败'));
  };

  const statusBadge = (s: SupplierApplication['status']): ReactNode =>
    s === 'approved'
      ? <span className="flex items-center gap-1 rounded bg-[#e8f4ee] px-1.5 py-0.5 text-[11px] font-bold text-[#2e7d54]"><BadgeCheck className="h-3 w-3" />合格</span>
      : s === 'rejected'
        ? <span className="flex items-center gap-1 rounded bg-[#fdeaea] px-1.5 py-0.5 text-[11px] font-bold text-[#b4402e]"><XCircle className="h-3 w-3" />驳回</span>
        : <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[11px] font-bold text-[#8a6d3b]">待评估</span>;

  return (
    <Section icon={<CloudCog className="h-5 w-5" />} title="云中心 · 供应商准入评估与货品治理（VXM）" sub="登记评估：通过 → 合格纳入 DU 采购商城；驳回附原因可重提。交易单向：供给方唯一交易对手 = DU。">
      <div className="space-y-2">
        {apps.map((a) => (
          <div key={a.id} className="rounded-md border border-[#e4ded2] px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#17181d]">{a.supplierName}</span>
              <span className="font-mono text-xs text-[#8a8577]">{a.boothCode ?? a.boothId}</span>
              {statusBadge(a.status)}
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
                <div className="mt-2 flex gap-2">
                  <button onClick={() => review(a.id, 'approve')} className="flex items-center gap-1 rounded-md bg-[#2e7d54] px-3 py-1 text-xs font-medium text-white hover:opacity-90"><BadgeCheck className="h-3.5 w-3.5" /> 通过准入</button>
                  <button onClick={() => { setRejectingId(a.id); setReason(''); }} className="flex items-center gap-1 rounded-md border border-[#b4402e] px-3 py-1 text-xs font-medium text-[#b4402e] hover:bg-[#fdeaea]"><XCircle className="h-3.5 w-3.5" /> 驳回</button>
                </div>
              )
            )}
          </div>
        ))}
        {apps.length === 0 && <div className="rounded-md border border-dashed border-[#e4ded2] px-3 py-4 text-center text-sm text-[#8a8577]">暂无供应商登记申请</div>}
      </div>

      <p className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold text-[#17181d]"><PackageMinus className="h-4 w-4" /> 违规货品治理（平台运营侧可强制下架；上架权在供给方）</p>
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
      {msg && <p className="mt-3 rounded-md bg-[#e8f4ee] px-3 py-2 text-xs text-[#2e7d54]">{msg}</p>}
    </Section>
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
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#17181d] text-[#f5f2eb]">{icon}</span>
        <div>
          <h2 className="text-base font-bold text-[#17181d]">{title}</h2>
          <p className="text-xs text-[#8a8577]">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function Govern() {
  const { user } = useAuth();
  const [data, setData] = useState<GovernData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .governCases()
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <div className="py-16 text-center text-sm text-[#b4402e]">{err}</div>;
  if (!data) return <div className="py-16 text-center text-sm text-[#8a8577]">载入治理数据…</div>;

  const open = data.cases.filter((c) => c.status === 'open');
  const closed = data.cases.filter((c) => c.status === 'closed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#17181d]">运营治理 · {data.domain ?? '平台全域'}</h1>
          <p className="mt-1 text-sm text-[#6b665a]">
            {user ? `${hatLabel(user.hatRole)} · ${user.containerName}` : ''} —— 平台运营方只治理，不经营（Market=交易平台）
          </p>
        </div>
        <Link to="/market" className="flex items-center gap-1 text-sm text-[#4a5fd5] hover:underline">
          返回 Market <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.duties.map((d, i) => (
          <div key={d} className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            {i === 0 && <ShieldCheck className="mb-2 h-5 w-5 text-[#17a290]" />}
            {i === 1 && <ScrollText className="mb-2 h-5 w-5 text-[#c27a1b]" />}
            {i === 2 && <Boxes className="mb-2 h-5 w-5 text-[#4a5fd5]" />}
            <h3 className="font-bold text-[#17181d]">{d}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8a8577]">
              {i === 0 && '巡查五专业市场秩序：跨主体用铺、越权开铺、身份错挂等违规即时处置。'}
              {i === 1 && '维护开铺规则（Y/H/DE 可加盟，E/T 仅直营）与交易规则（Order-T 六族）。'}
              {i === 2 && '向铺主供给专业 Booth 实体系统：FAB/WH/DL/SVC/LAB，拎包经营。'}
            </p>
          </div>
        ))}
      </div>

      <Section icon={<Scale className="h-5 w-5" />} title={`治理案件（在办 ${open.length} / 办结 ${closed.length}）`} sub="先落管理页骨架与数据接口，处置动作由运营方在案卷内推进">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-md bg-[#17181d] px-3 py-2 text-xs font-semibold text-[#f5f2eb]">
            <span>案卷</span>
            <span>管辖</span>
            <span>状态</span>
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

      {user?.hatRole === 'VXM' && <CloudReview />}
    </div>
  );
}
