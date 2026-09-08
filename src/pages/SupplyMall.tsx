// DU 采购商城（X-MARKET-08）：合格供应商 + 在架货品 → 一键下单生成 DU 采购单
// 隔离口径：仅 DU 经营线可见；客户（XU/CU）/匿名 → 隔离提示，全程不出现供给方名称/报价/产能
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Boxes, Lock, ShieldCheck, ShoppingCart } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../Auth';
import { colorOf, roleLabel } from '../lib/domain';
import type { SupplyMallItem } from '../../shared/types';

export default function SupplyMall() {
  const { user } = useAuth();
  const [items, setItems] = useState<SupplyMallItem[]>([]);
  const [blocked, setBlocked] = useState('');
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setBlocked('');
    try {
      setItems(await api.supplyMall());
    } catch (e) {
      setItems([]);
      setBlocked(e instanceof Error ? e.message : '采购商城仅对 DU 经营主体开放');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const order = async (p: SupplyMallItem) => {
    setMsg('');
    try {
      const q = qty[p.id] && qty[p.id] > 0 ? Math.floor(qty[p.id]) : 1;
      const o = await api.createOrder({ supplierProductId: p.id, qty: q, side: 'B' });
      setMsg(`采购单已生成：${o.code} · ¥${(o.amountCents / 100).toLocaleString()}（供给关系单据，客户不可见）`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '下单失败');
    }
  };

  /* 隔离提示态：客户/匿名直访 */
  if (blocked) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/market" className="inline-flex items-center gap-1 text-sm text-[#8a8577] hover:text-[#17181d]">
          <ArrowLeft className="h-4 w-4" /> 返回 Market
        </Link>
        <div className="paper-card hard-shadow mt-4 rounded-xl p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-[#b8862b]" />
          <h1 className="mt-3 font-serif-display text-2xl font-black">采购商城仅对 DU 经营主体开放</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6b665a]">
            {blocked}
          </p>
          <div className="mx-auto mt-4 max-w-xl rounded-lg bg-[#f3eee3] px-4 py-3 text-left text-xs leading-6 text-[#8a6d3b]">
            <b>交易单向</b>：供给方唯一交易对手 = DU；DU 采购货品后经 DU 经营实体铺面向客户（XU 走 Market / CU 走 Mall）。
            客户界面信息隔离：全程不出现供给方名称/报价/产能；本商城数据只在 DU / 供给方 / 云中心（VXM）间流转。
          </div>
        </div>
      </div>
    );
  }

  const groups = Array.from(new Set(items.map((i) => i.supplierId))).map((sid) => ({
    supplierId: sid,
    supplierName: items.find((i) => i.supplierId === sid)?.supplierName ?? '',
    boothCode: items.find((i) => i.supplierId === sid)?.boothCode ?? '',
    domain: items.find((i) => i.supplierId === sid)?.domain ?? 'E',
    products: items.filter((i) => i.supplierId === sid),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-6 py-8">
      <div>
        <Link to="/market" className="inline-flex items-center gap-1 text-sm text-[#8a8577] hover:text-[#17181d]">
          <ArrowLeft className="h-4 w-4" /> 返回 Market
        </Link>
        <h1 className="mt-2 flex items-center gap-2 font-serif-display text-2xl font-black">
          <Boxes className="h-6 w-6 text-[#b8862b]" /> DU 采购商城
          <span className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs font-medium text-[#8a6d3b]">仅 DU 经营主体可见</span>
        </h1>
        <p className="mt-1 text-sm text-[#6b665a]">
          云中心（VXM）准入合格的供给方 → 在架货品直采。一键下单生成 DU 采购单（复用 EX-2026-100x 体系，关联 supplierId），客户不可见。
        </p>
      </div>

      {msg && (
        <p className="hard-shadow rounded-md border-l-4 border-l-[#2f7d5b] bg-[#eef7ee] px-4 py-2 text-sm text-[#2f7d5b]">
          <ShieldCheck className="mr-1 inline h-4 w-4" />{msg}
        </p>
      )}

      {loading && <p className="paper-card rounded-lg p-8 text-center text-sm text-[#8a8577]">加载采购商城…</p>}

      {!loading && groups.length === 0 && (
        <div className="paper-card rounded-lg p-10 text-center text-sm text-[#8a8577]">
          暂无合格供应商在架货品：供给方需先通过云中心准入评估并在供给台上架货品。
        </div>
      )}

      {groups.map((g) => (
        <div key={g.supplierId} className="paper-card hard-shadow rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4ded2] pb-3">
            <p className="flex items-center gap-2 font-serif-display text-lg font-black">
              <ShoppingCart className="h-5 w-5" style={{ color: colorOf(g.domain) }} />
              {g.supplierName}
              <span className="font-mono text-xs font-medium text-[#8a8577]">{g.boothCode}</span>
            </p>
            <span className="rounded px-2 py-0.5 text-[11px] font-bold" style={{ color: colorOf(g.domain), background: `${colorOf(g.domain)}18` }}>
              云中心准入合格 · Market-{g.domain}
            </span>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#8a8577]">
                <th className="py-1.5">货品</th><th>品类</th><th>规格</th><th className="text-right">报价</th><th>单位</th><th className="text-right">库存</th><th className="text-right">数量</th><th />
              </tr>
            </thead>
            <tbody>
              {g.products.map((p) => (
                <tr key={p.id} className="border-t border-[#efeae0]">
                  <td className="py-2 font-semibold">{p.name}</td>
                  <td className="text-xs text-[#6b665a]">{p.category}</td>
                  <td className="font-mono text-xs text-[#6b665a]">{p.spec || '—'}</td>
                  <td className="ticker-font text-right font-bold">¥{(p.priceCents / 100).toLocaleString()}</td>
                  <td className="text-xs text-[#6b665a]">/{p.unit}</td>
                  <td className="ticker-font text-right text-xs">{p.stock.toLocaleString()}</td>
                  <td className="text-right">
                    <input
                      type="number" min={1} value={qty[p.id] ?? ''} placeholder="1"
                      onChange={(e) => setQty((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
                      className="ticker-font w-16 rounded-md border px-2 py-1 text-right text-sm"
                    />
                  </td>
                  <td className="pl-2 text-right">
                    <button onClick={() => void order(p)} className="whitespace-nowrap rounded-md bg-[#17181d] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                      一键下单
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <p className="text-xs text-[#8a8577]">
        当前身份：{user ? `${roleLabel(user.hatRole ?? '')} · ${user.containerName}` : '未登录'}。
        采购单属 DU↔供给方单据，进入「订单」DU 总览；发票流：供给方开进项票 → DU 开销售票给客户；责任转移点 = 交付回执。
      </p>
    </div>
  );
}
