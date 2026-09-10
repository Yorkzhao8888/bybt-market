// 订单（P3 按身份过滤：客户见自己 / DU 见名下多店 / 运营方全局总账）。
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { OrderRow } from '../../shared/types';
import { ORDER_STATUS, isAdminRole, canOperate, hatLabel } from '../lib/domain';
import { useAuth } from '../Auth';
import BoothTimelineCard from '../components/BoothTimelineCard';

const FAMILIES: { code: string; name: string; tone: string }[] = [
  { code: 'C', name: 'C端零售', tone: 'bg-[#b8862b]' },
  { code: 'D', name: '门店产能', tone: 'bg-[#d6366e]' },
  { code: 'H', name: '人力', tone: 'bg-[#e4572e]' },
  { code: 'E', name: '物资', tone: 'bg-[#c27a1b]' },
  { code: 'Y', name: '空间(捷租)', tone: 'bg-[#17a290]' },
  { code: 'T', name: '技术·Order-T', tone: 'bg-[#4a5fd5]' },
];

function FamBadge({ family }: { family: string }) {
  const f = FAMILIES.find((x) => x.code === family);
  if (!f) return <span className="rounded bg-[#e4ded2] px-1.5 py-0.5 text-[10px] font-bold text-[#17181d]">{family}</span>;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${f.tone}`} title={f.name}>{f.code}</span>;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null); // MARKET-CONN-01：展开订单详情（含 Booth 履约时间线）

  useEffect(() => { void api.orders().then(setOrders).catch(() => setOrders([])); }, []);

  const role = user?.hatRole;
  const isAdmin = isAdminRole(role);
  const operator = canOperate(role);
  const isClientRole = !operator; // 客户（XU/CU）：对手恒为 DU，供给方不出现在客户侧
  const scopeNote = isAdmin
    ? '运营方/平台视角：可见管辖域全部订单（全局总账）。'
    : operator
      ? '铺主（DU/供给方）视角：仅可见名下 Booth 相关订单。'
      : '客户视角（XU/CU）：仅可见自己下的订单（P3 隐私过滤）。';

  const totals = {
    count: orders.length,
    amount: orders.reduce((a, o) => a + o.amountCents, 0) / 100,
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-serif-display text-xl font-bold">交易单 · {isAdmin ? '全局总账' : '我的订单'}</span>
      </div>

      <div className="mb-3 rounded-lg bg-[#f3eee3] px-3 py-2 text-xs text-[#8a6d3b]">
        当前身份 {user?.hat ? hatLabel(role ?? '') : '未登录'}：{scopeNote}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg border border-[#e4ded2] bg-[#fbf9f4] px-3 py-2 text-[11px] text-[#6b665a]">
        <span className="mr-1 font-semibold text-[#17181d]">订单六族：</span>
        {FAMILIES.map((f) => (
          <span key={f.code} className={`rounded px-1.5 py-0.5 font-semibold text-white ${f.tone}`}>{f.code} {f.name}</span>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="paper-card hard-shadow rounded-lg px-4 py-3"><div className="text-xs text-[#8a8577]">可见交易单</div><div className="ticker-font text-2xl font-black">{totals.count}</div></div>
        <div className="paper-card hard-shadow rounded-lg px-4 py-3"><div className="text-xs text-[#8a8577]">累计金额</div><div className="ticker-font text-2xl font-black text-[#b8862b]">¥{totals.amount.toLocaleString()}</div></div>
      </div>

      {isClientRole && (
        <div className="mb-4 rounded-lg border border-[#e4ded2] bg-[#faf7f0] px-3 py-2 text-xs leading-5 text-[#6b665a]">
          <p className="font-bold text-[#17181d]">合同对手与售后（DU 承载）</p>
          <p>合同对手：{user?.hatRole === 'CU' ? 'Booth-DC 门店（DU 直营）' : 'DU 经营主体'}；供给方名称与 DU 采购合同不对客户展示。</p>
          <p>发票流：供给方 → DU（进项票）→ 客户（DU 开具销售票）。售后：联系 DU，责任转移点 = 交付回执，DU 向供给方追偿。</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="paper-card rounded-lg p-10 text-center text-sm text-[#8a8577]">当前视角暂无交易单</div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {orders.map((o, i) => {
            const st = ORDER_STATUS[o.status] ?? { label: o.status, color: '#6b665a' };
            const isC = o.side === 'C';
            return (
              <div
                key={o.id}
                className={`${i > 0 ? 'border-t' : ''} px-4 py-3 ${isC ? 'bg-[#fbf6ea]' : 'bg-[#f5f2eb]'}`}
              >
                <div
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-2"
                  onClick={() => setOpenId(openId === o.id ? null : o.id)}
                  title="点击展开订单详情与 Booth 履约时间线"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{o.code}</span>
                    <FamBadge family={o.family} />
                    <span className="rounded bg-[#efeae0] px-1.5 py-0.5 text-[11px] font-semibold">{isC ? 'Mall·C端' : 'Market·B端'}</span>
                    {o.boothCode && (
                      <Link
                        to={isC ? `/mall/booth/${o.boothId}` : `/market/booth/${o.boothId}`}
                        className="text-sm font-medium underline decoration-dotted hover:text-[#b8862b]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {o.boothName}
                      </Link>
                    )}
                    <span className="text-sm text-[#6b665a]">{o.listingTitle}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#8a8577]">
                      {isClientRole ? '合同对手：DU' : o.supplierId ? `采购对手（合格供应商）：${o.sellerName}` : `合同对手：${o.sellerName}`}
                    </span>
                    {!isClientRole && o.supplierId && (
                      <span className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[11px] font-bold text-[#8a6d3b]">DU 采购单</span>
                    )}
                    <span className="ticker-font font-bold">¥{(o.amountCents / 100).toLocaleString()}</span>
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ color: st.color, background: `${st.color}18` }}>{st.label}</span>
                    <button
                      type="button"
                      className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] font-medium text-[#6b665a] transition-colors hover:bg-black/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(openId === o.id ? null : o.id);
                      }}
                    >
                      {openId === o.id ? '收起详情 ▲' : '履约详情 ▼'}
                    </button>
                  </div>
                </div>
                {openId === o.id ? <BoothTimelineCard orderId={o.id} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
