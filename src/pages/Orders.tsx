import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DomainLine } from '../components/ui';
import { ORDER_STATUS } from '../lib/domain';

type OrderRow = { id: string; type: 'MALL' | 'MARKET'; tradeCode: string; domain: string; buyer: string; seller: string; title: string; qty: number; amount: number; status: string };

export default function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [type, setType] = useState<'ALL' | 'MALL' | 'MARKET'>('ALL');

  const load = () => api.orders(type === 'ALL' ? undefined : type).then(setOrders).catch(console.error);
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [type]);

  const totals = {
    count: orders.filter(o => o.status !== 'pending').length,
    amount: orders.filter(o => o.status !== 'pending').reduce((a, o) => a + o.amount, 0),
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-serif-display text-xl font-bold">交易单总账</span>
        <div className="ml-auto flex gap-1 text-sm">
          {(['ALL', 'MALL', 'MARKET'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className={`rounded-md px-3 py-1.5 font-semibold transition ${type === t ? (t === 'MALL' ? 'bg-[#b8862b] text-white' : 'bg-[#17181d] text-white') : 'paper-card hover:bg-[#efeae0]'}`}>
              {t === 'ALL' ? '全部' : t === 'MALL' ? 'Mall·C端' : 'Market·B端'}
            </button>
          ))}
        </div>
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