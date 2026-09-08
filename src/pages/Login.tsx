import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, ShieldCheck, Store, Store as StoreIcon, Building2 } from 'lucide-react';
import { useAuth } from '../Auth';
import { api } from '../api/client';
import type { DemoAccount } from '../../shared/types';

const ACCOUNTS = [
  { id: 'xiaolin', label: '消费者·小林', entry: 'C' },
  { id: 'hefeng', label: '恒丰供应链(经营)', entry: 'B' },
  { id: 'eu-qiuchen', label: '启辰物资(物资)', entry: 'B' },
  { id: 'hu-xunche', label: '迅驰人力(人力)', entry: 'B' },
  { id: 'tu-xingmai', label: '星脉科技(技术)', entry: 'B' },
  { id: 'de-haowei', label: '好味门店(产能)', entry: 'B' },
  { id: 'edu', label: '承启·物资经营帽', entry: 'B' },
  { id: 'tdu', label: '承启·技术经营帽', entry: 'B' },
];

function GroupCard(props: { title: string; sub: string; badge: string; isB: boolean; items: DemoAccount[]; onPick: (d: DemoAccount) => void; uid: string }) {
  const { title, sub, badge, isB, items, onPick, uid } = props;
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.07)]">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md text-[#f5f2eb] ${badge}`}>{isB ? <Building2 className="h-4 w-4" /> : <StoreIcon className="h-4 w-4" />}</span>
        <div>
          <p className="text-sm font-bold text-[#17181d]">{title}</p>
          <p className="text-[11px] text-[#8a8577]">{sub}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(d => (
          <button
            key={d.id}
            onClick={() => onPick(d)}
            className="group flex items-center gap-1.5 rounded-md border border-[#e4ded2] bg-[#faf8f3] px-3 py-1.5 text-xs font-semibold text-[#17181d] transition hover:border-[#b8862b] hover:bg-white"
          >
            {d.label}
            {d.boothTarget && <ArrowRight className="h-3 w-3 text-[#b8862b] opacity-0 transition group-hover:opacity-100" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const { login, loginDemo } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from || '';

  const [entry, setEntry] = useState<'C' | 'B'>(from.startsWith('/market') ? 'B' : 'C');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [demos, setDemos] = useState<DemoAccount[]>([]);

  useEffect(() => {
    void api.demos().then(setDemos).catch(() => setDemos([]));
  }, []);

  const cSides = useMemo(() => demos.filter(d => d.entry === 'C'), [demos]);
  const bSupply = useMemo(() => demos.filter(d => d.entry === 'B' && ['EU', 'HU', 'YU', 'TU', 'DU'].includes(d.hatRole)), [demos]);
  const bOps = useMemo(() => demos.filter(d => d.entry === 'B' && ['EDU', 'TDU', 'EDX', 'TDX', 'YU'].includes(d.hatRole)), [demos]);
  const bClientHats = useMemo(() => demos.filter(d => d.hatRole === 'XU'), [demos]);
  const bOperator = useMemo(() => demos.filter(d => /^V/.test(d.hatRole) && d.hatRole.endsWith('M')), [demos]);
  const bClient = useMemo(() => demos.filter(d => d.entry === 'B' && d.hatRole === 'XU'), [demos]);
  const bAdmin = useMemo(() => demos.filter(d => d.entry === 'B' && (d.hatRole.startsWith('V') && d.hatRole.endsWith('M'))), [demos]);

  const land = (u: { boothTarget?: string; entry?: string }): void => {
    nav(u?.boothTarget ? `/market/booths/${u.boothTarget}` : (u?.entry === 'C' ? '/mall' : '/market'), { replace: true });
  };

  const goLogin = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const u = await login(account, password, entry);
      land(u ?? {});
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
      const u = await loginDemo(d.id);
      land(u ?? {});
    } catch (error) {
      setErr(error instanceof Error ? error.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const entryMeta = entry === 'B'
    ? { title: 'Market · 企业采购中心', desc: 'B2B 撮合 · 五域 Booth 开店 / 上架 / 履约', badge: 'bg-[#17181d]', isB: true }
    : { title: 'Mall · 消费者市集', desc: 'CU 顾客 · 五域集市浏览下单', badge: 'bg-[#b8862b]', isB: false };
  const { isB } = entryMeta;

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="mb-6 text-center">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl text-[#f5f2eb] shadow-[4px_4px_0_rgba(23,24,29,0.12)] ${entryMeta.badge}`}>
          <Store className="h-7 w-7" />
        </span>
        <h1 className="font-serif-display mt-3 text-2xl font-black">X-Market · 登录</h1>
        <p className="mt-1 text-sm text-[#8a8577]">底座认证（开发版）· 口令统一 test123</p>
      </div>

      {/* 双入口切换 */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-[#efeae0] p-1">
        {(['C', 'B'] as const).map(se => (
          <button
            key={se}
            onClick={() => { setEntry(se); setErr(''); }}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${entry === se ? (se === 'B' ? 'bg-[#17181d] text-[#f5f2eb]' : 'bg-[#b8862b] text-white') : 'text-[#6b665a] hover:bg-white/60'}`}
          >
            {se === 'B' ? 'Market · B端(经营)' : 'Mall · C端(购物)'}
          </button>
        ))}
      </div>

      {err && <div className="mb-3 rounded-md bg-[#fdecec] px-3 py-2 text-xs text-[#c0392b]">{err}</div>}

      {/* 演示账号入口 */}
      <div className="mb-4 space-y-3">
        <GroupCard uid="c" title="C 端演示" sub="CU 顾客 · 一键登录" badge="bg-[#b8862b]" isB={false} items={cSides} onPick={(d) => void goDemo(d)} />
        <GroupCard uid="b" title="B 端 · 五域供给帽" sub="EU/HU/YU/TU/DU · 落到对应域 Booth" badge="bg-[#17181d]" isB items={bSupply} onPick={(d) => void goDemo(d)} />
        <GroupCard uid="o" title="B 端 · 经营/执行帽" sub="EDU/TDU 经营帽 · EDX/TDX 执行帽" badge="bg-[#d6366e]" isB items={bOps} onPick={(d) => void goDemo(d)} />
        <GroupCard uid="xu" title="B 端 · 客户帽" sub="XU 采购客户 · 企业采购中心" badge="bg-[#4a5fd5]" isB items={bClientHats} onPick={(d) => void goDemo(d)} />
        <GroupCard uid="vm" title="平台 · 运营管理方" sub="V*M 平台运营长 · 平台侧" badge="bg-[#17a290]" isB items={bOperator} onPick={(d) => void goDemo(d)} />
      </div>

      <div className="rounded-xl border border-[#e4ded2] bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
        <p className="mb-4 text-sm font-semibold text-[#17181d]">{entryMeta.title}</p>

        <form onSubmit={(e) => void goLogin(e)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[#6b665a]">账号（演示账号）</label>
            <input
              value={account}
              onChange={e => setAccount(e.target.value)}
              list="xm-accounts"
              placeholder="如 xiaolin / eu-qiuchen / edu"
              className="w-full rounded-md border border-[#e4ded2] px-3 py-2 text-sm outline-none focus:border-[#b8862b]"
            />
            <datalist id="xm-accounts">
              {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6b665a]">口令</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="test123"
              className="w-full rounded-md border border-[#e4ded2] px-3 py-2 text-sm outline-none focus:border-[#b8862b]"
            />
          </div>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#17181d] px-4 py-2.5 text-sm font-semibold text-[#f5f2eb] transition hover:opacity-90 disabled:opacity-50">
            <ShieldCheck className="h-4 w-4" /> 账号登录(口令 test123)
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-[#b8b2a4]">
          <span className="h-px flex-1 bg-[#e4ded2]" /> 或 <span className="h-px flex-1 bg-[#e4ded2]" />
        </div>

        <p className="mb-3 text-xs text-[#8a8577]">选择上方演示账号即<b>一键登录</b>，无需口令；也可在下方填写口令登录：</p>
        {entry === 'B' ? (
          <div className="flex flex-wrap gap-1.5">
            {demos.filter(d => d.entry === 'B').map(d => (
              <button key={d.id} onClick={() => { setAccount(d.id); setPassword(''); }} className="rounded border border-[#e4ded2] px-2 py-1 text-[11px] text-[#6b665a] hover:border-[#b8862b]">
                {d.id}
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => void goDemo(cSides[0])} disabled={busy || cSides.length === 0} className="flex w-full items-center justify-center gap-2 rounded-md border border-[#e4ded2] bg-[#f5f2eb] px-4 py-2.5 text-sm font-semibold text-[#17181d] transition hover:border-[#b8862b] disabled:opacity-50">
            <Zap className="h-4 w-4 text-[#b8862b]" /> 一键登录 · {isB ? '恒丰经营' : '小林(C端)'}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-[#8a8577]">
        还没有账号？<Link to="/" className="text-[#b8862b] underline">回到首页了解双入口</Link>
      </p>
    </div>
  );
}