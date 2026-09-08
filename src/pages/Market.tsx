import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Plus, Store, Users } from 'lucide-react';
import { api, type MarketBooth, type MarketsData } from '../api/client';
import { DomainChip, DomainLine, SectionTitle } from '../components/ui';
import { DOMAIN_NAMES, MARKET_OWNER_ROLES } from '../lib/domain';
import type { Unit } from '../../shared/types';
import { useAuth } from '../Auth';

export default function Market() {
  const { user } = useAuth();
  const [booths, setBooths] = useState<MarketBooth[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [markets, setMarkets] = useState<MarketsData | null>(null);
  const [domain, setDomain] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', ownerUnitId: '', frontDesc: '', backDesc: '' });

  const domains = useMemo(() => ['E', 'H', 'Y', 'T', 'DE'] as const, []);
  const load = () => api.marketBooths(domain || undefined).then(setBooths).catch(console.error);
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [domain]);
  useEffect(() => {
    api.units({ side: 'B' }).then(setUnits).catch(console.error);
    api.markets().then(setMarkets).catch(console.error);
  }, []);

  // 当前选中域的合法铺主帽（专业市场约束）
  const ownerRoles = useMemo(() => (domain ? (MARKET_OWNER_ROLES[domain] ?? []) : []), [domain]);
  const ownerCandidates = useMemo(
    () => units.filter(u => ownerRoles.includes(u.role)),
    [units, ownerRoles],
  );

  useEffect(() => {
    if (user && user.entry === 'B' && user.hatId) {
      const r = user.hatRole as string;
      if (ownerRoles.includes(r)) setForm(f => ({ ...f, ownerUnitId: user.hatId as string }));
    }
  }, [user, ownerRoles]);

  useEffect(() => {
    if (!domain) setForm(f => ({ ...f, ownerUnitId: '' }));
  }, [domain]);

  const create = async () => {
    if (!domain || !form.name.trim()) { setNotice('请选择专业市场并填写摊位名'); return; }
    if (!form.ownerUnitId) { setNotice(`请选择该市场铺主帽（${ownerRoles.join(' / ')}）`); return; }
    try {
      await api.createBooth({ domain, name: form.name, ownerUnitId: form.ownerUnitId, frontDesc: form.frontDesc, backDesc: form.backDesc });
      setNotice(`${DOMAIN_NAMES[domain]}域·专业市场「${form.name}」已开张`);
      setShowForm(false);
      setForm({ name: '', ownerUnitId: '', frontDesc: '', backDesc: '' });
      load();
    } catch (e) { setNotice((e as Error).message); }
  };

  const activeMarket = markets?.markets.find(m => m.code === domain) ?? null;

  return (
    <div>
      <div className="layer-back hard-shadow mb-4 rounded-xl p-4 text-white">
        <div className="font-serif-display text-lg font-bold">Market · 企业采购中心 / B2B 撮合平台</div>
        <p className="mt-1 text-xs text-[#c9c4b8]">第五产品定位：<span className="text-[#f5f2eb]">五大专业市场</span>（<span className="font-semibold" style={{ color: '#17A290' }}>智场 Y</span> · <span className="font-semibold" style={{ color: '#C27A1B' }}>通货 E</span> · <span className="font-semibold" style={{ color: '#E4572E' }}>人资 H</span> · <span className="font-semibold" style={{ color: '#4A5FD5' }}>技术 T</span> · <span className="font-semibold" style={{ color: '#D6366E' }}>产品 DE</span>），对标 1688/58；<span className="text-[#25c2ad]">Y-Market 保留捷租 Jezoom 子品牌</span>。</p>
        <p className="mt-1 text-xs text-[#a49f92]">差异化：铺主系统内置 <span className="ticker-font text-[#f0b429]">FAB / WH / DL / SVC / LAB</span> 五大作业系统，<span className="text-[#f5f2eb]">拎包经营</span>赋能。</p>
      </div>

      {/* 五大专业市场主视角 */}
      {markets && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {markets.markets.map(mk => (
            <button
              key={mk.code}
              onClick={() => setDomain(mk.code)}
              className={`paper-card hard-shadow group cursor-pointer rounded-lg p-3 text-left transition-all hover:-translate-y-0.5 ${domain === mk.code ? 'ring-2' : ''}`}
              style={{ ['--tw-ring-color' as string]: mk.color }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded px-1.5 py-0.5 text-xs font-black text-white" style={{ background: mk.color }}>M-{mk.code}</span>
                <span className="ticker-font text-[11px] text-[#8a8577]">{mk.projectLine}</span>
              </div>
              <div className="mt-2 font-serif-display text-base font-bold">{mk.marketTitle}市场</div>
              <div className="mt-1 text-[11px] text-[#6b665a]">{mk.boothCode} · 铺主 {mk.ownerLabels.join('/')}{mk.hasFranchise ? '（含加盟）' : ''}</div>
              <div className="mt-1 text-[11px] text-[#8a8577]">运营 {mk.operatorRole} · {mk.boothCount} 摊 · 作业族 {mk.collectedFamily}</div>
            </button>
          ))}
        </div>
      )}

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
          <div className="mb-3 font-serif-display font-bold">在专业市场开张一个摊位</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <select value={domain} onChange={e => setDomain(e.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">选择专业市场…</option>
              {domains.map(d => <option key={d} value={d}>{d} · {DOMAIN_NAMES[d]}（{activeMarket?.marketTitle ?? ''}）</option>)}
            </select>
            <select value={form.ownerUnitId} onChange={e => setForm({ ...form, ownerUnitId: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">铺主帽（{ownerRoles.length ? ownerRoles.join(' / ') : '先选市场'}）…</option>
              {ownerCandidates.map(u => <option key={u.id} value={u.id}>{u.name}（{u.code}）</option>)}
            </select>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="摊位名称" className="rounded-md border bg-white px-3 py-2 text-sm" />
            <button onClick={create} className="rounded-md bg-[#b8862b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#a07522]">确认开张</button>
          </div>
          {activeMarket && (
            <div className="mt-3 text-xs text-[#6b665a]">
              本市场（{activeMarket.marketTitle}）铺主限定为 <span className="font-semibold">{activeMarket.ownerLabels.join(' / ')}</span>，项目线 {activeMarket.projectLine}，平台运营 {activeMarket.operatorRole}，内置作业系统族 {activeMarket.collectedFamily}（拎包经营）。
            </div>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={form.frontDesc} onChange={e => setForm({ ...form, frontDesc: e.target.value })} placeholder="售卖面说明（前店卖什么）" className="rounded-md border bg-white px-3 py-2 text-sm" />
            <input value={form.backDesc} onChange={e => setForm({ ...form, backDesc: e.target.value })} placeholder="履约面说明（后厂怎么履约）" className="rounded-md border bg-white px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[#8a8577]">
        <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Market=交易平台；经营户=铺子；帽=铺子经营者身份</span>
        {markets && (
          <span className="flex flex-wrap items-center gap-2">
            {markets.jobSystems.map(js => (
              <span key={js.code} className="flex items-center gap-1 rounded-full border border-[#e4ded2] bg-white px-2 py-0.5 text-[11px]">
                <Box className="h-3 w-3" style={{ color: '#b8862b' }} /> <b>{js.code}</b> {js.label}
              </span>
            ))}
          </span>
        )}
      </div>

      <SectionTitle sub={`${booths.length} 个`}>在营摊位（双层）</SectionTitle>

      {booths.length === 0 ? <div className="paper-card rounded-lg p-10 text-center text-sm text-[#8a8577]">该专业市场暂无摊位</div> : (
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