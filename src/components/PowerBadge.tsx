// X-MARKET-11 三权标识徽标：治（云治理 · 紫）/ 管（端经营 · 橙）/ 办（端执行 · 蓝）
// 口径：治在云（VXM/O*M 审批审计）、管在端（DU 经营决策 / *U 供给经营）、办在端（执行帽落地执行）
import { POWER_BADGE } from '../lib/domain';
import type { PowerKind } from '../lib/domain';

export default function PowerBadge({ kind, text = true }: { kind: PowerKind; text?: boolean }) {
  const b = POWER_BADGE[kind];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 align-middle text-[10px] font-bold leading-4"
      style={{ color: b.color, background: b.bg, border: `1px solid ${b.color}40` }}
      title={b.desc}
    >
      <span className="font-serif-display text-[11px]">{b.short}</span>
      {text && <span>· {b.text}</span>}
    </span>
  );
}
