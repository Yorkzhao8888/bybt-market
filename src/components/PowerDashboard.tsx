// X-MARKET-14 治-管-办运行看板（治位帽 only；数据同源 /api/power/dashboard：审计表 + 业务 store）
import { useEffect, useState } from 'react';
import { Activity, BarChart3, ClipboardList, Gauge } from 'lucide-react';
import { api } from '../api/client';
import { POWER_BADGE } from '../lib/domain';
import type { PowerKind } from '../lib/domain';
import type { PowerDashboard } from '../../shared/types';
import PowerBadge from './PowerBadge';

const KINDS: PowerKind[] = ['govern', 'manage', 'operate'];

export default function PowerDashboardBoard() {
  const [data, setData] = useState<PowerDashboard | null>(null);
  const [err, setErr] = useState('');
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    api.powerDashboard()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '看板加载失败'));
  }, []);

  if (err) {
    return (
      <div className="rounded-xl border border-[#b4402e40] bg-[#fdeaea] p-4 text-sm text-[#b4402e]">{err}</div>
    );
  }
  if (!data) {
    return <div className="rounded-xl border bg-white p-5 text-sm text-[#8a8577]">看板加载中…</div>;
  }

  const vol = range === '7d' ? data.volume7d : data.volume30d;
  const pct = data.coverage.percent;
  const max = Math.max(vol.govern, vol.manage, vol.operate, 1);
  const { approveAvgHours, rejectAvgHours, approveCount, rejectCount } = data.timeliness;

  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--line)' }}>
      <p className="flex items-center gap-2 font-serif-display text-xl font-black">
        <Gauge className="h-5 w-5" /> 治-管-办运行看板
      </p>
      <p className="mt-1 text-xs text-[#8a8577]">数据同源：powerAudit 审计表 + 供应商/货品业务表 · 治位帽专属</p>
      <div className="grid gap-4 md:grid-cols-2">
        {/* 1. 各权位动作量 */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <BarChart3 className="h-4 w-4" /> 各权位动作量（allowed 计）
            </p>
            <div className="flex overflow-hidden rounded-md border text-xs">
              <button
                onClick={() => setRange('7d')}
                className="px-2.5 py-1 font-semibold transition-colors"
                style={range === '7d' ? { background: POWER_BADGE.govern.color, color: '#fff' } : { color: '#6b665a' }}
              >
                近 7 天
              </button>
              <button
                onClick={() => setRange('30d')}
                className="px-2.5 py-1 font-semibold transition-colors"
                style={range === '30d' ? { background: POWER_BADGE.govern.color, color: '#fff' } : { color: '#6b665a' }}
              >
                近 30 天
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {KINDS.map((k) => {
              const b = POWER_BADGE[k];
              const v = vol[k];
              return (
                <div key={k} className="rounded-lg border p-2.5" style={{ borderColor: `${b.color}35` }}>
                  <p className="flex items-center gap-1">
                    <PowerBadge kind={k} text={false} />
                    <span className="text-xs text-[#6b665a]">{b.text}</span>
                  </p>
                  <p className="ticker-font mt-1 text-2xl font-black" style={{ color: b.color }}>{v}</p>
                  <div className="mt-1.5 h-1.5 w-full rounded bg-[#f0ece0]">
                    <div className="h-1.5 rounded" style={{ width: `${Math.round((v / max) * 100)}%`, background: b.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-[#8a8577]">
            累计：治 {data.volume.govern} · 管 {data.volume.manage} · 办 {data.volume.operate}
          </p>
        </div>

        {/* 2. 审批时效 */}
        <div className="rounded-xl border bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Activity className="h-4 w-4" /> 审批时效（供应商评估）
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#2e7d5430] bg-[#f0f7f2] p-3">
              <p className="text-xs font-semibold text-[#2e7d54]">平均通过时长</p>
              <p className="ticker-font mt-1 text-xl font-black text-[#2e7d54]">
                {approveAvgHours === null ? '暂无' : `${approveAvgHours} 小时`}
              </p>
              <p className="text-[11px] text-[#8a8577]">{approveCount} 笔通过</p>
            </div>
            <div className="rounded-lg border border-[#b4402e30] bg-[#fdf1ef] p-3">
              <p className="text-xs font-semibold text-[#b4402e]">平均驳回时长</p>
              <p className="ticker-font mt-1 text-xl font-black text-[#b4402e]">
                {rejectAvgHours === null ? '暂无' : `${rejectAvgHours} 小时`}
              </p>
              <p className="text-[11px] text-[#8a8577]">{rejectCount} 笔驳回</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#8a8577]">口径：申请 createdAt → 最近一次 allowed 评估审计 ts（越权 denied 不计入审批）</p>
        </div>

        {/* 3. 审计覆盖度 */}
        <div className="rounded-xl border bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Gauge className="h-4 w-4" /> 审计覆盖度
          </p>
          <div className="mt-3 flex items-end gap-3">
            <p className="ticker-font text-4xl font-black text-[#6D28D9]">
              {pct}
              <span className="text-lg">%</span>
            </p>
            <p className="pb-1.5 text-xs text-[#6b665a]">
              已审计 {data.coverage.audited} / 应审计 {data.coverage.total} 个写入口
            </p>
          </div>
          <div className="mt-2 h-2 w-full rounded bg-[#f0ece0]">
            <div className="h-2 rounded bg-[#6D28D9]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* 4. 待办队列 */}
        <div className="rounded-xl border bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <ClipboardList className="h-4 w-4" /> 待办队列
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center justify-between rounded-lg bg-[#f0e9fc] px-3 py-2">
              <span className="text-[#5b21b6]">待评估供应商申请</span>
              <b className="ticker-font text-[#6D28D9]">{data.todo.pendingReviews}</b>
            </p>
            <p className="flex items-center justify-between rounded-lg bg-[#fbf0e0] px-3 py-2">
              <span className="text-[#92400e]">在架货品（可治理对象）</span>
              <b className="ticker-font text-[#B45309]">{data.todo.listedProducts}</b>
            </p>
            <p className="flex items-center justify-between rounded-lg bg-[#f5f2eb] px-3 py-2">
              <span className="text-[#4a463c]">治理下架累计</span>
              <b className="ticker-font text-[#17181d]">{data.todo.governedCount}</b>
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-right text-[11px] text-[#a39b88]">
        快照时间：{new Date(data.generatedAt).toLocaleString('zh-CN')}
      </p>
    </div>
  );
}
