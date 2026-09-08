import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Warehouse, Plus, Star, Box } from 'lucide-react';
import { api, type BoothDetail, type MarketsData } from '../api/client';
import { DomainLine, EmptyState } from '../components/ui';
import { DOMAIN_COLORS, ORDER_STATUS } from '../lib/domain';
import type { JobSystem, Order, Listing } from '../../shared/types';

type Detail = BoothDetail & { orders: Order[] };

export default function MarketBooth() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [mk, setMk] = useState<MarketsData | null>(null);
  const [layer, setLayer] = useState<'front' | 'back'>('front');
  const [notice, setNotice] = useState('');
  const [lForm, setLForm] = useState({ title: '', spec: '', unit: '', price: '', stock: '' });
  const [fForm, setFForm] = useState({ title: '', task: '', capacity: '' });

  const load = () => { if (id) api.marketBooth(id).then(setData).catch(console.error); };
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id]);
  useEffect(() => { api.markets().then(setMk).catch(console.error); }, []);

  if (!data) return <div className="py-20 text-center text-[#8a8577]">加载中…</div>;
  const { booth, front, back, orders, owner, ops } = data;
  const color = DOMAIN_COLORS[booth.domain] ?? '#17181d';
  const market = mk?.markets.find(m => m.code === booth.domain) ?? null;
  const jobSystems: JobSystem[] = mk?.jobSystems ?? [];

  const addListing = async () => {
    const price = Number(lForm.price);
    if (!lForm.title || !lForm.unit || Number.isNaN(price)) { setNotice('标题/单位/价格必填'); return; }
    try {
      await api.addListing(booth.id, { title: lForm.title, spec: lForm.spec, unit: lForm.unit, price, stock: Number(lForm.stock) || 0 });
      setNotice('已在「前店售卖面」上架'); setLForm({ title: '', spec: '', unit: '', price: '', stock: '' }); load();
    } catch (e) { setNotice((e as Error).message); }
  };

  const addFulfillment = async () => {
    if (!fForm.title) { setNotice('任务标题必填'); return; }
    try {
      await api.addFulfillment(booth.id, { title: fForm.title, task: fForm.task, capacity: Number(fForm.capacity) || 0 });
      setNotice('已在「后厂履约面」新增产能任务'); setFForm({ title: '', task: '', capacity: '' }); load();
    } catch (e) { setNotice((e as Error).message); }
  };

  const advance = async (orderId: string) => {
    try { await api.advanceOrder(orderId); setNotice('交易状态已推进'); load(); } catch (e) { setNotice((e as Error).message); }
  };

  return (
    <div>
      <Link to="/market" className="mb-4 inline-flex items-center gap-1 text-sm text-[#8a8577] hover:text-[var(--ink)]">
        <ArrowLeft className="h-4 w-4" /> 返回经营台
      </Link>

      <div className="dark-panel rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-3">
          <DomainLine code={booth.domain} />
          <h1 className="font-serif-display text-2xl font-black">{booth.name}</h1>
          <span className="flex items-center gap-1 text-sm text-[#b8862b]"><Star className="h-4 w-4 fill-current" /> {booth.rating}</span>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-[#222329] p-3"><span className="text-[#8f8a7d]">前店（售卖面）</span><p className="text-[#e7e2d6]">{booth.frontDesc}</p></div>
          <div className="rounded-lg bg-[#222329] p-3"><span className="text-[#8f8a7d]">后厂（履约面）</span><p className="text-[#e7e2d6]">{booth.backDesc}</p></div>
        </div>
        <p className="mt-2 text-xs text-[#8f8a7d]">链路 {booth.mode} · 铺子经营者身份（供给帽）{owner?.name}（{owner?.code}）</p>
        {ops && <p className="mt-1 text-xs text-[#b8862b]">经营者身份（经营帽视角）：{ops.name}（{ops.code} · {ops.role}）</p>}
        {market && (
          <p className="mt-1 text-xs text-[#8f8a7d]">专业市场 {market.marketTitle} · 项目线 <span className="ticker-font font-black text-[#f5f2eb]">{market.projectLine}</span> · 平台运营 <span className="ticker-font font-black text-[#f5f2eb]">{market.operatorRole}</span> {market.hasFranchise ? '· 含加盟' : ''}</p>
        )}
        {market && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#222329] p-3">
            <span className="text-xs font-semibold text-[#e7e2d6]">拎包经营 · 内置作业系统：</span>
            {jobSystems.map(js => (
              <span key={js.code} className="flex items-center gap-1 rounded-full border border-[#3a3b44] bg-[#2a2b34] px-2 py-0.5 text-[11px] text-[#d8d3c7]">
                <Box className="h-3 w-3" style={{ color }} /> <b>{js.code}</b> {js.label}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-[#8f8a7d]">经营户 = 本铺子（Booth），帽为经营/操作本铺子的身份，不单独入驻</p>
      </div>

      {notice && <div className="mb-3 mt-4 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm text-[#7a5c16]">{notice}</div>}

      <div className="mt-5 flex gap-2">
        <button onClick={() => setLayer('front')} className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition ${layer === 'front' ? 'bg-[#b8862b] text-white' : 'paper-card hover:bg-[#efeae0]'}`}><Store className="h-4 w-4" /> 前店售卖面</button>
        <button onClick={() => setLayer('back')} className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition ${layer === 'back' ? 'bg-[#17181d] text-white' : 'paper-card hover:bg-[#efeae0]'}`}><Warehouse className="h-4 w-4" /> 后厂履约面</button>
      </div>

      {layer === 'front' && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-serif-display font-bold">上架商品</span>
              <span className="text-xs text-[#8a8577]">{front.length} 件</span>
            </div>
            {front.length === 0 ? <EmptyState text="暂无上架商品" /> : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {front.map((l: Listing) => (
                  <div key={l.id} className="paper-card rounded-lg p-3">
                    <div className="flex items-center justify-between"><span className="font-semibold text-sm">{l.title}</span><span className="text-[11px] text-[#8a8577]">{l.spec}</span></div>
                    <div className="ticker-font mt-2 text-lg font-black" style={{ color }}>¥{l.price}<span className="text-xs font-normal text-[#8a8577]">/{l.unit}</span></div>
                    <div className="ticker-font mt-1 text-xs text-[#8a8577]">库存 {l.stock}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="paper-card hard-shadow rounded-xl p-4">
            <div className="mb-2 flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" style={{ color }} /> 上架新商品</div>
            <div className="flex flex-col gap-2 text-sm">
              <input placeholder="商品标题" value={lForm.title} onChange={e => setLForm({ ...lForm, title: e.target.value })} className="rounded-md border bg-white px-3 py-2" />
              <input placeholder="规格说明" value={lForm.spec} onChange={e => setLForm({ ...lForm, spec: e.target.value })} className="rounded-md border bg-white px-3 py-2" />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="单位" value={lForm.unit} onChange={e => setLForm({ ...lForm, unit: e.target.value })} className="rounded-md border bg-white px-3 py-2" />
                <input placeholder="价格" value={lForm.price} onChange={e => setLForm({ ...lForm, price: e.target.value })} className="rounded-md border bg-white px-3 py-2" />
                <input placeholder="库存" value={lForm.stock} onChange={e => setLForm({ ...lForm, stock: e.target.value })} className="rounded-md border bg-white px-3 py-2" />
              </div>
              <button onClick={addListing} className="rounded-md bg-[#17181d] py-2 font-semibold text-white hover:bg-black">上架</button>
            </div>
          </div>
        </div>
      )}

      {layer === 'back' && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between"><span className="font-serif-display font-bold">未完成履约（后厂）</span><span className="text-xs text-[#8a8577]">{back.filter(f => f.status !== 'done').length} 项</span></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {back.map(f => (
                <div key={f.id} className="layer-back rounded-lg p-4">
                  <div className="flex items-center justify-between"><span className="font-semibold">{f.title}</span><span className="rounded bg-[#3a3b44] px-2 py-0.5 text-[11px]">{f.status}</span></div>
                  <p className="mt-1 text-xs text-[#b9b4a8]">{f.task}</p>
                  <div className="ticker-font mt-3 text-xs"><span className="text-[#8f8a7d]">负载</span> <span className="text-[#f5f2eb]">{f.used}/{f.capacity}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-[#3a3b44]"><div className="h-full" style={{ width: `${f.capacity ? Math.min(100, (f.used / f.capacity) * 100) : 0}%`, background: color }} /></div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 font-serif-display font-bold">本摊位交易单</div>
              {orders.length === 0 ? <EmptyState text="暂无交易单" /> : (
                <div className="overflow-hidden rounded-lg border">
                  {orders.map(o => {
                    const st = ORDER_STATUS[o.status] ?? { label: o.status, color: '#6b665a' };
                    return (
                      <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b bg-[#f5f2eb] px-4 py-2.5 text-sm">
                        <div><span className="ticker-font font-mono text-xs text-[#8a8577]">{o.tradeCode}</span><span className="ml-2 font-medium">{o.title} × {o.qty}</span></div>
                        <div className="flex items-center gap-3">
                          <span className="ticker-font font-bold" style={{ color }}>¥{o.amount.toLocaleString()}</span>
                          <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ color: st.color, background: `${st.color}18` }}>{st.label}</span>
                          {o.status !== 'done' && <button onClick={() => advance(o.id)} className="rounded-md border px-2 py-1 text-xs hover:bg-[#efeae0]">推进</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="dark-panel hard-shadow rounded-xl p-4">
            <div className="mb-2 flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" style={{ color }} /> 新增产能任务</div>
            <div className="flex flex-col gap-2 text-sm">
              <input placeholder="任务标题" value={fForm.title} onChange={e => setFForm({ ...fForm, title: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-[#17181d]" />
              <input placeholder="履约动作" value={fForm.task} onChange={e => setFForm({ ...fForm, task: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-[#17181d]" />
              <input placeholder="产能配额" value={fForm.capacity} onChange={e => setFForm({ ...fForm, capacity: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-[#17181d]" />
              <button onClick={addFulfillment} className="rounded-md bg-[#b8862b] py-2 font-semibold text-white hover:bg-[#a07522]">新建任务</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}