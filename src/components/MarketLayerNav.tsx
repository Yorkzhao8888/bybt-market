/**
 * XMK-STRUCT-01 集市域内三层导航区（共享组件，Market / Mall / Goods 客户端同景）
 * 三层 = 客集 X-Customer（谁在买）/ 集市 X-Market（在哪成交）/ 供集 X-Supply（谁在卖）
 * 红线：文案全部走 terminology v1.4 常量（MARKET_LAYERS/RESOURCE_SET_TERMS），禁止硬编码；
 *      界面零帽名（市面称呼）；/entrance 六容器卡零改动（容器="我是谁"，三层="我要干什么"，不得混放）。
 */
import { Link } from 'react-router-dom';
import { Users, Store, Package, Lock } from 'lucide-react';
import { MARKET_LAYERS, resourceSetsOfLayer } from '../lib/terminology';

const ICONS = { users: Users, store: Store, package: Package } as const;

/** 三层跳转路由：客集=商城（X-Mall）、集市=企业采购中心（X-Market）、供集=供给集市（X-Supply） */
const LAYER_ROUTES: Record<string, string> = {
  customer: '/mall',
  market: '/market',
  supply: '/supply',
};

export default function MarketLayerNav({ active }: { active: 'customer' | 'market' | 'supply' }) {
  return (
    <div className="mb-5 rounded-xl border bg-white p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.keys(MARKET_LAYERS) as Array<keyof typeof MARKET_LAYERS>).map((key) => {
          const layer = MARKET_LAYERS[key];
          const Icon = ICONS[layer.icon];
          const isActive = key === active;
          const sets = resourceSetsOfLayer(key);
          return (
            <Link
              key={key}
              to={LAYER_ROUTES[key] ?? '/'}
              className={[
                'group flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                isActive
                  ? 'border-[#17181d] bg-[#f5f2eb]'
                  : 'border-[#e4ded2] hover:border-[#17181d] hover:bg-[#faf8f3]',
              ].join(' ')}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-[#17181d]' : 'text-[#8a8577]'}`} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className={`font-serif-display text-sm font-black ${isActive ? 'text-[#17181d]' : 'text-[#3d3a33]'}`}>
                    {layer.big}
                  </span>
                  <span className="text-[10px] text-[#8a8577]">{layer.code}</span>
                  {sets.map((s) => (
                    <span
                      key={s.alias}
                      className="rounded border border-[#e4ded2] bg-white px-1 font-mono text-[9px] font-bold tracking-wider text-[#6b665a]"
                    >
                      {s.alias}
                    </span>
                  ))}
                  {key === 'supply' && <Lock className="h-3 w-3 text-[#b0aa9c]" />}
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-4 text-[#8a8577]" title={layer.pos}>
                  {layer.pos}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
