import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, ShieldCheck, Store } from 'lucide-react';
import { useAuth } from '../Auth';

const ACCOUNTS = [
  { id: 'xiaolin', label: '消费者·小林', entry: 'C' },
  { id: 'amay', label: '消费者·阿May', entry: 'C' },
  { id: 'hefeng', label: '恒丰供应链', entry: 'B' },
  { id: 'qiuchen', label: '启辰物资', entry: 'B' },
];

export default function Login() {
  const { login, oneClick } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from || '';

  const [entry, setEntry] = useState<'C' | 'B'>(from.startsWith('/market') ? 'B' : 'C');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const dest = (): string => (entry === 'B' ? '/market' : '/mall');

  const goLogin = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(account, password, entry);
      nav(from || dest(), { replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const goOneClick = async (): Promise<void> => {
    setErr('');
    setBusy(true);
    try {
      await oneClick(entry);
      nav(from || dest(), { replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : '一键登录失败');
    } finally {
      setBusy(false);
    }
  };

  const entryMeta = entry === 'B'
    ? { title: 'Market 经营入口', desc: 'XU 经营者 · 开店 / 上架 / 履约管理', badge: 'bg-[#17181d]', isB: true }
    : { title: 'Mall 购物入口', desc: 'CU 顾客 · 五域集市浏览下单', badge: 'bg-[#b8862b]', isB: false };

  return (
    <div className="mx-auto max-w-md py-8">
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

      <div className="rounded-xl border border-[#e4ded2] bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
        <p className="mb-3 text-sm font-semibold text-[#17181d]">{entryMeta.title}</p>
        <p className="mb-4 text-xs text-[#8a8577]">{entryMeta.desc}</p>

        {err && <div className="mb-3 rounded-md bg-[#fdecec] px-3 py-2 text-xs text-[#c0392b]">{err}</div>}

        <form onSubmit={(e) => void goLogin(e)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[#6b665a]">账号（演示账号）</label>
            <input
              value={account}
              onChange={e => setAccount(e.target.value)}
              list="xm-accounts"
              placeholder="如 xiaolin / hefeng / qiuchen"
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
            <ShieldCheck className="h-4 w-4" /> 账号登录
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-[#b8b2a4]">
          <span className="h-px flex-1 bg-[#e4ded2]" /> 或 <span className="h-px flex-1 bg-[#e4ded2]" />
        </div>

        <button onClick={() => void goOneClick()} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md border border-[#e4ded2] bg-[#f5f2eb] px-4 py-2.5 text-sm font-semibold text-[#17181d] transition hover:border-[#b8862b] disabled:opacity-50">
          <Zap className="h-4 w-4 text-[#b8862b]" /> 一键登录{entry === 'B' ? '· 恒丰经营' : '· 小林(C端)'}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-[#8a8577]">
        还没有账号？<Link to="/" className="text-[#b8862b] underline">回到首页了解双入口</Link>
      </p>
    </div>
  );
}