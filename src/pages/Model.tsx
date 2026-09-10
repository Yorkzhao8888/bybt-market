// X-MARKET-05：两套系统 + Booth 权属定版。Market 铺面层（专业市场/帽/价值链），Booth 作业层独立。
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Boxes, Store, Factory, Briefcase, Network } from 'lucide-react';
import { api } from '../api/client';
import type { MarketGroup } from '../api/client';
import type { BoothRow, Container, HatRow } from '../../shared/types';
import { CONTAINER_TYPE_LABEL, UNIT_ROLE_LABEL } from '../../shared/types';
import { colorOf, PRO_MARKET_ORDER } from '../lib/domain';

export default function Model() {
  const [markets, setMarkets] = useState<MarketGroup[]>([]);
  const [containers, setContainers] = useState<Array<Container & { containerTypeLabel: string }>>([]);
  const [hats, setHats] = useState<HatRow[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([api.markets(), api.containers(), api.units(), api.marketBooths()])
      .then(([m, c, h, b]) => { setMarkets(m.markets); setContainers(c); setHats(h); setBooths(b); })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const ordered = PRO_MARKET_ORDER
    .map((code) => markets.find((m) => m.code === code))
    .filter((m): m is MarketGroup => Boolean(m));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-display text-2xl font-black">链路模型 · 两套系统 + Booth 权属</h1>
        <p className="mt-1 text-sm text-[#8a8577]">
          Market（交易/铺面层）不经营、不持资源、不执行作业；Booth 实体系统（作业层）内置 FAB/WH/DL/SVC/LAB；Mall 为 C 端零售。
          价值链：供给方 Booth-Y/E/H/T（上游产能）→ DU 经营实体 Booth-DY/DH/DT/DE/DC（中游）→ Market/Mall（客户界面）。
        </p>
      </div>

      {err && <div className="rounded-lg bg-[#fbeaea] px-3 py-2 text-sm text-[#b0413e]">{err}</div>}

      {/* 五大专业市场 + Booth 权属 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-serif-display text-lg font-black"><Store className="h-5 w-5" /> 五大专业市场 · Booth 权属</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {ordered.map((m) => {
            const supply = booths.filter((b) => b.marketCode === m.code && b.kind === 'supply');
            const du = booths.filter((b) => b.marketCode === m.code && b.kind === 'du');
            return (
              <div key={m.code} className="rounded-xl border bg-white p-4" style={{ borderTop: `4px solid ${colorOf(m.code)}` }}>
                <div className="flex items-center justify-between">
                  <p className="font-serif-display text-lg font-black" style={{ color: colorOf(m.code) }}>Market-{m.code} · {m.marketTitle}</p>
                  <span className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs">{m.marketName}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#6b665a]">
                  <Field label="供给方实体铺" value={`${m.supplyBooth} → ${m.supplyOwner}（${supply.length}）`} icon={<Factory className="h-3.5 w-3.5" />} />
                  <Field label="DU 经营实体铺" value={`${m.duBooth} → DU（${du.length}）`} icon={<Briefcase className="h-3.5 w-3.5" />} />
                  <Field label="运营方" value={`${m.operatorRole}（平台运营长）`} />
                  <Field label="项目线" value={m.projectLine} />
                  <Field label="DU 执行帽" value={m.duExecHat} />
                  <Field label="客户界面" value={m.clientFace === 'mall' ? 'Mall(C端)' : 'Market(B端)'} />
                  <Field label="加盟" value={m.canFranchise ? '可加盟' : '仅平台直营'} />
                  <Field label="订单族" value={`Order-${m.orderFamily}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 价值链 */}
      <section className="rounded-xl border bg-[#17181d] p-5 text-[#f5f2eb]">
        <h2 className="mb-3 flex items-center gap-2 font-serif-display text-lg font-black"><Network className="h-5 w-5" /> 三方链路 / 价值链</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Chain text="上游供给：YU/EU/HU/TU Booth 实体（源头产能）" tone="bg-white/10" />
          <span>→</span>
          <Chain text="中游经营：DU 唯一主体 Booth-DY/DH/DT/DE/DC（执行细化 YDX/HDX/TDX/EDX/CDX）" tone="bg-white/15" />
          <span>→</span>
          <Chain text="客户界面：Market(XU 企业) / Mall(CU 自然人)" tone="bg-[#b8862b]" />
        </div>
        <p className="mt-2 text-xs text-white/70">下游消费端双身份（X-MARKET-18 增补）：XU 主身份=采购方（B端走 Market）/ CU 主身份=消费客户（C端走 Mall）；第二身份=客户资源供给方（需求侧资源：客户/流量/需求线索，授权式/贡献式，不占权位、不登录操作）。客户本体供给=源头侧，VCU=平台方运营客户资源（管理侧），分层不冲突；与供给四源（EU 物资/YU 空间/HU 人力/TU 技术）严格区分。</p>
        <p className="mt-3 text-xs text-white/70">跨主体使用他方 Booth = 越权，已禁止。E/T 仅平台直营 DU 开店；Y/H/DE 可加盟。</p>
      </section>

      {/* 容器 + 帽 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-serif-display text-lg font-black"><Boxes className="h-5 w-5" /> 容器（主体）与帽（身份）</h2>
        <div className="overflow-hidden rounded-xl border">
          {containers.map((c, i) => {
            const ch = hats.filter((h) => h.containerId === c.id);
            return (
              <div key={c.id} className={`${i > 0 ? 'border-t' : ''} bg-white px-4 py-3`}>
                <p className="font-semibold">{c.name} <span className="ml-1 text-xs text-[#8a8577]">[{c.containerTypeLabel}] {c.domainTag ? `· ${c.domainTag}` : ''}</span></p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ch.map((h) => (
                    <span key={h.id} className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs font-mono">
                      {h.role} <span className="text-[#8a8577]">{UNIT_ROLE_LABEL[h.role] ?? ''}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg bg-[#fbf9f4] px-2.5 py-1.5">
      <p className="flex items-center gap-1 text-[10px] text-[#8a8577]">{icon}{label}</p>
      <p className="mt-0.5 font-semibold text-[#17181d]">{value}</p>
    </div>
  );
}

function Chain({ text, tone }: { text: string; tone: string }) {
  return <span className={`rounded-lg px-3 py-2 ${tone}`}>{text}</span>;
}
