// Mall Booth（C 端 CU 零售 · DCX 门店）。
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, ShoppingCart } from 'lucide-react';
import { api } from '../api/client';
import type { BoothDetail } from '../api/client';
import { colorOf, marketLabel, hatLabel } from '../lib/domain';
import { useAuth } from '../Auth';

export default function MallBooth() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [d, setD] = useState<BoothDetail | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => { void api.marketBooth(id).then(setD); }, [id]);

  if (!d) return <div className="py-20 text-center text-sm text-[#8a8577]">加载中…</div>;
  const { booth, owner, listings } = d;
  const color = colorOf(booth.marketCode);

  const buy = (l: { id: string; priceCents: number }): void => {
    if (!user) { setNotice('请先登录（CU 自然人客户）'); return; }
    setNotice('');
    api.createOrder({ boothId: booth.id, listingId: l.id, amountCents: l.priceCents, side: 'C' })
      .then((o) => setNotice(`下单成功：${o.code} · ¥${(o.amountCents / 100).toFixed(2)}`))
      .catch((e: unknown) => setNotice(e instanceof Error ? e.message : '下单失败'));
  };

  return (
    <div>
      <Link to="/mall" className="mb-4 inline-flex items-center gap-1 text-sm text-[#8a8577] hover:text-[#17181d]">
        <ArrowLeft className="h-4 w-4" /> 返回商城
      </Link>

      <div className="dark-panel rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: color }}>{marketLabel(booth.marketCode)}</span>
          <h1 className="font-serif-display text-2xl font-black">{booth.name}</h1>
        </div>
        <p className="mt-2 text-sm text-[#cfcabb]">{booth.frontDesc}</p>
        <p className="mt-1 text-xs text-[#8f8a7d] font-mono">
          {booth.code} · 铺主 {owner ? `${owner.name}（${hatLabel(owner.role)}）` : booth.ownerUnitId} · DCX 在 Mall
        </p>
      </div>

      {notice && <div className="mt-3 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm font-medium text-[#7a5c16]">{notice}</div>}

      <div className="mt-4">
        <p className="mb-3 flex items-center gap-2 font-serif-display text-lg font-black"><Store className="h-5 w-5" /> 在售商品（{listings.length}）</p>
        {listings.length === 0 ? (
          <div className="paper-card rounded-lg p-8 text-center text-sm text-[#8a8577]">该铺暂无在售商品</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <div key={l.id} className="paper-card hard-shadow rounded-lg p-4">
                <div className="text-xs text-[#8a8577]">DU 直营零售</div>
                <h3 className="mt-1 font-semibold">{l.title}</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {l.tags.map((t) => <span key={t} className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[10px] text-[#8a8577]">{t}</span>)}
                </div>
                <div className="mt-2 text-2xl font-black" style={{ color }}>¥{(l.priceCents / 100).toFixed(0)} <span className="text-xs font-normal text-[#8a8577]">/ {l.unit}</span></div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#8a8577]">库存/批次归 Booth 实体系统</span>
                  <button onClick={() => buy(l)} className="flex items-center gap-1 rounded-md bg-[#b8862b] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                    <ShoppingCart className="h-3.5 w-3.5" /> 购买
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
