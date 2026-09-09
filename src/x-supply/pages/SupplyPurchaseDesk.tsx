// X-SUPPLY-02 供给单采购端（DU 采购主体视图）
// 状态机：initiated（DU 发起）→ accepted（供给方接单）→ quoted（供给方报价）→ confirmed（DU 确认，基础闭环终态）
// 权限：发起/确认=DU（管·决策，supply_order_initiate/confirm）；执行帽（D*X）只读看单（办位不代经营决策）
// *DU 分拨机制预留：本期供给单归属 DU（分拨口径待架构确认，UI 仅落主体视图）
import { useCallback, useEffect, useState } from 'react';
import { PackagePlus, ScrollText, X } from 'lucide-react';
import { xSupplyApi } from '../api/du-supply';
import DualTerm from '../../components/DualTerm';
import PowerBadge from '../../components/PowerBadge';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../Auth';
import { colorOf } from '../../lib/domain';
import type { XSupplyBooth, XSupplyHubData, XSupplyOrder } from '../../../shared/x-supply';

const ORANGE = '#B45309';
const ORANGE_SOFT = '#fdf1e2';
const ORANGE_TEXT = '#92400e';

const STATUS_META: Record<XSupplyOrder['status'], { label: string; color: string; bg: string }> = {
  initiated: { label: '待接单', color: '#8a6d3b', bg: '#f5f2eb' },
  accepted: { label: '已接单 · 待报价', color: '#1D4ED8', bg: '#e8effb' },
  quoted: { label: '已报价 · 待确认', color: ORANGE, bg: ORANGE_SOFT },
  confirmed: { label: '已成单', color: '#16A34A', bg: '#e8f5ec' },
};

const yuan = (cents: number | null): string => (cents === null ? '—' : `￥${(cents / 100).toFixed(2)}`);

