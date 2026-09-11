// X-MARKET-ENTRANCE-01 容器类型页（XMK-CONT-01 六容器定版）：#xhpz 个人 / #xepz 企业 / #xdpz 经营户 实卡三入口；#xvpz 平台 / #xopz 治理 / #xgpz 政府 预留不开放。
import { Navigate, useNavigate } from 'react-router-dom';
import { UserRound, Building2, Store, Landmark, Boxes, Scale, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth';
import { CONTAINER_META, RESERVED_CONTAINERS, roleHomeOf } from './entrance';
import type { ContainerKind } from './entrance';

const ENTERABLE: ContainerKind[] = ['personal', 'enterprise', 'dp'];
const ENTER_ICON: Record<ContainerKind, typeof UserRound> = { personal: UserRound, enterprise: Building2, dp: Store };

export default function EntranceGate() {
  const { user, activeRole } = useAuth();
  const nav = useNavigate();
  // 已登录且已有视角 → 直进工作台；已登录未选角色 → 角色选择页
  if (user && activeRole) return <Navigate to={roleHomeOf(user)} replace />;
  if (user && !activeRole) return <Navigate to="/entrance/role" replace />;

  const enter = (c: ContainerKind) => nav(`/entrance/login?container=${c}`);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h1 className="font-serif-display text-3xl font-black">X-Market · 登入端</h1>
        <p className="mt-2 text-sm text-[#8a8577]">一角色一登入 · 选择容器类型进入对应登录</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ENTERABLE.map((c) => {
          const m = CONTAINER_META[c];
          const Icon = ENTER_ICON[c];
          return (
            <button
              key={c}
              onClick={() => enter(c)}
              className="group rounded-xl border border-[#e4ded2] bg-white p-5 text-left shadow-[4px_4px_0_rgba(23,24,29,0.08)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(23,24,29,0.12)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[#f5f2eb]" style={{ background: m.accent }}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-xs text-[#8a8577]">{m.code}</p>
                  <p className="font-serif-display text-lg font-black">{m.name}</p>
                </div>
                {/* XMK-CONT-01 容器简称徽标（X?PZ→?P） */}
                <span className="ml-auto rounded-md border px-2 py-0.5 font-mono text-xs font-bold" style={{ color: m.accent, borderColor: m.accent }}>
                  {m.short}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#6b665a]">{m.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: m.accent }}>
                进入登录 <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>

      {/* 预留容器：置灰展示，不做功能 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {RESERVED_CONTAINERS.map((m) => (
          <div key={m.code} className="rounded-xl border border-dashed border-[#d9d2c2] bg-[#faf8f3] p-5 opacity-60">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d9d2c2] bg-[#efeae0] text-[#a09a8b]">
                {m.code === '#xgpz' ? <Landmark className="h-5 w-5" /> : m.code === '#xopz' ? <Scale className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-mono text-xs text-[#a09a8b]">{m.code}</p>
                <p className="font-serif-display text-lg font-black text-[#6b665a]">{m.name}</p>
              </div>
              <span className="ml-auto rounded-md border border-[#d9d2c2] px-2 py-0.5 font-mono text-xs font-bold text-[#a09a8b]">{m.short}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#a09a8b]">{m.desc}</p>
            <span className="mt-4 inline-block rounded border border-[#d9d2c2] px-2 py-0.5 text-[11px] text-[#a09a8b]">预留 · 未开放</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-[#8a8577]">
        <Link to="/" className="text-[#b8862b] underline">回到首页了解五域集市</Link>
      </p>
    </div>
  );
}
