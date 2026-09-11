import { useEffect, useState } from 'react';
import { Crown, ShieldCheck, ShieldX, ClipboardList, Warehouse, BarChart3, History } from 'lucide-react';
import { useAuth } from '../Auth';
import { conceptTerm, governorTerm } from '../lib/terminology';
import { governanceApi } from '../api/governance';
import DualTerm from '../components/DualTerm';
import { SectionTitle, EmptyState, Stat } from '../components/ui';
import type { GovernanceVendor, GovernanceOrdersView, GovernanceOverview } from '../../shared/governance';

const GOV_ACCENT = '#6D28D9';

const VENDOR_STATUS_META: Record<string, { text: string; cls: string }> = {
  pending: { text: '待审', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  approved: { text: '准入', cls: 'bg-[#DCFCE7] text-[#166534]' },
  frozen: { text: '已冻结', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
};

const ORDER_STATUS_TEXT: Record<string, string> = {
  initiated: '已发起',
  accepted: '供给方已接单',
  quoted: '已报价',
  confirmed: '已确认',
};

function centsText(n: number): string {
  return (n / 100).toFixed(2);
}

function StatusPill({ status }: { status: string }) {
  const m = VENDOR_STATUS_META[status] ?? { text: status, cls: 'bg-[#E7E5E4] text-[#57534E]' };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.text}</span>;
}

export default function GovernanceDesk() {
  const { user } = useAuth();
  const isGovernor = !!user && user.hatRole === 'VEM' && user.containerType === 'XVPZ';

  const [vendors, setVendors] = useState<GovernanceVendor[]>([]);
  const [orders, setOrders] = useState<GovernanceOrdersView | null>(null);
  const [overview, setOverview] = useState<GovernanceOverview | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const term = governorTerm('vem');

  useEffect(() => {
    if (!isGovernor) return;
    let alive = true;
    const load = async () => {
      try {
        const [v, o, ov] = await Promise.all([
          governanceApi.vendors(),
          governanceApi.orders(),
          governanceApi.overview(),
        ]);
        if (!alive) return;
        setVendors(v);
        setOrders(o);
        setOverview(ov);
        setErr('');
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      }
    };
    void load();
    const timer = window.setInterval(load, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [isGovernor]);

  if (!isGovernor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShieldX className="mx-auto mb-4 h-12 w-12 text-[#DC2626]" />
        <h1 className="text-xl font-bold text-[#17181D]">{conceptTerm('governanceDesk').big} · 准入不通过</h1>
        <p className="mt-3 text-sm text-[#8a8577]">
          本面仅向 <span className="font-mono">{term?.sys}</span> 开放（{term?.pos}）。当前身份不持有市管方帽。
        </p>
      </div>
    );
  }

  const audit = async (containerId: string, action: 'approve' | 'freeze') => {
    setMsg('');
    setErr('');
    try {
      await governanceApi.audit(containerId, { action, note: note[containerId] ?? '' });
      setMsg(`${action === 'approve' ? '已批准' : '已冻结'} ${containerId}`);
      const [v, o, ov] = await Promise.all([
        governanceApi.vendors(),
        governanceApi.orders(),
        governanceApi.overview(),
      ]);
      setVendors(v);
      setOrders(o);
      setOverview(ov);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const pendingVendors = vendors.filter((v) => v.vendor_status !== 'approved');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#17181D]">
            <Crown className="h-5 w-5" style={{ color: GOV_ACCENT }} />
            {conceptTerm('governanceDesk').big}
            <span className="text-xs font-normal text-[#8a8577]">{conceptTerm('governanceDesk').sys}</span>
          </h1>
          <p className="mt-1 text-xs text-[#8a8577]">
            {term?.market} · {term?.pos}——只治理不撮合
          </p>
        </div>
        <DualTerm kind="governanceDesk" />
      </div>

      {err && <div className="mt-3 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]">{err}</div>}
      {msg && <div className="mt-3 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-xs text-[#166534]">{msg}</div>}

      {/* 区块 1：E-Market 经营看板 */}
      <section className="mt-5">
        <SectionTitle sub={term?.market}>{term?.market} · 经营看板</SectionTitle>
        {!overview ? (
          <EmptyState text="看板加载中…" />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="成交量（确认单）" value={overview.confirmed_count} color={GOV_ACCENT} />
            <Stat label="成交额（演示分）" value={`¥${centsText(overview.confirmed_amount_cents)}`} color={GOV_ACCENT} />
            <Stat label="准入供给方数" value={overview.approved_vendors} color="#15803D" />
            <Stat
              label="状态分布"
              value={Object.entries(overview.order_stats)
                .map(([k, n]) => `${ORDER_STATUS_TEXT[k] ?? k}:${n}`)
                .join(' / ')}
            />
          </div>
        )}
      </section>

      {/* 区块 2：入驻审核队列 */}
      <section className="mt-6">
        <SectionTitle sub="批准 / 冻结 · 状态机 pending→approved→frozen">入驻审核队列</SectionTitle>
        {pendingVendors.length === 0 ? (
          <EmptyState text="暂无待审 / 已冻结主体" />
        ) : (
          <div className="space-y-2">
            {pendingVendors.map((v) => (
              <div key={v.container_id} className="flex flex-wrap items-center gap-3 rounded border border-[#E7E5E4] bg-white px-3 py-2 shadow-[3px_3px_0_rgba(23,24,29,0.08)]">
                <StatusPill status={v.vendor_status} />
                <div className="min-w-40">
                  <div className="text-sm font-semibold text-[#17181D]">{v.container_name}</div>
                  <div className="font-mono text-[11px] text-[#8a8577]">{v.container_id} · identity {v.identity_id}</div>
                </div>
                <div className="min-w-32 flex-1 text-xs text-[#8a8577]">{v.intro}</div>
                <input
                  className="w-44 rounded border border-[#D6D3D1] px-2 py-1 text-xs"
                  placeholder="审核备注（可空）"
                  value={note[v.container_id] ?? ''}
                  onChange={(e) => setNote({ ...note, [v.container_id]: e.target.value })}
                />
                <div className="flex gap-2">
                  <button
                    className="rounded bg-[#15803D] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    onClick={() => void audit(v.container_id, 'approve')}
                  >
                    批准
                  </button>
                  <button
                    className="rounded bg-[#B91C1C] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    onClick={() => void audit(v.container_id, 'freeze')}
                  >
                    冻结
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 区块 3：供给单全域监察 */}
      <section className="mt-6">
        <SectionTitle sub="只读监察 · 全域供给单与状态聚合">
          <span className="inline-flex items-center gap-1">
            <ClipboardList className="h-4 w-4" /> 供给单全域监察
          </span>
        </SectionTitle>
        {!orders || orders.orders.length === 0 ? (
          <EmptyState text="暂无供给单" />
        ) : (
          <div className="overflow-hidden rounded border border-[#E7E5E4] bg-white shadow-[3px_3px_0_rgba(23,24,29,0.08)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF9] text-[#8a8577]">
                <tr>
                  <th className="px-3 py-2 font-medium">单号</th>
                  <th className="px-3 py-2 font-medium">采购主体</th>
                  <th className="px-3 py-2 font-medium">供给方</th>
                  <th className="px-3 py-2 font-medium">状态</th>
                  <th className="px-3 py-2 font-medium">报价（分）</th>
                  <th className="px-3 py-2 font-medium">事件数</th>
                </tr>
              </thead>
              <tbody>
                {orders.orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#F5F5F4]">
                    <td className="px-3 py-2 font-mono">{o.code}</td>
                    <td className="px-3 py-2">{o.buyerContainerId}</td>
                    <td className="px-3 py-2">{o.supplierContainerId}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 font-semibold text-[#5B21B6]">
                        {ORDER_STATUS_TEXT[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{o.quotedCents ?? '—'}</td>
                    <td className="px-3 py-2 text-[#8a8577]">{o.events?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 区块 4：供给方名录 */}
      <section className="mt-6">
        <SectionTitle sub="入驻主体与治理留痕">
          <span className="inline-flex items-center gap-1">
            <Warehouse className="h-4 w-4" /> 供给方名录
          </span>
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {vendors.map((v) => (
            <div key={v.container_id} className="rounded border border-[#E7E5E4] bg-white p-3 shadow-[3px_3px_0_rgba(23,24,29,0.08)]">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[#17181D]">{v.container_name}</div>
                <StatusPill status={v.vendor_status} />
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#8a8577]">
                {v.container_id} · {v.identity_id} · {v.contact_name}
              </div>
              {v.vendor_note && <div className="mt-1 text-xs text-[#8a8577]">治理备注：{v.vendor_note}</div>}
              {v.governance_events.length > 0 && (
                <div className="mt-2 border-t border-dashed border-[#E7E5E4] pt-2">
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-[#8a8577]">
                    <History className="h-3 w-3" /> 治理留痕
                  </div>
                  {v.governance_events.slice(-3).map((ev, i) => (
                    <div key={`${ev.ts}-${i}`} className="font-mono text-[11px] text-[#57534E]">
                      [{ev.ts.slice(5, 16)}] {ev.action} by {ev.actor_hat}（{ev.actor_user}）→ {ev.target}
                      {ev.note ? ` · ${ev.note}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex items-center gap-2 rounded border border-[#EDE9FE] bg-[#FAF5FF] px-3 py-2 text-xs text-[#5B21B6]">
        <ShieldCheck className="h-4 w-4" />
        治理边界：本台不做交易功能（只治理不撮合）；审核动作全部落治理事件流（snake_case）。
        <BarChart3 className="ml-auto h-4 w-4" />
      </div>
    </div>
  );
}
