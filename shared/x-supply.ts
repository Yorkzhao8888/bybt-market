/* ============ X-Supply 供给四源集市 · 独立类型契约（X-SUPPLY-01 补充约束：模块化与未来独立化预留） ============
 * 依赖单向：仅依赖公共底座（shared/types 的帽/域/会话模型），禁止反向依赖 X-Market 业务类型。
 * 命名空间：XSupply* 前缀；未来整体迁出独立工程时本文件随域目录平移。
 */

import type { DomainCode, HatRole, SessionUser } from './types';

/** 供给集市入驻登记台账（EX/EXX 办位登记） */
export interface XSupplyEntry {
  id: string;
  /** 登记执行帽（EX/EXX，办位穿透留痕） */
  hatRole: HatRole;
  /** 归属供给容器（供货商，如 c-qc 启辰） */
  containerId: string;
  /** 供货商名（大号市面称呼） */
  containerName: string;
  /** 目标 Booth-E 铺 id */
  boothId: string;
  /** 目标 Booth-E 铺码（如 Booth-E-01） */
  boothCode: string;
  domain: DomainCode;
  /** 资质摘要（消防验收/产权核验/SLA/售后等核验项） */
  qualification: string;
  note: string;
  status: 'registered';
  ts: string;
}

/** 供给列表卡（只读、脱敏下发；owner 信息经 unitById 二级反查） */
export interface XSupplyBooth {
  id: string;
  code: string;
  domain: DomainCode;
  name: string;
  ownerContainerId: string;
  /** 供货商名（大号） */
  ownerName: string;
  /** 铺主帽（EU/HU/YU/TU，供给帽·管位） */
  ownerHatRole: HatRole;
  /** 铺内执行帽（E 域映射 EXX；其他域后续单扩展） */
  execHat: HatRole | '';
  frontDesc: string;
  backDesc: string;
  rating: number;
  status: string;
}

/** GET /api/supply/hub 响应（读权限：供给帽+EX/EXX+DU+执行帽+V*M；XU/CU 一律 403） */
export interface XSupplyHubData {
  viewer: Pick<SessionUser, 'hatRole' | 'hatId' | 'containerId' | 'containerName'>;
  /** 登记入口可见性（EX/EXX 办位） */
  canRegister: boolean;
  /** 铺子维护入口可见性（EX/EXX 且名下有供给铺） */
  canMaintain: boolean;
  /** 本铺 Booth 码（仅本铺维护口径，EX/EXX 名下 Booth-E 首铺） */
  maintainBoothCode: string;
  booths: XSupplyBooth[];
  entries: XSupplyEntry[];
}

/* ============ XMK-API-01 入驻主体资料（供集写矩阵：DU / XEPZ#CU 企业入驻主体 / 供给帽；XHPZ#CU 403） ============ */

/** 入驻主体准入状态（XMK-GOV-01 治理面：pending 待审 / approved 批准 / frozen 冻结） */
export type VendorStatus = 'pending' | 'approved' | 'frozen' | 'rejected';

/** 入驻主体资料（API 字段 snake_case；identity_id 复用 OAS 身份标识，禁止另建主数据） */
export interface XSupplyProfile {
  container_id: string;
  container_name: string;
  identity_id: string;
  contact_name: string;
  contact_phone: string;
  intro: string;
  updated_at: string;
  /** 准入状态（XMK-GOV-01：VEM audit 迁移；frozen 时 /api/supply 写路径联动拦截） */
  vendor_status: VendorStatus;
  vendor_note: string;
  /** 治理事件流（snake_case：action/actor_user/actor_hat/target/note/ts） */
  governance_events: import('./governance').GovernanceAuditEvent[];
}

/* ============ X-SUPPLY-02 供给单体系（DU 采购发起 → 供给方接单/报价 → DU 确认） ============ */

/** 供给单状态流（基础闭环；confirmed 终态，后续串联 X-Market 采购单/ERP 见后续单） */
export type XSupplyOrderStatus = 'initiated' | 'accepted' | 'quoted' | 'confirmed';

/** 供给单流转留痕（字段对齐三权审计 snake_case：actor_user/actor_hat/booth_code 穿透原文） */
export interface XSupplyOrderEvent {
  id: string;
  order_id: string;
  action: 'initiate' | 'accept' | 'quote' | 'confirm';
  actor_user: string;
  actor_hat: HatRole;
  booth_code: string;
  note: string;
  ts: string;
}

/** 供给单（采购主体=DU 唯一经营号；D*U 分拨机制预留——buyerCategory 后续单落） */
export interface XSupplyOrder {
  id: string;
  /** 供给单号（XS-2026-xxxx，独立于 X-Market 订单六族） */
  code: string;
  /** 供给源域（E/Y/H/T） */
  domain: DomainCode;
  buyerContainerId: string;
  buyerContainerName: string;
  /** 发起帽（DU 线留痕） */
  buyerHatRole: HatRole;
  supplierBoothId: string;
  supplierBoothCode: string;
  supplierContainerId: string;
  supplierContainerName: string;
  /** 铺主帽（EU/HU/YU/TU，管位） */
  supplierHatRole: HatRole;
  title: string;
  qty: number;
  unit: string;
  /** 供给方报价（分；quoted/confirmed 态有值） */
  quotedCents: number | null;
  note: string;
  status: XSupplyOrderStatus;
  events: XSupplyOrderEvent[];
  createdAt: string;
  updatedAt: string;
}
