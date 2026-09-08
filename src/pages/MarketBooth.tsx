// X-MARKET-05：Booth 铺面（Market 侧）。两套系统边界 + 权属展示 + P1 客户隐藏铺主操作。
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Factory, ListChecks } from 'lucide-react';
import { api } from '../api/client';
import type { BoothDetail, OrderRow } from '../api/client';
import type { TrustExposure } from '../../shared/types';
import { TRUST_EXPOSURE } from '../../shared/types';
import { useAuth } from '../Auth';
import { colorOf, marketLabel, hatLabel, canOperate, canOperateBooth } from '../lib/domain';

export default function MarketBooth() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [d, setD] = useState<BoothDetail | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [face, setFace] = useState<'sale' | 'fulfill'>('sale');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setD(null);
    setErr('');
    void api
      .marketBooth(id)
      .then(setD)
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : '加载失败');
      });
    if (user) void api.orders().then(setOrders).catch(() => undefined);
  }, [id, user]);

  if (err)
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="mb-2 text-4xl">🗂️</p>
        <p className="text-base font-bold text-[#17181d]">铺面不存在或对你不可见</p>
        <p className="mt-2 text-sm leading-6 text-[#8a8577]">
          {err === 'Booth 不存在'
            ? '该 Booth 为供给方实体铺或已下架。客户界面仅展示 DU 经营实体铺（信息隔离：不暴露供给方主体）。'
            : err}
        </p>
        <Link to="/market" className="mt-5 inline-block rounded-lg bg-[#17181d] px-4 py-2 text-sm text-[#f5f2eb]">
          返回 Market 铺面
        </Link>
      </div>
    );
  if (!d) return <div className="py-20 text-center text-sm text-[#8a8577]">加载铺面…</div>;
  const { booth, owner, exec, listings, jobSystems } = d;
  const color = colorOf(booth.marketCode);
  const mayOperate = canOperate(user?.hatRole);
  const isOwner = canOperateBooth(user?.hatRole, user?.hatId, booth.ownerUnitId);
  const boothOrders = orders.filter((o) => o.boothId === booth.id);

  const restock = (): void => {
    setMsg('补货/上架由 Booth 实体系统（作业层 WH 仓储）执行，Market 铺面层仅引用展示（两套系统边界）。');
  };

  return (
    <div className="space-y-5">
      <Link to="/market" className="inline-flex items-center gap-1.5 text-sm text-[#6b665a] hover:text-[#17181d]">
        <ArrowLeft className="h-4 w-4" /> 返回 Market
      </Link>

      <div className="rounded-xl border bg-white p-5 shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color }}>
              {booth.kind === 'supply' ? <Factory className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              {marketLabel(booth.marketCode)} · {booth.kindLabel} · <span className="font-mono">{booth.code}</span>
            </div>
            <h2 className="mt-1 font-serif-display text-2xl font-black">{booth.name}</h2>
            <p className="mt-1 text-sm text-[#6b665a]">{booth.frontDesc}</p>
            <p className="mt-1 text-xs text-[#8a8577]">项目线 {booth.projectLine} · 运营方 {booth.operatorRole}</p>
          </div>
          <div className="shrink-0 rounded-lg border px-3 py-2 text-right text-xs">
            <p className="text-[#8a8577]">铺主（权属）</p>
            <p className="font-semibold">{owner?.name ?? booth.ownerUnitId}</p>
            <p className="text-[#8a8577]">{owner ? hatLabel(owner.role) : ''}</p>
            {booth.execHat && <p className="mt-1 text-[#8a8577]">执行帽 {booth.execHat}{exec ? ` · ${exec.name}` : ''}</p>}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[#17181d] p-3 text-xs text-white/80">
          两套系统边界：本页为 Market <b className="text-white">铺面层</b>（询价/报价/合同/订单）。FAB/WH/DL/SVC/LAB 五大作业系统归属
          <b className="text-white"> Booth 实体系统</b>（作业层，另一窗口实现），Market 不执行作业。
        </div>

        <div className="mt-3 flex gap-2">
          <FaceBtn active={face === 'sale'} onClick={() => setFace('sale')}>售卖面（前店·交易）</FaceBtn>
          <FaceBtn active={face === 'fulfill'} onClick={() => setFace('fulfill')}>履约面（后厂·订单对接作业层）</FaceBtn>
        </div>
      </div>

      {/* 五大作业系统：Booth 实体能力引用（占位，不在 Market 执行） */}
      <div className="rounded-xl border bg-white p-5">
        <p className="font-serif-display text-base font-black">内置五大作业系统（铺主拎包经营 · 实体系统能力）</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {jobSystems.map((s) => (
            <span key={s.code} className="rounded-lg border border-dashed px-3 py-2 text-xs text-[#6b665a]">
              <b className="font-mono text-[#17181d]">{s.code}</b> {s.label} <span className="text-[#b0a996]">·{s.scene}</span>
            </span>
          ))}
        </div>
      </div>

      {face === 'sale' ? (
        <div className="rounded-xl border bg-white p-5">
          <p className="mb-3 flex items-center gap-2 font-serif-display text-lg font-black"><Store className="h-5 w-5" /> 售卖面 · 挂单</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {listings.length === 0 && <p className="text-sm text-[#8a8577]">暂无挂单</p>}
            {listings.map((l) => (
              <div key={l.id} className="rounded-lg border border-[#e4ded2] p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{l.title}</p>
                  <span className="font-mono text-sm font-bold">¥{(l.priceCents / 100).toFixed(0)}{l.unit ? `/${l.unit}` : ''}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {l.tags.map((t) => <span key={t} className="rounded bg-[#f3eee3] px-1.5 py-0.5 text-[10px] text-[#8a8577]">{t}</span>)}
                </div>
                {/* 补充单2：强隔离+脱敏露出（质检/产地脱敏/服务等级/时效/售后），不含供给方名称/报价 */}
                {(() => {
                  const exp: TrustExposure | undefined = TRUST_EXPOSURE[l.domain];
                  if (!exp) return null;
                  return (
                    <div className="mt-2 rounded-md bg-[#faf7f0] px-2 py-1.5 text-[11px] leading-5 text-[#6b665a]">
                      <p>{exp.quality.join(' · ')}</p>
                      <p>产地 {exp.originMask} · {exp.serviceLevel} · {exp.leadTime}</p>
                      <p>售后：{exp.afterSales}</p>
                    </div>
                  );
                })()}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#8a8577]">铺面挂单（库存/批次归 Booth 实体系统）</span>
                  {/* P1：客户不可见上架等铺主操作 */}
                  {isOwner ? (
                    <button onClick={restock} className="rounded-md border px-2 py-1 text-xs hover:bg-[#efeae0]">补货（作业层）</button>
                  ) : (
                    <Link to="/market" className="rounded-md bg-[#b8862b] px-2 py-1 text-xs text-white hover:opacity-90">B2B 询价</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* 补充单2：DU 承载 —— 售后入口指向 DU，发票流供给方→DU→客户，客户不可见采购合同 */}
          <div className="mt-4 rounded-lg border border-[#e4ded2] bg-[#faf7f0] p-3 text-xs leading-5 text-[#6b665a]">
            <p className="font-bold text-[#17181d]">售后与发票（DU 承载）</p>
            <p>售后：仅联系合同对手 {owner ? `${owner.name}（DU 经营主体）` : 'DU 经营主体'}，责任转移点 = 交付回执；DU 向供给方追偿。</p>
            <p>发票：供给方 → DU（进项票） → 客户（销售票，由 DU 开具）。</p>
            <p>DU 与供给方的采购/服务合同仅 DU 经营台可见，客户不可见。</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-5">
          <p className="mb-3 flex items-center gap-2 font-serif-display text-lg font-black"><ListChecks className="h-5 w-5" /> 履约面 · 交易订单对接作业层</p>
          {!user ? <p className="text-sm text-[#8a8577]">登录后可见本铺订单（P3 按身份过滤）</p> : boothOrders.length === 0 ? (
            <p className="text-sm text-[#8a8577]">暂无可见交易订单</p>
          ) : (
            <div className="space-y-2">
              {boothOrders.map((o) => (
                <div key={o.code} className="flex items-center justify-between rounded-lg border border-[#e4ded2] p-3 text-sm">
                  <div>
                    <p className="font-mono text-xs font-bold">{o.code}</p>
                    <p className="text-xs text-[#6b665a]">{o.listingTitle} · ¥{(o.amountCents / 100).toFixed(2)} · {o.buyerName} → {o.sellerName}</p>
                  </div>
                  <span className="rounded bg-[#f3eee3] px-2 py-0.5 text-xs">{o.family}族 · {o.status}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-[#8a8577]">履约采购/调度单在 Booth 实体系统生成并回传状态（占位）。</p>
        </div>
      )}

      {/* 经营者身份位 */}
      <div className="rounded-xl border bg-[#17181d] p-5 text-[#f5f2eb]">
        <p className="font-serif-display text-base font-black">铺子经营身份位</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {!owner && !exec && <p className="text-xs text-white/60">暂无经营者身份位</p>}
          {owner && (
            <div className="rounded-lg bg-white/10 px-3 py-2 text-sm">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-mono">{hatLabel(owner.role)}</span>
              <span className="ml-2">{owner.name}（铺主·权属）</span>
            </div>
          )}
          {exec && (
            <div className="rounded-lg bg-white/10 px-3 py-2 text-sm">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-mono">{hatLabel(exec.role)}</span>
              <span className="ml-2">{exec.name}（执行帽）</span>
            </div>
          )}
        </div>
        {!mayOperate && <p className="mt-3 text-xs text-white/60">客户视角：铺主管理操作（上架/补货/开铺）已隐藏（P1）。</p>}
      </div>

      {msg && <p className="rounded-md bg-[#f3eee3] px-3 py-2 text-sm text-[#8a6d3b]">{msg}</p>}
    </div>
  );
}

function FaceBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-[#17181d] text-white' : 'bg-[#f3eee3] text-[#6b665a] hover:bg-[#e9e3d6]'}`}>
      {children}
    </button>
  );
}
