// X-MARKET-ENTRANCE-01 登录表单（V1）：选择容器类型 → 账号+密码登录；
// 现有 demo 账号按容器映射兼容（XU/CU → 个人容器，其余 → 企业容器），不做容器数据迁移；
// 企业容器登录态展示企业名徽标；demo 一键登录走 oneclick 通道（自动带默认角色直进视角）。
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Building2, UserRound, Zap } from 'lucide-react';
import { useAuth } from '../Auth';
import { api } from '../api/client';
import { CONTAINER_META, roleHomeOf } from './entrance';
import type { ContainerKind } from './entrance';
import type { DemoAccount } from '../../shared/types';

const CLIENT_HATS = ['XU', 'CU'];

export default function EntranceLogin() {
  const { user, activeRole, login, loginDemo } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const container: ContainerKind = params.get('container') === 'personal' ? 'personal' : 'enterprise';

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [demos, setDemos] = useState<DemoAccount[]>([]);

  useEffect(() => {
    void api.demos().then(setDemos).catch(() => setDemos([]));
  }, []);

  // 已登录：有视角直进工作台；无视角进角色选择
  if (user && activeRole) return <Navigate to={roleHomeOf(user)} replace />;
  if (user && !activeRole) return <Navigate to="/entrance/role" replace />;

  const meta = CONTAINER_META[container];
  const isPersonal = container === 'personal';

  // demo 账号按容器映射过滤（P0 兼容：不做容器数据迁移）
  const containerDemos = useMemo(
    () => demos.filter((d) => (isPersonal ? CLIENT_HATS.includes(d.hatRole) : !CLIENT_HATS.includes(d.hatRole))),
    [demos, isPersonal],
  );

  const goLogin = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(account, password); // AuthContext 已清空 activeRole
      nav('/entrance/role', { replace: true }); // 表单登录 → 角色选择页（一角色一登入闭环）
    } catch (error) {
      setErr(error instanceof Error ? error.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const goDemo = async (d: DemoAccount): Promise<void> => {
    setErr('');
    setBusy(true);
    try {
      const u = await loginDemo(d.id); // oneclick 通道：自动携带默认角色
      nav(roleHomeOf(u), { replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const Icon = isPersonal ? UserRound : Building2;

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl text-[#f5f2eb] shadow-[4px_4px_0_rgba(23,24,29,0.12)]" style={{ background: meta.accent }}>
          <Icon className="h-7 w-7" />
        </span>
        <h1 className="font-serif-display mt-3 text-2xl font-black">
          {meta.name} · 登录
        </h1>
        {/* 容器徽标（V2 企业容器登录态展示企业名口径——登录前展示容器标识） */}
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#e4ded2] bg-white px-3 py-1 text-xs font-semibold" style={{ color: meta.accent }}>
          <span className="font-mono">{meta.code}</span>
          <span>·</span>
          <span>{isPersonal ? '个人 / 客户侧' : '企业 / 单位侧'}</span>
        </p>
      </div>

      {err && <div className="mb-3 rounded-md bg-[#fdecec] px-3 py-2 text-xs text-[#c0392b]">{err}</div>}

      {/* 演示账号（按容器过滤，一键登录直进视角） */}
      {containerDemos.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.07)]">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[#6b665a]">
            <Zap className="h-3.5 w-3.5 text-[#b8862b]" />
            {isPersonal ? '客户侧演示账号' : '企业侧演示账号'} · 一键登录直进视角
          </p>
          <div className="flex flex-wrap gap-2">
            {containerDemos.map((d) => (
              <button
                key={d.id}
                disabled={busy}
                onClick={() => void goDemo(d)}
                className="rounded-md border border-[#e4ded2] bg-[#faf8f3] px-3 py-1.5 text-xs font-semibold text-[#17181d] transition hover:border-[#b8862b] hover:bg-white disabled:opacity-50"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#e4ded2] bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
        <form onSubmit={(e) => void goLogin(e)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[#6b665a]">账号</label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              list="xm-entrance-accounts"
              placeholder={isPersonal ? '如 xiaolin / xu-huadong' : '如 du-hehe / eu-qiuchen / vxm-cloud'}
              className="w-full rounded-md border border-[#e4ded2] px-3 py-2 text-sm outline-none focus:border-[#b8862b]"
            />
            <datalist id="xm-entrance-accounts">
              {demos.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6b665a]">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="test123"
              className="w-full rounded-md border border-[#e4ded2] px-3 py-2 text-sm outline-none focus:border-[#b8862b]"
            />
          </div>
          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-[#f5f2eb] transition hover:opacity-90 disabled:opacity-50"
            style={{ background: meta.accent }}
          >
            <ShieldCheck className="h-4 w-4" /> 登录{meta.name}
          </button>
        </form>
        <p className="mt-3 text-center text-[11px] text-[#b8b2a4]">登录后进入角色选择，一角色一登入进入对应专业视角</p>
      </div>

      <p className="mt-4 flex justify-center gap-4 text-center text-xs text-[#8a8577]">
        <Link to="/entrance" className="inline-flex items-center gap-1 text-[#b8862b] underline">
          <ArrowLeft className="h-3 w-3" /> 重选容器类型
        </Link>
        <Link to="/" className="underline">回到首页</Link>
      </p>
    </div>
  );
}
