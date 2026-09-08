import type { ReactNode } from 'react';
import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom';
import { BookOpenText, Store, LayoutGrid, LogIn, LogOut, CircleUserRound } from 'lucide-react';
import { AuthProvider, useAuth } from './Auth';
import Home from './pages/Home';
import Login from './pages/Login';
import Mall from './pages/Mall';
import MallBooth from './pages/MallBooth';
import Market from './pages/Market';
import MarketBooth from './pages/MarketBooth';
import Orders from './pages/Orders';
import Model from './pages/Model';

function Protected({ children }: { children: ReactNode }) {
  const { isAuthed, loading } = useAuth();
  if (loading) {
    return <div className="py-24 text-center text-sm text-[#8a8577]">正在恢复登录会话…</div>;
  }
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Header() {
  const { user, isAuthed, logout } = useAuth();
  const location = useLocation();
  const entry = user?.entry ?? 'C';

  const handleLogout = (): void => {
    void logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-[#f5f2eb]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#17181d] text-[#f5f2eb]">
            <Store className="h-5 w-5" />
          </span>
          <span className="font-serif-display text-lg font-black tracking-wide">
            X-Market<span className="ml-1 text-sm font-semibold text-[#b8862b]">五域集市</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <NavLink to="/mall" className={({ isActive }) => `flex items-center gap-1.5 rounded-md px-3 py-2 transition ${isActive ? 'bg-[#b8862b] text-white' : 'hover:bg-[#efeae0]'}`}>
            <BookOpenText className="h-4 w-4" /> Mall · C端
          </NavLink>
          <NavLink to="/market" className={({ isActive }) => `flex items-center gap-1.5 rounded-md px-3 py-2 transition ${isActive ? 'bg-[#17181d] text-white' : 'hover:bg-[#efeae0]'}`}>
            <LayoutGrid className="h-4 w-4" /> Market · B端
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `flex items-center gap-1.5 rounded-md px-3 py-2 transition ${isActive ? 'bg-[#17181d] text-white' : 'hover:bg-[#efeae0]'}`}>
            交易单
          </NavLink>
          <NavLink to="/model" className={({ isActive }) => `hidden items-center gap-1.5 rounded-md px-3 py-2 transition md:flex ${isActive ? 'bg-[#17181d] text-white' : 'hover:bg-[#efeae0]'}`}>
            域·帽
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed && user ? (
            <>
              <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:flex ${entry === 'B' ? 'bg-[#17181d] text-[#f5f2eb]' : 'bg-[#b8862b] text-white'}`}>
                <CircleUserRound className="h-3.5 w-3.5" />
                {user.containerName} · {user.hat}
              </span>
              <button onClick={handleLogout} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-[#6b665a] hover:bg-[#efeae0]" title="登出">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            location.pathname === '/login' ? null : (
              <Link to="/login" className="flex items-center gap-1.5 rounded-md bg-[#17181d] px-3 py-2 text-sm font-medium text-[#f5f2eb] hover:opacity-90">
                <LogIn className="h-4 w-4" /> 登录
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mall" element={<Protected><Mall /></Protected>} />
            <Route path="/mall/booth/:id" element={<Protected><MallBooth /></Protected>} />
            <Route path="/market" element={<Protected><Market /></Protected>} />
            <Route path="/market/booth/:id" element={<Protected><MarketBooth /></Protected>} />
            <Route path="/orders" element={<Protected><Orders /></Protected>} />
            <Route path="/model" element={<Protected><Model /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="mt-10 border-t py-6 text-center text-xs text-[#8a8577]">
          X-Market 五域集市系统 · ZiwayOS v2.2 · 13U 口径 · 双入口 Mall/Market · Booth 双层 前店售卖面 / 后厂履约面
        </footer>
      </div>
    </AuthProvider>
  );
}