export function SupplyPurchaseDesk() {
  const { user } = useAuth();
  const [hub, setHub] = useState<XSupplyHubData | null>(null);
  const [orders, setOrders] = useState<XSupplyOrder[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  // 发起弹层（目标铺 + 表单）
  const [target, setTarget] = useState<XSupplyBooth | null>(null);
  const [title, setTitle] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('件');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setErr('');
      const [h, os] = await Promise.all([xSupplyApi.hub(), xSupplyApi.supplyOrders.list()]);
      setHub(h);
      setOrders(os);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '供给单加载失败');
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const canInitiate = user?.hatRole === 'DU';

  const doCreate = async () => {
    if (!target) return;
    setErr('');
    setMsg('');
    if (!title.trim()) {
      setErr('采购内容（title）必填');
      return;
    }
    try {
      const o = await xSupplyApi.supplyOrders.create({
        boothId: target.id,
        title: title.trim(),
        qty: Number(qty) || 1,
        unit: unit.trim() || '件',
        note: note.trim() || undefined,
      });
      setMsg(`供给单 ${o.code} 已发起（等待供货商接单）`);
      setTarget(null);
      setTitle('');
      setQty('1');
      setUnit('件');
      setNote('');
      void load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '发起失败');
    }
  };

  const doConfirm = async (id: string) => {
    setErr('');
    setMsg('');
    try {
      const o = await xSupplyApi.supplyOrders.confirm(id);
      setMsg(`供给单 ${o.code} 已确认成单（基础闭环完成）`);
      void load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '确认失败');
    }
  };

  if (!user) return null;

  return (
    <div className="mb-5 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-[#17181d]">
            <ScrollText size={17} style={{ color: ORANGE }} /> <DualTerm kind="supplyOrder" /> · 采购台
          </h2>
          <PowerBadge kind={canInitiate ? 'manage' : 'operate'} />
        </div>
        <span className="text-[11px] text-[#6b675f]">状态机：待接单 → 已接单 → 已报价 → 已成单</span>
      </div>

      {/* *DU 分拨机制预留说明（本期供给单归属 DU） */}
      <div className="rounded border border-[#e4ded2] bg-[#f5f2eb] px-4 py-2.5 text-xs leading-relaxed text-[#57534e]">
        <b className="text-[#17181d]">*DU 分拨预留：</b>本期供给单归属 DU（采购主体=DU 唯一经营号）；*DU 分店/分拨逐级下发机制待架构确认后接入，界面先落 DU 主体视图。执行帽（D*X）看单不代办——发起/确认属经营决策（管位）。
      </div>

      {err && <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded px-3 py-2 text-sm" style={{ background: '#e8f5ec', color: '#166534' }}>{msg}</div>}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* 左：四源货源（发起入口） */}
        <div>
          <div className="mb-2 text-sm font-bold text-[#17181d]">四源货源（点选发起<DualTerm kind="supplyOrder" compact />）</div>
          <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {(hub?.booths ?? []).map((b) => (
              <div key={b.id} className="rounded border border-[#e4ded2] bg-white p-3 shadow-[3px_3px_0_rgba(23,24,29,0.08)]">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-5 w-2 rounded-sm" style={{ background: colorOf(b.domain) }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-[#17181d]">{b.name}</div>
                    <div className="font-mono text-[10px] text-[#6b675f]">{b.code} · 供货商 {b.ownerName}</div>
                  </div>
                </div>
                <div className="mt-1.5 truncate text-[11px] text-[#6b675f]">前店：{b.frontDesc || '—'}</div>
                <button
                  onClick={() => (canInitiate ? setTarget(b) : setErr('发起供给单属经营决策（管位），执行帽 D*X 不代办'))}
                  className="mt-2 w-full rounded border-2 px-2 py-1.5 text-xs font-bold transition-colors"
                  style={{ borderColor: ORANGE, color: ORANGE_TEXT }}
                >
                  <span className="inline-flex items-center gap-1"><PackagePlus size={12} /> 发起供给单</span>
                </button>
              </div>
            ))}
            {hub && hub.booths.length === 0 && <EmptyState text="暂无供给货源" />}
          </div>
        </div>

        {/* 右：我的供给单（DU 本人发起） */}
        <div>
          <div className="mb-2 text-sm font-bold text-[#17181d]">我的<DualTerm kind="supplyOrder" compact />（{orders.length}）</div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {orders.map((o) => {
              const meta = STATUS_META[o.status];
              const last = o.events[o.events.length - 1];
              return (
                <div key={o.id} className="rounded border border-[#e4ded2] bg-white p-3 shadow-[3px_3px_0_rgba(23,24,29,0.08)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-4 w-1.5 rounded-sm" style={{ background: colorOf(o.domain) }} />
                      <span className="font-mono text-xs font-bold text-[#17181d]">{o.code}</span>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-[#57534e]">
                    <b className="text-[#17181d]">{o.title}</b> × {o.qty} {o.unit}
                    <span className="ml-1 text-[10px] text-[#6b675f]">→ {o.supplierBoothCode} · {o.supplierContainerName}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#6b675f]">
                      报价：<b style={{ color: o.quotedCents ? ORANGE_TEXT : '#6b675f' }}>{yuan(o.quotedCents)}</b>
                      {last && <span className="ml-2 text-[10px]">最近：{last.action} · {last.actor_hat}</span>}
                    </span>
                    {o.status === 'quoted' && canInitiate && (
                      <button onClick={() => void doConfirm(o.id)} className="rounded px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: '#16A34A' }}>
                        确认成单
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {orders.length === 0 && <EmptyState text="暂无供给单（从左侧货源发起）" />}
          </div>
        </div>
      </div>

      {/* 发起弹层 */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setTarget(null)}>
          <div className="w-full max-w-md rounded border-2 border-[#17181d] bg-white p-5 shadow-[6px_6px_0_rgba(23,24,29,0.2)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-base font-bold text-[#17181d]">
                <PackagePlus size={16} style={{ color: ORANGE }} /> 发起<DualTerm kind="supplyOrder" compact />
              </h3>
              <button onClick={() => setTarget(null)} className="rounded p-1 text-[#6b675f] hover:bg-[#f5f2eb]" aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="mb-3 rounded bg-[#f5f2eb] px-3 py-2 text-xs text-[#57534e]">
              供货铺：<b className="text-[#17181d]">{target.name}</b>（{target.code} · {target.domain} 域）· 供货商 {target.ownerName}
            </div>
            <label className="block text-xs font-bold text-[#57534e]">采购内容 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：办公服务器整机采购" className="mb-2 w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#57534e]">数量</label>
                <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" className="w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#57534e]">单位</label>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
              </div>
            </div>
            <label className="block text-xs font-bold text-[#57534e]">备注</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="交付要求等（可空）" className="mb-3 w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => void doCreate()} className="flex-1 rounded px-3 py-2 text-sm font-bold text-white" style={{ background: ORANGE }}>
                发起供给单（留痕 initiate）
              </button>
              <button onClick={() => setTarget(null)} className="rounded border-2 border-[#e4ded2] px-3 py-2 text-sm font-bold text-[#57534e]">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
