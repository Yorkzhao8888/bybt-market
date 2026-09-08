// P7 运营治理页骨架：V*M 市场秩序 / 规则制定 / 专业 Booth 系统供给
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, ScrollText, Boxes, ArrowRight } from 'lucide-react';
import { api, type GovernData } from '../api/client';
import { useAuth } from '../Auth';
import { colorOf, marketLabel, hatLabel } from '../lib/domain';

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
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#17181d] text-[#f5f2eb]">{icon}</span>
        <div>
          <h2 className="text-base font-bold text-[#17181d]">{title}</h2>
          <p className="text-xs text-[#8a8577]">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function Govern() {
  const { user } = useAuth();
  const [data, setData] = useState<GovernData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .governCases()
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <div className="py-16 text-center text-sm text-[#b4402e]">{err}</div>;
  if (!data) return <div className="py-16 text-center text-sm text-[#8a8577]">载入治理数据…</div>;

  const open = data.cases.filter((c) => c.status === 'open');
  const closed = data.cases.filter((c) => c.status === 'closed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#17181d]">运营治理 · {data.domain ?? '平台全域'}</h1>
          <p className="mt-1 text-sm text-[#6b665a]">
            {user ? `${hatLabel(user.hatRole)} · ${user.containerName}` : ''} —— 平台运营方只治理，不经营（Market=交易平台）
          </p>
        </div>
        <Link to="/market" className="flex items-center gap-1 text-sm text-[#4a5fd5] hover:underline">
          返回 Market <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.duties.map((d, i) => (
          <div key={d} className="rounded-lg border border-[#e4ded2] bg-[#fffdf8] p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            {i === 0 && <ShieldCheck className="mb-2 h-5 w-5 text-[#17a290]" />}
            {i === 1 && <ScrollText className="mb-2 h-5 w-5 text-[#c27a1b]" />}
            {i === 2 && <Boxes className="mb-2 h-5 w-5 text-[#4a5fd5]" />}
            <h3 className="font-bold text-[#17181d]">{d}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8a8577]">
              {i === 0 && '巡查五专业市场秩序：跨主体用铺、越权开铺、身份错挂等违规即时处置。'}
              {i === 1 && '维护开铺规则（Y/H/DE 可加盟，E/T 仅直营）与交易规则（Order-T 六族）。'}
              {i === 2 && '向铺主供给专业 Booth 实体系统：FAB/WH/DL/SVC/LAB，拎包经营。'}
            </p>
          </div>
        ))}
      </div>

      <Section icon={<Scale className="h-5 w-5" />} title={`治理案件（在办 ${open.length} / 办结 ${closed.length}）`} sub="先落管理页骨架与数据接口，处置动作由运营方在案卷内推进">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-md bg-[#17181d] px-3 py-2 text-xs font-semibold text-[#f5f2eb]">
            <span>案卷</span>
            <span>管辖</span>
            <span>状态</span>
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
              当前身份无管辖案件（仅 V*M 运营方可见；VDM 兼看全部案卷）
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
