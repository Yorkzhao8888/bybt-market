// MARKET-CONN-01：订单详情「Booth 履约时间线」卡（消费侧展示层）
// 数据经 Market server 代理（server 持有 OAS token，不落地浏览器）；30s 轮询联动订单状态回写
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { BoothTimelineResp, BoothFulfillmentNode } from '../../shared/types';
import { CONCEPT_TERMS } from '../lib/terminology';

const NODE_ORDER = ['placed', 'accepted', 'fulfilling', 'delivered'] as const;
const NODE_FALLBACK_LABEL: Record<string, string> = {
  placed: 'Market 下单',
  accepted: '供给铺接单',
  fulfilling: 'DU 履约',
  delivered: '交付确认',
};
const STATE_META: Record<string, { dot: string; text: string; label: string }> = {
  done: { dot: '#16A34A', text: '#16A34A', label: '完成' },
  doing: { dot: '#2563EB', text: '#2563EB', label: '进行中' },
  pending: { dot: '#9CA3AF', text: '#6B7280', label: '待推进' },
};

function fmtAt(at: string | null | undefined): string {
  if (!at) return '--';
  const d = new Date(at);
  return Number.isFinite(d.getTime()) ? d.toLocaleString('zh-CN', { hour12: false }) : '--';
}

export default function BoothTimelineCard({ orderId }: { orderId: string }) {
  const [data, setData] = useState<BoothTimelineResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = (): void => {
    api
      .boothTimeline(orderId)
      .then((d) => {
        setData(d);
        setErr(null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : '加载失败'));
  };

  useEffect(() => {
    load();
    timerRef.current = window.setInterval(load, 30_000); // 状态联动：30s 轮询（不强求 SSE）
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // 四节点固定序渲染：Booth 下发 nodes 按 key 映射，缺失补 pending 占位（与 Booth 端状态语义一致）
  const nodes: Array<BoothFulfillmentNode & { key: string }> = data?.timeline?.nodes?.length
    ? NODE_ORDER.map((key) => {
        const hit = data.timeline?.nodes.find((n) => n.key === key);
        return hit
          ? { ...hit, key }
          : { key, label: NODE_FALLBACK_LABEL[key] ?? key, at: null, state: 'pending', actor: undefined };
      })
    : [];

  return (
    <div className="mt-3 rounded-xl border border-black/10 bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-black/85">{CONCEPT_TERMS.boothTimeline?.big ?? '履约时间线'}</span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-black/50">{CONCEPT_TERMS.boothTimeline?.sys ?? 'Booth · 履约链路'}</span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[11px] text-black/60">{data?.orderCode ?? orderId}</span>
        </div>
        <div className="flex items-center gap-3">
          {data?.fetchedAt ? (
            <span className="text-[11px] text-black/40">同步于 {fmtAt(new Date(data.fetchedAt).toISOString())}</span>
          ) : null}
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] text-black/60 transition-colors hover:bg-black/5"
          >
            刷新
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg bg-amber-50 px-3 py-3 text-[12px] text-amber-700">履约时间线加载失败：{err}（30s 后自动重试）</div>
      ) : !data ? (
        <div className="rounded-lg bg-black/[0.03] px-3 py-3 text-[12px] text-black/40">正在拉取 Booth 履约数据...</div>
      ) : data.unreachable ? (
        <div className="rounded-lg bg-black/[0.03] px-3 py-3">
          <span className="text-[12px] text-black/50">暂未进入履约：Booth 履约通道暂未就绪，通道恢复后自动显示四节点。</span>
          <a className="ml-1 text-[12px] underline" href={data.deepLink} target="_blank" rel="noreferrer">在 Booth 中查看 ↗</a>
        </div>
      ) : !data.matched || !data.timeline ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/[0.03] px-3 py-3">
          <span className="text-[12px] text-black/50">暂未进入履约：该订单尚未在 Booth 产生履约记录（订单透传对齐后自动显示四节点）。</span>
          <a
            href={data.deepLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-black/15 px-3 py-1 text-[12px] font-medium text-black/70 transition-colors hover:bg-black/5"
          >
            在 Booth 中查看 ↗
          </a>
        </div>
      ) : (
        <>
          <ol className="space-y-0">
            {nodes.map((n, i) => {
              const meta = STATE_META[n.state] ?? STATE_META.pending!;
              const last = i === nodes.length - 1;
              return (
                <li key={n.key} className="relative flex gap-3 pb-4 pl-1 last:pb-0">
                  {!last ? <span className="absolute left-[9px] top-5 h-full w-px bg-black/10" aria-hidden="true" /> : null}
                  <span
                    className="relative z-10 mt-0.5 inline-block h-[18px] w-[18px] shrink-0 rounded-full border-2 bg-white"
                    style={{ borderColor: meta.dot }}
                    aria-hidden="true"
                  >
                    {n.state === 'done' ? (
                      <span className="absolute inset-[3px] rounded-full" style={{ background: meta.dot }} />
                    ) : n.state === 'doing' ? (
                      <span className="absolute inset-[5px] rounded-full animate-pulse" style={{ background: meta.dot }} />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-semibold" style={{ color: n.state === 'pending' ? '#6B7280' : '#17181D' }}>
                        {n.label || NODE_FALLBACK_LABEL[n.key] || n.key}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: meta.text }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-black/45">
                      <span>{fmtAt(n.at)}</span>
                      {n.actor ? <span className="font-mono">操作方 {n.actor}</span> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
            <span className="text-[11px] text-black/40">
              履约单 <span className="font-mono">{data.timeline.orderNo}</span>
              {data.timeline.source ? <span className="ml-2">来源 {data.timeline.source}</span> : null}
            </span>
            <a
              href={data.deepLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#17181D] px-3.5 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-85"
            >
              在 Booth 中查看 ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}
