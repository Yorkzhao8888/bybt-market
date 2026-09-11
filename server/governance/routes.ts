/**
 * XMK-GOV-01 治理面（/api/governance）——E-Market 治理打样（VEM）
 * 独立命名空间：客集 /api/customer/* 与供集 /api/supply/* 契约零触碰。
 * 准入：仅 XVPZ#VEM（市管方）；其他帽 403、匿名 401。
 * 边界：只治理不撮合——审核/监察/看板，无交易端点。
 * 事件流 snake_case：action/actor_user/actor_hat/target/note/ts。
 */
import { Router } from 'express';
import { requireAuth, roleOf, type AuthReq, type AuthRes } from '../auth';
import { containerById, normalizePowerHat } from '../store';
import { xSupplyProfiles, xSupplyOrders } from '../x-supply/store';
import { VENDOR_STATUS_TRANSITIONS, type GovernanceAuditEvent } from '../../shared/governance';
import type { XSupplyProfile } from '../../shared/x-supply';

const ok = (res: AuthRes, data: unknown): void => {
  res.status(200).json({ success: true, data });
};
const fail = (res: AuthRes, code: number, message: string): void => {
  res.status(code).json({ success: false, error: message });
};

const governance = Router();

/** E 域判定（VEM 治理范围 = E-Market / X-Goods；DE 线归 E） */
const isEDomain = (domainTag: string | undefined): boolean =>
  domainTag === 'E_MARKET' || domainTag === 'DE_MARKET';

/** 准入守卫：仅 XVPZ#VEM（市管方）。旧治理号（XVMZ 容器 VEM）与 CU/DU/EU/VDM 一律 403。 */
const requireGovernor = (req: AuthReq, res: AuthRes): boolean => {
  const user = req.user;
  if (!user) {
    fail(res, 401, '未登录或会话已过期');
    return false;
  }
  const hat = normalizePowerHat(roleOf(user));
  if (hat !== 'VEM' || user.containerType !== 'XVPZ') {
    fail(res, 403, '治理面准入不通过：/api/governance 仅市管方（XVPZ#VEM）可访问（XMK-GOV-01 矩阵）');
    return false;
  }
  return true;
};

/** E 域入驻主体名录（Booth-E 入驻方 + 准入状态 + 治理事件流） */
governance.get('/supply/vendors', requireAuth, (req: AuthReq, res: AuthRes) => {
  if (!requireGovernor(req, res)) return;
  const rows = ([...xSupplyProfiles.values()]
    .filter((p: XSupplyProfile) => {
      const c = containerById(p.container_id);
      return Boolean(c) && isEDomain(c?.domainTag);
    })
    .sort((a: XSupplyProfile, b: XSupplyProfile) => a.container_id.localeCompare(b.container_id)) as (XSupplyProfile & { domain: string })[]);
  ok(res, rows);
});

/**
 * 准入审核（真实状态变更，落 profile.vendor_status + 治理事件流）。
 * 状态机：pending→approved / approved→frozen / frozen→approved；非法迁移 409；未知动作 400。
 */
governance.post('/supply/vendors/:id/audit', requireAuth, (req: AuthReq, res: AuthRes) => {
  if (!requireGovernor(req, res)) return;
  const user = req.user!;
  const p = xSupplyProfiles.get(String(req.params.id ?? ''));
  if (!p) {
    fail(res, 404, '入驻主体不存在');
    return;
  }
  const body = (req.body ?? {}) as { action?: string; note?: string };
  const action = String(body.action ?? '');
  const note = String(body.note ?? '').slice(0, 120);
  if (action !== 'approve' && action !== 'freeze') {
    fail(res, 400, '审核动作非法：仅 approve（批准）/ freeze（冻结）');
    return;
  }
  const next = action === 'approve' ? 'approved' : 'frozen';
  const allowed = VENDOR_STATUS_TRANSITIONS[p.vendor_status] ?? [];
  if (!allowed.includes(next)) {
    fail(res, 409, `状态机非法迁移：${p.vendor_status} 不可执行 ${action}（XMK-GOV-01）`);
    return;
  }
  p.vendor_status = next;
  p.vendor_note = note;
  p.updated_at = new Date().toISOString();
  const ev: GovernanceAuditEvent = {
    action: action === 'approve' ? 'vendor_approve' : 'vendor_freeze',
    actor_user: user.hatId ?? '',
    actor_hat: 'VEM',
    target: p.container_id,
    note,
    ts: new Date().toISOString(),
  };
  p.governance_events.push(ev);
  ok(res, p);
});

/** 供给单全域监察（只读 + 状态分布聚合） */
governance.get('/supply/orders', requireAuth, (req: AuthReq, res: AuthRes) => {
  if (!requireGovernor(req, res)) return;
  const orders = xSupplyOrders;
  const stats: Record<string, number> = {};
  for (const o of orders) stats[o.status] = (stats[o.status] ?? 0) + 1;
  ok(res, { orders, stats, total: orders.length });
});

/** E-Market 经营看板（成交量 / 供给方数 / 订单状态分布） */
governance.get('/overview', requireAuth, (req: AuthReq, res: AuthRes) => {
  if (!requireGovernor(req, res)) return;
  const eOrders = xSupplyOrders.filter((o) => o.domain === 'E');
  const dist: Record<string, number> = {};
  let volume = 0;
  let volumeCents = 0;
  for (const o of eOrders) {
    dist[o.status] = (dist[o.status] ?? 0) + 1;
    if (o.status === 'confirmed') {
      volume += 1;
      volumeCents += o.quotedCents ?? 0;
    }
  }
  const vendors = [...xSupplyProfiles.values()].filter((p) => {
    const c = containerById(p.container_id);
    return Boolean(c) && isEDomain(c?.domainTag);
  });
  const approved = vendors.filter((p) => p.vendor_status === 'approved').length;
  const pending = vendors.filter((p) => p.vendor_status === 'pending').length;
  const frozen = vendors.filter((p) => p.vendor_status === 'frozen').length;
  ok(res, {
    plat: 'X-Goods',
    market: 'E-Market',
    volume,
    volume_cents: volumeCents,
    vendors_total: vendors.length,
    vendors_approved: approved,
    vendors_pending: pending,
    vendors_frozen: frozen,
    status_dist: dist,
    generated_at: new Date().toISOString(),
  });
});

export const router = governance;
export default governance;
