// 共享 UI 组件：域徽章、统计卡、双层摊位卡等
import type { ReactNode } from 'react';
import type { DomainMeta, DomainStats } from '../../shared/types';
import { DOMAIN_COLORS, DOMAIN_NAMES } from '../lib/domain';

export function DomainChip({ code, active, onClick }: { code: string; active?: boolean; onClick?: () => void }) {
  const color = DOMAIN_COLORS[code] ?? '#17181d';
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition"
      style={{
        borderColor: active ? color : 'var(--line)',
        background: active ? color : 'transparent',
        color: active ? '#fff' : 'var(--ink)',
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color, opacity: active ? 1 : 0.8 }} />
      <span>{DOMAIN_NAMES[code] ?? code}</span>
    </button>
  );
}

export function DomainLine({ code }: { code: string }) {
  const color = DOMAIN_COLORS[code] ?? '#17181d';
  return <span className="ticker-font rounded px-1.5 py-0.5 text-[11px] font-bold" style={{ color, background: `${color}18` }}>{code}</span>;
}

export function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="paper-card hard-shadow rounded-lg px-4 py-3">
      <div className="text-xs text-[#8a8577]">{label}</div>
      <div className="ticker-font mt-1 text-2xl font-black" style={{ color: color ?? 'var(--ink)' }}>{value}</div>
    </div>
  );
}

export function DomainStrip({ stats, active, onSelect }: { stats: DomainStats[]; active?: string; onSelect: (code: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stats.map(s => {
        const color = DOMAIN_COLORS[s.domain] ?? '#17181d';
        const isActive = active === s.domain;
        return (
          <button
            key={s.domain}
            onClick={() => onSelect(isActive ? '' : s.domain)}
            className="hard-shadow rounded-lg border p-3 text-left transition"
            style={{ borderColor: isActive ? color : 'var(--line)', background: isActive ? color : 'var(--paper-2)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif-display text-2xl font-black" style={{ color: isActive ? '#fff' : color }}>{s.domain}</span>
              <span className="text-[11px] font-semibold" style={{ color: isActive ? '#fff' : '#8a8577' }}>{DOMAIN_NAMES[s.domain]}</span>
            </div>
            <div className="ticker-font mt-2 text-[11px]" style={{ color: isActive ? '#fff' : '#6b665a' }}>
              {s.booths} 铺 · {s.listings} 上架 · ¥{s.turnover.toLocaleString()}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-serif-display text-xl font-bold">{children}</h2>
      {sub && <span className="text-sm text-[#8a8577]">{sub}</span>}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="paper-card rounded-lg p-10 text-center text-sm text-[#8a8577]">{text}</div>;
}

export function ToTicker({ meta }: { meta: DomainMeta[] }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {meta.map(m => (
        <span key={m.code} className="flex items-center gap-1.5 rounded-md border bg-[#efeae0] px-2 py-1 text-[11px]">
          <DomainLine code={m.code} />
          <span className="ticker-font font-medium text-[#5b564a]">{m.unitCode} → {m.tradeCode}</span>
        </span>
      ))}
    </div>
  );
}