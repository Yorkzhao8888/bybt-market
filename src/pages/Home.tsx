import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText, LayoutGrid, ArrowRight } from 'lucide-react';
import { api, type OverviewData } from '../api/client';
import { DomainLine, Stat, ToTicker } from '../components/ui';
import { DOMAIN_NAMES } from '../lib/domain';

export default function Home() {
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    api.overview().then(setData).catch(console.error);
  }, []);

  return (
    <div>
      {/* Hero 双入口 */}
      <section className="relative overflow-hidden rounded-2xl dark-panel p-8 sm:p-12">
        <div className="relative z-10">
          <div className="font-serif-display text-sm font-semibold tracking-[0.3em] text-[#b8862b]">ZIWAYOS V2.2 · 五域链定版</div>
          <h1 className="font-serif-display mt-3 max-w-xl text-3xl font-black leading-tight sm:text-5xl">
            X-Market <span className="text-[#b8862b]">五域集市</span>
          </h1>
          <p className="mt-4 max-w-xl text-[#cfcabb]">
            物资 · 人力 · 空间 · 技术 · 门店产能 五域联动交易。摊位双层：前店售卖面，后厂履约面。<br aria-hidden />
            双入口双路并进 —— 消费者逛 <b className="text-[#f5f2eb]">Mall</b>，经营者在 <b className="text-[#f5f2eb]">Market</b> 开铺经营。
          </p>
          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <Link to="/mall" className="group hard-shadow rounded-xl bg-[#b8862b] p-5 text-[#fff] transition">
              <div className="flex items-center justify-between">
                <span className="font-serif-display text-lg font-bold">Mall · C端消费</span>
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-sm text-[#f7ecd2]">逛五域摊位，下单购物资/空间/门店产能 D-OFD 单品。</p>
              <BookOpenText className="mt-3 h-5 w-5 opacity-70" />
            </Link>
            <Link to="/market" className="group hard-shadow rounded-xl border border-[#3a3b44] p-5 text-[#fff] transition">
              <div className="flex items-center justify-between">
                <span className="font-serif-display text-lg font-bold">Market · B端经营</span>
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-sm text-[#cfcabb]">EU/HU/YU/TU/DU 开铺上架，管理前店售卖面与后厂履约面。</p>
              <LayoutGrid className="mt-3 h-5 w-5 opacity-70" />
            </Link>
          </div>
        </div>
      </section>

      {/* 五域链路 */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif-display text-xl font-bold">五域交易链路</h2>
          <span className="text-sm text-[#8a8577]">供应单元 → 调度 → Booth → 交易单</span>
        </div>
        <ToTicker meta={data?.domainMeta ?? []} />
      </section>

      {/* 域统计 */}
      <section className="mt-2">
        {data && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="grid grid-cols-2 gap-3 sm:col-span-3 sm:grid-cols-3">
              <Stat label="在营摊位" value={data.totalBooths} />
              <Stat label="在售商品" value={data.totalListings} />
              <Stat label="累计交易单" value={data.totalOrders} />
            </div>
            <Stat label="累计成交额(元)" value={`¥${data.totalTurnover.toLocaleString()}`} color="#b8862b" />
          </div>
        )}
        {data && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {data.stats.map(s => (
              <Link key={s.domain} to={`/mall?domain=${s.domain}`} className="paper-card hard-shadow group rounded-lg p-4 transition hover:bg-[#efeae0]">
                <div className="flex items-center justify-between">
                  <span className="font-serif-display text-2xl font-black">{s.domain}</span>
                  <DomainLine code={s.domain} />
                </div>
                <div className="text-sm font-semibold">{DOMAIN_NAMES[s.domain]}域</div>
                <div className="ticker-font mt-2 text-xs text-[#6b665a]">
                  {s.booths} 铺 · ¥{s.turnover.toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}