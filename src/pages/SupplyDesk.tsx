// 供应商工作台（X-MARKET-09）：供给帽（EU/HU/YU/TU）登录落点 /supplier
// 布局 = 业务操作型：左侧导航（准入登记/货品上架/采购单/产能概览），主区列表+表单
// 主题色 = 源头供给绿 #15803D（顶栏徽标/侧栏激活态/主按钮）
// 能力（X-MARKET-08）：准入登记 → VMX 评估 → 合格后上架货品 → 供给单据（DU 采购）→ 产能概览
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Boxes, Clock3, ClipboardList, FileClock, Gauge, PackagePlus, ShieldAlert, Warehouse, XCircle } from 'lucide-react';
import { api } from '../api/client';
import PowerAuditList from '../components/PowerAuditList';
import PowerBadge from '../components/PowerBadge';
import { useAuth } from '../Auth';
import { colorOf } from '../lib/domain';
import type { BoothRow, OrderRow, SupplierApplication, SupplierProduct } from '../../shared/types';

const GREEN = '#15803D';
const GREEN_SOFT = '#e8f5ec';
const GREEN_TEXT = '#166534';

type Sec = 'register' | 'products' | 'orders' | 'capacity' | 'audit';

const SECS: { id: Sec; label: string; icon: typeof ShieldAlert }[] = [
  { id: 'register', label: '准入登记', icon: ShieldAlert },
  { id: 'products', label: '货品上架', icon: Warehouse },
  { id: 'orders', label: '采购单', icon: ClipboardList },
  { id: 'capacity', label: '产能概览', icon: Gauge },
  { id: 'audit', label: '我的留痕', icon: FileClock },
];

