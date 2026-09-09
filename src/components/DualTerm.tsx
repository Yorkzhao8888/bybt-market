import { roleTerm, conceptTerm } from '../lib/terminology';

/**
 * 双称呼展示（v1.1）：大号=市面常态称呼为主，小号=系统称呼弱化副标。
 * 治理穿透字段（actor_hat/governor/actor_user）不使用本组件，保留系统标识原文。
 */
export default function DualTerm({
  kind,
  hat,
  accent,
  compact,
}: {
  kind?: string;
  hat?: string | null;
  accent?: string;
  compact?: boolean;
}) {
  const t = hat ? roleTerm(hat) : conceptTerm(kind ?? '');
  if (compact || t.big === t.sys) {
    return <span style={accent ? { color: accent } : undefined}>{t.big}</span>;
  }
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-bold" style={accent ? { color: accent } : undefined}>
        {t.big}
      </span>
      <span className="text-[10px] text-[#8a8577]">{t.sys}</span>
    </span>
  );
}
