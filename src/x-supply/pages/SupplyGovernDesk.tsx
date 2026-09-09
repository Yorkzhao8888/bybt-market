// X-MARKET-ROLE-01 A3/A5：X-Supply 四源治理台（V*M 家族分源治理 + VXM 统筹）
// 口径：VEM 治 E 源（EU）/ VYM 治 Y 源（YU）/ VHM 治 H 源（HU）/ VTM 治 T 源（TU），各自治理本源准入；
// VXM（云中心）全域统筹 + 大额采购升级审批（X-MARKET-15）+ 阈值配置；VDM 归 market 经营治理（/govern），不越界。
// 数据层：xSupplyApi.govern（req 原语直调，依赖单向白名单）；后端已按域过滤/校验（家族仅见本源数据）。
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CircleSlash, ClipboardCheck, Gavel, ScrollText, Settings2, ShieldCheck } from 'lucide-react';
import { xSupplyApi } from '../api/du-supply';
import PowerBadge from '../../components/PowerBadge';
import { OfdCenter } from '../../components/OfdCenter';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../Auth';
import { colorOf, supplyGovernDomainOf } from '../../lib/domain';
import { conceptTerm } from '../../lib/terminology';
import type { GovernThresholds, OrderRow, SupplierApplication, SupplierProduct } from '../../../shared/types';

const PURPLE = '#6D28D9';
const PURPLE_SOFT = '#f1eafd';

/** 治理域标题：家族显示本源域；VXM 全域 */
function governScopeLabel(hatRole: string): string {
  const dom = supplyGovernDomainOf(hatRole as never);
  if (hatRole === 'VXM') return '云中心统筹 · 四源全域';
  return dom ? `四源治理 · ${dom} 源（本源准入与货品治理）` : '四源治理';
}

