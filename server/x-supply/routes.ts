// X-Supply 供给四源集市 · 路由域（X-SUPPLY-01）
// 依赖单向：仅公共底座（auth 会话 / power 三权 / store 公共数据 helper / domainConfig / shared 类型）；
// 禁止 import X-Market 业务路由、页面与业务 store 表（未来整体迁出独立服务时零耦合）。

import { Router } from 'express';
import { requireAuth, roleOf, type AuthReq, type AuthRes } from '../auth';
import { checkPower } from '../power';
import { getStore, containerById, unitById, normalizePowerHat } from '../store';
import { boothOwnerRole } from '../domainConfig';
import { xSupplyEntries, xSupplyNextEntryId } from './store';
import type { XSupplyBooth, XSupplyEntry, XSupplyHubData } from '../../shared/x-supply';
import type { PowerHat } from '../../shared/types';

const xSupply = Router();

const ok = (res: AuthRes, data: unknown): void => {
  res.json({ success: true, data });
};
const fail = (res: AuthRes, code: number, message: string): void => {
  res.status(code).json({ success: false, error: message });
};

/** 办位执行帽（E 域供给线：EX 驻场执行 / EXX 铺内执行端；后续域扩展 HYX/HYXX 等） */
const isSupplyExecHat = (hat: PowerHat): boolean => hat === 'EX' || hat === 'EXX';

/** 供给集市读权限（EU/HU/YU/TU + EX/EXX + DU + 执行帽 + V*M；XU/CU 一律 403 双保险） */
const isSupplyReader = (hat: PowerHat): boolean =>
  ['EU', 'HU', 'YU', 'TU', 'EX', 'EXX', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VXM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM'].includes(
    hat,
  );

/* ============ 供给列表只读（XU/CU 403） ============ */
xSupply.get('/hub', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const hat = normalizePowerHat(roleOf(user!));
  if (!isSupplyReader(hat)) {
    fail(res, 403, '供给集市（X-Supply）仅面向供给帽/执行帽/经营者/治理角色；客户界面不对四源露出（隔离口径）');
    return;
  }
  const s = getStore();
  const booths: XSupplyBooth[] = s.booths
    .filter((b) => b.kind === 'supply')
    .map((b) => {
      const ownerUnit = unitById(b.ownerUnitId);
      return {
        id: b.id,
        code: b.code,
        domain: b.domain,
        name: b.name,
        ownerContainerId: ownerUnit?.containerId ?? '',
        ownerName: containerById(ownerUnit?.containerId ?? '')?.name ?? '',
        ownerHatRole: boothOwnerRole(b.domain, b.kind),
        execHat: b.domain === 'E' ? 'EXX' : '',
        frontDesc: b.frontDesc,
        backDesc: b.backDesc,
        rating: b.rating,
        status: b.status,
      };
    });
  const myBooth = booths.find((b) => b.ownerContainerId === user!.containerId);
  const data: XSupplyHubData = {
    viewer: {
      hatRole: roleOf(user!),
      hatId: user!.hatId,
      containerId: user!.containerId,
      containerName: user!.containerName,
    },
    canRegister: isSupplyExecHat(hat),
    canMaintain: isSupplyExecHat(hat) && Boolean(myBooth),
    maintainBoothCode: myBooth?.code ?? '',
    booths,
    entries: xSupplyEntries,
  };
  ok(res, data);
});

/* ============ 入驻登记（EX/EXX 办位；EU 管位不可代办 → 403） ============ */
xSupply.post('/register', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const body = (req.body ?? {}) as { boothId?: string; qualification?: string; note?: string };
  const booth = getStore().booths.find((b) => b.id === body.boothId && b.kind === 'supply');
  if (!booth) {
    fail(res, 404, '供给实体铺不存在');
    return;
  }
  if (!checkPower('supply_register', req, res, booth.code)) return;
  const ownerUnit = unitById(booth.ownerUnitId);
  const entry: XSupplyEntry = {
    id: xSupplyNextEntryId(),
    hatRole: roleOf(user!),
    containerId: ownerUnit?.containerId ?? '',
    containerName: containerById(ownerUnit?.containerId ?? '')?.name ?? '',
    boothId: booth.id,
    boothCode: booth.code,
    domain: booth.domain,
    qualification: body.qualification ?? '',
    note: body.note ?? '',
    status: 'registered',
    ts: new Date().toISOString(),
  };
  xSupplyEntries.push(entry);
  ok(res, entry);
});

/* ============ 铺子维护（EX/EXX 办位，仅本铺） ============ */
xSupply.post('/booths/:id/maintain', requireAuth, (req: AuthReq, res: AuthRes) => {
  const user = req.user;
  const body = (req.body ?? {}) as { frontDesc?: string; backDesc?: string };
  // 兼容 id（b-e1）与铺码（Booth-E-01，来自 hub.maintainBoothCode）双口径
  const key = req.params?.id ?? '';
  const booth = getStore().booths.find((b) => (b.id === key || b.code === key) && b.kind === 'supply');
  if (!booth) {
    fail(res, 404, '非供给实体铺');
    return;
  }
  const ownerUnit = unitById(booth.ownerUnitId);
  if (ownerUnit?.containerId !== user!.containerId) {
    fail(res, 403, '仅可维护本铺（Booth-E 归属供给单位，越权他铺禁止）');
    return;
  }
  if (!checkPower('supply_booth_maintain', req, res, booth.code)) return;
  booth.frontDesc = body.frontDesc ?? booth.frontDesc;
  booth.backDesc = body.backDesc ?? booth.backDesc;
  ok(res, { id: booth.id, code: booth.code, frontDesc: booth.frontDesc, backDesc: booth.backDesc });
});

export default xSupply;
