// X-Market · 公共权限底座（X-MARKET-12 三权映射 checkPower / 审计留痕 / 交叉校验）
// X-SUPPLY-01 补充约束：权限帽属公共底座，X-Market 与 X-Supply 双向依赖本模块；本模块不依赖任何业务路由。

import { marketPowerMap, marketPowerAudit, nextPowerAuditId, normalizePowerHat, schedulePowerAuditPersist, getStore } from './store';
import { HAT_POWER_BITS, type HatRole, type MarketPowerAuditRow, type MarketPowerMapRow, type PowerHat } from '../shared/types';
import type { AuthReq, AuthRes } from './auth';

/* ============ 三权映射落库（治-管-办防呆约束） ============ */
// 治（govern：VXM/VEM/VDM 云审批评估）、管（manage：DU 经营决策、*U 供给经营）、办（operate：执行帽作业）
// 写入口统一查 market_power_map：无映射行默认拒绝；帽 ∉ allow_hats 或 ∈ forbid_hats → 403（错误信息带权位口径）；全部动作写 market_power_audit 审计
export const POWER_BIT_LABEL: Record<string, string> = {
  govern: '治位（云审批评估）',
  manage: '管位（经营决策）',
  operate: '办位（执行作业）',
};

export const isCloudHat = (hat: PowerHat): boolean => HAT_POWER_BITS[hat]?.includes('govern') === true;

export function powerAudit(row: MarketPowerMapRow | null, actionCode: string, req: AuthReq, actorHat: PowerHat, boothCode: string, result: 'allowed' | 'denied' | 'escalated', detail: string): void {
  const user = req.user;
  const audit: MarketPowerAuditRow = {
    id: nextPowerAuditId(),
    action_code: actionCode,
    power_bit: row?.power_bit ?? 'unknown',
    actor_user: user?.hatId ?? 'anonymous',
    actor_hat: actorHat,
    actor_tenant: user?.containerId ?? 'anonymous',
    booth_code: boothCode,
    governor: result === 'allowed' && row?.power_bit === 'govern' ? actorHat : '',
    result,
    detail,
    ts: new Date().toISOString(),
  };
  marketPowerAudit.push(audit);
  schedulePowerAuditPersist(); // X-MARKET-TI-02 ③：审计落盘持久化（防抖）
}

// 返回 true=放行；false=已写 403 响应+审计。boothCode：能解析到的铺面码（booth_new/supplier_apply 无预存上下文传空）
export function checkPower(actionCode: string, req: AuthReq, res: AuthRes, boothCode = '', actorHatOverride?: HatRole): boolean {
  const row = marketPowerMap.find((r) => r.action_code === actionCode) ?? null;
  // X-MARKET-16 穿透追责：执行帽动作可传入域映射执行帽（服务端裁定，客户端不可伪造）；缺省仍按登录帽
  const actorHat = actorHatOverride ?? normalizePowerHat(req.user?.hatRole ?? '');
  const deny = (detail: string): boolean => {
    powerAudit(row, actionCode, req, actorHat, boothCode, 'denied', detail);
    res.status(403).json({ success: false, error: detail });
    return false;
  };
  if (!row) return deny(`动作 ${actionCode} 无三权映射行，默认拒绝（防呆：未授权动作不可执行）`);
  if (!row.enabled) return deny(`动作 ${row.action_name}（${actionCode}）已停用，拒绝执行`);
  if (row.forbid_hats.includes(actorHat)) {
    return deny(`${row.action_name}（${actionCode}）属${POWER_BIT_LABEL[row.power_bit] ?? row.power_bit}，帽 ${actorHat} 为禁帽（forbid），无此权；治理口径：${row.governance}`);
  }
  if (!row.allow_hats.includes(actorHat)) {
    return deny(`${row.action_name}（${actionCode}）属${POWER_BIT_LABEL[row.power_bit] ?? row.power_bit}，帽 ${actorHat} 无此权（需 ${row.allow_hats.join('/')}）；治理口径：${row.governance}`);
  }
  if (row.tier === 'cloud' && !isCloudHat(actorHat)) {
    return deny(`${row.action_name}（${actionCode}）为 ${row.tier}/cloud 层动作，帽 ${actorHat} 非云帽，tier 不匹配`);
  }
  powerAudit(row, actionCode, req, actorHat, boothCode, 'allowed', `allow：tier=${row.tier}/scope=${row.scope}（${row.governance}）`);
  return true;
}

// 由铺面 id 解析铺面码（checkPower 审计留痕用；查不到回退原 id）
export function boothCodeOf(boothId: string | null | undefined): string {
  if (!boothId) return '';
  return getStore().booths.find((b) => b.id === boothId)?.code ?? boothId;
}

// 启动交叉校验：market_power_map.allow_hats 与 HAT_POWER_BITS 交叉检查（不一致告警，不阻断）
export function crossCheckPowerMap(): void {
  for (const row of marketPowerMap) {
    if (!row.enabled) continue;
    for (const hat of row.allow_hats) {
      // XU/CU 无帽（归一 NONE），B2B 双边 allow 属客户通行口径而非权位授予，不参与权位交叉校验
      if (hat === 'XU' || hat === 'CU') continue;
      const bits = HAT_POWER_BITS[hat];
      if (!bits || !bits.includes(row.power_bit)) {
        console.warn(`[POWER-MAP] 启动校验告警：${row.action_code}(${row.power_bit}) allow_hats 含 ${hat}，但 HAT_POWER_BITS 未授予该权位（${bits ? bits.join('+') : '无权位'}），请核对映射与帽矩阵`);
      }
    }
  }
}
crossCheckPowerMap();
