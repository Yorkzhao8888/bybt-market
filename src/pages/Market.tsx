// X-MARKET-09：Market = 客户工作台（B 端采购首页，浏览引导型，蓝主题）。
// 五大专业市场 tab + DU 铺面网格 + B2B 询价面板；供给/经营/治理分属 /supplier /operator /govern 独立工作台。
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Store, Briefcase, Send, Factory } from 'lucide-react';
import { api } from '../api/client';
import type { MarketGroup } from '../api/client';
import type { BoothRow, Container, HatRow, InquiryRow } from '../../shared/types';
import { useAuth } from '../Auth';
import { colorOf, canOperate, isAdminRole, roleLabel, hatLabel, PRO_MARKET_ORDER, workbenchOf, WORKBENCH_THEME } from '../lib/domain';
import InquiryList from '../components/InquiryList';

function kindLabel(kind: string): string {
  return kind === 'supply' ? '供给方实体铺' : 'DU 经营实体铺';
}

export default function Market() {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<MarketGroup[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [hats, setHats] = useState<HatRow[]>([]);
  const [inq, setInq] = useState<InquiryRow[]>([]);
  const [active, setActive] = useState<string>('Y');

  // B2B 询价面板
  const [inqBooth, setInqBooth] = useState('');
  const [inqItem, setInqItem] = useState('');
  const [inqMsg, setInqMsg] = useState('');

  const mayOperate = canOperate(user?.hatRole);
  const isAdmin = isAdminRole(user?.hatRole);

  useEffect(() => {
    void api.markets().then((r) => setMarkets(r.markets));
    void api.marketBooths().then(setBooths);
    void api.containers().then(setContainers);
    void api.units().then(setHats);
    void api.inquiries().then(setInq);
  }, []);

  const ordered = useMemo(
    () => PRO_MARKET_ORDER.map((c) => markets.find((m) => m.code === c)).filter((m): m is MarketGroup => Boolean(m)),
    [markets],
  );
  const current = ordered.find((m) => m.code === active);
  const marketBooths = booths.filter((b) => b.marketCode === active);
  const supplyBooths = marketBooths.filter((b) => b.kind === 'supply');
  const duBooths = marketBooths.filter((b) => b.kind === 'du');

  const containerName = (id: string): string => containers.find((u) => u.id === id)?.name ?? id;
  const hatOf = (id: string): HatRow | undefined => hats.find((h) => h.id === id);

  const refreshInq = (): void => { void api.inquiries().then(setInq); };

  const submitInquiry = (): void => {
    if (!inqBooth || !inqItem) return;
    setInqMsg('');
    api.createInquiry({ boothId: inqBooth, title: inqItem, detail: inqMsg })
      .then(() => { setInqMsg('询价已发送，等待铺主报价'); setInqItem(''); setInqBooth(''); return api.inquiries(); })
      .then(setInq)
      .catch((e: unknown) => setInqMsg(e instanceof Error ? e.message : '询价失败'));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-serif-display text-2xl font-black">Market · 企业采购中心（B 端交易平台）</p>
              {user?.hatRole && workbenchOf(user.hatRole) === 'client' && (
                <span className="rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ background: WORKBENCH_THEME.client.accent }}>客户工作台</span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6b665a]">
              五大专业市场各自独立。Market 只做交易（询价/报价/合同/订单），不经营、不持资源、不执行作业；作业系统归属 Booth 实体系统。
            </p>
          </div>
        </div>
        {!mayOperate && (
          <p className="mt-2 rounded-md px-3 py-2 text-xs text-[#1e40af]" style={{ background: WORKBENCH_THEME.client.accentSoft }}>
            客户视角（{user?.hat ? roleLabel(user.hatRole ?? '') : '未登录'}）：可浏览与询价；铺主操作分属供应商 / 经营者工作台（越权由服务端 403 兜底）。
          </p>
        )}
      </div>

      {/* 专业市场 tab（P4：后缀按各选项自身分类） */}
      <div className="flex flex-wrap gap-2">
        {ordered.map((m) => (
          <button key={m.code} onClick={() => setActive(m.code)}
            className={`rounded-lg border px-4 py-2 text-left transition ${active === m.code ? 'border-transparent text-white shadow-[4px_4px_0_rgba(23,24,29,0.18)]' : 'bg-white hover:bg-[#efeae0]'}`}
            style={active === m.code ? { backgroundColor: colorOf(m.code) } : undefined}>
            <span className="flex items-center gap-2 font-serif-display text-base font-black">
              <Store className="h-4 w-4" /> Market-{m.code}
            </span>
            <span className={`text-xs ${active === m.code ? 'text-white/85' : 'text-[#8a8577]'}`}>{m.marketTitle} · 摊 {m.supplyCount + m.duCount}</span>
          </button>
        ))}
      </div>

      {current && (
        <div className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="font-semibold">铺主：</span>
            <span>{current.supplyOwner} / DU{current.canFranchise ? '（可加盟）' : '（仅平台直营）'}</span>
            <span><b>运营方</b> {current.operatorRole}</span>
            <span><b>项目线</b> {current.projectLine}</span>
            <span className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs">客户界面：{current.clientFace === 'mall' ? 'Mall(C端)' : 'Market(B端)'}</span>
          </div>
        </div>
      )}

      {/* Booth 双层权属：供给方实体铺 / DU 经营实体铺 */}
      {current && (
        <div className="grid gap-4 md:grid-cols-2">
          <BoothGroup title="上游 · 供给方实体铺" icon={<Factory className="h-4 w-4" />} booths={supplyBooths} color={colorOf(active)} containerName={containerName} />
          <BoothGroup title="中游 · DU 经营实体铺" icon={<Briefcase className="h-4 w-4" />} booths={duBooths} color={colorOf(active)} containerName={containerName}
            onInquire={(id) => setInqBooth(id)} canBuy />
        </div>
      )}

      {/* 经营/供给/治理操作分属专属工作台：/operator · /supplier · /govern（X-MARKET-09） */}

      {/* B2B 询价面板（客户工作台主功能区） */}
      {current && !mayOperate && (
        <div className="rounded-xl border bg-white p-5">
          <p className="flex items-center gap-2 font-serif-display text-lg font-black"><Send className="h-4 w-4" /> B2B 采购询价</p>
          <p className="mt-1 text-xs text-[#8a8577]">询价 → 铺主报价 → 合同 → 下单（企业采购走 Market，不走 Mall 个人购买）。</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <select value={inqBooth} onChange={(e) => setInqBooth(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
              <option value="">选择询价铺面</option>
              {duBooths.map((b) => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}
            </select>
            <input value={inqItem} onChange={(e) => setInqItem(e.target.value)} placeholder="采购品类/规格" className="rounded-md border px-3 py-2 text-sm" />
            <input value={inqMsg} onChange={(e) => setInqMsg(e.target.value)} placeholder="数量/交期/备注" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <button onClick={submitInquiry} className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: WORKBENCH_THEME.client.accent }}>发送询价</button>
          {inqMsg && <p className="mt-2 text-xs text-[#1e40af]">{inqMsg}</p>}
        </div>
      )}

      {/* 询价/报价清单（按身份可见） */}
      <InquiryList inquiries={inq} booths={booths} containerName={containerName} hatOf={hatOf} isAdmin={isAdmin} canOperate={mayOperate} viewerUnit={user?.hatId ?? ''} refresh={refreshInq} />
    </div>
  );
}

function BoothGroup({ title, icon, booths, color, containerName, onInquire, canBuy }: {
  title: string; icon: ReactNode; booths: BoothRow[]; color: string;
  containerName: (id: string) => string; onInquire?: (id: string) => void; canBuy?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="mb-3 flex items-center gap-2 font-serif-display text-base font-black" style={{ color }}>{icon} {title}</p>
      <div className="space-y-3">
        {booths.length === 0 && <p className="text-sm text-[#8a8577]">暂无铺面</p>}
        {booths.map((b) => (
          <div key={b.id} className="rounded-lg border border-[#e4ded2] p-3 transition hover:shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <div className="flex items-center justify-between">
              <Link to={`/market/booth/${b.id}`} className="font-semibold hover:underline">{b.name}</Link>
              <span className="font-mono text-xs text-[#8a8577]">{b.code}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-[#6b665a]">{b.frontDesc}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8a8577]">
              <span>铺主：{containerName(b.ownerUnitId)}</span>
              {b.execHat && <span className="rounded bg-[#f3eee3] px-1.5 py-0.5">执行帽 {b.execHat}</span>}
              <span className="rounded bg-[#f3eee3] px-1.5 py-0.5">{kindLabel(b.kind)}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Link to={`/market/booth/${b.id}`} className="rounded-md border px-2.5 py-1 text-xs hover:bg-[#efeae0]">进铺面</Link>
              {canBuy && onInquire && <button onClick={() => onInquire(b.id)} className="rounded-md px-2.5 py-1 text-xs text-white hover:opacity-90" style={{ background: WORKBENCH_THEME.client.accent }}>询价</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// InquiryList 已抽至 src/components/InquiryList.tsx（Market 客户工作台与 OperatorDesk 经营者工作台共用）
