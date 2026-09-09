// X-MARKET-13：三权审计列表（治-管-办留痕查看，越权→403→审计→可查闭环）
// scope='all'：治理台全量视图（服务端按治位帽下发）；scope='mine'：非治理工作台本人留痕（含 denied 越权尝试）
// 数据源 = GET /api/power/audit（服务端身份过滤，前端只做展示与筛选）
import { useEffect, useMemo, useState } from 'react';
import { ListFilter } from 'lucide-react';
import { api } from '../api/client';
import type { MarketPowerAuditRow } from '../../shared/types';

// 动作码 → 展示名（与 server/store.ts 三权种子同口径）
const ACTION_LABEL: Record<string, string> = {
  booth_new: '上新铺',
  market_inquiry: 'B2B 发起询价',
  bid_quote: '报价',
  contract_sign: 'B2B 签订合同',
  procurement_order: '采购下单',
  supplier_apply: '供应商准入登记',
  supplier_evaluate: '供应商评估',
  product_publish: '货品上架',
  product_remove: '货品下架',
  product_govern_remove: '治理下架',
};

const RESULT_BADGE: Record<MarketPowerAuditRow['result'], { text: string; cls: string }> = {
  allowed: { text: 'allowed 放行', cls: 'bg-[#e8f4ee] text-[#2e7d54]' },
  denied: { text: 'denied 拒绝', cls: 'bg-[#fdeaea] text-[#b4402e]' },
  escalated: { text: 'escalated 升级', cls: 'bg-[#f3eee3] text-[#8a6d3b]' },
};

function seqOf(a: MarketPowerAuditRow): number {
  const n = Number(a.id.replace(/\D/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function fmtTs(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', { hour12: false });
}

export default function PowerAuditList({ scope, accent, compact = false }: {
  scope: 'all' | 'mine';
  /** 工作台主题色（标题/筛选高亮）；缺省炭黑 */
  accent?: string;
  /** compact：工作台内嵌紧凑视图（mine 默认），仅展示最近 8 条 */
  compact?: boolean;
}) {
  const [rows, setRows] = useState<MarketPowerAuditRow[]>([]);
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [err, setErr] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.powerAudit({ action: action || undefined, result: result === '' ? undefined : (result as 'allowed' | 'denied') })
      .then(setRows)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '审计加载失败'))
      .finally(() => setLoaded(true));
  }, [action, result]);

  const view = useMemo(() => [...rows].sort((x, y) => (seqOf(y) - seqOf(x))), [rows]);
  const shown = compact ? view.slice(0, 8) : view;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <ListFilter className="h-3.5 w-3.5" style={{ color: accent ?? '#8a8577' }} />
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-md border border-[#e4ded2] bg-white px-2.5 py-1.5 text-xs text-[#17181d]">
          <option value="">全部动作</option>
          {Object.entries(ACTION_LABEL).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <select
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="rounded-md border border-[#e4ded2] bg-white px-2.5 py-1.5 text-xs text-[#17181d]">
          <option value="">全部结果</option>
          <option value="allowed">allowed（放行）</option>
          <option value="denied">denied（拒绝）</option>
        </select>
        <span className="text-xs text-[#8a8577]">共 {view.length} 条 · 时间倒序</span>
      </div>

      {err && <p className="mt-3 text-xs text-[#b4402e]">{err}</p>}
      {loaded && !err && view.length === 0 && (
        <p className="mt-3 rounded-md border border-dashed border-[#e4ded2] px-3 py-4 text-center text-xs text-[#8a8577]">
          {scope === 'all' ? '暂无审计记录（三权动作允许/拒绝全量留痕）' : '暂无留痕（你的操作与越权尝试会记录在此，仅本人可见）'}
        </p>
      )}

      {shown.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="ticker-font w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#e4ded2] text-[#8a8577]">
                <th className="py-2 pr-2">时间</th>
                <th className="py-2 pr-2">动作</th>
                {scope === 'all' && <th className="py-2 pr-2">帽</th>}
                {scope === 'all' && <th className="py-2 pr-2">操作人</th>}
                <th className="py-2 pr-2">结果</th>
                {scope === 'all' && <th className="py-2 pr-2">治理人</th>}
                <th className="py-2">详情</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => {
                const badge = RESULT_BADGE[a.result];
                return (
                  <tr key={a.id} className="border-b border-[#efe9dc] last:border-0">
                    <td className="py-2 pr-2 whitespace-nowrap text-[#6b665a]">{fmtTs(a.ts)}</td>
                    <td className="py-2 pr-2 whitespace-nowrap font-semibold text-[#17181d]">
                      {ACTION_LABEL[a.action_code] ?? a.action_code}
                      {a.booth_code && <span className="ml-1.5 font-mono text-[10px] text-[#8a8577]">{a.booth_code}</span>}
                    </td>
                    {scope === 'all' && <td className="py-2 pr-2 font-mono text-[#6b665a]">{a.actor_hat}</td>}
                    {scope === 'all' && <td className="py-2 pr-2 font-mono text-[#6b665a]">{a.actor_user}</td>}
                    <td className="py-2 pr-2">
                      <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.text}</span>
                    </td>
                    {scope === 'all' && <td className="py-2 pr-2 font-mono text-[#6b665a]">{a.governor || '—'}</td>}
                    <td className="py-2 text-[#8a8577]">{a.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {compact && view.length > shown.length && (
            <p className="mt-2 text-[11px] text-[#8a8577]">仅显示最近 {shown.length} 条（共 {view.length} 条），治理台可查全量。</p>
          )}
        </div>
      )}
    </div>
  );
}
