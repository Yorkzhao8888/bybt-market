/* ============ X-Customer 客集 · 独立类型契约（XMK-API-01） ============
 * 依赖单向：仅依赖公共底座（shared/types 的帽/域/会话模型），禁止反向依赖 X-Market 业务类型。
 * 命名空间：Customer* / XC* 前缀；API 字段统一 snake_case（互通协议面，未来独立服务时零转换）。
 */

import type { HatRole } from './types';

/** 客集单据状态（需求单/采购意向共用；open 默认态，matched/closed 由后续互通协议扩展） */
export type CustomerDocStatus = 'open' | 'matched' | 'closed';

/** 客集单据（需求单 XCD / 采购意向 XCI 共用结构；kind 区分） */
export interface CustomerDoc {
  id: string;
  /** 单号（XCD-2026-xxxx / XCI-2026-xxxx） */
  code: string;
  kind: 'demand' | 'intent';
  title: string;
  desc: string;
  status: CustomerDocStatus;
  /** 复用 OAS identity_id（登录身份标识，禁止另建客户主数据） */
  identity_id: string;
  container_id: string;
  container_name: string;
  /** 提交人系统标识（穿透原文，不大号化） */
  actor_user: string;
  actor_hat: HatRole;
  created_at: string;
  updated_at: string;
}

/** GET /api/customer/profile 响应（派生只读档案——复用 OAS identity_id，零新主数据表） */
export interface CustomerProfile {
  identity_id: string;
  container_id: string;
  container_name: string;
  container_type: string;
  hat_role: HatRole;
  display_name: string;
}