export default function SupplyDesk() {
  const { user } = useAuth();
  const [sec, setSec] = useState<Sec>('register');
  const [app, setApp] = useState<SupplierApplication | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
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
  const [pErr, setPErr] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [a, ps, os, bs] = await Promise.all([api.myApplication(), api.myProducts(), api.orders(), api.marketBooths()]);
      setApp(a);
      setProducts(ps);
      setOrders(os);
      setBooths(bs.filter((b) => b.kind === 'supply' && b.ownerUnitId === user.hatId));
    } catch {
      setApp(null);
      setProducts([]);
      setOrders([]);
      setBooths([]);
    } finally {
      setLoaded(true);
    }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const submitApp = (): void => {
    setAppMsg('');
    api.submitApplication({ categories, capacity, qualification, priceIntent })
      .then((a) => { setApp(a); setAppMsg('登记申请已提交，云中心评估中'); setQualification(''); setCategories(''); setCapacity(''); setPriceIntent(''); })
      .catch((e: unknown) => setAppMsg(e instanceof Error ? e.message : '提交失败'));
  };

  const addProduct = (): void => {
    setPMsg('');
    setPErr('');
    const cents = Math.round(Number(pPrice) * 100);
    if (!pName.trim() || !pCategory.trim() || !cents || cents <= 0) { setPMsg('名称/品类/报价为必填'); return; }
    api.addProduct({ name: pName, category: pCategory, spec: pSpec, priceCents: cents, unit: pUnit || '件', stock: Number(pStock) || 0 })
      .then((p) => { setProducts((s) => [...s, p]); setPMsg(`已上架：${p.name}`); setPName(''); setPCategory(''); setPSpec(''); setPPrice(''); setPStock(''); })
      .catch((e: unknown) => setPErr(e instanceof Error ? e.message : '上架失败'));
  };

  const toggleProduct = (id: string): void => {
    setPMsg('');
    setPErr('');
    api.toggleProduct(id)
      .then((p) => setProducts((s) => s.map((x) => (x.id === p.id ? p : x))))
      .catch((e: unknown) => setPErr(e instanceof Error ? e.message : '操作失败'));
  };

  if (!loaded) return null;
  const approved = app?.status === 'approved';
  const onShelf = products.filter((p) => p.status === 'on');
  const totalStock = products.reduce((n, p) => n + (p.stock || 0), 0);
  const soldCents = orders.reduce((n, o) => n + (o.amountCents || 0), 0);

  return (
    <div className="space-y-4">
      {/* 工作台头：绿徽标 + 身份 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-5 py-4" style={{ borderTop: `3px solid ${GREEN}` }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ background: GREEN }}>供应商工作台</span>
          <span className="font-serif-display text-lg font-black">源头供给 · 业务操作型</span>
          <span className="text-xs text-[#8a8577]">{user?.containerName ?? user?.containerId} · {user?.hatRole}</span>
        </div>
        {approved && <span className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold" style={{ background: GREEN_SOFT, color: GREEN_TEXT }}><BadgeCheck className="h-3.5 w-3.5" /> 合格供应商</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-[176px_1fr]">
        {/* 左侧导航 */}
        <aside className="h-fit rounded-xl border bg-white p-2">
          {SECS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSec(id)}
              className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={sec === id ? { background: GREEN, color: '#fff' } : { color: '#44403c' }}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
          <p className="mt-2 rounded-lg px-3 py-2 text-[11px] leading-relaxed text-[#8a8577]">
            交易单向：供给方唯一交易对手 = DU。货品与产能仅对 DU/云中心可见。
          </p>
        </aside>

        {/* 主区 */}
        <main className="min-w-0 space-y-4">
          {sec === 'register' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex flex-wrap items-center gap-2 font-serif-display text-lg font-black">
                <ShieldAlert className="h-5 w-5" style={{ color: GREEN }} /> 供应商准入登记
                {app?.status === 'pending' && <span className="flex items-center gap-1 rounded bg-[#f3eee3] px-2 py-0.5 text-xs font-medium text-[#8a6d3b]"><Clock3 className="h-3.5 w-3.5" /> 待云中心评估</span>}
                {approved && <span className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium" style={{ background: GREEN_SOFT, color: GREEN_TEXT }}><BadgeCheck className="h-3.5 w-3.5" /> 合格</span>}
                {app?.status === 'rejected' && <span className="flex items-center gap-1 rounded bg-[#fbeaea] px-2 py-0.5 text-xs font-medium text-[#b0413e]"><XCircle className="h-3.5 w-3.5" /> 已驳回</span>}
                {(app?.resubmitCount ?? 0) > 0 && <span className="text-[11px] text-[#8a6d3b]">重提 {app?.resubmitCount} 次</span>}
                {app?.escalated && <span className="rounded bg-[#fdf3e0] px-1.5 py-0.5 text-[11px] font-bold text-[#b45309]" title="驳回重提超 3 次，升级待 V*M 复核">升级待复核</span>}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#8a8577]">
                <PowerBadge kind="manage" />
                流程：供给方登记 → VMX 云中心评估（通过/驳回）→ 合格供应商 → 纳入 DU 采购商城 → 上架货品 → DU 一键下单。
              </p>

              {app?.status === 'rejected' && (
                <p className="mt-3 rounded-md bg-[#fbeaea] px-3 py-2 text-sm text-[#b0413e]">
                  驳回原因：{app.rejectReason ?? '未填写'} —— 请补正材料后重新提交。
                </p>
              )}
              {app?.status === 'pending' && (
                <p className="mt-3 rounded-md bg-[#f3eee3] px-3 py-2 text-sm text-[#8a6d3b]">
                  登记材料已提交（资质：{app.qualification}），云中心运营审批统筹（VMX）评估中。
                </p>
              )}

              {!approved && (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="资质（如 ISO9001 / 经营许可）" className="rounded-md border px-3 py-2 text-sm" />
                  <input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="供货品类（如 MRO/五金/建材）" className="rounded-md border px-3 py-2 text-sm" />
                  <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="产能/供货能力（如 月供 5000 件）" className="rounded-md border px-3 py-2 text-sm" />
                  <input value={priceIntent} onChange={(e) => setPriceIntent(e.target.value)} placeholder="报价意向（如 月结 30 天）" className="rounded-md border px-3 py-2 text-sm" />
                  <div className="md:col-span-2">
                    <button onClick={submitApp} disabled={!qualification.trim() || !categories.trim()} className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40" style={{ background: GREEN }}>
                      {app?.status === 'rejected' ? '重新提交登记' : '提交准入登记'}
                    </button>
                    {appMsg && <span className="ml-3 text-xs" style={{ color: GREEN_TEXT }}>{appMsg}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {sec === 'products' && (
            approved ? (
              <div className="rounded-xl border bg-white p-5">
                <p className="flex flex-wrap items-center gap-2 font-serif-display text-lg font-black">
                  <Warehouse className="h-5 w-5" style={{ color: colorOf(app.domain) }} /> 货品上架管理
                  <PowerBadge kind="manage" />
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
                            <span className="inline-flex items-center gap-1.5">
                              <PowerBadge kind="manage" text={false} />
                              <button onClick={() => toggleProduct(p.id)} className="rounded-md border px-2.5 py-1 text-xs hover:bg-[#efeae0]">
                                {p.status === 'on' ? '下架' : '重新上架'}
                              </button>
                            </span>
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
                    <span className="inline-flex items-center gap-2">
                      <PowerBadge kind="manage" text={false} />
                      <button onClick={addProduct} className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: GREEN }}>
                        <PackagePlus className="h-4 w-4" /> 上架货品
                      </button>
                    </span>
                    {pMsg && <span className="ml-3 text-xs" style={{ color: GREEN_TEXT }}>{pMsg}</span>}
                    {pErr && <span className="ml-3 rounded border-l-4 border-l-[#b4402e] bg-[#fdeaea] px-2 py-1 text-xs font-medium text-[#b4402e]">{pErr}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-white p-5 text-sm text-[#8a8577]">
                <Boxes className="mr-2 inline h-4 w-4" />
                货品上架为合格供应商专属能力——请先完成「准入登记」并通过云中心（VMX）评估。
              </div>
            )
          )}

          {sec === 'orders' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex flex-wrap items-center gap-2 font-serif-display text-lg font-black">
                <ClipboardList className="h-5 w-5" style={{ color: GREEN }} /> 采购单（供给单据）
                <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: GREEN_SOFT, color: GREEN_TEXT }}>名下 Booth 相关 · 仅 DU 采购单，客户订单隔离</span>
              </p>
              {orders.length > 0 ? (
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#8a8577]">
                      <th className="py-1.5">单号</th><th>铺面</th><th>摘要</th><th className="text-right">金额</th><th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-[#efeae0]">
                        <td className="ticker-font py-2 font-bold">{o.code}</td>
                        <td className="font-mono text-xs text-[#6b665a]">{o.boothCode ?? o.boothId ?? '—'}</td>
                        <td className="max-w-[280px] truncate text-xs text-[#6b665a]">{o.note ?? '—'}</td>
                        <td className="ticker-font text-right font-bold">¥{((o.amountCents ?? 0) / 100).toLocaleString()}</td>
                        <td>
                          <span className="rounded px-1.5 py-0.5 text-[11px] font-bold" style={o.status === 'done' ? { background: GREEN_SOFT, color: GREEN_TEXT } : { background: '#f3eee3', color: '#8a6d3b' }}>
                            {o.status === 'done' ? '已交付' : o.status === 'pending' ? '履约中' : o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-3 text-sm text-[#8a8577]">暂无供给单据——DU 采购你货品后将在此出现（客户订单不会出现）。</p>
              )}
            </div>
          )}

          {sec === 'capacity' && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-4" style={{ borderTop: `3px solid ${GREEN}` }}>
                  <p className="text-xs text-[#8a8577]">在架货品</p>
                  <p className="ticker-font mt-1 text-2xl font-black" style={{ color: GREEN }}>{onShelf.length}<span className="text-sm font-medium text-[#8a8577]"> / {products.length} 件</span></p>
                </div>
                <div className="rounded-xl border bg-white p-4" style={{ borderTop: `3px solid ${GREEN}` }}>
                  <p className="text-xs text-[#8a8577]">总库存</p>
                  <p className="ticker-font mt-1 text-2xl font-black" style={{ color: GREEN }}>{totalStock.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border bg-white p-4" style={{ borderTop: `3px solid ${GREEN}` }}>
                  <p className="text-xs text-[#8a8577]">累计被采购金额</p>
                  <p className="ticker-font mt-1 text-2xl font-black" style={{ color: GREEN }}>¥{(soldCents / 100).toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-5">
                <p className="font-serif-display text-lg font-black">产能与铺面</p>
                <p className="mt-1 text-sm text-[#6b665a]">供货能力：{app?.capacity || '（登记后展示）'} · 报价意向：{app?.priceIntent || '—'} · 品类：{app?.categories || '—'}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {booths.map((b) => (
                    <div key={b.id} className="rounded-lg border p-3" style={{ borderLeft: `3px solid ${colorOf(b.domain)}` }}>
                      <p className="text-sm font-bold">{b.code} · {b.name}</p>
                      <p className="text-xs text-[#8a8577]">{b.domain} 域 · 供给实体铺 · 挂载 {b.execUnitId ?? '—'}</p>
                    </div>
                  ))}
                  {booths.length === 0 && <p className="text-sm text-[#8a8577]">名下暂无供给实体铺。</p>}
                </div>
              </div>
            </div>
          )}
          {sec === 'audit' && (
            <div className="rounded-xl border bg-white p-5">
              <p className="flex items-center gap-2 font-serif-display text-lg font-black"><FileClock className="h-4 w-4" style={{ color: GREEN }} /> 我的留痕（三权审计）</p>
              <p className="mt-1 text-xs text-[#8a8577]">登记/上架/下架等供给动作与越权尝试全部留痕，仅本人可见。</p>
              <PowerAuditList scope="mine" accent={GREEN} compact />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
