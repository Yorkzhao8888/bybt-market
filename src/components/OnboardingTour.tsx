/**
 * X-MARKET-TI-05 用户教育训练（新手引导）—— 展示组件
 *
 * 纯前端：不调 API、不收集输入、不改业务数据；非模态浮层不阻塞业务操作。
 * - 首次登录（localStorage 无记录）延迟自动弹出对应角色引导；治理类 / 未识别角色弹三选一入口
 * - 「跳过引导」记录 skipped；「再次打开」由 Header 引导按钮（dispatchTourOpen）触发
 * - 视觉沿用现有设计体系：白底 + 炭黑硬阴影 + 工作台主题色 + 双称呼术语
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Flag,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../Auth';
import { workbenchOf, workbenchThemeOf } from '../lib/domain';
import { conceptTerm } from '../lib/terminology';
import {
  TOUR_IDENTITY_CHOICES,
  TOUR_OPEN_EVENT,
  dispatchTourOpen,
  readTourState,
  tourKindOf,
  tourStepsOf,
  writeTourState,
  type TourKind,
} from '../lib/onboarding';

const term = conceptTerm('onboarding');

export default function OnboardingTour() {
  const { user } = useAuth();
  const uid = user?.hatId ?? user?.containerId ?? null;
  const wb = workbenchOf(user?.hatRole);
  const theme = workbenchThemeOf(user?.hatRole);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TourKind | null>(null);
  const [idx, setIdx] = useState(0);

  /* 首次登录检测：无本地记录 → 延迟自动弹出（等页面渲染稳定） */
  useEffect(() => {
    if (!user) {
      setOpen(false);
      setKind(null);
      return;
    }
    if (readTourState(uid)) return;
    const timer = setTimeout(() => {
      setKind(tourKindOf(user.hatRole, wb));
      setIdx(0);
      setOpen(true);
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hatId, user?.hatRole]);

  /* Header「引导」按钮重开（不重置完成记录） */
  useEffect(() => {
    const handler = (): void => {
      if (!user) return;
      setKind(tourKindOf(user.hatRole, wb));
      setIdx(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_OPEN_EVENT, handler);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hatId, user?.hatRole, wb]);

  const steps = useMemo(() => (kind ? tourStepsOf(kind, { domainView: user?.domainView, hatRole: user?.hatRole }) : []), [kind, user?.domainView, user?.hatRole]);

  const closeWith = useCallback(
    (status: 'done' | 'skipped') => {
      writeTourState(uid, status, kind);
      setOpen(false);
    },
    [uid, kind],
  );

  const pick = useCallback((k: TourKind) => {
    setKind(k);
    setIdx(0);
  }, []);

  if (!user || !open) return null;
  const step = steps[idx];

  return (
    <>
      {/* 三选一入口（未识别角色自选身份；轻遮罩可点击关闭 = 记 skipped） */}
      {!kind && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#17181d]/30 p-4" onClick={() => closeWith('skipped')}>
          <div
            className="w-full max-w-md rounded-xl border border-[#e4ded2] bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`${term.big} · 选择身份`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 font-serif-display text-lg font-black">
                  <GraduationCap className="h-4.5 w-4.5" style={{ color: theme.accent }} />
                  {term.big}
                  <span className="text-[10px] font-normal text-[#8a8577]">{term.sys}</span>
                </p>
                <p className="mt-1 text-xs text-[#6b665a]">选择你的身份，按分步引导快速上手（可跳过，随时从顶栏「引导」重开）。</p>
              </div>
              <button onClick={() => closeWith('skipped')} className="rounded p-1 text-[#8a8577] hover:bg-[#efeae0]" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {TOUR_IDENTITY_CHOICES.map((c) => (
                <button
                  key={c.kind}
                  onClick={() => pick(c.kind)}
                  className="flex items-center justify-between rounded-lg border border-[#e4ded2] bg-[#faf8f3] px-3.5 py-3 text-left transition hover:border-[#c9c2b2] hover:bg-white"
                >
                  <span>
                    <span className="flex items-baseline gap-1.5 text-sm font-bold" style={{ color: theme.accent }}>
                      {c.big}
                      <span className="text-[10px] font-normal text-[#8a8577]">{c.sys}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-[#6b665a]">{c.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8a8577]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 引导浮层（非模态 · 右下角 · 不阻塞业务操作） */}
      {kind && step && (
        <aside
          className="fixed bottom-5 right-5 z-40 w-[380px] max-w-[92vw] overflow-hidden rounded-xl border border-[#e4ded2] bg-white shadow-[4px_4px_0_rgba(23,24,29,0.12)]"
          role="dialog"
          aria-label={term.big}
        >
          <div className="px-4 pt-3.5 pb-3" style={{ background: theme.accentSoft }}>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-black" style={{ color: theme.accentText }}>
                <GraduationCap className="h-4 w-4" />
                {term.big} · {steps.length} 步上手
                <span className="text-[10px] font-normal text-[#8a8577]">{term.sys}</span>
              </p>
              <button onClick={() => closeWith('skipped')} className="rounded p-1 text-[#8a8577] hover:bg-white/70" aria-label="关闭引导">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* 步骤条 */}
            <div className="mt-2.5 flex items-center gap-1.5">
              {steps.map((s, i) => (
                <span
                  key={s.key}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{ background: i <= idx ? theme.accent : '#e4ded2' }}
                  title={s.title}
                />
              ))}
            </div>
          </div>

          <div className="min-h-[196px] px-4 py-3">
            <p className="text-[11px] font-semibold text-[#8a8577]">
              第 {idx + 1} / {steps.length} 步
            </p>
            <p className="mt-0.5 font-serif-display text-base font-black">{step.title}</p>
            <div className="mt-2 space-y-2 text-xs leading-relaxed">
              <p className="flex gap-1.5">
                <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
                <span>
                  <span className="font-semibold">做什么：</span>
                  <span className="text-[#4b463a]">{step.what}</span>
                </span>
              </p>
              <p className="flex gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
                <span>
                  <span className="font-semibold">去哪个入口点：</span>
                  <Link to={step.entryPath} className="underline decoration-dotted underline-offset-2 hover:opacity-75" style={{ color: theme.accent }}>
                    {step.entryLabel}
                  </Link>
                </span>
              </p>
              <p className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
                <span>
                  <span className="font-semibold">完成标准：</span>
                  <span className="text-[#4b463a]">{step.done}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#e4ded2] px-4 py-2.5">
            <button onClick={() => closeWith('skipped')} className="flex items-center gap-1 text-xs text-[#8a8577] hover:text-[#4b463a]">
              <X className="h-3 w-3" /> 跳过引导（不再自动弹出）
            </button>
            <div className="flex items-center gap-1.5">
              {idx > 0 && (
                <button
                  onClick={() => setIdx(idx - 1)}
                  className="flex items-center gap-0.5 rounded-md border bg-white px-2.5 py-1.5 text-xs hover:bg-[#efeae0]"
                >
                  <ChevronLeft className="h-3 w-3" /> 上一步
                </button>
              )}
              {idx < steps.length - 1 ? (
                <button
                  onClick={() => setIdx(idx + 1)}
                  className="flex items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  style={{ background: theme.accent }}
                >
                  下一步 <ChevronRight className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={() => closeWith('done')}
                  className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  style={{ background: theme.accent }}
                >
                  <CheckCircle2 className="h-3 w-3" /> 完成引导
                </button>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

/** Header 重开入口：所有登录用户可见；引导纯展示层，点击仅重新打开向导 */
export function TourRestartButton() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <button
      onClick={dispatchTourOpen}
      title="新手引导（分步教学，可重开）"
      className="flex items-center gap-1 rounded-md border bg-white px-2.5 py-1 text-xs hover:bg-[#efeae0]"
    >
      <Lightbulb className="h-3.5 w-3.5" /> 引导
    </button>
  );
}
