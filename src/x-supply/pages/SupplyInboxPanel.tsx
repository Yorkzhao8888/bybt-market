// X-SUPPLY-02 供给方收件箱（EU/HU/YU/TU 管位操作；EX/EXX 办位只读）
// 数据源 GET /api/supply/orders（服务端按身份过滤：供给方=名下供给铺收件）
// 操作：accept（接单，仅 initiated）/ quote（报价，仅 accepted）；接单/报价属经营决策（管位），EX/EXX 看单不代办（三权防呆）
import { useCallback, useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import { xSupplyApi } from '../api/du-supply';
import DualTerm from '../../components/DualTerm';
import PowerBadge from '../../components/PowerBadge';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../Auth';
import { colorOf } from '../../lib/domain';
import type { XSupplyOrder } from '../../../shared/x-supply';

const GREEN = '#15803D';
const GREEN_SOFT = '#e8f5ec';
const GREEN_TEXT = '#166534';

const STATUS_META: Record<XSupplyOrder['status'], { label: string; color: string; bg: string }> = {
  initiated: { label: '待接单', color: '#8a6d3b', bg: '#f5f2eb' },
  accepted: { label: '已接单 · 待报价', color: '#1D4ED8', bg: '#e8effb' },
  quoted: { label: '已报价 · 待买家确认', color: '#B45309', bg: '#fdf1e2' },
  confirmed: { label: '已成单', color: '#16A34A', bg: '#e8f5ec' },
};

const yuan = (cents: number | null): string => (cents === null ? '—' : `￥${(cents / 100).toFixed(2)}`);

export function SupplyInboxPanel() {
  const { user } = useAuth();
  const hat = user?.hatRole ?? null;
  const [orders, setOrders] = useState<XSupplyOrder[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  // 报价表单（目标单 id + 金额元 + 备注）
  const [quoteId, setQuoteId] = useState('');
  const [yuanStr, setYuanStr] = useState('');
  const [qnote, setQnote] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setErr('');
      setOrders(await xSupplyApi.supplyOrders.list());
    } catch (e) {
      setErr(e instanceof Error ? e.message : '收件加载失败');
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const canOperate = hat !== null && ['EU', 'HU', 'YU', 'TU'].includes(hat);

  const doAccept = async (id: string, code: string) => {
    setErr('');
    setMsg('');
    try {
      await xSupplyApi.supplyOrders.accept(id);
      setMsg(`供给单 ${code} 已接单（等待买家）`);
      void load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '接单失败');
    }
  };

  const doQuote = async () => {
    if (!quoteId) return;
    setErr('');
    setMsg('');
    const cents = Math.round(parseFloat(yuanStr) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setErr('报价金额须为正数（元）');
      return;
    }
    try {
      await xSupplyApi.supplyOrders.quote(quoteId, { quotedCents: cents, note: qnote.trim() || undefined });
      setMsg(`供给单已报价 ${yuan(cents)}（等待买家确认）`);
      setQuoteId('');
      setYuanStr('');
      setQnote('');
      void load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '报价失败');
    }
  };

  if (!user) return null;

  return (
    <div className="mb-5 rounded border-2 p-4" style={{ borderColor: GREEN, background: '#fbfdf9' }}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-1.5 text-lg font-bold text-[#17181d]">
          <Inbox size={17} style={{ color: GREEN }} /> <DualTerm kind="supplyInbox" />
        </h2>
        <PowerBadge kind={canOperate ? 'manage' : 'operate'} />
        <span className="text-[11px] text-[#6b675f]">{canOperate ? '接单/报价属经营决策（管位）· 仅本铺收件' : '办位看单：接单/报价归供货商管位（EU/HU/YU/TU），EX/EXX 不代办（三权防呆）'}</span>
      </div>

      {err && <div className="mb-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      {msg && <div className="mb-2 rounded px-3 py-2 text-sm" style={{ background: GREEN_SOFT, color: GREEN_TEXT }}>{msg}</div>}

      {orders.length === 0 ? (
        <EmptyState text="暂无收件供给单（DU 发起后到达名下供给铺）" />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const meta = STATUS_META[o.status];
            return (
              <div key={o.id} className="rounded border border-[#e4ded2] bg-white p-3 shadow-[3px_3px_0_rgba(23,24,29,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-4 w-1.5 rounded-sm" style={{ background: colorOf(o.domain) }} />
                    <span className="font-mono text-xs font-bold text-[#17181d]">{o.code}</span>
                    <span className="text-[10px] text-[#6b675f]">{o.supplierBoothCode}</span>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-[#57534e]">
                  <b className="text-[#17181d]">{o.title}</b> × {o.qty} {o.unit}
                  <span className="ml-1 text-[10px] text-[#6b675f]">买家 {o.buyerContainerName}（{o.buyerHatRole}）</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#6b675f]">
                    报价：<b style={{ color: o.quotedCents ? GREEN_TEXT : '#6b675f' }}>{yuan(o.quotedCents)}</b>
                    {o.note && <span className="ml-2 text-[10px]">买家备注：{o.note}</span>}
                  </span>
                  {canOperate && o.status === 'initiated' && (
                    <button onClick={() => void doAccept(o.id, o.code)} className="rounded px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: GREEN }}>
                      接单
                    </button>
                  )}
                  {canOperate && o.status === 'accepted' && (
                    <button
                      onClick={() => {
                        setQuoteId(quoteId === o.id ? '' : o.id);
                        setYuanStr('');
                        setQnote('');
                      }}
                      className="rounded border-2 px-2.5 py-1 text-[11px] font-bold"
                      style={{ borderColor: GREEN, color: GREEN_TEXT }}
                    >
                      {quoteId === o.id ? '收起报价' : '填报价'}
                    </button>
                  )}
                </div>
                {quoteId === o.id && (
                  <div className="mt-2 rounded bg-[#f5f2eb] p-2">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[10px] font-bold text-[#57534e]">报价金额（元）</label>
                        <input value={yuanStr} onChange={(e) => setYuanStr(e.target.value)} inputMode="decimal" placeholder="如 12800" className="w-full rounded border border-[#e4ded2] px-2 py-1 text-sm" />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[10px] font-bold text-[#57534e]">报价备注</label>
                        <input value={qnote} onChange={(e) => setQnote(e.target.value)} placeholder="可空" className="w-full rounded border border-[#e4ded2] px-2 py-1 text-sm" />
                      </div>
                      <button onClick={() => void doQuote()} className="rounded px-3 py-1.5 text-xs font-bold text-white" style={{ background: GREEN }}>
                        提交报价
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
