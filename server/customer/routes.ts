/* ============ X-Customer 客集 · API 域（XMK-API-01） ============
 * 依赖单向：仅公共底座（auth 会话 / store 容器反查 / shared 类型）；
 * 禁止 import X-Market 业务路由与页面（未来整体迁出独立服务时零耦合）。
 * 准入矩阵（互通协议 §3）：客集写=CU（XHPZ#CU 消费侧 / XEPZ#CU 企业入驻主体均 ✅）；其余身份 403；匿名 401。
 * 客户档案（profile）：复用 OAS identity_id，禁止另建客户主数据。
 */

import { Router } from 'express';
import { requireAuth, roleOf, type AuthReq, type AuthRes } from '../auth';
import { getStore } from '../store';
import type { CustomerDoc, CustomerProfile } from '../../shared/customer';
import type { HatRole } from '../../shared/types';

const customer = Router();

const ok = (res: AuthRes, data: unknown): void => {
  res.json({ success: true, data });
};
const fail = (res: AuthRes, code: number, message: string): void => {
  res.status(code).json({ success: false, error: message, code });
};

/* ============ 客集单据数据层（需求单/采购意向；内存 store，重启清空；与 X-Market 经营数据隔离） ============ */

const customerDocs: CustomerDoc[] = [];

function nextDocSeq(): number {
  return customerDocs.length + 1;
}
function nextDocCode(kind: 'demand' | 'intent'): string {
  const prefix = kind === 'demand' ? 'XCD' : 'XCI';
  return `${prefix}-2026-${String(nextDocSeq()).padStart(4, '0')}`;
}

/** 客集写准入（矩阵 v3）：仅 CU 帽（自然人 XHPZ#CU / 企业容器 XEPZ#CU）；匿名由 requireAuth 拦（401） */
const isCustomerWriter = (hat: HatRole): boolean => hat === 'CU';

function createDoc(kind: 'demand' | 'intent', req: AuthReq, res: AuthRes): void {
  const user = req.user!;
  const hat = roleOf(user);
  if (!isCustomerWriter(hat)) {
    fail(res, 403, '客集写仅客户身份（CU）可提交；企业与供给身份请走对应动线（准入矩阵 XMK-API-01）');
    return;
  }
  const body = (req.body ?? {}) as { title?: string; desc?: string };
  const title = String(body.title ?? '').trim();
  if (!title || title.length > 120) {
    fail(res, 400, '标题（title）必填且不超过 120 字');
    return;
  }
  const now = new Date().toISOString();
  const doc: CustomerDoc = {
    id: `cd-${nextDocSeq()}`,
    code: nextDocCode(kind),
    kind,
    title,
    desc: String(body.desc ?? '').trim(),
    status: 'open',
    identity_id: user.hatId ?? '',
    container_id: user.containerId ?? '',
    container_name: user.containerName ?? '',
    actor_user: user.hatId ?? '',
    actor_hat: hat,
    created_at: now,
    updated_at: now,
  };
  customerDocs.push(doc);
  ok(res, doc);
}

function listDocs(kind: 'demand' | 'intent', req: AuthReq, res: AuthRes): void {
  const user = req.user!;
  // 跨容器隔离：仅下发本人容器单据
  ok(res, customerDocs.filter((d) => d.kind === kind && d.container_id === user.containerId));
}

/* ============ 需求单（XCD） ============ */
customer.post('/demands', requireAuth, (req: AuthReq, res: AuthRes) => createDoc('demand', req, res));
customer.get('/demands', requireAuth, (req: AuthReq, res: AuthRes) => listDocs('demand', req, res));

/* ============ 采购意向（XCI） ============ */
customer.post('/intents', requireAuth, (req: AuthReq, res: AuthRes) => createDoc('intent', req, res));
customer.get('/intents', requireAuth, (req: AuthReq, res: AuthRes) => listDocs('intent', req, res));

/* ============ 客户档案（派生只读；复用 OAS identity_id，禁止另建客户主数据） ============ */
customer.get('/profile', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user!;
  const container = getStore().containers.find((c) => c.id === user.containerId);
  const profile: CustomerProfile = {
    identity_id: user.hatId ?? '',
    container_id: user.containerId ?? '',
    container_name: user.containerName ?? '',
    container_type: container?.type ?? '',
    hat_role: roleOf(user),
    display_name: user.hat,
  };
  ok(res, profile);
});

export default customer;
