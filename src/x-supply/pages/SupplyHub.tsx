// X-Supply 供给四源集市（X-SUPPLY-01）：独立路由域 /supply · 组件命名空间 XSupply*
// 定位：供给四源集市（YU/EU/HU/TU 上游供给）——DU 在此为采购者；X-Market=五域经营面。两交易面中间隔 DU。
// 权限：EU/VXM/DU 可进；XU/CU 前端守卫 403 + 后端接口 403 双保险
// 办位（EX/EXX）：入驻登记 + Booth-E 铺面维护（仅本铺）；EU 管位只读 + 指引；VXM/DU 治理/采购视角
// 双称呼（试行延续 UE-02）：大号市面称呼 + 小号系统称呼；穿透字段保留系统标识
// 依赖单向（X-SUPPLY-01 补充约束）：仅公共底座（ui/PowerBadge/DualTerm/domain/terminology/Auth）+ 本域数据层，禁止 import X-Market 页面组件
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Building2, ClipboardCheck, FileClock, ShieldAlert, Warehouse } from 'lucide-react';
import { xSupplyApi } from '../api/du-supply';
import PowerBadge from '../../components/PowerBadge';
import DualTerm from '../../components/DualTerm';
import { EmptyState, SectionTitle } from '../../components/ui';
import { useAuth } from '../../Auth';
import { colorOf, hatLabel, isSupplyGovernHat, supplyGovernDomainOf } from '../../lib/domain';
import { conceptTerm } from '../../lib/terminology';
import { SupplyGovernDesk } from './SupplyGovernDesk';
import { SupplyPurchaseDesk } from './SupplyPurchaseDesk';
import { SupplyInboxPanel } from './SupplyInboxPanel';
import type { XSupplyHubData } from '../../../shared/x-supply';

const GREEN = '#15803D';
const GREEN_SOFT = '#e8f5ec';
const GREEN_TEXT = '#166534';

