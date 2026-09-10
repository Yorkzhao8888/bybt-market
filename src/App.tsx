// X-MARKET-09：四类角色工作台路由壳。
// 客户→/market（蓝）· 供应商→/supplier（绿）· 经营者→/operator（橙）· 治理者→/govern（紫）；
// 导航按角色收敛，越权直访由 RoleGuard 403 兜底；全局背景浅米白+炭黑不变。
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, ReceiptText, Boxes, ShieldCheck, LogOut, ShieldBan, LayoutDashboard, Sprout, Crown, ClipboardCheck, Bell, Monitor, Smartphone, Repeat, Landmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './Auth';
import type { SessionUser } from '../shared/types';
import Home from './pages/Home';
import Login from './pages/Login';
import Mall from './pages/Mall';
import MallBooth from './pages/MallBooth';
import Market from './pages/Market';
import MarketBooth from './pages/MarketBooth';
import Orders from './pages/Orders';
import Model from './pages/Model';
import Govern from './pages/Govern';
import SupplyMall from './pages/SupplyMall';
import SupplyDesk from './pages/SupplyDesk';
import SupplyVendorDesk from './pages/SupplyVendorDesk';
import { XSupplyHub } from './x-supply';
import OperatorDesk from './pages/OperatorDesk';
import Board from './pages/Board';
import OperatorMobile from './pages/OperatorMobile';
import OrderStatusBadge from './components/OrderStatusBadge';
import OnboardingTour, { TourRestartButton } from './components/OnboardingTour';
import EntranceGate from './entrance/EntranceGate';
import EntranceLogin from './entrance/EntranceLogin';
import EntranceRole from './entrance/EntranceRole';
import { workbenchOf, workbenchThemeOf, WORKBENCH_HOME, WORKBENCH_THEME } from './lib/domain';
import type { WorkbenchKind } from './lib/domain';
import { roleTerm, conceptTerm, duChildTermOf, duChildBadgeTextOf } from './lib/terminology';
import { api } from './api/client';

