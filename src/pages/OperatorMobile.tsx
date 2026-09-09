// X-MARKET-UE-01 DU 三端体验·手机作业端（办·执行）
// 单手履约作业：头卡（执行帽态）+ 三段切换（待履约/已完成/看单）+ 履约大按钮 + 回执内联（actor_user/actor_hat 穿透双字段）。
// 数据同源 /api/orders，履约动作即 X-MARKET-16 exec_fulfill（服务端按域映射执行帽）。
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList, FileText, PlayCircle, Smartphone, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../Auth';
import { EXEC_ACCENT, money, orderStatusMeta } from '../lib/domain';
import OrderStatusBadge from '../components/OrderStatusBadge';
import PowerBadge from '../components/PowerBadge';
import type { FulfillmentReceipt, OrderRow } from '../../shared/types';

type WorkTab = 'work' | 'orders' | 'receipts' | 'me';
type WorkSeg = 'todo' | 'done' | 'all';

export default function OperatorMobile() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState<WorkTab>('work');
  const [seg, setSeg] = useState<WorkSeg>('todo');
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const pull = useCallback(() => {
    void api.orders().then((r) => setOrders(r)).catch(() => setErr('订单拉取失败，下拉重试'));
  }, []);

  useEffect(() => { pull(); }, [pull]);

  const fulfillable = orders.filter((o) => o.status === 'pending');
  const doneList = orders.filter((o) => o.status === 'done' || o.status === 'fulfilling');
  const receipts = orders.flatMap((o) => (o.fulfillments ?? []).map((f: FulfillmentReceipt) => ({ f, o }))).sort((a, b) => b.f.ts.localeCompare(a.f.ts));

  const doFulfill = async (o: OrderRow) => {
    setBusyId(o.id); setMsg(''); setErr('');
    try {
      const r = await api.fulfillOrder(o.id, '移动端履约确认');
      const hat = r.receipt?.actor_hat ?? '';
      setMsg(`履约回执已生成 · 执行帽 ${hat} · 操作者 ${user?.hatId ?? ''}`);
      pull();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '履约失败');
    } finally {
      setBusyId('');
    }
  };

  const segList = seg === 'todo' ? fulfillable : seg === 'done' ? doneList : orders;

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-[#17181d]">
      <div className="mx-auto max-w-md px-4 pb-24 pt-5">
        {/* 角色头卡：执行帽当前态 + 经营号 + Booth */}
        <div className="rounded-2xl p-4 text-white shadow-[4px_4px_0_rgba(23,24,29,0.18)]" style={{ background: EXEC_ACCENT }}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
              <Smartphone className="h-3.5 w-3.5" /> 手机作业端 · 办·执行
            </span>
            <PowerBadge kind="operate" />
          </div>
          <p className="mt-3 font-serif-display text-2xl font-black">{user?.containerName ?? user?.containerId}</p>
          <p className="mt-1 text-xs text-white/85">经营号 {user?.hatId ?? '—'} · 执行帽按单域自动映射（DYX/DHX/DTX/DEX/DCX）</p>
        </div>

        {err && <p className="mt-3 rounded-lg border border-[#e8b4b0] bg-[#fdeaea] px-3 py-2 text-xs font-medium text-[#b3261e]">{err}</p>}
        {msg && <p className="mt-3 rounded-lg border border-[#bcd9c3] bg-[#e6f6ea] px-3 py-2 text-xs font-medium text-[#166534]">{msg}</p>}

        <div className="mt-4">
          {tab === 'work' && (
            <>
              {/* 三段切换 */}
              <div className="flex gap-2">
                {([['todo', `待履约 ${fulfillable.length}`], ['done', '已完成'], ['all', '看单']] as [WorkSeg, string][]).map(([k, label]) => (
                  <button key={k} onClick={() => setSeg(k)}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition"
                    style={seg === k ? { background: EXEC_ACCENT, color: '#fff', borderColor: EXEC_ACCENT } : { background: '#fff', color: '#4b463a' }}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-3 space-y-3">
                {segList.length === 0 && (
                  <div className="rounded-xl border border-dashed bg-white/70 p-6 text-center text-sm text-[#8a8577]">
                    {seg === 'todo' ? '暂无待履约订单——去 PC 经营台下单或等待新单' : '暂无数据'}
                  </div>
                )}
                {segList.map((o) => (
                  <div key={o.id} className="rounded-2xl border bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.10)]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold">{o.code}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-[#6b665a]">{orderStatusMeta(o.status).label} · {o.boothCode ?? '—'}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="font-mono text-lg font-black">{money(o.amountCents ?? 0)}</span>
                      {o.status === 'pending' && (
                        <button onClick={() => void doFulfill(o)} disabled={busyId === o.id}
                          className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(23,24,29,0.25)] transition active:translate-y-0.5 disabled:opacity-60"
                          style={{ background: EXEC_ACCENT }}>
                          <PlayCircle className="h-4 w-4" /> {busyId === o.id ? '履约中…' : '开始本次履约'}
                        </button>
                      )}
                    </div>
                    {/* 回执内联（穿透双字段） */}
                    {(o.fulfillments ?? []).length > 0 && (
                      <div className="mt-3 rounded-lg bg-[#f5f2eb] p-2.5 text-[11px] leading-relaxed text-[#4b463a]">
                        <p className="font-bold text-[#166534]"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />最新回执</p>
                        {(o.fulfillments ?? []).slice(-1).map((f) => (
                          <p key={f.id} className="mt-0.5 font-mono">
                            actor_user={f.actor_user} · actor_hat={f.actor_hat}<br />{f.ts.replace('T', ' ').slice(0, 19)} · {f.note}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'orders' && (
            <div className="space-y-2.5">
              {orders.length === 0 && <div className="rounded-xl border border-dashed bg-white/70 p-6 text-center text-sm text-[#8a8577]">暂无订单</div>}
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border bg-white px-3.5 py-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{o.code}</p>
                    <p className="mt-0.5 text-[11px] text-[#8a8577]">{o.family} 族 · {orderStatusMeta(o.status).label}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold">{money(o.amountCents ?? 0)}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'receipts' && (
            <div className="space-y-2.5">
              {receipts.length === 0 && <div className="rounded-xl border border-dashed bg-white/70 p-6 text-center text-sm text-[#8a8577]">暂无履约回执</div>}
              {receipts.map(({ f, o }) => (
                <div key={f.id} className="rounded-xl border bg-white px-3.5 py-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{o.code}</span>
                    <span className="rounded-full bg-[#e3edfb] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1D4ED8]">执行帽 {f.actor_hat}</span>
                  </div>
                  <p className="mt-1 font-mono text-[#4b463a]">actor_user={f.actor_user} · actor_hat={f.actor_hat}</p>
                  <p className="mt-0.5 text-[10px] text-[#8a8577]">{f.ts.replace('T', ' ').slice(0, 19)} · {f.note}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'me' && (
            <div className="space-y-3">
              <div className="rounded-2xl border bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.10)]">
                <p className="flex items-center gap-1.5 text-sm font-bold"><UserRound className="h-4 w-4" /> {user?.containerName ?? user?.containerId}</p>
                <p className="mt-1 text-xs text-[#6b665a]">经营号 {user?.hatId ?? '—'} · DU 经营实体（唯一经营主体）</p>
                <p className="mt-1 text-xs text-[#6b665a]">作业由执行帽落地，审计记 actor_user + actor_hat 双字段（X-MARKET-16 穿透追责）</p>
              </div>
              <Link to="/operator" className="block rounded-xl border bg-white px-4 py-3 text-center text-sm font-semibold hover:bg-[#fbf0e0]">返回 PC 经营驾驶舱</Link>
              <Link to="/board" className="block rounded-xl border bg-white px-4 py-3 text-center text-sm font-semibold hover:bg-[#fbf0e0]">现场看板（Booth 大屏）</Link>
            </div>
          )}
        </div>
      </div>

      {/* 底部 Tab */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e4ded2] bg-[#f5f2eb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-md">
          {([['work', '作业', <PlayCircle key="w" className="h-4 w-4" />], ['orders', '订单', <ClipboardList key="o" className="h-4 w-4" />], ['receipts', '回执', <FileText key="r" className="h-4 w-4" />], ['me', '我的', <UserRound key="m" className="h-4 w-4" />]] as [WorkTab, string, React.ReactNode][]).map(([k, label, icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition"
              style={tab === k ? { color: EXEC_ACCENT } : { color: '#8a8577' }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