export default function XSupplyHub() {
  const { user } = useAuth();
  const [hub, setHub] = useState<XSupplyHubData | null>(null);
  const [err, setErr] = useState('');
  // 入驻登记表单（EX/EXX 办位）
  const [qualification, setQualification] = useState('消防验收 · 产权核验 · SLA-A · 售后 48h');
  const [note, setNote] = useState('');
  const [regMsg, setRegMsg] = useState('');
  const [regErr, setRegErr] = useState('');
  // 铺面维护表单（EX/EXX 仅本铺，目标铺 = hub.maintainBoothCode 同源）
  const [frontDesc, setFrontDesc] = useState('');
  const [backDesc, setBackDesc] = useState('');
  const [mtMsg, setMtMsg] = useState('');
  const [mtErr, setMtErr] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setErr('');
      setHub(await xSupplyApi.hub());
    } catch (e) {
      setErr(e instanceof Error ? e.message : '供给集市加载失败');
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const doRegister = async () => {
    setRegMsg('');
    setRegErr('');
    const boothKey = hub?.maintainBoothCode || 'b-e1';
    try {
      await xSupplyApi.register({ boothId: boothKey, qualification, note });
      setRegMsg('入驻登记已提交（登记台账可查）');
      setNote('');
      void load();
    } catch (e) {
      setRegErr(e instanceof Error ? e.message : '登记失败');
    }
  };

  const doMaintain = async () => {
    setMtMsg('');
    setMtErr('');
    const boothKey = hub?.maintainBoothCode || 'b-e1';
    try {
      await xSupplyApi.maintain(boothKey, { frontDesc, backDesc });
      setMtMsg('铺面已更新（前店售卖面 / 后厂履约面）');
      void load();
    } catch (e) {
      setMtErr(e instanceof Error ? e.message : '维护失败');
    }
  };

  if (!user) return null;
  const hat = user.hatRole;
  const isExec = hub?.canRegister ?? false;
  // X-SUPPLY-02 供给单分面：DU/执行帽=采购台（发起/确认/看单）；供给方（*U 管位 + EX/EXX 办位）=收件箱
  const isProcure = hat !== null && ['DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX'].includes(hat);
  const isSupplierSide = hat !== null && ['EU', 'HU', 'YU', 'TU', 'EX', 'EXX'].includes(hat);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 头部：双称呼身份徽标（X-Supply 供给集市） */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#e4ded2] pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17181d]" style={{ fontFamily: 'Noto Serif SC, Songti SC, serif' }}>
            <DualTerm kind="supplyHub" /> · 供给四源集市
          </h1>
          <p className="mt-1 text-xs text-[#6b675f]">
            YU/EU/HU/TU 上游供给 · DU 为采购者 · 两交易面中间隔 DU（X-Market 为五域经营面）
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-bold text-white" style={{ background: GREEN }}>
            {hatLabel(hat)}
          </span>
          <span className="text-xs text-[#6b675f]">{user.containerName}</span>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
          {err.includes('403') || err.includes('无权') ? '（XU/CU 无权访问供给集市）' : ''}
        </div>
      )}

      {/* 角色指引条（办/管/治权位口径） */}
      <div className="mb-5 rounded border border-[#e4ded2] bg-white px-4 py-3 text-sm text-[#57534e] shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
        {isExec ? (
          <span className="flex flex-wrap items-center gap-2">
            <PowerBadge kind="operate" />
            办位执行：入驻登记与 Booth-E 铺面维护由 <b>EX/EXX</b> 办理（仅本铺）；资质审核（X-SUPPLY-02）与准入治理属管/治位。
          </span>
        ) : isSupplyGovernHat(hat) ? (
          <span className="flex flex-wrap items-center gap-2">
            <PowerBadge kind="govern" />
            治位视角（四源分线 · X-MARKET-ROLE-01）：{supplyGovernDomainOf(hat) ? `${hat} 治 ${supplyGovernDomainOf(hat)} 源准入与货品` : 'VXM 统筹全域四源（含大额采购审批/阈值）'}；下方治理台办理。
          </span>
        ) : hat === 'DU' ? (
          <span className="flex flex-wrap items-center gap-2">
            <PowerBadge kind="manage" />
            采购者视角：DU 在供给集市为采购方——四源货源发起<DualTerm kind="supplyOrder" compact />、确认报价成单（下方采购台）；供给单→X-Market 采购单串联待后续工单。
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <PowerBadge kind="manage" />
            管位视角：入驻登记/铺面维护由办位（EX/EXX）执行，管位不代办；资质提交链路（EU→EMXX）见 X-SUPPLY-02。
          </span>
        )}
      </div>

      {isSupplyGovernHat(hat) && <SupplyGovernDesk />}

      {isProcure && <SupplyPurchaseDesk />}
      {isSupplierSide && <SupplyInboxPanel />}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* 左：供给列表（只读 + 准入徽章） */}
        <div>
          <SectionTitle>
            供给货源一览 <span className="ml-1 text-xs font-normal text-[#6b675f]">（只读 · <DualTerm kind="admission" compact /> 徽章）</span>
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {(hub?.booths ?? []).map((b) => (
              <div key={b.id} className="rounded border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-6 w-2 rounded-sm" style={{ background: colorOf(b.domain) }} />
                    <div>
                      <div className="text-sm font-bold text-[#17181d]">{b.name}</div>
                      <div className="font-mono text-[11px] text-[#6b675f]">{b.code} · {b.domain} 域</div>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e8f5ec] px-2 py-0.5 text-[11px] font-bold" style={{ color: GREEN_TEXT }}>
                    <BadgeCheck size={12} /> 准入合格
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-[#57534e]">
                  <div>供货商：<b className="text-[#17181d]">{b.ownerName}</b><span className="ml-1 font-mono text-[10px] text-[#6b675f]">{b.ownerContainerId}</span></div>
                  <div>驻场执行：<span className="font-mono text-[11px]">{b.execHat || '—'}</span><span className="ml-1 text-[10px] text-[#6b675f]">{b.execHat ? 'Booth 执行端' : '待派驻'}</span></div>
                  <div className="rounded bg-[#f5f2eb] px-2 py-1.5 leading-relaxed">资质摘要：{(hub?.entries ?? []).filter((e) => e.boothCode === b.code).slice(-1)[0]?.qualification || '资质核验链路待提交（X-SUPPLY-02）'}</div>
                  <div className="flex flex-wrap gap-2 pt-0.5 text-[11px] text-[#6b675f]">
                    <span>前店：{b.frontDesc || '—'}</span>
                    <span>后厂：{b.backDesc || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
            {hub && hub.booths.length === 0 && <EmptyState text="暂无供给货源（EX/EXX 完成入驻登记后展示）" />}
          </div>
        </div>

        {/* 右：办位操作（EX/EXX）+ 入驻台账 */}
        <div className="space-y-5">
          {isExec && (
            <>
              <div className="rounded border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17181d]">
                  <ShieldAlert size={15} style={{ color: GREEN }} /> <DualTerm kind="supplyRegister" />
                  <PowerBadge kind="operate" />
                </div>
                <label className="block text-xs font-bold text-[#57534e]">资质摘要</label>
                <input value={qualification} onChange={(e) => setQualification(e.target.value)} className="mb-2 w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
                <label className="block text-xs font-bold text-[#57534e]">备注</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="登记说明（可空）" className="mb-2 w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
                <button onClick={() => void doRegister()} className="w-full rounded px-3 py-2 text-sm font-bold text-white" style={{ background: GREEN }}>
                  提交入驻登记
                </button>
                {regMsg && <div className="mt-2 rounded px-2 py-1.5 text-xs" style={{ background: GREEN_SOFT, color: GREEN_TEXT }}>{regMsg}</div>}
                {regErr && <div className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1.5 text-xs text-red-700">{regErr}</div>}
              </div>

              <div className="rounded border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17181d]">
                  <Warehouse size={15} style={{ color: GREEN }} /> <DualTerm kind="supplyMaintain" />
                  <span className="text-[10px] font-normal text-[#6b675f]">仅本铺 {hub?.maintainBoothCode || 'Booth-E'}</span>
                </div>
                <label className="block text-xs font-bold text-[#57534e]">前店售卖面描述</label>
                <input value={frontDesc} onChange={(e) => setFrontDesc(e.target.value)} className="mb-2 w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
                <label className="block text-xs font-bold text-[#57534e]">后厂履约面描述</label>
                <input value={backDesc} onChange={(e) => setBackDesc(e.target.value)} className="mb-2 w-full rounded border border-[#e4ded2] px-2 py-1.5 text-sm" />
                <button onClick={() => void doMaintain()} className="w-full rounded border-2 px-3 py-2 text-sm font-bold" style={{ borderColor: GREEN, color: GREEN_TEXT }}>
                  保存铺面
                </button>
                {mtMsg && <div className="mt-2 rounded px-2 py-1.5 text-xs" style={{ background: GREEN_SOFT, color: GREEN_TEXT }}>{mtMsg}</div>}
                {mtErr && <div className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1.5 text-xs text-red-700">{mtErr}</div>}
              </div>
            </>
          )}

          <div className="rounded border border-[#e4ded2] bg-white p-4 shadow-[4px_4px_0_rgba(23,24,29,0.08)]">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17181d]">
              <ClipboardCheck size={15} style={{ color: GREEN }} /> <DualTerm kind="supplyEntry" />
            </div>
            {(hub?.entries ?? []).length === 0 ? (
              <EmptyState text="暂无入驻记录" />
            ) : (
              <ul className="space-y-2">
                {hub!.entries.map((en) => (
                  <li key={en.id} className="rounded bg-[#f5f2eb] px-2.5 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <b className="text-[#17181d]">{en.containerName}</b>
                      <span className="font-mono text-[10px] text-[#6b675f]">{en.hatRole} · {en.boothCode}</span>
                    </div>
                    <div className="mt-0.5 text-[#57534e]">{en.qualification}</div>
                    {en.note && <div className="mt-0.5 text-[10px] text-[#6b675f]">备注：{en.note} · {en.ts}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded border border-[#e4ded2] bg-[#f5f2eb] p-4 text-xs leading-relaxed text-[#57534e]">
            <div className="mb-1 flex items-center gap-1.5 font-bold text-[#17181d]"><Building2 size={13} /> 路由域口径</div>
            X-Supply 独立路由域（/supply），旧链 /supplier 继续渲染供给工作台不 404；四源入口不对客户（XU/CU）露出。
            <div className="mt-2 flex items-center gap-1.5"><FileClock size={12} /> 越权尝试进入留痕台账（actor_hat 保留系统标识）。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
