import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Warehouse, ShoppingCart, Star } from 'lucide-react';
import { api, type BoothDetail } from '../api/client';
import { DomainLine } from '../components/ui';
import { DOMAIN_COLORS } from '../lib/domain';
import type { Unit } from '../../shared/types';

export default function MallBooth() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BoothDetail | null>(null);
  const [layer, setLayer] = useState<'front' | 'back'>('front');
  const [cus, setCus] = useState<Unit[]>([]);
  const [buyer, setBuyer] = useState('u-cu1');
  const [notice, setNotice] = useState('');

  useEffect(() => { if (id) api.mallBooth(id).then(setData).catch(console.error); }, [id]);
  useEffect(() => { api.units({ role: 'CU' }).then(setCus).catch(console.error); }, []);

  if (!data) return <div className="py-20 text-center text-[#8a8577]">加载中…</div>;
  const { booth, front, back } = data;
  const color = DOMAIN_COLORS[booth.domain] ?? '#17181d';

  const buy = async (listingId: string) => {
    try {
      const order = await api.createOrder({ type: 'MALL', listingId, buyerUnitId: buyer, qty: 1 });
      setNotice(`交易成功：${order.tradeCode} · ¥${order.amount.toLocaleString()}`);
    } catch (e) { setNotice((e as Error).message); }
  };

  return (
    <div>
      <Link to="/mall" className="mb-4 inline-flex items-center gap-1 text-sm text-[#8a8577] hover:text-[var(--ink)]">
        <ArrowLeft className="h-4 w-4" /> 返回集市
      </Link>

      <div className="dark-panel rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-3">
          <DomainLine code={booth.domain} />
          <h1 className="font-serif-display text-2xl font-black">{booth.name}</h1>
          <span className="flex items-center gap-1 text-sm text-[#b8862b]"><Star className="h-4 w-4 fill-current" /> {booth.rating}</span>
        </div>
        <p className="mt-2 text-sm text-[#cfcabb]">{booth.frontDesc}</p>
        <p className="mt-1 text-xs text-[#8f8a7d]">链路：{booth.mode} · 交易单码 {booth.code.replace('Booth-', '→ ')}</p>
      </div>

      {/* 双层切换 */}
      <div className="mt-5 flex gap-2">
        <button onClick={() => setLayer('front')} className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition ${layer === 'front' ? 'bg-[#b8862b] text-white' : 'paper-card hover:bg-[#efeae0]'}`}>
          <Store className="h-4 w-4" /> 前店 · 售卖面
        </button>
        <button onClick={() => setLayer('back')} className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition ${layer === 'back' ? 'bg-[#17181d] text-white' : 'paper-card hover:bg-[#efeae0]'}`}>
          <Warehouse className="h-4 w-4" /> 后厂 · 履约面
        </button>
      </div>

      {layer === 'front' && (
        <div className="mt-4">
          {notice && <div className="mb-3 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm text-[#7a5c16]">{notice}</div>}
          <div className="mb-3 flex items-center gap-2 text-sm">
            <label className="text-[#8a8577]">消费者</label>
            <select value={buyer} onChange={e => setBuyer(e.target.value)} className="rounded-md border bg-[#efeae0] px-2 py-1.5">
              {cus.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {front.length === 0 ? <div className="paper-card rounded-lg p-8 text-center text-sm text-[#8a8577]">前店暂无在售商品</div> : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {front.map(l => (
                <div key={l.id} className="paper-card hard-shadow rounded-lg p-4">
                  <div className="text-xs text-[#8a8577]">{l.category} · {l.spec}</div>
                  <h3 className="mt-1 font-semibold">{l.title}</h3>
                  <div className="ticker-font mt-2 text-2xl font-black" style={{ color }}>¥{l.price.toLocaleString()} <span className="text-xs font-normal text-[#8a8577]">/ {l.unit}</span></div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-[#8a8577]">库存 {l.stock}</span>
                    <button onClick={() => buy(l.id)} className="flex items-center gap-1 rounded-md bg-[#17181d] px-3 py-1.5 text-xs font-semibold text-[#f5f2eb] hover:bg-black">
                      <ShoppingCart className="h-3.5 w-3.5" /> 购买
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {layer === 'back' && (
        <div className="mt-4 rounded-xl p-5" style={{ border: '1px solid', borderColor: color }} >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color }}><Warehouse className="h-4 w-4" /> 后厂履约面 · {back.length} 条产能任务</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {back.map(f => (
              <div key={f.id} className="layer-back rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{f.title}</span>
                  <span className="rounded bg-[#3a3b44] px-2 py-0.5 text-[11px]">{f.status}</span>
                </div>
                <p className="mt-1 text-xs text-[#b9b4a8]">{f.task}</p>
                <div className="ticker-font mt-3 flex items-center justify-between text-xs">
                  <span className="text-[#8f8a7d]">产能配额</span>
                  <span className="text-[#f5f2eb]">{f.used} / {f.capacity}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-[#3a3b44]">
                  <div className="h-full" style={{ width: `${f.capacity ? Math.min(100, (f.used / f.capacity) * 100) : 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}