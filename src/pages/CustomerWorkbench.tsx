/**
 * XMK-CRM-UI-01 客集工作台（X-Customer PRD v1.1 P0 F1-F5）
 * F1 三区块（需求单/采购意向/客户档案）+F5 供给单时间线（买家视角）；
 * 身份矩阵 UI 守卫：XHPZ#CU / XEPZ#CU 全功能（XEPZ 仅见本人买家单）；
 * XDPZ#DU→403 守卫页；匿名→跳登录；XVPZ 系→引导治理台。
 * 红线：契约零改动（仅消费 XMK-API-01 端点）；零帽名；文案全走 terminology；禁 mock。
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldX, Crown, ClipboardList, BookmarkPlus, IdCard, Plus, ArrowRight, FileClock } from 'lucide-react';
import { useAuth } from '../Auth';
import { conceptTerm, layerTerm } from '../lib/terminology';
import { customerApi } from '../api/customer';
import { req } from '../api/client';
import DualTerm from '../components/DualTerm';
import { EmptyState } from '../components/ui';
import type { CustomerDoc, CustomerProfile } from '../../shared/customer';
import type { XSupplyOrder } from '../../shared/x-supply';

const CU_ACCENT = '#1D4ED8';

const DOC_STATUS_META: Record<string, { text: string; cls: string }> = {
  open: { text: '进行中', cls: 'bg-[#DBEAFE] text-[#1D4ED8]' },
  matched: { text: '已匹配', cls: 'bg-[#DCFCE7] text-[#166534]' },
  closed: { text: '已关闭', cls: 'bg-[#E7E5E4] text-[#57534E]' },
};

const ORDER_STATUS_TEXT: Record<string, string> = {
  initiated: '已发起',
  accepted: '供给方已接单',
  quoted: '已报价',
  confirmed: '已确认',
};

function DocStatusPill({ status }: { status: string }) {
  const m = DOC_STATUS_META[status] ?? { text: status, cls: 'bg-[#E7E5E4] text-[#57534E]' };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.text}</span>;
}

function SectionHead({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: CU_ACCENT }}>{icon}</span>
      <h3 className="font-serif-display text-base font-black text-[#17181d]">{title}</h3>
      <span className="text-[11px] text-[#8a8577]">{sub}</span>
    </div>
  );
}

/** F2/F3 同构单据区块：发布表单（title 必填）+列表（本人容器过滤由 API 保证）；F3 意向卡可关联需求单对照展示 */
function DocSection({ kind, docs, demands, onPosted }: { kind: 'demand' | 'intent'; docs: CustomerDoc[]; demands?: CustomerDoc[]; onPosted: () => void }) {
  const term = conceptTerm(kind === 'demand' ? 'customerDemand' : 'customerIntent');
  /* F3 关联展示：意向 → 需求单 的本地对照（仅展示层引用，不落库、不动契约） */
  const [linkOf, setLinkOf] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    setMsg('');
    if (!title.trim()) {
      setErr('标题必填，请先填写单据标题');
      return;
    }
    setBusy(true);
    try {
      await (kind === 'demand' ? customerApi.postDemand({ title: title.trim(), desc: desc.trim() })
        : customerApi.postIntent({ title: title.trim(), desc: desc.trim() }));
      setTitle('');
      setDesc('');
      setMsg('已发布，列表已即时更新');
      onPosted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <SectionHead icon={kind === 'demand' ? <ClipboardList className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />} title={term.big} sub={term.sys} />
      <p className="mt-1.5 text-xs leading-5 text-[#6b665a]">
        {kind === 'demand'
          ? '登记您的采购需求：发布后进入需求池，供后续互通协议对接（本面不做撮合与承接）。'
          : '登记您的采购意向：可关联已有需求单作为上下文对照（本面不做客户资源供应）。'}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`${term.big}标题（必填）`}
          className="min-w-0 flex-1 rounded-lg border border-[#e4ded2] px-3 py-2 text-sm outline-none focus:border-[#17181d]"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#17181d] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />发布
        </button>
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="补充说明（选填）：品类 / 数量 / 期望交付等"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border border-[#e4ded2] px-3 py-2 text-sm outline-none focus:border-[#17181d]"
      />
      {err && <p className="mt-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-[#DC2626]">{err}</p>}
      {msg && <p className="mt-2 rounded-lg border border-[#bfe3c8] bg-[#eef8f0] px-3 py-2 text-xs text-[#166534]">{msg}</p>}
      <div className="mt-3 divide-y divide-[#f0ece2]">
        {docs.length === 0 ? (
          <EmptyState text={`暂无${term.big}——发布第一条试试`} />
        ) : (
          docs.map((d) => (
            <div key={d.id} className="py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-[#6b665a]">{d.code}</span>
                <DocStatusPill status={d.status} />
                <span className="ml-auto text-[10px] text-[#b0aa9c]">{new Date(d.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <p className="mt-1 text-sm font-bold text-[#17181d]">{d.title}</p>
              {d.desc && <p className="mt-0.5 text-xs leading-5 text-[#6b665a]">{d.desc}</p>}
              {kind === 'intent' && demands && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <label className="text-[11px] text-[#8a8577]" htmlFor={`link-${d.id}`}>关联需求单</label>
                  <select
                    id={`link-${d.id}`}
                    value={linkOf[d.id] ?? ''}
                    onChange={(e) => setLinkOf((prev) => ({ ...prev, [d.id]: e.target.value }))}
                    className="rounded border border-[#e4ded2] bg-white px-1.5 py-0.5 text-[11px] text-[#3d3a33] outline-none focus:border-[#17181d]"
                  >
                    <option value="">不关联</option>
                    {demands.map((dm) => (
                      <option key={dm.id} value={dm.id}>{dm.code} · {dm.title}</option>
                    ))}
                  </select>
                  {linkOf[d.id] && (() => {
                    const linked = demands.find((dm) => dm.id === linkOf[d.id]);
                    return linked ? (
                      <span className="text-[11px] text-[#6b665a]">
                        已关联：<span className="font-mono font-bold text-[#3d3a33]">{linked.code}</span> · {linked.title}（{DOC_STATUS_META[linked.status]?.text ?? linked.status}）
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** F4 客户档案：OAS 派生只读，零编辑入口（档案未就绪时显示加载态，不做本地派生兜底） */
function ProfileSection({ profile }: { profile: CustomerProfile | null }) {
  const term = conceptTerm('customerProfile');
  return (
    <div className="rounded-xl border bg-white p-4">
      <SectionHead icon={<IdCard className="h-4 w-4" />} title={term.big} sub={term.sys} />
      <p className="mt-1.5 rounded-lg border border-[#e4ded2] bg-[#faf8f3] px-3 py-2 text-xs text-[#6b665a]">
        档案由 OAS 派生，不可编辑——本页为零编辑入口，身份信息以登录身份为准。
      </p>
      {!profile ? (
        <p className="mt-3 text-sm text-[#8a8577]">档案加载中……</p>
      ) : (
        <dl className="mt-3 divide-y divide-[#f0ece2]">
          {([
            ['身份标识', profile.identity_id],
            ['所属容器', `${profile.container_name}（${profile.container_id}）`],
            ['容器类型', profile.container_type],
            ['身份帽', profile.hat_role],
            ['显示名', profile.display_name],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 py-2">
              <dt className="w-20 shrink-0 text-xs text-[#8a8577]">{k}</dt>
              <dd className="min-w-0 truncate font-mono text-sm font-bold text-[#17181d]">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** F5 供给单时间线（买家视角）：时间线 + 确认动线（知情提示 + 409 正确呈现） */
function TimelineSection({ orders, onChanged }: { orders: XSupplyOrder[]; onChanged: () => void }) {
  const term = conceptTerm('customerTimeline');
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');

  const confirm = async (id: string) => {
    setErr('');
    setBusyId(id);
    try {
      await req(`/api/supply/orders/${encodeURIComponent(id)}/confirm`, { method: 'POST' });
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <SectionHead icon={<FileClock className="h-4 w-4" />} title={term.big} sub={term.sys} />
      <p className="mt-1.5 text-xs leading-5 text-[#6b665a]">
        您名下的供给单（买家视角）：已报价单可执行确认——<span className="font-bold text-[#17181d]">确认即责任转移至交付阶段，并触发结算</span>。
      </p>
      {err && <p className="mt-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-[#DC2626]">{err}</p>}
      <div className="mt-3 space-y-3">
        {orders.length === 0 ? (
          <EmptyState text="暂无供给单——企业批量采购请走企业采购市场的 B2B 动线" />
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-[#e4ded2] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-[#6b665a]">{o.code}</span>
                <span className="rounded-full bg-[#f5f2eb] px-2 py-0.5 text-[11px] font-semibold text-[#3d3a33]">{ORDER_STATUS_TEXT[o.status] ?? o.status}</span>
                {o.quotedCents != null && <span className="ml-auto font-mono text-sm font-black text-[#17181d]">￥{(o.quotedCents / 100).toFixed(2)}</span>}
              </div>
              <p className="mt-1 text-sm font-bold text-[#17181d]">{o.title}</p>
              <p className="mt-0.5 text-xs text-[#8a8577]">
                {o.qty} {o.unit} · 供给方 {o.supplierContainerName}
              </p>
              {o.status === 'quoted' && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => confirm(o.id)}
                    disabled={busyId === o.id}
                    className="rounded-lg bg-[#17181d] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    确认报价成单
                  </button>
                  <span className="text-[11px] leading-4 text-[#B45309]">确认 = 责任转移 + 触发结算，请核对报价金额后执行</span>
                </div>
              )}
              {o.events.length > 0 && (
                <ol className="mt-2.5 space-y-1 border-l-2 border-[#e4ded2] pl-3">
                  {[...o.events].reverse().map((ev, i) => (
                    <li key={`${ev.ts}-${i}`} className="text-[11px] leading-5 text-[#6b665a]">
                      <span className="font-mono text-[#b0aa9c]">{new Date(ev.ts).toLocaleString('zh-CN')}</span> · {ev.note}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CustomerWorkbench() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isCu = user?.hatRole === 'CU';
  const isPlatform = !!user && (user.hatRole === 'VEM' || user.containerType === 'XVPZ');

  const [demands, setDemands] = useState<CustomerDoc[]>([]);
  const [intents, setIntents] = useState<CustomerDoc[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [supplyOrders, setSupplyOrders] = useState<XSupplyOrder[]>([]);
  const [loadErr, setLoadErr] = useState('');

  const reload = async () => {
    /* 逐项落地（allSettled）：供集 GET 对 XHPZ#CU 是 403（API-01 契约口径），不得冻结客集三区块——F5 降级空态 */
    const results = await Promise.allSettled([
      customerApi.demands(),
      customerApi.intents(),
      customerApi.profile(),
      req<XSupplyOrder[]>('/api/supply/orders'),
    ]);
    if (results[0].status === 'fulfilled') setDemands(results[0].value);
    if (results[1].status === 'fulfilled') setIntents(results[1].value);
    if (results[2].status === 'fulfilled') setProfile(results[2].value);
    setSupplyOrders(results[3].status === 'fulfilled' ? results[3].value : []);
    const coreErr = results.slice(0, 3).find((r): r is PromiseRejectedResult => r.status === 'rejected');
    setLoadErr(coreErr ? (coreErr.reason instanceof Error ? coreErr.reason.message : String(coreErr.reason)) : '');
  };

  useEffect(() => {
    /* 身份校验中不判匿名（Auth 恢复存在竞态：loading 期 navigate 会把已登录用户弹去登入端再被弹回工作台首页） */
    if (!loading && !user) navigate('/entrance');
    if (!loading && user && isCu) void reload();
  }, [user, isCu, navigate, loading]);

  /* 身份校验中 */
  if (loading) {
    return <p className="p-10 text-center text-sm text-[#8a8577]">身份校验中…</p>;
  }

  /* 匿名 → 跳登录（已在 effect 导航，渲染提示兜底） */
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-[#8a8577]">正在前往登录……</p>
      </div>
    );
  }

  /* XVPZ 系 → 引导至治理台 */
  if (isPlatform) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Crown className="mx-auto mb-4 h-12 w-12 text-[#6D28D9]" />
        <h1 className="text-xl font-bold text-[#17181D]">{conceptTerm('customerWorkbench').big} · 平台治理身份</h1>
        <p className="mt-3 text-sm text-[#8a8577]">
          您持有平台方治理身份（<span className="font-mono">{user.containerType}#{user.hatRole}</span>），客集客户面不适用——市场秩序与供给治理请前往治理台。
        </p>
        <Link
          to="/governance"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85"
        >
          前往治理台 <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  /* 非 CU（如 XDPZ#DU）→ 403 守卫拒绝页（复用市管台拒绝页模式） */
  if (!isCu) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShieldX className="mx-auto mb-4 h-12 w-12 text-[#DC2626]" />
        <h1 className="text-xl font-bold text-[#17181D]">{conceptTerm('customerWorkbench').big} · 准入不通过</h1>
        <p className="mt-3 text-sm text-[#8a8577]">
          本面仅向 <span className="font-bold text-[#17181d]">买家</span>（自然人客户 / 企业客户）开放。当前身份（
          <span className="font-mono">{user.containerType}#{user.hatRole}</span>）属经营主体——采购请走采购商城与 B2B 动线。
        </p>
        <Link to="/" className="mt-5 inline-block rounded-lg border border-[#e4ded2] px-4 py-2 text-sm font-bold text-[#3d3a33] transition-colors hover:border-[#17181d]">
          返回我的工作台
        </Link>
      </div>
    );
  }

  const layer = layerTerm('customer');

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <DualTerm kind="customerWorkbench" accent={CU_ACCENT} />
          <span className="ml-auto rounded-full bg-[#f5f2eb] px-2.5 py-0.5 text-[11px] font-semibold text-[#3d3a33]">
            {user.containerType} · {user.containerName ?? ''}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-[#6b665a]">
          {layer?.pos ?? ''}——买方登记需求与意向、查阅派生档案、跟进供给单履约；撮合、承接、结算执行不在本面（见集市三层口径）。
        </p>
        {loadErr && <p className="mt-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-[#DC2626]">{loadErr}</p>}
      </div>

      <div className="mt-4 space-y-4">
        <DocSection kind="demand" docs={demands} onPosted={() => void reload()} />
        <DocSection kind="intent" docs={intents} demands={demands} onPosted={() => void reload()} />
        <ProfileSection profile={profile} />
        <TimelineSection orders={supplyOrders} onChanged={() => void reload()} />
      </div>
    </div>
  );
}