export function SupplyGovernDesk() {
  const { user } = useAuth();
  const hatRole = user?.hatRole ?? '';
  const isVxm = hatRole === 'VXM';
  const govDomain = supplyGovernDomainOf(hatRole as never);

  const [apps, setApps] = useState<SupplierApplication[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [thresholds, setThresholds] = useState<GovernThresholds | null>(null);
  const [thresholdInput, setThresholdInput] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setErr('');
      const [a, p] = await Promise.all([xSupplyApi.govern.applications(), xSupplyApi.govern.products()]);
      setApps(a);
      setProducts(p);
      if (isVxm) {
        const [o, t] = await Promise.all([xSupplyApi.govern.orders(), xSupplyApi.govern.thresholds()]);
        setOrders(o);
        setThresholds(t);
        setThresholdInput(String(Math.round(t.procurementAmountCents / 100)));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '治理数据加载失败');
    }
  }, [user, isVxm]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (ok: string, e?: unknown) => {
    if (e instanceof Error) {
      setErr(e.message);
      setMsg('');
    } else {
      setMsg(ok);
      setErr('');
      void load();
    }
  };

  const review = async (id: string, action: 'approve' | 'reject') => {
    try {
      const reason = action === 'reject' ? window.prompt('驳回原因（必填）') ?? '' : undefined;
      if (action === 'reject' && !reason) return;
      await xSupplyApi.govern.reviewApplication(id, { action, rejectReason: reason });
      flash(action === 'approve' ? '准入已通过（供应商合格，可上架货品）' : '已驳回（可重提）');
    } catch (e) {
      flash('', e);
    }
  };

  const takeDown = async (id: string) => {
    try {
      await xSupplyApi.govern.takeDown(id);
      flash('违规货品已治理下架（仅下架不代上架）');
    } catch (e) {
      flash('', e);
    }
  };

  const approveOrder = async (id: string, action: 'approve' | 'reject') => {
    try {
      const note = action === 'reject' ? window.prompt('驳回说明（必填）') ?? '' : '治理审批通过';
      if (action === 'reject' && !note) return;
      await xSupplyApi.govern.approveOrder(id, { action, note });
      flash(action === 'approve' ? '大额采购已批准（订单转待交付）' : '大额采购已驳回');
    } catch (e) {
      flash('', e);
    }
  };

  const saveThreshold = async () => {
    const cents = Math.round(Number(thresholdInput) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setErr('阈值需为正数金额（元）');
      return;
    }
    try {
      await xSupplyApi.govern.updateThresholds(cents);
      flash('大额采购阈值已更新');
    } catch (e) {
      flash('', e);
    }
  };

  const pending = apps.filter((a) => a.status === 'pending');
  const approved = apps.filter((a) => a.status === 'approved');
  const listed = products.filter((p) => p.status === 'on');
  const approvals = orders.filter((o) => o.status === 'pending_approval' || o.status === 'rejected');

  return (
    <div className="mt-6 rounded border-2 border-[#d8ccf5] bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
      {/* 头部：治理台标识（大号=平台监管，小号=V*M 家族） */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[#e4ded2] pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#17181d]">
            <ShieldCheck size={18} style={{ color: PURPLE }} />
            <span className="font-bold">{conceptTerm('supplyGovern').big}</span>
            <span className="text-xs font-normal text-[#6b675f]">{conceptTerm('supplyGovern').sys}</span>
          </h2>
          <p className="mt-1 text-xs text-[#6b675f]">
            {governScopeLabel(hatRole)}
            {govDomain ? ` · 域 ${govDomain}` : ''} · VDM 归 market 经营治理（/govern），四源治理互不越界
          </p>
        </div>
        <PowerBadge kind="govern" />
      </div>

      {err && <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</div>}
      {msg && <div className="mb-3 rounded px-3 py-2 text-xs" style={{ background: PURPLE_SOFT, color: PURPLE }}>{msg}</div>}

      {/* 统计卡 */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: '待评估申请', value: pending.length, hint: '准入 pending' },
          { label: '合格供应商', value: approved.length, hint: '已准入' },
          { label: '在架货品', value: listed.length, hint: '治理可下架' },
          isVxm
            ? { label: '大额审批队列', value: approvals.length, hint: 'X-MARKET-15' }
            : { label: '本源域', value: govDomain ?? '—', hint: '分线治理' },
        ].map((c) => (
          <div key={c.label} className="rounded border border-[#e4ded2] bg-[#faf8f3] px-3 py-2">
            <div className="text-xl font-bold text-[#17181d]">{c.value}</div>
            <div className="text-[11px] text-[#6b675f]">{c.label} · {c.hint}</div>
          </div>
        ))}
      </div>

      {/* 准入审核（X-MARKET-08） */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17181d]">
          <ClipboardCheck size={15} style={{ color: PURPLE }} /> 供应商准入审核
          <span className="text-[10px] font-normal text-[#6b675f]">{isVxm ? '全域' : `仅 ${govDomain} 源`}</span>
        </div>
        {apps.length === 0 ? (
          <EmptyState text={isVxm ? '暂无准入申请' : `${govDomain} 源暂无准入申请（供给帽登记后进入本列表）`} />
        ) : (
          <ul className="space-y-2">
            {apps.map((a) => (
              <li key={a.id} className="rounded border border-[#e4ded2] px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-1.5 rounded-sm" style={{ background: colorOf(a.domain) }} />
                    <b className="text-[#17181d]">{a.supplierName ?? a.supplierId}</b>
                    <span className="font-mono text-[10px] text-[#6b675f]">{a.boothCode ?? a.boothId} · {a.domain}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: a.status === 'approved' ? '#e8f5ec' : a.status === 'rejected' ? '#fdeaea' : PURPLE_SOFT,
                        color: a.status === 'approved' ? '#166534' : a.status === 'rejected' ? '#b91c1c' : PURPLE,
                      }}
                    >
                      {a.status === 'approved' ? '已准入' : a.status === 'rejected' ? '已驳回' : '待评估'}
                    </span>
                    {a.escalated && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">升级待复核</span>}
                  </div>
                  {a.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => void review(a.id, 'approve')} className="rounded px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: PURPLE }}>
                        通过
                      </button>
                      <button onClick={() => void review(a.id, 'reject')} className="rounded border border-[#d6d3cd] px-2.5 py-1 text-[11px] font-bold text-[#57534e]">
                        驳回
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-1 leading-relaxed text-[#57534e]">
                  品类：{a.categories} · 产能：{a.capacity} · 资质：{a.qualification} · 报价意向：{a.priceIntent}
                </div>
                {a.rejectReason && <div className="mt-0.5 text-[10px] text-red-600">驳回原因：{a.rejectReason}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 货品治理下架（X-MARKET-12） */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17181d]">
          <Gavel size={15} style={{ color: PURPLE }} /> 货品治理下架
          <span className="text-[10px] font-normal text-[#6b675f]">只审不落：治理下架 ≠ 经营上架</span>
        </div>
        {products.length === 0 ? (
          <EmptyState text="暂无货品（合格供应商上架后进入治理视野）" />
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#e4ded2] px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-4 w-1.5 rounded-sm" style={{ background: colorOf(p.domain) }} />
                  <b className="text-[#17181d]">{p.name}</b>
                  <span className="text-[#6b675f]">{p.spec} · {(p.priceCents / 100).toFixed(2)} 元/{p.unit} · 库存 {p.stock}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: p.status === 'on' ? '#e8f5ec' : '#fdeaea', color: p.status === 'on' ? '#166534' : '#b91c1c' }}
                  >
                    {p.status === 'on' ? '在架' : '已下架'}
                  </span>
                </div>
                {p.status === 'on' && (
                  <button onClick={() => void takeDown(p.id)} className="flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-[11px] font-bold text-red-600">
                    <CircleSlash size={11} /> 治理下架
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* VXM 专属：大额采购审批（X-MARKET-15）+ 阈值配置 */}
      {isVxm && (
        <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17181d]">
              <ScrollText size={15} style={{ color: PURPLE }} /> 大额采购升级审批
              <span className="text-[10px] font-normal text-[#6b675f]">DU 采购超阈值 → pending_approval（DU 自批 403）</span>
            </div>
            {approvals.length === 0 ? (
              <EmptyState text="暂无待审批采购单" />
            ) : (
              <ul className="space-y-2">
                {approvals.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#e4ded2] px-3 py-2 text-xs">
                    <div>
                      <b className="font-mono text-[#17181d]">{o.code}</b>
                      <span className="ml-2 text-[#6b675f]">
                        {(o.amountCents / 100).toFixed(2)} 元 · {o.note?.includes('大额') ? '超阈值升级' : o.status === 'rejected' ? '已驳回' : '待审批'}
                      </span>
                      {o.approvalNote && <div className="text-[10px] text-[#6b675f]">审批备注：{o.approvalNote}</div>}
                    </div>
                    {o.status === 'pending_approval' && (
                      <div className="flex gap-2">
                        <button onClick={() => void approveOrder(o.id, 'approve')} className="rounded px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: PURPLE }}>
                          批准
                        </button>
                        <button onClick={() => void approveOrder(o.id, 'reject')} className="rounded border border-[#d6d3cd] px-2.5 py-1 text-[11px] font-bold text-[#57534e]">
                          驳回
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded border border-[#e4ded2] bg-[#faf8f3] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#17181d]">
              <Settings2 size={14} style={{ color: PURPLE }} /> 大额采购阈值
            </div>
            <div className="mb-2 text-[11px] text-[#6b675f]">
              当前：{thresholds ? `${(thresholds.procurementAmountCents / 100).toFixed(0)} 元` : '…'}
              {thresholds?.updatedBy ? ` · 由 ${thresholds.updatedBy} 更新` : ''}
            </div>
            <div className="flex gap-2">
              <input
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm"
                placeholder="金额（元）"
              />
              <button onClick={() => void saveThreshold()} className="shrink-0 rounded px-3 py-1.5 text-xs font-bold text-white" style={{ background: PURPLE }}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A5：X-OFD 履约中心（模拟契约期标注） */}
      <OfdCenter />

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#6b675f]">
        <BadgeCheck size={11} /> 治理分线：家族治本源、VXM 统筹全域、VDM 治经营（/govern）——数据互不越界，越权 403 入审计。
      </div>
    </div>
  );
}
