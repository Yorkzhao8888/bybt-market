// 供给台（X-MARKET-08）：供给帽（EU/HU/YU/TU）专属
// 1) 供应商准入登记（资质/品类/产能/报价意向 → 云中心 VXM 评估）
// 2) 登记状态：待评估 / 合格 / 驳回（附原因，可重新提交）
// 3) 合格后货品上架管理：上架/下架（名称/品类/规格/报价/单位/库存）
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Clock3, PackagePlus, ShieldAlert, Warehouse, XCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../Auth';
import { colorOf } from '../lib/domain';
import type { SupplierApplication, SupplierProduct } from '../../shared/types';

const SUPPLY_HATS = ['EU', 'HU', 'YU', 'TU'];

export default function SupplyDesk() {
  const { user } = useAuth();
  const [app, setApp] = useState<SupplierApplication | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  // 登记表单
  const [qualification, setQualification] = useState('');
  const [categories, setCategories] = useState('');
  const [capacity, setCapacity] = useState('');
  const [priceIntent, setPriceIntent] = useState('');
  const [appMsg, setAppMsg] = useState('');
  // 货品表单
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pSpec, setPSpec] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pUnit, setPUnit] = useState('');
  const [pStock, setPStock] = useState('');
  const [pMsg, setPMsg] = useState('');

  const isSupply = user !== null && SUPPLY_HATS.includes(user.hatRole ?? '');

  const load = useCallback(async () => {
    if (!isSupply) return;
    try {
      const [a, ps] = await Promise.all([api.myApplication(), api.myProducts()]);
      setApp(a);
      setProducts(ps);
    } catch {
      setApp(null);
      setProducts([]);
    } finally {
      setLoaded(true);
    }
  }, [isSupply]);
  useEffect(() => { void load(); }, [load]);

  if (!isSupply || !loaded) return null;

  const submitApp = (): void => {
    setAppMsg('');
    api.submitApplication({ categories, capacity, qualification, priceIntent })
      .then((a) => { setApp(a); setAppMsg('登记申请已提交，云中心评估中'); setQualification(''); setCategories(''); setCapacity(''); setPriceIntent(''); })
      .catch((e: unknown) => setAppMsg(e instanceof Error ? e.message : '提交失败'));
  };

  const addProduct = (): void => {
    setPMsg('');
    const cents = Math.round(Number(pPrice) * 100);
    if (!pName.trim() || !pCategory.trim() || !cents || cents <= 0) { setPMsg('名称/品类/报价为必填'); return; }
    api.addProduct({ name: pName, category: pCategory, spec: pSpec, priceCents: cents, unit: pUnit || '件', stock: Number(pStock) || 0 })
      .then((p) => { setProducts((s) => [...s, p]); setPMsg(`已上架：${p.name}`); setPName(''); setPCategory(''); setPSpec(''); setPPrice(''); setPStock(''); })
      .catch((e: unknown) => setPMsg(e instanceof Error ? e.message : '上架失败'));
  };

  const toggleProduct = (id: string): void => {
    setPMsg('');
    api.toggleProduct(id)
      .then((p) => setProducts((s) => s.map((x) => (x.id === p.id ? p : x))))
      .catch((e: unknown) => setPMsg(e instanceof Error ? e.message : '操作失败'));
  };

  const approved = app?.status === 'approved';

  return (
    <div className="space-y-4">
      {/* 供应商准入登记 / 状态 */}
      <div className="rounded-xl border bg-white p-5">
        <p className="flex flex-wrap items-center gap-2 font-serif-display text-lg font-black">
          <ShieldAlert className="h-5 w-5 text-[#b8862b]" /> 供给台 · 供应商准入登记
          {app?.status === 'pending' && <span className="flex items-center gap-1 rounded bg-[#f3eee3] px-2 py-0.5 text-xs font-medium text-[#8a6d3b]"><Clock3 className="h-3.5 w-3.5" /> 待云中心评估</span>}
          {approved && <span className="flex items-center gap-1 rounded bg-[#eef7ee] px-2 py-0.5 text-xs font-medium text-[#2f7d5b]"><BadgeCheck className="h-3.5 w-3.5" /> 合格供应商</span>}
          {app?.status === 'rejected' && <span className="flex items-center gap-1 rounded bg-[#fbeaea] px-2 py-0.5 text-xs font-medium text-[#b0413e]"><XCircle className="h-3.5 w-3.5" /> 已驳回</span>}
        </p>
        <p className="mt-1 text-xs text-[#8a8577]">流程：供给方登记 → VXM 云中心评估（通过/驳回）→ 合格供应商 → 纳入 DU 采购商城 → 上架货品 → DU 一键下单。交易单向：供给方唯一交易对手 = DU。</p>

        {app?.status === 'rejected' && (
          <p className="mt-3 rounded-md bg-[#fbeaea] px-3 py-2 text-sm text-[#b0413e]">
            驳回原因：{app.rejectReason ?? '未填写'} —— 请补正材料后重新提交。
          </p>
        )}
        {app?.status === 'pending' && (
          <p className="mt-3 rounded-md bg-[#f3eee3] px-3 py-2 text-sm text-[#8a6d3b]">
            登记材料已提交（资质：{app.qualification}），云中心运营审批统筹（VXM）评估中；驳回后将附原因并允许重新提交。
          </p>
        )}

        {!approved && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="资质（如 ISO9001 / 经营许可）" className="rounded-md border px-3 py-2 text-sm" />
            <input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="供货品类（如 MRO/五金/建材）" className="rounded-md border px-3 py-2 text-sm" />
            <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="产能/供货能力（如 月供 5000 件）" className="rounded-md border px-3 py-2 text-sm" />
            <input value={priceIntent} onChange={(e) => setPriceIntent(e.target.value)} placeholder="报价意向（如 月结 30 天）" className="rounded-md border px-3 py-2 text-sm" />
            <div className="md:col-span-2">
              <button onClick={submitApp} disabled={!qualification.trim() || !categories.trim()} className="rounded-md bg-[#b8862b] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">
                {app?.status === 'rejected' ? '重新提交登记' : '提交准入登记'}
              </button>
              {appMsg && <span className="ml-3 text-xs text-[#2f7d5b]">{appMsg}</span>}
            </div>
          </div>
        )}
      </div>

      {/* 合格后：货品上架管理 */}
      {approved && (
        <div className="rounded-xl border bg-white p-5">
          <p className="flex items-center gap-2 font-serif-display text-lg font-black">
            <Warehouse className="h-5 w-5" style={{ color: colorOf(app.domain) }} /> 货品上架管理
            <span className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs font-medium text-[#8a6d3b]">在架货品进入 DU 采购商城（客户不可见）</span>
          </p>
          {products.length > 0 ? (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#8a8577]">
                  <th className="py-1.5">货品</th><th>品类</th><th>规格</th><th className="text-right">报价</th><th>单位</th><th className="text-right">库存</th><th>状态</th><th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-[#efeae0]">
                    <td className="py-2 font-semibold">{p.name}</td>
                    <td className="text-xs text-[#6b665a]">{p.category}</td>
                    <td className="font-mono text-xs text-[#6b665a]">{p.spec || '—'}</td>
                    <td className="ticker-font text-right font-bold">¥{(p.priceCents / 100).toLocaleString()}</td>
                    <td className="text-xs text-[#6b665a]">/{p.unit}</td>
                    <td className="ticker-font text-right text-xs">{p.stock.toLocaleString()}</td>
                    <td>
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${p.status === 'on' ? 'bg-[#eef7ee] text-[#2f7d5b]' : 'bg-[#f3eee3] text-[#8a6d3b]'}`}>
                        {p.status === 'on' ? '在架' : '已下架'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => toggleProduct(p.id)} className="rounded-md border px-2.5 py-1 text-xs hover:bg-[#efeae0]">
                        {p.status === 'on' ? '下架' : '重新上架'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-[#8a8577]">暂无货品，请在下方上架第一批货品。</p>
          )}
          <div className="mt-4 grid gap-2 border-t border-[#efeae0] pt-3 md:grid-cols-6">
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="货品名称" className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
            <input value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="品类" className="rounded-md border px-3 py-2 text-sm" />
            <input value={pSpec} onChange={(e) => setPSpec(e.target.value)} placeholder="规格" className="rounded-md border px-3 py-2 text-sm" />
            <input value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="报价(元)" type="number" min={0} className="ticker-font rounded-md border px-3 py-2 text-sm" />
            <input value={pUnit} onChange={(e) => setPUnit(e.target.value)} placeholder="单位" className="rounded-md border px-3 py-2 text-sm" />
            <input value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="库存" type="number" min={0} className="ticker-font rounded-md border px-3 py-2 text-sm" />
            <div className="md:col-span-6">
              <button onClick={addProduct} className="flex items-center gap-1.5 rounded-md bg-[#17181d] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <PackagePlus className="h-4 w-4" /> 上架货品
              </button>
              {pMsg && <span className="ml-3 text-xs text-[#2f7d5b]">{pMsg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
