import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { api, type MallListing } from '../api/client';
import { DomainChip, DomainLine, EmptyState, SectionTitle } from '../components/ui';
import { DOMAIN_COLORS } from '../lib/domain';
import type { Unit } from '../../shared/types';
import { useAuth } from '../Auth';

export default function Mall() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const active = params.get('domain') ?? '';
  const [listings, setListings] = useState<MallListing[]>([]);
  const [cus, setCus] = useState<Unit[]>([]);
  const [buyer, setBuyer] = useState('u-cu1');
  const [notice, setNotice] = useState('');

  useEffect(() => { api.mallListings(active || undefined).then(setListings).catch(console.error); }, [active]);
  useEffect(() => { api.units({ role: 'CU' }).then(setCus).catch(console.error); }, []);
  useEffect(() => {
    if (user && user.entry === 'C' && user.hatId) setBuyer(user.hatId);
  }, [user]);

  const domains = useMemo(() => ['E', 'H', 'Y', 'T', 'DE'], []);

  const placeOrder = async (l: MallListing) => {
    if (!buyer) { setNotice('请先选择消费者账户'); return; }
    try {
      const order = await api.createOrder({ type: 'MALL', listingId: l.id, buyerUnitId: buyer, qty: 1 });
      setNotice(`交易成功：${order.tradeCode} · ¥${order.amount.toLocaleString()}`);
    } catch (e) {
      setNotice((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-serif-display font-bold">Mall 集市</span>
        <DomainChip code="" active={active === ''} onClick={() => setParams({})} />
        {domains.map(d => (
          <span key={d} onClick={() => setParams({ domain: d })} className="cursor-pointer">
            <DomainChip code={d} active={active === d} />
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <label className="text-[#8a8577]">消费者</label>
          <select value={buyer} onChange={e => setBuyer(e.target.value)} className="rounded-md border bg-[#efeae0] px-2 py-1.5 text-sm">
            {cus.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {notice && <div className="mb-4 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm font-medium text-[#7a5c16]">{notice}</div>}

      <SectionTitle sub={`前店售卖面 · ${listings.length} 件`}>五域货架</SectionTitle>

      {listings.length === 0 ? (
        <EmptyState text="该域暂无上架商品" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map(l => (
            <div key={l.id} className="paper-card hard-shadow group flex flex-col rounded-lg p-4">
              <div className="flex items-center justify-between">
                <DomainLine code={l.domain} />
                <span className="text-[11px] text-[#8a8577]">{l.category}</span>
              </div>
              <h3 className="mt-2 font-semibold">{l.title}</h3>
              <p className="mt-1 text-xs text-[#6b665a]">{l.spec}</p>
              <div className="ticker-font mt-3 flex items-baseline gap-1">
                <span className="font-serif-display text-2xl font-black" style={{ color: DOMAIN_COLORS[l.domain] }}>¥{l.price.toLocaleString()}</span>
                <span className="text-xs text-[#8a8577]">/ {l.unit}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#8a8577]">
                {l.booth ? (
                  <Link to={`/mall/booth/${l.booth.id}`} className="hover:text-[var(--ink)] hover:underline">@{l.booth.name}</Link>
                ) : <span>—</span>}
                <span className="ticker-font">库存 {l.stock}</span>
              </div>
              <button
                onClick={() => placeOrder(l)}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#17181d] py-2 text-sm font-semibold text-[#f5f2eb] transition hover:bg-[#000]"
              >
                <ShoppingCart className="h-4 w-4" /> 立即购买
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}