/* ============ XMK-GOV-01 E-Market 治理面（/api/governance/* 新命名空间） ============
 * 契约：集市三层结构定版 v1.1 第四视角——市场管理方=XVPZ 平台方，分治制，E 域打样。
 * 供集集中管理归 VEM；本命名空间仅 XVPZ#VEM 可访问（其他帽 403 / 匿名 401）。
 * 依赖单向：仅 import ./types 与 ./x-supply（VendorStatus），禁止反向。
 */
import type { HatRole } from './types';
import type { XSupplyOrder, VendorStatus } from './x-supply';

/** 治理审计事件（snake_case 延续：actor_hat 系统标识原文） */
export interface GovernanceAuditEvent {
  action: 'vendor_approve' | 'vendor_freeze';
  actor_user: string;
  actor_hat: HatRole;
  /** 治理对象（入驻主体容器 id） */
  target: string;
  note: string;
  ts: string;
}

/** 入驻主体名录行（聚合 XSupplyProfile + 准入状态 + 治理事件流） */
export interface GovernanceVendor {
  container_id: string;
  container_name: string;
  identity_id: string;
  contact_name: string;
  intro: string;
  vendor_status: VendorStatus;
  vendor_note: string;
  domain: string;
  governance_events: GovernanceAuditEvent[];
  updated_at: string;
}

/** 供给单状态分布聚合（snake_case 延续） */
export interface GovernanceOrderStats {
  total: number;
  by_status: Record<string, number>;
}

/** 供给单全域监察视图（只读） */
export interface GovernanceOrdersView {
  orders: XSupplyOrder[];
  stats: GovernanceOrderStats;
}

/** E-Market 经营看板（治理只读，不做交易撮合） */
export interface GovernanceOverview {
  /** 成交量（confirmed 供给单数，E 域） */
  confirmed_count: number;
  /** 成交额（分；confirmed 单 quoted_cents 之和，E 域） */
  confirmed_amount_cents: number;
  /** 供给方数（approved 入驻主体，E 域） */
  approved_vendors: number;
  order_stats: GovernanceOrderStats;
  generated_at: string;
}

/** 审核动作入参（POST /api/governance/supply/vendors/:id/audit） */
export interface VendorAuditReq {
  action: 'approve' | 'freeze';
  note?: string;
}

/** 准入状态机：pending→approved / approved⇄frozen；其余迁移一律 409 */
export const VENDOR_STATUS_TRANSITIONS: Record<VendorStatus, VendorStatus[]> = {
  pending: ['approved'],
  approved: ['frozen'],
  frozen: ['approved'],
};