function Header() {
  const { user, logout, clearActiveRole } = useAuth();
  const navigate = useNavigate();
  const wb: WorkbenchKind = workbenchOf(user?.hatRole);
  const theme = workbenchThemeOf(user?.hatRole);
  const loc = useLocation();

  const navByWb: Record<WorkbenchKind, { to: string; label: string; icon: ReactNode }[]> = {
    client: [
      { to: '/market', label: 'Market', icon: <Store className="h-3.5 w-3.5" /> },
      { to: '/mall', label: 'Mall', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
      { to: '/orders', label: '交易单', icon: <ReceiptText className="h-3.5 w-3.5" /> },
    ],
    supplier: [
      { to: '/supply', label: '供给集市', icon: <Store className="h-3.5 w-3.5" /> },
      { to: '/supplier', label: '供给台', icon: <Sprout className="h-3.5 w-3.5" /> },
      { to: '/supply/vendor', label: 'ERP 供给台', icon: <Landmark className="h-3.5 w-3.5" /> },
      { to: '/orders', label: '交易单', icon: <ReceiptText className="h-3.5 w-3.5" /> },
    ],
    operator: [
      { to: '/operator', label: '经营台', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
      { to: '/operator/mobile', label: '手机作业端', icon: <Smartphone className="h-3.5 w-3.5" /> },
      { to: '/supply-mall', label: '采购商城', icon: <Boxes className="h-3.5 w-3.5" /> },
      { to: '/supply', label: '供给集市', icon: <Store className="h-3.5 w-3.5" /> },
      { to: '/orders', label: '交易单', icon: <ReceiptText className="h-3.5 w-3.5" /> },
    ],
    govern: [
      // X-MARKET-18 v1.2：VDM=总经营管理执行（原 VXM/VDM 合并）——/govern 经营治理大本营 + /supply 管家审批统筹入口
      { to: '/govern', label: '治理台', icon: <Crown className="h-3.5 w-3.5" /> },
      { to: '/supply', label: '管家审批', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
      { to: '/board', label: '现场看板', icon: <Monitor className="h-3.5 w-3.5" /> },
      { to: '/orders', label: '交易单', icon: <ReceiptText className="h-3.5 w-3.5" /> },
    ],
    // X-MARKET-18：V*M 管家审批家族（VEM/VHM/VYM/VTM，v1.2 终版 VDM 废弃并入 VDM）落 supply 审批视图
    governSupply: [
      { to: '/supply', label: '管家审批', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
    ],
  };
  const nav = navByWb[wb];

  /* X-MARKET-UE-01 顶栏通知铃（DU 待办数：待报价+待审批采购+待履约）与徽标副信息 */
  /* X-MARKET-UE-02 客户端铃（报价到达 / 订单状态）：待报价询价+进行中订单 */
  const [todoCount, setTodoCount] = useState(0);
  const [boothCode, setBoothCode] = useState('');
  useEffect(() => {
    if (wb === 'client' && user) {
      let live = true;
      void Promise.all([api.orders(), api.inquiries()])
        .then(([os, iqs]) => {
          if (!live) return;
          const activeOrders = os.filter((o) => ['pending', 'pending_approval', 'fulfilling'].includes(o.status)).length;
          const myInq = iqs.filter((q) => q.buyerContainerId === user.containerId && q.status === 'inquiry').length;
          setTodoCount(activeOrders + myInq);
        })
        .catch(() => undefined);
      return () => {
        live = false;
      };
    }
    if (wb !== 'operator' || !user) {
      setTodoCount(0);
      setBoothCode('');
      return;
    }
    let live = true;
    void api
      .marketBooths({ kind: 'du' })
      .then((bs) => {
        if (live) setBoothCode(bs.find((b) => b.operatorContainerId === user.containerId)?.code ?? '');
      })
      .catch(() => undefined);
    void Promise.all([api.orders(), api.inquiries()])
      .then(([os, iqs]) => {
        if (!live) return;
        const pendingFulfill = os.filter((o) => o.status === 'pending' || o.status === 'pending_approval').length;
        const pendingInq = iqs.filter((q) => q.boothId !== null && q.status === 'inquiry').length;
        setTodoCount(pendingFulfill + pendingInq);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [wb, user]);

  return (
    <header className="sticky top-0 z-20 border-b border-[#e4ded2] bg-[#f5f2eb]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link to="/" className="font-serif-display text-lg font-black tracking-tight hover:opacity-80">X-Market <span className="text-xs font-normal text-[#8a8577]">五域集市</span></Link>
        <span className="rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ background: theme.accent }}>
          {theme.label}
        </span>
        <nav className="flex flex-wrap items-center gap-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) => `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition ${isActive ? 'font-semibold text-white' : 'text-[#4b463a] hover:bg-[#efeae0]'}`}
              style={loc.pathname.startsWith(n.to) || (n.to === '/market' && loc.pathname.startsWith('/market')) ? { background: theme.accent } : undefined}>
              {n.icon} {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {wb === 'operator' ? (
                <span className="hidden flex-col items-start rounded-md border bg-white px-2.5 py-1 leading-tight sm:flex">
                  {/* X-MARKET-ROLE-01 经营端标识 + 分经营号命名规范（2026-09-10 实例化去星号）：小号按域范畴展示（如 EDU · 产品经营），模板总称 *DU 保留星号，语义与帽 ID 不变 */}
                  <span className="text-xs font-bold" style={{ color: theme.accent }}>{conceptTerm('duChild').big} · {user.containerName ?? user.containerId}</span>
                  {/* X-MARKET-19 复合经营：多挂 *DU 给复合串（EDU · 产品经营 / HDU · 人资经营 / …），单挂/无多挂回退单域范畴（X-MARKET-ROLE-01 分经营号命名规范） */}
                  <span className="text-[10px] text-[#8a8577]">{duChildBadgeTextOf(user.duChildDomains) || duChildTermOf(user.domainView)} · {user.hatId ?? user.containerId}{boothCode ? ` · ${boothCode}` : ''}</span>
                </span>
              ) : wb === 'client' ? (
                <span className="hidden flex-col items-start rounded-md border bg-white px-2.5 py-1 leading-tight sm:flex">
                  <span className="text-xs font-bold" style={{ color: theme.accent }}>{roleTerm(user.hatRole).big} · {user.containerName ?? user.containerId}</span>
                  <span className="text-[10px] text-[#8a8577]">{roleTerm(user.hatRole).sys}</span>
                </span>
              ) : (
                <span className="hidden flex-col items-start rounded-md border bg-white px-2.5 py-1 leading-tight sm:flex">
                  {/* X-MARKET-ROLE-01：govern=经营治理（VDM）/ governSupply=管家审批（V*M 家族域内，X-MARKET-18）/ supplier=供给方 */}
                  <span className="text-xs font-bold" style={{ color: theme.accent }}>{theme.label.replace('工作台', '')} · {user.containerName ?? user.containerId}</span>
                  <span className="text-[10px] text-[#8a8577]">{roleTerm(user.hatRole).sys}{user.hatId ? ` · ${user.hatId}` : ''}</span>
                </span>
              )}
              {(wb === 'operator' || wb === 'client') && (
                <Link to={wb === 'client' ? '/orders' : '/operator'} title={wb === 'client' ? '报价到达 / 订单状态' : '待办：待报价 / 待审批采购 / 待履约'} className="relative rounded-md border bg-white px-2 py-1.5 hover:bg-[#efeae0]">
                  <Bell className="h-3.5 w-3.5 text-[#4b463a]" />
                  {todoCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold text-white">{todoCount}</span>
                  )}
                </Link>
              )}
              {/* X-MARKET-TI-05 新手引导重开入口（纯前端展示层，不阻塞业务） */}
              <TourRestartButton />
              {/* X-MARKET-ENTRANCE-01 V5：视角内切换角色 → 回角色选择页并清空当前视角会话状态 */}
              <button
                onClick={() => { clearActiveRole(); navigate('/entrance/role'); }}
                title="切换角色（一角色一登入）"
                className="flex items-center gap-1 rounded-md border bg-white px-2.5 py-1 text-xs hover:bg-[#efeae0]"
              >
                <Repeat className="h-3.5 w-3.5" /> 切换角色
              </button>
              <button onClick={() => void api.logout().then(logout)} className="flex items-center gap-1 rounded-md border bg-white px-2.5 py-1 text-xs hover:bg-[#efeae0]">
                <LogOut className="h-3.5 w-3.5" /> 退出
              </button>
            </>
          ) : (
            <Link to="/entrance" className="rounded-md px-3 py-1.5 text-xs font-medium text-white hover:opacity-90" style={{ background: theme.accent }}>进入登入端</Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** X-MARKET-09 路由守卫：按工作台类型拦截，未授权 403 兜底。
 *  X-MARKET-ENTRANCE-01 视角容器守卫（V4）：未登录 → 容器类型页；未选角色（activeRole 空/与登录帽不一致）→ 角色选择页。 */
function RoleGuard({ wb, children }: { wb: WorkbenchKind | WorkbenchKind[]; children: ReactNode }) {
  const { user, isAuthed, loading, activeRole } = useAuth();
  if (loading) return <p className="p-10 text-center text-sm text-[#8a8577]">身份校验中…</p>;
  if (!isAuthed || !user) return <Navigate to="/entrance" replace />;
  if (!activeRole || activeRole !== user.hatRole) return <Navigate to="/entrance/role" replace />;
  const allowed: WorkbenchKind[] = Array.isArray(wb) ? wb : [wb];
  if (!allowed.includes(workbenchOf(user.hatRole))) return <Forbidden hatRole={user.hatRole} need={workbenchThemeOf(user.hatRole)} want={allowed[0]} />;
  return <>{children}</>;
}

function Forbidden({ hatRole, need, want }: { hatRole: string | null; need: ReturnType<typeof workbenchThemeOf>; want: WorkbenchKind }) {
  const term = roleTerm(hatRole);
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-white p-8 text-center shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
      <ShieldBan className="mx-auto h-10 w-10 text-[#b3261e]" />
      <p className="mt-3 font-serif-display text-2xl font-black">403 · 越权访问</p>
      <p className="mt-2 text-sm text-[#6b665a]">
        该区域属于{WORKBENCH_THEME[want].label}，你的当前身份是「{term.big}（{term.sys}）」。角色数据边界由服务端强制（隔离红线 P0）。
      </p>
      <Link to={WORKBENCH_HOME[workbenchOf(need.kind)]} className="mt-4 inline-block rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: need.accent }}>
        返回我的工作台
      </Link>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f2eb] text-[#17181d]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="border-t border-[#e4ded2] py-4 text-center text-xs text-[#8a8577]">
        X-Market 五域集市 · 交易不经营 / 铺面即实体 · Booth 实体系统另窗口实现
      </footer>
      {/* X-MARKET-TI-05 新手引导浮层（登录后按角色自动弹出；非模态不阻塞业务） */}
      <OnboardingTour />
    </div>
  );
}

function AllRoutes() {
  return (
    <Routes>
      {/* X-MARKET-UE-01 现场看板：全屏深色独立壳，不经 Shell */}
      <Route path="/board" element={<RoleGuard wb={['operator', 'govern']}><Board /></RoleGuard>} />
      <Route
        path="*"
        element={
          <Shell>
            <Routes>
              <Route path="/" element={<Home />} />
              {/* X-MARKET-ENTRANCE-01 登入端框架：容器类型 → 登录 → 角色选择（一角色一登入 P0） */}
              <Route path="/entrance" element={<EntranceGate />} />
              <Route path="/entrance/login" element={<EntranceLogin />} />
              <Route path="/entrance/role" element={<EntranceRole />} />
              {/* 旧登录链保留兼容（内部已对接 ENTRANCE-01 流程） */}
              <Route path="/login" element={<Login />} />
              <Route path="/mall" element={<Mall />} />
              <Route path="/mall/booth/:id" element={<MallBooth />} />
              <Route path="/market" element={<Market />} />
              <Route path="/market/booth/:id" element={<MarketBooth />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/model" element={<Model />} />
              <Route path="/supply-mall" element={<SupplyMall />} />
              <Route path="/supplier" element={<RoleGuard wb="supplier"><SupplyDesk /></RoleGuard>} />
              {/* X-MARKET-ERP-01 供给线 ERP 嵌入（P2）：/supply/vendor 按帽过滤只读，客户/经营者/治理 403 兜底 */}
              <Route path="/supply/vendor" element={<RoleGuard wb="supplier"><SupplyVendorDesk /></RoleGuard>} />
              {/* X-SUPPLY-01 供给四源集市：EU/EX/EXX/DU 可进；X-MARKET-ROLE-01：V*M 家族落此治理视图（governSupply）；X-MARKET-18 v1.2：VDM=总经营管理执行兼统筹（wb 'govern' 放行）；客户 403 兜底 */}
              <Route path="/supply" element={<RoleGuard wb={['supplier', 'operator', 'governSupply', 'govern']}><XSupplyHub /></RoleGuard>} />
              <Route path="/operator" element={<RoleGuard wb="operator"><OperatorDesk /></RoleGuard>} />
              <Route path="/operator/mobile" element={<RoleGuard wb="operator"><OperatorMobile /></RoleGuard>} />
              <Route path="/govern" element={<RoleGuard wb="govern"><Govern /></RoleGuard>} />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AllRoutes />
    </AuthProvider>
  );
}
