import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { BookOpenText, Store, LayoutGrid } from 'lucide-react';
import Home from './pages/Home';
import Mall from './pages/Mall';
import MallBooth from './pages/MallBooth';
import Market from './pages/Market';
import MarketBooth from './pages/MarketBooth';
import Orders from './pages/Orders';

function Header() {
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
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mall" element={<Mall />} />
          <Route path="/mall/booth/:id" element={<MallBooth />} />
          <Route path="/market" element={<Market />} />
          <Route path="/market/booth/:id" element={<MarketBooth />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
      <footer className="mt-10 border-t py-6 text-center text-xs text-[#8a8577]">
        X-Market 五域集市系统 · ZiwayOS v2.2 · 双入口 Mall/Market · Booth 双层 前店售卖面 / 后厂履约面
      </footer>
    </div>
  );
}