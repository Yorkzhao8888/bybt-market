// X-MARKET-ROLE-01 治理分线：/govern 归 VDM（market 经营治理）——治理案件 / 规则（只读）/ 全局数据 / 三权审计 / X-OFD 履约中心
// 供应商准入审核、货品审批下架、大额采购审批、阈值配置 → 迁供给面管家审批台（src/x-supply/pages/SupplyGovernDesk.tsx，V*M 家族，X-MARKET-18）
// X-MARKET-09：治理者工作台 —— 紫色管控型：顶部全局统计 + 左侧导航（履约中心/治理案件/治理规则/全局数据/三权审计）
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, ScrollText, Boxes, ArrowRight, Gavel, Database, Ban, Lock, FileClock, RadioTower } from 'lucide-react';
import { api, type GovernData, type OrderRow } from '../api/client';
import { useAuth } from '../Auth';
import { colorOf, marketLabel, hatLabel, workbenchThemeOf } from '../lib/domain';
import type { GovernThresholds } from '../../shared/types';
import PowerAuditList from '../components/PowerAuditList';
import PowerDashboardBoard from '../components/PowerDashboard';
import { OfdCenter } from '../components/OfdCenter';

const PURPLE = '#6d28d9';
const PURPLE_SOFT = '#f0e9fc';

