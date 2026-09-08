// Mall = C 端客户商城（CU 自然人），承载 DCX（Booth-DC）零售产品；DEX/DYX/DHX/DTX 在 Market B 端。
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { api } from '../api/client';
import type { MallListing, DecoratedBooth } from '../api/client';
import { DomainChip, SectionTitle, EmptyState } from '../components/ui';
import { colorOf, marketLabel } from '../lib/domain';
import { useAuth } from '../Auth';

export default function Mall() {
  const { user } = useAuth();
  const [active, setActive] = useState<string>('');
  const [booths, setBooths] = useState<DecoratedBooth[]>([]);
  const [listings, setListings] = useState<MallListing[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => { void api.mallBooths().then(setBooths); }, []);
  useEffect(() => {
    void api.mallListings(active || undefined).then(setListings).catch(() => setListings([]));
  }, [active]);

  const domains = useMemo(() => ['DE', 'Y', 'H', 'E', 'T'], []);
  const mallBooths = booths.filter((b) => b.clientFace === 'mall' && (!active || b.marketCode === active));

  const buy = (l: MallListing): void => {
    if (!user) { setNotice('请先登录（CU 自然人客户）'); return; }
    setNotice('');
    api.createOrder({ boothId: l.boothId, listingId: l.id, amountCents: l.priceCents, side: 'C' })
      .then((o) => setNotice(`下单成功：${o.code} · ¥${(o.amountCents / 100).toFixed(2)}`))
      .catch((e: unknown) => setNotice(e instanceof Error ? e.message : '下单失败'));
  };

  return (
    <div>
      <div className="rounded-xl border bg-white p-4 mb-5">
        <p className="font-serif-display text-xl font-black">Mall · C 端客户商城</p>
        <p className="mt-1 text-sm text-[#6b665a]">面向 CU 自然人客户的零售商城（DCX 产品铺在 Mall；DEX/DYX/DHX/DTX 在 Market B 端）。</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-serif-display font-bold">商城货架</span>
        <DomainChip code="" active={active === ''} onClick={() => setActive('')} />
        {domains.map((d) => (
          <span key={d} onClick={() => setActive(d)} className="cursor-pointer"><DomainChip code={d} active={active === d} /></span>
        ))}
      </div>

      {notice && <div className="mb-4 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm font-medium text-[#7a5c16]">{notice}</div>}

      <SectionTitle sub={`零售商品 · ${listings.length} 件`}>DU 零售铺（{mallBooths.length}）</SectionTitle>
      {mallBooths.map((b) => (
        <Link key={b.id} to={`/mall/booth/${b.id}`} className="mb-2 block rounded-lg border bg-white px-3 py-2 text-sm hover:bg-[#efeae0]">
          @{b.name} <span className="font-mono text-xs text-[#8a8577]">{b.code}</span>
          <span className="ml-2 text-xs text-[#8a8577]">{marketLabel(b.marketCode)} · DCX 在 Mall</span>
        </Link>
      ))}

      {listings.length === 0 ? <EmptyState text="该分类暂无上架零售商品" /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const b = l.booth;
            const color = colorOf(l.domain);
            return (
              <div key={l.id} className="paper-card hard-shadow flex flex-col rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color }}>{marketLabel(l.domain)}</span>
                  <span className="text-[11px] text-[#8a8577]">DU 直营零售</span>
                </div>
                <h3 className="mt-2 font-semibold">{l.title}</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {l.tags.map((t) => <span key={t} className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[10px] text-[#8a8577]">{t}</span>)}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif-display text-2xl font-black" style={{ color }}>¥{(l.priceCents / 100).toFixed(0)}</span>
                  <span className="text-xs text-[#8a8577]">/ {l.unit}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[#8a8577]">
                  {b ? <Link to={`/mall/booth/${b.id}`} className="hover:underline">@{b.name}</Link> : <span>—</span>}
                  <span>库存/批次归 Booth 实体系统</span>
                </div>
                <button onClick={() => buy(l)} className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#b8862b] py-2 text-sm font-semibold text-white hover:opacity-90">
                  <ShoppingCart className="h-4 w-4" /> 立即购买
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
