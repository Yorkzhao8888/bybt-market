import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { hatLabel } from '../lib/domain';
import PowerBadge from './PowerBadge';
import type { BoothRow, HatRow, InquiryRow } from '../../shared/types';

/** 询价 → 报价 → 合同 → 下单（P6 B2B 闭环）— 客户工作台与经营者工作台共用 */
export default function InquiryList({ inquiries, booths, containerName, hatOf, isAdmin, canOperate, viewerUnit, refresh }: {
  inquiries: InquiryRow[]; booths: BoothRow[]; containerName: (id: string) => string;
  hatOf: (id: string) => HatRow | undefined; isAdmin: boolean; canOperate: boolean; viewerUnit: string;
  refresh: () => void;
}) {
  const visible = inquiries.filter((q) =>
    isAdmin
    || q.buyerContainerId === viewerUnit
    || (canOperate && booths.some((b) => b.id === q.boothId && b.ownerUnitId === viewerUnit)),
  );
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [err, setErr] = useState('');
  const isSeller = (q: InquiryRow): boolean =>
    canOperate && booths.some((b) => b.id === q.boothId && b.ownerUnitId === viewerUnit);
  const isBuyer = (q: InquiryRow): boolean => q.buyerContainerId === viewerUnit;

  const quote = (q: InquiryRow): void => {
    const cents = Math.round(Number(quotePrice) * 100);
    if (!Number.isFinite(cents) || cents <= 0) { setErr('请输入有效报价金额'); return; }
    setErr('');
    api.quoteInquiry(q.id, { quoteCents: cents })
      .then(() => { setQuoteId(''); setQuotePrice(''); refresh(); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '报价失败'));
  };
  const contract = (q: InquiryRow): void => {
    api.contractInquiry(q.id).then(refresh).catch((e: unknown) => setErr(e instanceof Error ? e.message : '合同失败'));
  };
  const placeOrder = (q: InquiryRow): void => {
    api.createOrder({ boothId: q.boothId, amountCents: q.quoteCents, side: 'B', inquiryId: q.id })
      .then((o) => { setErr(''); window.alert(`已下单 ${o.code}（P6 B2B 闭环完成，履约由 Booth 实体系统承接）`); refresh(); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '下单失败'));
  };

  if (visible.length === 0) return null;
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="flex items-center gap-2 font-serif-display text-lg font-black"><ShieldCheck className="h-4 w-4" /> 询价 → 报价 → 合同 → 下单（P6 B2B 闭环 · {visible.length}）</p>
      {err && <p className="mt-2 rounded border-l-4 border-l-[#b4402e] bg-[#fdeaea] px-2 py-1 text-xs font-medium text-[#b4402e]">{err}</p>}
      <div className="mt-3 space-y-2">
        {visible.map((q) => {
          const h = hatOf(q.buyerContainerId);
          const stageLabel: Record<string, string> = { inquiry: '询价中', quoted: '已报价', contracted: '已签合同', ordered: '已下单' };
          return (
            <div key={q.id} className="rounded-lg border border-[#e4ded2] p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#17181d] px-2 py-0.5 text-xs text-white">{stageLabel[q.status] ?? q.status}</span>
                <span className="font-medium">{q.title}</span>
                <span className="text-xs text-[#8a8577]">铺面 {booths.find((b) => b.id === q.boothId)?.code ?? q.boothId}</span>
                {q.quoteCents != null && <span className="rounded bg-[#eef7ee] px-1.5 py-0.5 text-xs text-[#2f7d5b]">报价 ¥{(q.quoteCents / 100).toFixed(2)}</span>}
                {q.contractNo && <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-xs">合同 {q.contractNo}</span>}
              </div>
              <p className="mt-1 text-xs text-[#6b665a]">客户：{containerName(q.buyerContainerId)}{h ? `（${hatLabel(h.role)}）` : ''} · {q.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {q.status === 'inquiry' && isSeller(q) && (
                  quoteId === q.id ? (
                    <>
                      <input value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} placeholder="报价金额(元)" className="w-28 rounded border px-2 py-1 text-xs" />
                      <button onClick={() => quote(q)} className="rounded bg-[#b8862b] px-2 py-1 text-xs text-white hover:opacity-90">确认报价</button>
                      <button onClick={() => { setQuoteId(''); setQuotePrice(''); }} className="rounded border px-2 py-1 text-xs">取消</button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <PowerBadge kind="manage" text={false} />
                      <button onClick={() => { setQuoteId(q.id); setQuotePrice(''); }} className="rounded bg-[#b8862b] px-2 py-1 text-xs text-white hover:opacity-90">报价</button>
                    </span>
                  )
                )}
                {q.status === 'quoted' && isBuyer(q) && (
                  <span className="inline-flex items-center gap-1.5">
                    <PowerBadge kind="manage" text={false} />
                    <button onClick={() => contract(q)} className="rounded bg-[#17181d] px-2 py-1 text-xs text-white hover:opacity-90">确认合同</button>
                  </span>
                )}
                {q.status === 'contracted' && isBuyer(q) && (
                  <button onClick={() => placeOrder(q)} className="rounded bg-[#2f7d5b] px-2 py-1 text-xs text-white hover:opacity-90">下单（Order-{q.domain} 族）</button>
                )}
                {q.status === 'ordered' && <span className="text-xs text-[#8a8577]">订单已建立，履约由 Booth 实体系统承接</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
