/**
 * XMK-STRUCT-01 X-Goods（E-Market 通货集市）占位页
 * 仅占位：真 UI 由后续工单交付。本页只落三层结构示意（术语走 terminology v1.4，零硬编码）。
 * 消歧红线：模块≠客户端——X-Goods 是集市面 Plat（E-Market），不是某个客户端；
 *          Booth-E≠Booth-EDP——供给实体铺（Booth-E）与通货集市 Booth 形态（制造厂 Booth-EDP）是两个概念。
 */
import { Link } from 'react-router-dom';
import { Boxes, ArrowRight, Construction } from 'lucide-react';
import MarketLayerNav from '../components/MarketLayerNav';
import { platTerm, layerTerm, RESOURCE_SET_TERMS, BOOTH_FORM_TERMS } from '../lib/terminology';

export default function Goods() {
  const plat = platTerm('goods');
  const marketLayer = layerTerm('market');
  const scm = RESOURCE_SET_TERMS.scm;
  const factory = BOOTH_FORM_TERMS.xfactory;
  return (
    <div>
      <MarketLayerNav active="market" />

      {/* Plat 头卡 */}
      <div className="mb-5 rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex flex-wrap items-center gap-2">
          <Boxes className="h-5 w-5 text-[#8a8577]" />
          <p className="font-serif-display text-xl font-black">
            {plat?.plat} · {plat?.big}
          </p>
          <span className="rounded border border-[#e4ded2] bg-[#faf8f3] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#6b665a]">
            {plat?.plat} = {plat?.market}
          </span>
          <span className="text-xs text-[#8a8577]">{marketLayer?.sys}</span>
        </div>
        <p className="mt-1.5 text-sm text-[#6b665a]">
          {scm?.sys}——{scm?.big}资源在{marketLayer?.big}成交：{marketLayer?.pos}。
        </p>
      </div>

      {/* 占位说明卡 */}
      <div className="rounded-xl border border-dashed border-[#c9c2b2] bg-[#faf8f3] p-6">
        <div className="flex items-center gap-2">
          <Construction className="h-4 w-4 text-[#b0aa9c]" />
          <p className="font-serif-display text-sm font-bold">占位页 · 真实界面由后续工单交付</p>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-[#6b665a]">
          <li>· 集市形态：{factory?.sys}</li>
          <li>· 资源集别名：{scm?.alias}（{scm?.big}）· 挂{layerTerm('supply')?.big}</li>
          <li>· 成交链路：询价 → 报价 → 合约 → 下单 → 交付回执</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/mall"
            className="inline-flex items-center gap-1 rounded-md bg-[#17181d] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            前往{layerTerm('customer')?.big}（商城 {platTerm('mall')?.plat}） <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/market"
            className="inline-flex items-center gap-1 rounded-md border border-[#17181d] px-3 py-1.5 text-xs font-bold text-[#17181d] hover:bg-[#f5f2eb]"
          >
            返回集市（企业采购中心） <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
