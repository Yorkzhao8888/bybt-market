import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Boxes, ClipboardList, FileClock, Landmark, PackageCheck, Wallet } from 'lucide-react';
import { api } from '../api/client';
import { xSupplyApi } from '../x-supply';
import { useAuth } from '../Auth';
import { roleTerm } from '../lib/terminology';

const GREEN = '#15803D';

type ProductList = Awaited<ReturnType<typeof api.myProducts>>;
type SupplyOrderList = Awaited<ReturnType<typeof xSupplyApi.supplyOrders.list>>;

const STATUS_ZH: Record<string, string> = {
  initiated: '已发起',
  accepted: '供给方已接',
  quoted: '已报价',
  confirmed: '已确认',
  pending: '待处理',
  fulfilling: '处理中',
  done: '已完成',
  pending_approval: '待治理审批',
  rejected: '已驳回',
};

const statusZh = (s: string) => STATUS_ZH[s] ?? s;

const yuan = (cents: number | null | undefined) => `¥${((cents ?? 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * X-MARKET-ERP-01 供给线 ERP 嵌入（/supply/vendor）
 * 按帽过滤只读：服务端 supplyOrders 按 ownerUnitId、products/orders 按 owner 过滤，不串源。
 * 留守 ERP（不进 Market）：租户/适配层/月结/CSV 导出/权限矩阵。
 */
export default function SupplyVendorDesk() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductList | null>(null);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrderList | null>(null);
  const [myOrders, setMyOrders] = useState<Awaited<ReturnType<typeof api.orders>> | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([api.myProducts(), xSupplyApi.supplyOrders.list(), api.orders()])
      .then(([ps, so, os]) => {
        if (!alive) return;
        setProducts(ps);
        setSupplyOrders(so);
        setMyOrders(os);
      })
      .catch((e: Error) => alive && setErr(e.message || 'ERP 供给台加载失败'));
    return () => {
      alive = false;
    };
  }, []);

  const confirmed = (supplyOrders ?? []).filter((o) => o.status === 'confirmed');
  const settleTotal = confirmed.reduce((acc, o) => acc + (o.quotedCents ?? 0), 0);
  const lowStock = (products ?? []).filter((p) => (p.stock ?? 0) < 20);

  return (
    <div className="min-h-screen bg-[#f4f2ec] pb-16">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-wide text-[#17181d]">
              ERP · 供给台（嵌入）
              <span className="ml-2 rounded px-1.5 py-0.5 align-middle text-[11px] font-bold" style={{ background: GREEN, color: '#fff' }}>
                ERP-MARKET-01 · 供给线 90%
              </span>
            </h1>
            <p className="mt-1 text-sm text-[#6b665a]">
              {user?.hatRole ? roleTerm(user.hatRole).big : ''}（{user?.hatRole ?? '—'}） · 按帽过滤只读视图（本帽/名下 Booth 数据，服务端 ownerUnitId·owner 过滤，不串源） · ERP 独立资源底座不变，Market 仅新外壳
            </p>
          </div>
          <Link to="/supplier" className="flex items-center gap-1.5 rounded-full border-2 border-[#17181d] bg-white px-3 py-1.5 text-sm font-bold text-[#17181d] transition hover:bg-[#17181d] hover:text-white">
            <ArrowLeft size={15} /> 返回供给台
          </Link>
        </div>

        {err && <div className="mt-4 rounded border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{err}</div>}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border-2 border-[#17181d] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#8a8577]"><PackageCheck size={14} /> 货品在架</p>
            <p className="mt-1 text-3xl font-black" style={{ color: GREEN }}>{products?.length ?? '—'}</p>
            <p className="mt-1 text-[11px] text-[#a39b88]">低库存（&lt;20）{lowStock.length} 项</p>
          </div>
          <div className="rounded-lg border-2 border-[#17181d] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#8a8577]"><Boxes size={14} /> 库存总量（本帽货品）</p>
            <p className="mt-1 text-3xl font-black" style={{ color: GREEN }}>{products ? products.reduce((a, p) => a + (p.stock ?? 0), 0) : '—'}</p>
            <p className="mt-1 text-[11px] text-[#a39b88]">库存底账归 Booth 实体系统（WH），此处为供给侧只读视图</p>
          </div>
          <div className="rounded-lg border-2 border-[#17181d] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#8a8577]"><Wallet size={14} /> 已确认结算依据</p>
            <p className="mt-1 text-3xl font-black" style={{ color: GREEN }}>{supplyOrders ? yuan(settleTotal) : '—'}</p>
            <p className="mt-1 text-[11px] text-[#a39b88]">confirmed 供给单 {confirmed.length} 张 · 月结/开票留守 ERP（X-FIN）</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border-2 border-[#17181d] bg-white shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
          <p className="flex items-center gap-2 border-b-2 border-dashed border-[#e2ddd0] px-4 py-3 text-sm font-black text-[#17181d]"><ClipboardList size={15} /> 本帽相关 ERP 单据 · 供给单（只读）</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf8f2] text-[#8a8577]">
                <tr>
                  <th className="px-4 py-2 font-bold">单号</th>
                  <th className="px-4 py-2 font-bold">标的</th>
                  <th className="px-4 py-2 font-bold">数量</th>
                  <th className="px-4 py-2 font-bold">报价（分→元）</th>
                  <th className="px-4 py-2 font-bold">状态</th>
                  <th className="px-4 py-2 font-bold">买方（DU 经营号）</th>
                </tr>
              </thead>
              <tbody>
                {(supplyOrders ?? []).map((o) => (
                  <tr key={o.id} className="border-t border-[#f0ece1]">
                    <td className="px-4 py-2 font-mono font-bold text-[#17181d]">{o.code}</td>
                    <td className="px-4 py-2">{o.title}</td>
                    <td className="px-4 py-2">{o.qty} {o.unit}</td>
                    <td className="px-4 py-2">{o.quotedCents != null ? yuan(o.quotedCents) : '—'}</td>
                    <td className="px-4 py-2">
                      <span className="rounded px-1.5 py-0.5 text-[11px] font-bold" style={{ background: o.status === 'confirmed' ? GREEN : '#efece4', color: o.status === 'confirmed' ? '#fff' : '#6b665a' }}>{statusZh(o.status)}</span>
                    </td>
                    <td className="px-4 py-2 text-[#6b665a]">{o.buyerContainerName}</td>
                  </tr>
                ))}
                {supplyOrders && supplyOrders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-[#a39b88]">暂无与本帽相关的供给单</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border-2 border-[#17181d] bg-white shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <p className="flex items-center gap-2 border-b-2 border-dashed border-[#e2ddd0] px-4 py-3 text-sm font-black text-[#17181d]"><Boxes size={15} /> 本帽货品库存（只读）</p>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf8f2] text-[#8a8577]">
                  <tr><th className="px-4 py-2 font-bold">货品</th><th className="px-4 py-2 font-bold">单价</th><th className="px-4 py-2 font-bold">库存</th><th className="px-4 py-2 font-bold">状态</th></tr>
                </thead>
                <tbody>
                  {(products ?? []).map((p) => (
                    <tr key={p.id} className="border-t border-[#f0ece1]">
                      <td className="px-4 py-2 font-semibold">{p.name}</td>
                      <td className="px-4 py-2">{yuan(p.priceCents)}</td>
                      <td className="px-4 py-2"><span className={(p.stock ?? 0) < 20 ? 'font-black text-red-600' : ''}>{p.stock ?? 0}</span>{(p.stock ?? 0) < 20 && <span className="ml-1 text-[10px] font-bold text-red-600">预警</span>}</td>
                      <td className="px-4 py-2">{p.status === 'on' ? '在架' : '下架'}</td>
                    </tr>
                  ))}
                  {products && products.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-[#a39b88]">暂无货品</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-lg border-2 border-[#17181d] bg-white shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
            <p className="flex items-center gap-2 border-b-2 border-dashed border-[#e2ddd0] px-4 py-3 text-sm font-black text-[#17181d]"><FileClock size={15} /> 名下 Booth 订单（供给侧视角）</p>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf8f2] text-[#8a8577]">
                  <tr><th className="px-4 py-2 font-bold">单号</th><th className="px-4 py-2 font-bold">族</th><th className="px-4 py-2 font-bold">金额</th><th className="px-4 py-2 font-bold">状态</th></tr>
                </thead>
                <tbody>
                  {(myOrders ?? []).slice(0, 10).map((o) => (
                    <tr key={o.id} className="border-t border-[#f0ece1]">
                      <td className="px-4 py-2 font-mono font-bold">{o.code}</td>
                      <td className="px-4 py-2">{o.family}</td>
                      <td className="px-4 py-2">{yuan(o.amountCents)}</td>
                      <td className="px-4 py-2">{statusZh(o.status)}</td>
                    </tr>
                  ))}
                  {myOrders && myOrders.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-[#a39b88]">名下 Booth 暂无订单</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border-2 border-dashed border-[#b9b2a0] bg-[#faf8f2] p-4">
          <p className="flex items-center gap-2 text-sm font-black text-[#6b665a]"><Landmark size={15} /> 留守 ERP（不进 Market，仍从 ERP 进入）</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#8a8577]">
            租户管理 / 适配层 / 月结 / CSV 导出 / 权限矩阵 —— 以上运维项不复制到 Market 界面；菜单收敛贯通口径：OAS JWT/13U → 容器 → 帽 → 三权 checkPower → 按角色裁剪（Market 侧等价实现为「容器 → 帽 → checkPower → 视图裁剪」，服务端 403 兜底 + 前端 RoleGuard）。
          </p>
        </div>
      </div>
    </div>
  );
}