function Section({
  icon,
  title,
  sub,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md text-[#f5f2eb]" style={{ backgroundColor: PURPLE }}>{icon}</span>
        <div>
          <h2 className="text-base font-bold text-[#17181d]">{title}</h2>
          <p className="text-xs text-[#8a8577]">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ============ X-MARKET-15 阈值自动升级（治理触达） ============ */

/** 订单状态中文口径（含 15 新增 pending_approval/rejected） */
export function orderStatusLabel(s: OrderRow['status']): string {
  return s === 'pending' ? '待履约' : s === 'paid' ? '已支付' : s === 'fulfilling' ? '履约中' : s === 'done' ? '已完成'
    : s === 'pending_approval' ? '待治理审批' : s === 'rejected' ? '已驳回' : s;
}

/** X-MARKET-ROLE-01：大额采购阈值配置归供给面管家审批（supply 面，X-MARKET-18），/govern 仅只读展示归口 */
function ThresholdReadonly({ th }: { th: GovernThresholds | null }) {
  return (
    <div className="rounded-md border border-[#e4ded2] bg-white p-4">
      <p className="flex items-center gap-2 font-bold text-[#17181d]"><Gavel className="h-4 w-4" style={{ color: PURPLE }} />大额采购升级阈值</p>
      <p className="ticker-font mt-2 text-2xl font-black" style={{ color: PURPLE }}>
        ¥{(((th?.procurementAmountCents ?? 500000)) / 100).toLocaleString()}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-[#6b665a]">
        DU 采购单笔金额超阈值 → 自动升级管家审批（pending_approval）。配置归口：供给面管家审批台（supply 面，V*M 家族 threshold_update，X-MARKET-18）；本页只读展示。
      </p>
    </div>
  );
}

const RULES: Array<{ icon: ReactNode; title: string; desc: string }> = [
  { icon: <Ban className="h-4 w-4" />, title: '交易单向（P0）', desc: '供给实体铺唯一交易对手 = DU；客户越权采购 403。采购商城数据只在 DU/供给方/V*M 间流转。' },
  { icon: <ShieldCheck className="h-4 w-4" />, title: '信息隔离（TRUST_EXPOSURE）', desc: '客户界面仅露出质检/脱敏产地/服务等级/交付时效/售后；严禁露出供给方名称/报价/产能/联系方式/DU 采购合同。' },
  { icon: <Gavel className="h-4 w-4" />, title: '域开店限制', desc: 'Y/H/DE 域可加盟 DU；E/T 域仅平台直营 DU。开铺按域校验铺主帽（canOpenMarket）。' },
  { icon: <Lock className="h-4 w-4" />, title: 'Booth 权属（LOCKED）', desc: '供给实体归各自供给帽；五类 DU 经营实体全部归 DU；跨主体使用他方 Booth = 越权禁止。' },
];

type GovernSec = 'ofd' | 'cases' | 'rules' | 'data' | 'audit';

export default function Govern() {
  const { user } = useAuth();
  const [data, setData] = useState<GovernData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [th, setTh] = useState<GovernThresholds | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sec, setSec] = useState<GovernSec>('cases');
  const theme = workbenchThemeOf(user?.hatRole);

  useEffect(() => {
    api.governCases().then(setData).catch((e: Error) => setErr(e.message));
    api.orders().then(setOrders).catch(() => setOrders([]));
    api.governThresholds().then(setTh).catch(() => setTh(null));
  }, []);

  if (err) return <div className="py-16 text-center text-sm text-[#b4402e]">{err}</div>;
  if (!data) return <div className="py-16 text-center text-sm text-[#8a8577]">载入治理数据…</div>;

  const open = data.cases.filter((c) => c.status === 'open');
  const closed = data.cases.filter((c) => c.status === 'closed');
  const gmv = orders.reduce((sum, o) => sum + o.amountCents, 0);

  const kpis: Array<{ label: string; value: string }> = [
    { label: '全局订单', value: String(orders.length) },
    { label: '交易总额', value: `¥${(gmv / 100).toLocaleString()}` },
    { label: '在办案件', value: String(open.length) },
    { label: '办结案件', value: String(closed.length) },
  ];

  const NAV: Array<{ key: GovernSec; label: string; icon: ReactNode }> = [
    { key: 'ofd', label: '履约中心', icon: <RadioTower className="h-4 w-4" /> },
    { key: 'cases', label: '治理案件', icon: <Scale className="h-4 w-4" /> },
    { key: 'rules', label: '治理规则', icon: <ScrollText className="h-4 w-4" /> },
    { key: 'data', label: '全局数据', icon: <Database className="h-4 w-4" /> },
    { key: 'audit', label: '三权审计', icon: <FileClock className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* 工作台头部 + 全局统计 */}
      <div className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: PURPLE }}>经营治理工作台</span>
            <div>
              <h1 className="text-xl font-black text-[#17181d]">经营治理台 · {data.domain ?? '平台全域'}</h1>
              <p className="mt-0.5 text-xs text-[#6b665a]">
                {user ? `${hatLabel(user.hatRole)} · ${user.containerName} —— ` : ''}VDM 经营管理治理（market 面）：治理案件 / 全局总账 / 规则只读；供应商与货品审批归供给面管家审批台
              </p>
            </div>
          </div>
          <Link to="/orders" className="flex items-center gap-1 text-sm" style={{ color: PURPLE }}>全局交易单 <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-md border p-3" style={{ backgroundColor: PURPLE_SOFT, borderColor: '#e4ded2' }}>
              <p className="text-xs text-[#6b665a]">{k.label}</p>
              <p className="ticker-font mt-1 text-lg font-black" style={{ color: PURPLE }}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[168px_1fr]">
        {/* 左侧导航 */}
        <aside className="h-fit rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-2 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
          <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b0aa9b]">治理导航</p>
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setSec(n.key)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium ${sec === n.key ? 'text-white' : 'text-[#17181d] hover:bg-[#f3eee3]'}`}
              style={sec === n.key ? { backgroundColor: PURPLE } : undefined}>
              {n.icon}{n.label}
            </button>
          ))}
          <div className="mt-1 border-t border-[#e4ded2] px-2.5 pt-2 text-[11px] leading-relaxed text-[#8a8577]" style={{ color: theme.accentText }}>
            经营治理：履约中心 / 案件 / 规则 / 数据 / 审计
          </div>
        </aside>

        {/* 主区 */}
        <main className="min-w-0 space-y-4">
          {sec === 'ofd' && (
            <Section icon={<RadioTower className="h-5 w-5" />} title="履约中心（X-OFD 只读接入）" sub="订单履约可视与追踪；外部系统模拟契约期，只读不回写。">
              <OfdCenter />
            </Section>
          )}
          {sec === 'audit' && (
            <Section icon={<FileClock className="h-5 w-5" />} title="三权审计（治-管-办全量留痕）" sub="越权 → 403 → 审计 → 可查闭环：写入口的 allowed/denied 全量记录，govern 位动作回填治理人；按动作/结果筛选，时间倒序。">
              <PowerAuditList scope="all" accent={PURPLE} />
            </Section>
          )}
          {sec === 'cases' && (
            <Section icon={<Scale className="h-5 w-5" />} title={`治理案件（在办 ${open.length} / 办结 ${closed.length}）`} sub="market 面市场秩序案件归经营管理治理（VDM）；供给面审批走管家审批台（X-MARKET-18）">
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-md bg-[#17181d] px-3 py-2 text-xs font-semibold text-[#f5f2eb]">
                  <span>案卷</span><span>管辖</span><span>状态</span>
                </div>
                {[...open, ...closed].map((c) => (
                  <div key={c.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border border-[#e4ded2] px-3 py-2 text-sm">
                    <span className="text-[#17181d]">
                      <span className="mr-2 font-mono text-xs text-[#8a8577]">{c.kind}</span>
                      {c.desc}
                    </span>
                    <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: colorOf(c.domain) }}>
                      {marketLabel(c.domain)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === 'open' ? 'bg-[#fdeaea] text-[#b4402e]' : 'bg-[#e8f4ee] text-[#2e7d54]'}`}>
                      {c.status === 'open' ? '在办' : '办结'}
                    </span>
                  </div>
                ))}
                {data.cases.length === 0 && (
                  <div className="rounded-md border border-dashed border-[#e4ded2] px-3 py-6 text-center text-sm text-[#8a8577]">
                    当前身份无管辖案件（治理案件归经营管理治理 VDM；V*M 四源家族走供给面治理）
                  </div>
                )}
              </div>
            </Section>
          )}
          {sec === 'rules' && (
            <Section icon={<ScrollText className="h-5 w-5" />} title="治理规则（平台红线）" sub="定版口径：规则由治理方制定与执法，规则本身对全平台生效">
              <div className="space-y-3">
                <ThresholdReadonly th={th} />
                <div className="grid gap-3 md:grid-cols-2">
                  {RULES.map((r) => (
                    <div key={r.title} className="rounded-md border border-[#e4ded2] bg-white p-4">
                      <p className="flex items-center gap-2 font-bold text-[#17181d]"><span style={{ color: PURPLE }}>{r.icon}</span>{r.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#6b665a]">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
          {sec === 'data' && (
            <div className="space-y-4">
              <PowerDashboardBoard />
              <Section icon={<Database className="h-5 w-5" />} title="全局数据 · 交易总账" sub="VDM 全域订单总账（服务端按身份下发）；资金流三段 XCASE→ERP→X-FIN">
              <div className="overflow-x-auto">
                <table className="ticker-font w-full min-w-[560px] text-left text-xs">
                  <thead><tr className="border-b text-[#8a8577]"><th className="py-2">单号</th><th>族</th><th>买方</th><th>卖方</th><th className="text-right">金额</th><th className="text-right">状态</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-2 font-bold">{o.code}</td>
                        <td><span className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: colorOf(o.family) }}>{o.family}</span></td>
                        <td className="text-[#6b665a]">{o.buyerContainerId === 'c-du' ? 'DU 经营' : o.buyerContainerId}</td>
                        <td className="text-[#6b665a]">{o.supplierId ? '合格供应商' : o.sellerContainerId === 'c-du' ? 'DU 经营' : o.sellerContainerId}</td>
                        <td className="text-right font-bold">¥{(o.amountCents / 100).toLocaleString()}</td>
                        <td className="text-right">{orderStatusLabel(o.status)}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-[#8a8577]">暂无总账数据</td></tr>}
                  </tbody>
                </table>
              </div>
              </Section>
            </div>
          )}
        </main>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.duties.map((d, i) => (
          <div key={d} className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <div className="mb-2 flex items-center gap-2" style={{ color: PURPLE }}>
              {i === 0 && <ShieldCheck className="h-5 w-5" />}
              {i === 1 && <ScrollText className="h-5 w-5" />}
              {i === 2 && <Boxes className="h-5 w-5" />}
              <h3 className="font-bold text-[#17181d]">{d}</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#8a8577]">
              {i === 0 && '巡查五专业市场秩序：跨主体用铺、越权开铺、身份错挂等违规即时处置。'}
              {i === 1 && '维护开铺规则（Y/H/DE 可加盟，E/T 仅直营）与交易规则（Order-T 六族）。'}
              {i === 2 && '向铺主供给专业 Booth 实体系统：FAB/WH/DL/SVC/LAB，拎包经营。'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
