import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Store, Users } from 'lucide-react';
import { api, type MarketBooth } from '../api/client';
import { DomainChip, DomainLine, SectionTitle } from '../components/ui';
import { DOMAIN_NAMES } from '../lib/domain';
import type { Unit } from '../../shared/types';
import { useAuth } from '../Auth';

export default function Market() {
  const { user } = useAuth();
  const [booths, setBooths] = useState<MarketBooth[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [domain, setDomain] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', ownerUnitId: 'u-eu1', frontDesc: '', backDesc: '' });

  const domains = useMemo(() => ['E', 'H', 'Y', 'T', 'DE'], []);
  const load = () => api.marketBooths(domain || undefined).then(setBooths).catch(console.error);
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [domain]);
  useEffect(() => { api.units({ side: 'B' }).then(setUnits).catch(console.error); }, []);
  useEffect(() => {
    if (user && user.entry === 'B' && user.hatId) setForm(f => ({ ...f, ownerUnitId: user.hatId as string }));
  }, [user]);

  const create = async () => {
    if (!domain || !form.name.trim()) { setNotice('请选择域并填写摊位名'); return; }
    try {
      await api.createBooth({ domain, name: form.name, ownerUnitId: form.ownerUnitId, frontDesc: form.frontDesc, backDesc: form.backDesc });
      setNotice(`${DOMAIN_NAMES[domain]}域摊位「${form.name}」已开张`);
      setShowForm(false);
      setForm({ name: '', ownerUnitId: 'u-eu1', frontDesc: '', backDesc: '' });
      load();
    } catch (e) { setNotice((e as Error).message); }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-serif-display font-bold">Market 经营台</span>
        <DomainChip code="" active={domain === ''} onClick={() => setDomain('')} />
        {domains.map(d => (
          <span key={d} onClick={() => setDomain(d)} className="cursor-pointer">
            <DomainChip code={d} active={domain === d} />
          </span>
        ))}
        <button onClick={() => setShowForm(v => !v)} className="ml-auto flex items-center gap-1.5 rounded-md bg-[#17181d] px-3 py-2 text-sm font-semibold text-white hover:bg-black">
          <Plus className="h-4 w-4" /> 新开摊位
        </button>
      </div>

      {notice && <div className="mb-4 rounded-lg bg-[#e8e0cb] px-4 py-2 text-sm font-medium text-[#7a5c16]">{notice}</div>}

      {showForm && (
        <div className="paper-card hard-shadow mb-6 rounded-xl p-5">
          <div className="mb-3 font-serif-display font-bold">在新域开张一个摊位</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <select value={domain} onChange={e => setDomain(e.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">选择交易域…</option>
              {domains.map(d => <option key={d} value={d}>{d} · {DOMAIN_NAMES[d]}</option>)}
            </select>
            <select value={form.ownerUnitId} onChange={e => setForm({ ...form, ownerUnitId: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-sm">
              {units.map(u => <option key={u.id} value={u.id}>{u.name}（{u.code}）</option>)}
            </select>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="摊位名称" className="rounded-md border bg-white px-3 py-2 text-sm" />
            <button onClick={create} className="rounded-md bg-[#b8862b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#a07522]">确认开张</button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={form.frontDesc} onChange={e => setForm({ ...form, frontDesc: e.target.value })} placeholder="售卖面说明（前店卖什么）" className="rounded-md border bg-white px-3 py-2 text-sm" />
            <input value={form.backDesc} onChange={e => setForm({ ...form, backDesc: e.target.value })} placeholder="履约面说明（后厂怎么履约）" className="rounded-md border bg-white px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 text-sm text-[#8a8577]">
        <Users className="h-4 w-4" /> 经营侧（B端）· {units.length} 顶经营帽可统辖摊位
      </div>

      <SectionTitle sub={`${booths.length} 个`}>在营摊位（双层）</SectionTitle>

      {booths.length === 0 ? <div className="paper-card rounded-lg p-10 text-center text-sm text-[#8a8577]">该域暂无摊位</div> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {booths.map(b => (
            <Link key={b.id} to={`/market/booth/${b.id}`} className="paper-card hard-shadow group flex flex-col rounded-lg p-4 hover:bg-[#efeae0]">
              <div className="flex items-center justify-between">
                <span className="ticker-font text-[11px] text-[#8a8577]">{b.code}</span>
                <DomainLine code={b.domain} />
              </div>
              <h3 className="mt-2 font-semibold">{b.name}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-[#6b665a]">{b.frontDesc}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-md bg-[#f0ead9] p-2">
                  <div className="ticker-font text-base font-black"><Store className="mr-1 inline h-3.5 w-3.5" />{b.frontCount}</div>
                  <div className="text-[#8a8577]">前店上架</div>
                </div>
                <div className="layer-back rounded-md p-2">
                  <div className="ticker-font text-base font-black">{b.backCount} · {b.backLoad}</div>
                  <div className="text-[#9c978a]">后厂任务·负载</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#8a8577]">
                <span>{b.owner?.name}</span>
                <span className="rounded-full px-2 py-0.5" style={{ background: b.status === 'open' ? '#e4ece2' : '#efe0dd', color: b.status === 'open' ? '#1e6b3a' : '#9c3a2a' }}>{b.status === 'open' ? '营业中' : '已闭摊'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}