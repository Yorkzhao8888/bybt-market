import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DomainLine } from '../components/ui';
import { ORDER_STATUS } from '../lib/domain';

type OrderRow = { id: string; type: 'MALL' | 'MARKET'; tradeCode: string; domain: string; family: string; buyer: string; seller: string; title: string; qty: number; amount: number; status: string };

const FAMILIES: { code: string; name: string; tone: string }[] = [
  { code: 'C', name: 'C端客户', tone: 'bg-[#b8862b]' },
  { code: 'D', name: '门店产能', tone: 'bg-[#d6366e]' },
  { code: 'H', name: '人力', tone: 'bg-[#e4572e]' },
  { code: 'E', name: '物资', tone: 'bg-[#c27a1b]' },
  { code: 'Y', name: '空间(捷租)', tone: 'bg-[#17a290]' },
  { code: 'T', name: '技术·Order-T', tone: 'bg-[#4a5fd5]' },
];

export default function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [type, setType] = useState<'ALL' | 'MALL' | 'MARKET'>('ALL');

  const load = () => api.orders(type === 'ALL' ? undefined : type).then((d) => {
    setOrders(d.map((r) => ({
      id: r.id, type: r.type, tradeCode: r.tradeCode, domain: r.domain ?? '',
      family: r.family, buyer: r.buyer, seller: r.seller, title: r.title,
      qty: r.qty, amount: r.amount, status: r.status,
    })));
  }).catch(console.error);
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [type]);

  const totals = {
    count: orders.filter(o => o.status !== 'pending').length,
    amount: orders.filter(o => o.status !== 'pending').reduce((a, o) => a + o.amount, 0),
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-serif-display text-xl font-bold">交易单总账 · 六族订单</span>
        <div className="ml-auto flex gap-1 text-sm">
          {(['ALL', 'MALL', 'MARKET'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className={`rounded-md px-3 py-1.5 font-semibold transition ${type === t ? (t === 'MALL' ? 'bg-[#b8862b] text-white' : 'bg-[#17181d] text-white') : 'paper-card hover:bg-[#efeae0]'}`}>
              {t === 'ALL' ? '全部' : t === 'MALL' ? 'Mall·C端' : 'Market·B端'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg border border-[#e4ded2] bg-[#fbf9f4] px-3 py-2 text-[11px] text-[#6b665a]">
        <span className="mr-1 font-semibold text-[#17181d]">订单族：</span>
        {FAMILIES.map(f => (
          <span key={f.code} className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-white ${f.tone}`}> {f.code} {f.name}</span>
        ))}
        <span className="ml-1 text-[#8a8577]">T 族经 Booth-T → X-OFD 汇聚（占位）</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="paper-card hard-shadow rounded-lg px-4 py-3"><div className="text-xs text-[#8a8577]">有效交易单</div><div className="ticker-font text-2xl font-black">{totals.count}</div></div>
        <div className="paper-card hard-shadow rounded-lg px-4 py-3"><div className="text-xs text-[#8a8577]">累计成交</div><div className="ticker-font text-2xl font-black text-[#b8862b]">¥{totals.amount.toLocaleString()}</div></div>
      </div>

      {orders.length === 0 ? (
        <div className="paper-card rounded-lg p-10 text-center text-sm text-[#8a8577]">暂无交易单</div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {orders.map((o, i) => {
            const st = ORDER_STATUS[o.status] ?? { label: o.status, color: '#6b665a' };
            return (
              <div key={o.id} className={`${i > 0 ? 'border-t' : ''} px-4 py-3 ${o.type === 'MALL' ? 'bg-[#fbf6ea]' : 'bg-[#f5f2eb]'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DomainLine code={o.domain} />
                    <span className="ticker-font font-mono text-xs text-[#8a8577]">{o.tradeCode}</span>
                    <FamBadge family={o.family} />
                    <span className="rounded bg-[#efeae0] px-1.5 py-0.5 text-[11px] font-semibold">{o.type === 'MALL' ? 'Mall' : 'Market'}</span>
                    <span className="font-medium">{o.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#8a8577]">{o.buyer} → {o.seller}</span>
                    <span className="ticker-font">×{o.qty}</span>
                    <span className="ticker-font font-bold">¥{o.amount.toLocaleString()}</span>
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ color: st.color, background: `${st.color}18` }}>{st.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FamBadge({ family }: { family: string }) {
  const f = FAMILIES.find(x => x.code === family);
  if (!f) return <span className="rounded bg-[#e4ded2] px-1.5 py-0.5 text-[10px] font-bold text-[#17181d]">{family}</span>;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${f.tone}`}>{f.code}</span>;
}