// 13U 数据模型：容器(主体) → 帽(身份) → 域角色(交易对象)
import { useEffect, useState } from 'react';
import { Boxes, Layers, Link2, Store } from 'lucide-react';
import { api, type ContainerView, type HierarchyContainer, type MarketsData } from '../api/client';
import { CONTAINER_TYPE_LABEL, UNIT_ROLE_LABEL } from '../../shared/types';
import { PARTY_COLORS, partyOfRole } from '../lib/domain';

export default function Model() {
  const [containers, setContainers] = useState<ContainerView[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyContainer[]>([]);
  const [markets, setMarkets] = useState<MarketsData | null>(null);
  const [flows, setFlows] = useState<Partial<Record<'ORDER' | 'RESOURCE' | 'FUND', { caption: string; gate: string; status: string; note: string }>> | null>(null);
  const [err, setErr] = useState('');
  const [party, setParty] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, h, f, m] = await Promise.all([api.containers(), api.hierarchy(), api.flows(), api.markets()]);
        setContainers(c);
        setHierarchy(h);
        setFlows(f);
        setMarkets(m);
      } catch (error) {
        setErr(error instanceof Error ? error.message : '加载失败');
      }
    })();
  }, []);

  const activeContainers = containers.filter(c => c.hatCount > 0 || c.boothCount > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif-display text-2xl font-black">13U 数据模型 · 五大专业市场</h1>
        <p className="mt-1 text-sm text-[#8a8577]">主视角：五大专业市场（Y 智场 / E 通货 / H 人资 / T 技术 / DE 产品）；辅助：主体(容器) → 身份(帽) → 域角色(交易对象) · 13U 口径：PU→TU；13 = 12U + YU(域主)</p>
      </div>

      {/* 五大专业市场主视角（X-MARKET-04） */}
      {markets && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#17181d]"><Store className="h-4 w-4 text-[#b8862b]" /> 五大专业市场（专业视角，不混杂）</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {markets.markets.map(mk => (
              <div key={mk.code} className="paper-card hard-shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded px-1.5 py-0.5 text-xs font-black text-white" style={{ background: mk.color }}>M-{mk.code}</span>
                  <span className="ticker-font text-[11px] text-[#8a8577]">{mk.boothCode}</span>
                </div>
                <div className="mt-2 font-serif-display text-base font-bold">{mk.marketTitle}市场</div>
                <div className="mt-1 text-xs text-[#6b665a]">{mk.name}域 · {mk.summary}</div>
                <dl className="mt-3 space-y-1 text-[11px]">
                  <div className="flex justify-between"><dt className="text-[#8a8577]">铺主</dt><dd className="font-semibold">{mk.ownerLabels.join(' / ')}{mk.hasFranchise ? ' ·含加盟' : ''}</dd></div>
                  <div className="flex justify-between"><dt className="text-[#8a8577]">运营方</dt><dd className="font-semibold">{mk.operatorRole}</dd></div>
                  <div className="flex justify-between"><dt className="text-[#8a8577]">项目线</dt><dd className="ticker-font font-black">{mk.projectLine}</dd></div>
                  <div className="flex justify-between"><dt className="text-[#8a8577]">订单族</dt><dd className="ticker-font font-black">{mk.orderFamily}</dd></div>
                  <div className="flex justify-between"><dt className="text-[#8a8577]">作业系统</dt><dd className="ticker-font font-black">{mk.collectedFamily}</dd></div>
                  <div className="flex justify-between"><dt className="text-[#8a8577]">在营摊</dt><dd>{mk.boothCount}</dd></div>
                </dl>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6b665a]">
            <span className="font-semibold text-[#17181d]">平台运营方五职：</span>
            {markets.operatorDuties.map(d => <span key={d} className="rounded-full border border-[#e4ded2] bg-white px-2 py-0.5">{d}</span>)}
          </div>
        </section>
      )}

      {/* 容器概览 */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#17181d]"><Boxes className="h-4 w-4 text-[#b8862b]" /> 容器（主体）</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeContainers.map(c => (
            <div key={c.id} className="rounded-lg border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{c.name}</span>
                <span className="rounded-full bg-[#f5f2eb] px-2 py-0.5 text-[10px] font-semibold text-[#6b665a]">{c.typeLabel}</span>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-[#8a8577]">
                <span>{c.hatCount} 顶帽</span>
                <span>{c.boothCount} 个摊位</span>
                <span>信用 {c.credit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 三级结构 */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#17181d]"><Layers className="h-4 w-4 text-[#b8862b]" /> 容器 → 帽 → 摊位 <span className="text-[11px] font-normal text-[#8a8577]">（帽归属分类作辅助筛选）</span></h2>
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {(['客户','供应商','加盟商','运营管理方','组织管理'] as const).map((p) => (
            <button key={p} type="button" onClick={() => setParty(p === party ? '' : p)}
              className={`rounded-md border px-2 py-1 transition ${party === p ? 'border-[#17181d] font-bold text-[#17181d]' : 'border-[#e4ded2] text-[#8a8577]'}`}>
              <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: PARTY_COLORS[p] }} />{p}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {hierarchy.map(c => (
            <div key={c.id} className="rounded-lg border border-[#e4ded2] bg-white/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-bold">{c.name}</span>
                <span className="rounded bg-[#f5f2eb] px-1.5 py-0.5 text-[10px] text-[#6b665a]">{c.typeLabel}</span>
              </div>
              <ul className="space-y-1.5">
                {c.hats.length === 0 && <li className="text-xs text-[#b8b2a4]">暂无帽</li>}
                {c.hats.filter((hh) => !party || partyOfRole(hh.role) === party).map(h => (
                  <li key={h.id} className="flex items-center justify-between rounded-md bg-white px-2 py-1.5 text-xs">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold">{UNIT_ROLE_LABEL[h.role as keyof typeof UNIT_ROLE_LABEL] ?? h.role}</span>
                      <span className="rounded px-1 py-px text-[10px] font-medium" style={{ backgroundColor: PARTY_COLORS[partyOfRole(h.role)] + '1a', color: PARTY_COLORS[partyOfRole(h.role)] }}>{partyOfRole(h.role)}</span>
                      <span className="text-[#8a8577]">{h.name}</span>
                      {h.dispatch && <span className="rounded bg-[#e4572e]/10 px-1 text-[10px] text-[#e4572e]">调度</span>}
                      <span className="text-[10px] text-[#b8b2a4]">{h.domainTags.join('·') || '无域'}</span>
                    </span>
                    {h.booths.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#b8862b]"><Link2 className="h-3 w-3" />{h.booths.length}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 三流占位 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#17181d]">三流预留（XCASE 收口）</h2>
        {flows && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(flows).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-dashed border-[#e4ded2] bg-white/50 p-4">
                <div className="text-sm font-bold">{v.caption}</div>
                <div className="mt-1 text-xs text-[#8a8577]">{v.note}</div>
                <div className="mt-2 flex gap-2 text-[10px]">
                  <span className="rounded bg-[#f5f2eb] px-1.5 py-0.5 text-[#6b665a]">闸口 {v.gate}</span>
                  <span className="rounded bg-[#b8862b]/10 px-1.5 py-0.5 text-[#b8862b]">{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {err && <p className="mt-4 text-sm text-[#c0392b]">{err}</p>}
      <p className="mt-6 text-xs text-[#8a8577]">* 容器读侧 API 待对接 ERP-TENANT-READ-01，本单先立结构、读侧收口后对接。{CONTAINER_TYPE_LABEL.XOPZ}</p>
    </div>
  );
}