// X-MARKET-ENTRANCE-01 角色选择页（V2/V3）：卡片列出当前账号可担任角色（帽）——
// 每卡含角色帽名（双称呼）、所属面、职责一句话、进入按钮；workbenchOf 默认落点标「默认进入」；
// 企业容器登录态展示企业名徽标；进入后 setActiveRole 落对应专业视角路由。
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, LogOut, UserRound, CornerDownRight } from 'lucide-react';
import { useAuth } from '../Auth';
import { CONTAINER_META, containerOf, roleBriefOf, roleHomeOf, rolesOf } from './entrance';
import { WORKBENCH_THEME, workbenchOf } from '../lib/domain';
import { roleTerm } from '../lib/terminology';
import type { HatRole } from '../../shared/types';

export default function EntranceRole() {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const nav = useNavigate();
  // 未登录直访角色选择页 → 回容器类型页（从头走流程）
  if (!user) return <Navigate to="/entrance" replace />;

  const roles = rolesOf(user); // P0 单帽；多帽扩展点
  const kind = containerOf(user.hatRole);
  const meta = CONTAINER_META[kind];
  const Icon = kind === 'personal' ? UserRound : Building2;

  const enter = (role: HatRole) => {
    setActiveRole(role);
    nav(roleHomeOf(user), { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* 登录态身份条：容器徽标 + 企业/单位名（V2 企业容器登录态展示企业名徽标） */}
      <div className="mb-6 rounded-xl border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.07)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-[#f5f2eb]" style={{ background: meta.accent }}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#17181d]">
                {kind === 'enterprise' ? user.containerName : `账号 ${user.containerName}`}
              </p>
              <p className="text-[11px] text-[#8a8577]">
                <span className="font-mono">{meta.code}</span> · {meta.name} · hatId {user.hatId ?? '—'}
              </p>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="flex items-center gap-1 rounded-md border border-[#e4ded2] px-2.5 py-1.5 text-xs text-[#6b665a] transition hover:bg-[#efeae0]"
          >
            <LogOut className="h-3.5 w-3.5" /> 退出登录
          </button>
        </div>
      </div>

      <div className="mb-5 text-center">
        <h1 className="font-serif-display text-2xl font-black">选择进入视角</h1>
        <p className="mt-1.5 text-sm text-[#8a8577]">一角色一登入：选择当前会话担任的角色帽，进入对应专业视角</p>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d9d2c2] bg-[#faf8f3] p-8 text-center">
          <p className="text-sm text-[#6b665a]">当前账号未绑定角色帽，无法进入专业视角。</p>
          <button onClick={() => void logout()} className="mt-3 text-xs text-[#b8862b] underline">退出并切换账号</button>
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => {
            const brief = roleBriefOf(role);
            const term = roleTerm(role);
            const theme = WORKBENCH_THEME[workbenchOf(role)];
            // P0 单帽账号恒为默认进入；多帽扩展时按 WORKBENCH_HOME[workbenchOf(role)] 优先级标记
            const isDefault = roles.length > 0 && role === roles[0];
            return (
              <div
                key={role}
                className="rounded-xl border border-[#e4ded2] bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.08)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(23,24,29,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#f5f2eb]" style={{ background: theme.accent }}>
                      {term.sys.slice(0, 1)}
                    </span>
                    <div>
                      <p className="font-serif-display text-lg font-black text-[#17181d]">
                        {term.big}
                        <span className="ml-2 text-xs font-normal text-[#8a8577]">{term.sys}</span>
                      </p>
                      <p className="mt-1 text-xs">
                        <span className="rounded px-1.5 py-0.5 font-semibold" style={{ background: theme.accentSoft, color: theme.accentText }}>
                          {brief.face}
                        </span>
                        {isDefault && (
                          <span className="ml-1.5 rounded bg-[#17181d] px-1.5 py-0.5 text-[11px] font-semibold text-[#f5f2eb]">
                            默认进入
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[#6b665a]">{brief.duty}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => enter(role)}
                    className="flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-[#f5f2eb] transition hover:opacity-90"
                    style={{ background: theme.accent }}
                  >
                    进入 <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 flex items-center gap-1 border-t border-dashed border-[#efeae0] pt-2 text-[11px] text-[#a09a8b]">
                  <CornerDownRight className="h-3 w-3" /> 落点 {roleHomeOf(user)}（{theme.label}）
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
