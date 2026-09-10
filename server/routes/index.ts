// X-Market 五域集市系统 · 后端 Express API 路由
// X-MARKET-05：两套独立系统（Market 铺面层 / Booth 实体作业层）+ 三方链路 + Booth 权属
//   Market：五大专业市场、铺面、询价/报价/合同/订单、DU 经营台、运营方治理（不经营/不持资源/不执行作业）
//   Booth 实体：FAB/WH/DL/SVC/LAB 五作业系统（占位，另一窗口实现），铺面仅引用

import { Router } from 'express';
import {
  DOMAINS, domainByCode, familyOfDomain, marketMetaOf, PUBLIC_MARKETS,
  JOB_SYSTEMS, OPERATOR_DUTIES, boothOwnerRole, duExecHatOf, BOOTH_OF_EXEC_HAT, MALL_EXEC_HAT,
  isSupplyGovernHat, supplyGovernDomainOf,
} from '../domainConfig';
import {
  getStore, nextSeq, containerById, unitById,
  inquiries, governanceCases, nextOrderCode, supplyContracts,
  supplierApplications, supplierProducts, nextSupplierId, nextFulfillId,
  marketPowerMap, marketPowerAudit, normalizePowerHat, governThresholds,
} from '../store';
import { createToken, getUserByToken, revokeToken, DEV_PASSWORD, requireAuth, optionalAuth, roleOf, type AuthReq, type AuthRes } from '../auth';
import { checkPower, boothCodeOf, powerAudit } from '../power';
import xSupply from '../x-supply/routes';
import type { DemoAccount, DomainCode, HatRole, Order, SessionUser, Booth, SupplierApplication, SupplierProduct, SupplyMallItem, MarketPowerMapRow, MarketPowerAuditRow, PowerHat, FulfillmentReceipt } from '../../shared/types';
import { CONTAINER_TYPE_LABEL, UNIT_ROLE_LABEL, HAT_LINE_OF, HAT_POWER_BITS, type Inquiry } from '../../shared/types';

const router = Router();
const api = Router();

function ok(res: { json: (v: unknown) => void }, data: unknown): void {
  res.json({ success: true, data });
}

/* ============ 身份/权限判定（X-MARKET-05 P1/P2/P3/P5） ============ */
type Capability = 'open_booth' | 'operate_booth' | 'view_all_orders' | 'govern' | 'b2b_purchase';
/** 客户（XU/CU）只读；DU 系/供给方可开铺经营；V*M 运营方可治理与全局总账 */
function can(user: SessionUser, cap: Capability): boolean {
  const role = user.hatRole;
  if (!role) return false;
  const line = HAT_LINE_OF[role] as string | undefined;
  switch (cap) {
    case 'b2b_purchase':
      return role === 'XU' || line === 'demand' || role === 'OU';
    case 'open_booth':
    case 'operate_booth':
      // 经营/供给/运营可操作铺；客户（CU/XU）不可
      return line === 'supply' || line === 'exec' || role === 'DU' || line === 'admin';
    case 'view_all_orders':
    case 'govern':
      return line === 'admin'; // 仅运营方/平台可见全局总账/治理
  }
}
/** 是否为客户（下游买家）：C 端 CU / B 端 XU */
const isClient = (role: HatRole | null): boolean => role === 'CU' || role === 'XU';
/** 当前帽归属线 */
const lineOf = (user: SessionUser): string => (user.hatRole ? (HAT_LINE_OF[user.hatRole] as string) : '');

// ================= 认证（底座·开发版）=================
/** 演示账号（C 端顾客 / 供给方 / DU 经营主体 / B 端客户 / 运营方） */
const demoAccounts: DemoAccount[] = [
  // C 端顾客（Mall）
  { id: 'xiaolin', entry: 'C', hatRole: 'CU', containerId: 'c-xl', hatId: 'u-cu1', label: '小林 · 顾客', note: '消费者·小林 · 自然人容器' },
  { id: 'amay', entry: 'C', hatRole: 'CU', containerId: 'c-may', hatId: 'u-cu2', label: '阿May · 顾客', note: '消费者·阿May · 自然人容器' },
  // B 端组织/采购
  { id: 'hefeng', entry: 'B', hatRole: 'OU', containerId: 'c-hf', hatId: 'u-op1', label: '恒丰·组织需求', note: '恒丰供应链 · 企业容器' },
  // 供给方（源头产能，持供给实体铺）
  { id: 'eu-qiuchen', entry: 'B', hatRole: 'EU', containerId: 'c-qc', hatId: 'u-eu1', label: '启辰物资 · 物资供给', note: '以 EU 身份持源头供给实体铺 Booth-E', domainView: 'E', boothTarget: 'b-e1' },
  { id: 'hu-renshi', entry: 'B', hatRole: 'HU', containerId: 'c-rs', hatId: 'u-hu1', label: '任仕人力 · 人力供给', note: '以 HU 身份持源头供给实体铺 Booth-H', domainView: 'H', boothTarget: 'b-h1' },
  { id: 'tu-chiyuan', entry: 'B', hatRole: 'TU', containerId: 'c-cy', hatId: 'u-tu1', label: '驰远智联 · 技术供给', note: '以 TU 身份持源头供给实体铺 Booth-T', domainView: 'T', boothTarget: 'b-t1' },
  { id: 'yu-jiezu', entry: 'B', hatRole: 'YU', containerId: 'c-yj', hatId: 'u-yu1', label: '捷租云间 · 空间供给', note: '以 YU 身份持源头供给实体铺 Booth-Y（捷租 Jezoom）', domainView: 'Y', boothTarget: 'b-y1' },
  // DU 唯一经营主体（一个 DU 多店）
  { id: 'du-hehe', entry: 'B', hatRole: 'DU', containerId: 'c-du', hatId: 'u-du1', label: '合和经营 · 平台直营 DU', note: '以 DU 身份经营 5 类经营实体铺（DY/DH/DT/DE/DC），执行帽 DYX/DHX/DTX/DEX/DCX 分管；复合多挂 *DU 五域分经营号（X-MARKET-19 展示/核算维度，权限仍单帽 DU）', domainView: 'DE', boothTarget: 'b-de1', duChildDomains: ['Y', 'H', 'T', 'DE', 'C'] },
  { id: 'du-fengshi', entry: 'B', hatRole: 'DU', containerId: 'c-fs', hatId: 'u-du2', label: '丰时经营 · 加盟 DU', note: '加盟 DU（Y/H/DE 可加盟），经营 Booth-DH', domainView: 'H', boothTarget: 'b-dh2' },
  // B 端客户 XU（买家，走 Market）
  { id: 'xu-huadong', entry: 'B', hatRole: 'XU', containerId: 'c-gou', hatId: 'u-xu1', label: '华东区采购办 · 客户 XU', note: 'B 端采购客户（走 Market，企业采购/询价报价）', domainView: 'E' },
  // 平台运营方 V*M（X-MARKET-ROLE-01 治理分线：VDM=market 经营治理；VXM+四源家族=supply 域内管家审批，X-MARKET-18）
  { id: 'vdm', entry: 'B', hatRole: 'VDM', containerId: 'c-plat', hatId: 'u-vdm1', label: '经营管理治理 VDM', note: 'market 经营治理（治理案件/全局订单总账/规则只读/三权审计/履约中心）', domainView: 'DE' },
  { id: 'vem-e', entry: 'B', hatRole: 'VEM', containerId: 'c-plat', hatId: 'u-vem1', label: '管家审批 · 通货市场 VEM', note: 'supply 域内管家审批·E 源（EU 物资供给准入评估/货品审批/大额采购审批，EMX）', domainView: 'E' },
  // 管家审批统筹（X-MARKET-18：VXM→VMX 总运执行归 OVM；域内管家审批仍 V*M 系 + 大额采购审批统筹）
  { id: 'vmx-cloud', entry: 'B', hatRole: 'VXM', containerId: 'c-plat', hatId: 'u-vxm1', label: '管家审批统筹 VMX', note: '总运执行（归 OVM）+ supply 管家审批全域统筹（域内准入评估/货品审批/大额采购审批）', domainView: 'E' },
  // X-Supply 供给线执行帽（X-SUPPLY-01：EX 办位，入驻登记/Booth-E 铺面维护）
  { id: 'ex-qiuchen', entry: 'B', hatRole: 'EX', containerId: 'c-qc', hatId: 'u-ex1', label: '启辰·物资供给执行 EX', note: '启辰 Booth-E 驻场执行（办位：供给集市入驻登记/铺面维护）', domainView: 'E', boothTarget: 'b-e1' },
  // 域内管家审批家族（X-MARKET-ROLE-01 + X-MARKET-18：VYM/VHM/VTM 各审本源，仅可末尾追加）
  { id: 'vym-y', entry: 'B', hatRole: 'VYM', containerId: 'c-plat', hatId: 'u-vym1', label: '管家审批 · 智场市场 VYM', note: 'supply 域内管家审批·Y 源（YU 空间供给准入评估/货品审批/大额采购审批，YMX）', domainView: 'Y' },
  { id: 'vhm-h', entry: 'B', hatRole: 'VHM', containerId: 'c-plat', hatId: 'u-vhm1', label: '管家审批 · 人资市场 VHM', note: 'supply 域内管家审批·H 源（HU 人力供给准入评估/货品审批/大额采购审批，HMX）', domainView: 'H' },
  { id: 'vtm-t', entry: 'B', hatRole: 'VTM', containerId: 'c-plat', hatId: 'u-vtm1', label: '管家审批 · 技术市场 VTM', note: 'supply 域内管家审批·T 源（TU 技术供给准入评估/货品审批/大额采购审批，TMX · 白名单兼任）', domainView: 'T' },
];
const DEMO_ALIAS: Record<string, DemoAccount> = Object.fromEntries(demoAccounts.map((a) => [a.id, a]));
// 帽角色路由 → 演示账号（快捷）
const DEMO_ROUTE: Partial<Record<HatRole, DemoAccount>> = {
  EU: demoAccounts[3], HU: demoAccounts[4], TU: demoAccounts[5], YU: demoAccounts[6],
  DU: demoAccounts[7], XU: demoAccounts[9], VDM: demoAccounts[10], VEM: demoAccounts[11], VXM: demoAccounts[12], EX: demoAccounts[13],
  VYM: demoAccounts[14], VHM: demoAccounts[15], VTM: demoAccounts[16],
};

function buildSession(acc: DemoAccount): SessionUser {
  const store = getStore();
  const container = store.containers.find((c) => c.id === acc.containerId) ?? store.containers[0];
  const hat = store.units.find((u) => u.id === acc.hatId) ?? store.units[0];
  return {
    containerId: container.id,
    containerName: container.name,
    containerType: container.type,
    entry: acc.entry,
    hatId: hat.id,
    hatRole: acc.hatRole,
    hat: hat.name,
    domainView: acc.domainView ?? undefined,
    boothTarget: acc.boothTarget ?? undefined,
    duChildDomains: acc.duChildDomains ?? undefined,
  };
}


api.post('/auth/login', (req, res) => {
  const { account, password } = (req.body ?? {}) as { account?: string; password?: string };
  if (password !== DEV_PASSWORD) {
    res.status(401).json({ success: false, error: '密码不正确（开发版统一 test123）' });
    return;
  }
  const acc = DEMO_ALIAS[account ?? ''] ?? (account === 'test123' ? demoAccounts[0] : undefined);
  if (!acc) {
    res.status(400).json({ success: false, error: '账号不存在，可使用演示账号一键登录' });
    return;
  }
  const user = buildSession(acc);
  ok(res, { token: createToken(user), user });
});

api.post('/auth/oneclick', (req, res) => {
  const { demoId } = (req.body ?? {}) as { demoId?: string };
  const acc = DEMO_ALIAS[demoId ?? 'xiaolin'] ?? demoAccounts[0];
  const user = buildSession(acc);
  ok(res, { token: createToken(user), user });
});

api.get('/auth/demos', (_req, res) => ok(res, demoAccounts));

api.get('/auth/me', requireAuth, (req: AuthReq, res) => ok(res, req.user));
api.post('/auth/logout', requireAuth, (req: AuthReq, res) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  revokeToken(token);
  ok(res, { loggedOut: true });
});

// ================= 首页总览 =================
api.get('/overview', (_req, res) => {
  const store = getStore();
  const turnoverOf = (domain: string): number => {
    const ids = new Set(store.booths.filter((b) => b.domain === domain).map((b) => b.id));
    return Math.round(
      store.orders.filter((o) => o.boothId !== null && ids.has(o.boothId)).reduce((s, o) => s + o.amountCents, 0) / 100,
    );
  };
  ok(res, {
    domainMeta: DOMAINS,
    totalBooths: store.booths.length,
    totalListings: store.listings.length,
    totalOrders: store.orders.length,
    totalTurnover: Math.round(store.orders.reduce((s, o) => s + o.amountCents, 0) / 100),
    stats: DOMAINS.map((d) => ({
      domain: d.code,
      booths: store.booths.filter((b) => b.domain === d.code).length,
      turnover: turnoverOf(d.code),
    })),
  });
});

// ================= 13U 帽模型查询 =================
api.get('/model/units', (_req, res) => {
  const store = getStore();
  const enriched = store.units.map((u) => ({ ...u, line: HAT_LINE_OF[u.role], roleLabel: UNIT_ROLE_LABEL[u.role] }));
  ok(res, enriched);
});

api.get('/model/hierarchy', (_req, res) => {  const store = getStore();
  const data = store.containers.map((c) => ({
    ...c,
    containerTypeLabel: CONTAINER_TYPE_LABEL[c.type],
    units: store.units
      .filter((u) => u.containerId === c.id)
      .map((u) => ({ ...u, roleLabel: UNIT_ROLE_LABEL[u.role], line: HAT_LINE_OF[u.role] })),
  }));
  ok(res, data);
});

api.get('/model/containers', (_req, res) => {
  const store = getStore();
  ok(res, store.containers.map((c) => ({ ...c, containerTypeLabel: CONTAINER_TYPE_LABEL[c.type] })));
});

/** 帽体系说明（X-MARKET-05：DU 唯一经营主体 + 五执行帽；不再有 YDU/HDU/EDU/TDU 独立执业帽） */
api.get('/model/hats', (_req, res) => {
  const base13 = ['CU', 'DU', 'TU', 'EU', 'HU', 'OU', 'GU', 'AU', 'FU', 'IU', 'VU', 'SU', 'YU'] as HatRole[];
  const duExec = ['DYX', 'DHX', 'DTX', 'DEX', 'DCX'] as HatRole[];
  const parties = {
    client: { label: '客户(下游)', line: '买家', hats: ['XU', 'CU'], desc: 'XU 企业客户走 Market / CU 自然人客户走 Mall' },
    operator: { label: '经营(中游)', line: 'DU 唯一经营主体', hats: ['DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX'], desc: 'DU 平台直营/加盟，下辖五执行帽一一对应 Booth-DY/DH/DT/DE/DC' },
    supplier: { label: '供给(上游)', line: '源头产能', hats: ['YU', 'EU', 'HU', 'TU', 'DU'], desc: '供给方实体铺 Booth-Y/E/H/T（+产品 DU），源头产能' },
    admin: { label: '运营管理方', line: '平台方', hats: ['VYM', 'VEM', 'VHM', 'VTM', 'VDM'], desc: '平台运营长系 V*M，市场秩序/规则/Booth 系统供给' },
  };
  ok(res, {
    base13U: base13,
    duExecHats: duExec,
    clients: ['XU'] as HatRole[],
    suppliers: ['EU', 'YU', 'HU', 'TU'] as HatRole[],
    duEntity: ['DU'],
    execHats: duExec,
    operators: ['VEM', 'VHM', 'VYM', 'VTM', 'VDM'] as HatRole[],
    removedIndependent: ['YDU', 'HDU', 'EDU', 'TDU', 'EDX', 'TDX'],
    execHatToBooth: BOOTH_OF_EXEC_HAT,
    mallExecHat: MALL_EXEC_HAT,
    parties,
    domains: DOMAINS,
    jobSystems: JOB_SYSTEMS,
    jobSystemNote: '五大作业系统 FAB/WH/DL/SVC/LAB 归 Booth 实体系统（作业层）；Market 铺面层仅引用展示，不执行作业（拎包经营，另一窗口实现）。',
  });
});

/** 五大专业市场（Market 系统·铺面层主视角） */
api.get('/model/markets', (_req, res) => {
  const store = getStore();
  const markets = PUBLIC_MARKETS.map((code) => {
    const d = DOMAINS.find((x) => x.code === code)!;
    const domainBooths = store.booths.filter((b) => b.domain === code);
    const supply = domainBooths.filter((b) => b.kind === 'supply');
    const du = domainBooths.filter((b) => b.kind === 'du');
    return {
      code,
      marketTitle: d.marketTitle,
      marketName: d.marketName,
      name: d.name,
      clientFace: d.clientFace,
      // 源头供给
      supplyBooth: d.supplyBoothCode,
      supplyOwner: d.unitCode,
      supplyBoothCodes: supply.map((b) => b.code),
      // DU 经营实体
      duBooth: d.duBoothCode,
      duExecHat: d.duExecCode,
      duBoothCodes: du.map((b) => b.code),
      canFranchise: d.duCanFranchise,
      // 平台运营方 + 项目线
      operatorRole: d.opRole,
      projectLine: d.projectLine,
      orderFamily: familyOfDomain(code),
      color: d.color,
      summary: d.description,
      supplyCount: supply.length,
      duCount: du.length,
    };
  });
  ok(res, {
    markets,
    jobSystems: JOB_SYSTEMS,
    jobSystemNote: '五大作业系统 FAB/WH/DL/SVC/LAB 内置 Booth 实体（拎包经营）；Market 铺面层仅引用展示，不执行作业。',
    operatorDuties: OPERATOR_DUTIES,
    valueChain: '供给方 Booth-Y/E/H/T（源头产能）→ DU 经营实体 Booth-DY/DH/DT/DE/DC（组织经营）→ Market/Mall（客户界面）',
  });
});

// ================= Mall（C 端 CU）：面向自然人的商城只读 =================
api.get('/mall/listings', (req, res) => {
  const store = getStore();
  const domain = (req.query?.domain as string) || null;
  // Mall 仅展示 C 端门店（Booth-DC，DCX 执行帽）与可零售商品
  const dcxBoothIds = new Set(
    store.booths
      .filter((b) => b.kind === 'du' && store.units.find((u) => u.id === b.execUnitId)?.role === 'DCX')
      .map((b) => b.id),
  );
  let list = store.listings.filter((l) => dcxBoothIds.has(l.boothId));
  if (domain) list = list.filter((l) => l.domain === domain);
  ok(res, list.map((l) => ({ ...l, booth: store.booths.find((b) => b.id === l.boothId) })));
});

api.get('/mall/booths', (_req, res) => {
  const store = getStore();
  const mall = store.booths
    .filter((b) => b.kind === 'du' && store.units.find((u) => u.id === b.execUnitId)?.role === 'DCX')
    .map(decorateBooth(store));
  ok(res, mall);
});

// ================= Market（B 端 XU）：企业采购中心 · 五大专业市场铺面 =================
/** 客户（CU/XU）或匿名视角判定：强隔离 + 脱敏露出（X-MARKET-05 补充单2） */
function isClientView(req: AuthReq): boolean {
  const u = req.user;
  return !u || u.hatRole === 'CU' || u.hatRole === 'XU';
}

api.get('/market/booths', optionalAuth, (req: AuthReq, res) => {
  const store = getStore();
  const domain = (req.query?.domain as string) || null;
  const kind = (req.query?.kind as string) || null; // supply | du
  let list = [...store.booths];
  // 客户/匿名视角：供给实体铺（源头产能）不下发，仅 DU 经营实体铺（合同对手=DU）
  if (isClientView(req)) list = list.filter((b) => b.kind === 'du');
  if (domain) list = list.filter((b) => b.domain === domain);
  if (kind === 'supply' || kind === 'du') list = list.filter((b) => b.kind === kind);
  ok(res, list.map(decorateBooth(store)));
});

api.get('/market/booths/:id', optionalAuth, (req: AuthReq, res) => {
  const store = getStore();
  const booth = store.booths.find((b) => b.id === req.params?.id);
  if (!booth || (booth.kind === 'supply' && isClientView(req))) {
    // 供给实体铺对客户不存在（防探测：同样返回"不存在"）
    res.status(404).json({ success: false, error: 'Booth 不存在' });
    return;
  }
  const d = DOMAINS.find((x) => x.code === booth.domain)!;
  const listing = store.listings.filter((l) => l.boothId === booth.id);
  const owner = store.units.find((u) => u.id === booth.ownerUnitId) || null;
  const exec = booth.execUnitId ? store.units.find((u) => u.id === booth.execUnitId) || null : null;
  ok(res, {
    booth: decorateBooth(store)(booth),
    owner,
    exec,
    operatorRole: d.opRole,
    projectLine: d.projectLine,
    canFranchise: d.duCanFranchise,
    clientFace: d.clientFace,
    listings: listing,
    // 作业系统：Booth 实体能力（铺面层仅引用展示，不执行）
    jobSystems: JOB_SYSTEMS,
    jobSystemNote: '五大作业系统内置 Booth 实体（拎包经营）；Market 铺面层仅引用展示，不执行作业。',
  });
});

function decorateBooth(store: ReturnType<typeof getStore>) {
  return (b: Booth) => {
    const d = DOMAINS.find((x) => x.code === b.domain)!;
    const owner = store.units.find((u) => u.id === b.ownerUnitId) || null;
    const exec = b.execUnitId ? store.units.find((u) => u.id === b.execUnitId) || null : null;
    return {
      ...b,
      marketCode: b.domain,
      kindLabel: b.kind === 'supply' ? '供给方实体铺(源头产能)' : 'DU 经营实体铺(组织经营)',
      chainLabel: b.chain === 'source' ? '源头' : b.chain === 'du' ? '经营' : '铺面',
      ownerRoleLabel: owner ? UNIT_ROLE_LABEL[owner.role] : '',
      ownerName: owner?.name ?? '',
      execHat: exec?.role ?? null,
      execName: exec?.name ?? null,
      marketTitle: d.marketTitle,
      projectLine: d.projectLine,
      operatorRole: d.opRole,
      clientFace: d.clientFace,
      jobSystems: JOB_SYSTEMS.map((j) => j.code),
      franchiseLabel: b.franchise === 'direct' ? '平台直营' : b.franchise === 'franchise' ? '加盟' : '—',
    };
  };
}

/** DU 采购合同（DU 与供给方之间）——仅经营台可见（补充单2：二-3） */
api.get('/market/supply-contracts', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const role = roleOf(user);
  if (role !== 'DU' && HAT_LINE_OF[role] !== 'admin') {
    res.status(403).json({ success: false, error: 'DU 采购合同仅经营台（DU/运营方）可见，客户不可见' });
    return;
  }
  ok(res, supplyContracts);
});

/** 新开 Booth（B 端经营）：按专业市场约束铺主帽与权属（P4/P5）
 *  Y/H：供给帽(YU/HU) 或 DU 经营均可；E/T：供给帽(EU/TU) 或平台直营 DU（无加盟）；DE：DU 直营/加盟。
 *  供给方实体铺归供给帽；DU 经营实体铺归 DU + 合法执行帽；跨主体选帽拒绝。 */
api.post('/market/booths', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  if (!checkPower('booth_new', req, res)) return;
  if (!can(user, 'open_booth')) {
    res.status(403).json({ success: false, error: '客户身份不可开铺/上架；请使用供给方或 DU 经营身份' });
    return;
  }
  const { domain, kind, name, franchise } = (req.body ?? {}) as { domain?: DomainCode; kind?: 'supply' | 'du'; name?: string; franchise?: 'direct' | 'franchise' };
  const d = domain ? DOMAINS.find((x) => x.code === domain) : undefined;
  if (!d) {
    res.status(400).json({ success: false, error: '请选择专业市场（Y智场/E通货/H人资/T技术/DE产品）' });
    return;
  }
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: '请填写铺名' });
    return;
  }
  const store = getStore();
  const boothKind: 'supply' | 'du' = kind === 'supply' ? 'supply' : 'du';
  // 权属帽：supply=该域供给帽；du=DU
  const ownerRole = boothOwnerRole(d.code, boothKind);
  // 校验当前身份有权开该类铺
  const role = roleOf(user);
  const line = lineOf(user);
  if (boothKind === 'supply' && role !== ownerRole && line !== 'admin') {
    res.status(403).json({ success: false, error: `供给方实体铺 ${d.supplyBoothCode} 仅 ${ownerRole}（${UNIT_ROLE_LABEL[ownerRole]}）可开，跨主体开铺属越权` });
    return;
  }
  if (boothKind === 'du' && role !== 'DU' && line !== 'admin') {
    res.status(403).json({ success: false, error: `经营实体铺 ${d.duBoothCode} 仅 DU 经营主体可开（DU 唯一经营主体）` });
    return;
  }
  // 加盟约束：E/T 仅平台直营
  const effFranchise = boothKind === 'du' ? (franchise === 'franchise' ? 'franchise' : 'direct') : undefined;
  if (boothKind === 'du' && effFranchise === 'franchise' && !d.duCanFranchise) {
    res.status(403).json({ success: false, error: `${d.marketName}（${d.marketTitle}）不开放加盟，仅平台直营 DU 可开店` });
    return;
  }
  // 执行帽：du 经营实体按域一一对应；Mall C 端 DE 用 DCX
  const execRole = boothKind === 'du'
    ? (d.clientFace === 'mall' && franchise === 'direct' ? MALL_EXEC_HAT : duExecHatOf(d.code))
    : undefined;
  const ownerHat = store.units.find((u) => u.containerId === user.containerId && u.role === ownerRole)
    ?? store.units.find((u) => u.role === ownerRole);
  const execHat = execRole
    ? (store.units.find((u) => u.containerId === user.containerId && u.role === execRole)
       ?? store.units.find((u) => u.role === execRole))
    : undefined;
  if (!ownerHat) {
    res.status(400).json({ success: false, error: `当前主体缺少 ${ownerRole} 帽，无法持有 ${boothKind === 'supply' ? d.supplyBoothCode : d.duBoothCode}` });
    return;
  }
  const prefix = boothKind === 'supply' ? d.supplyBoothCode : d.duBoothCode;
  const id = nextSeq('booth');
  const seq = String(store.booths.filter((b) => b.code.startsWith(prefix)).length + 1).padStart(2, '0');
  const booth: Booth = {
    id,
    code: `${prefix}-${seq}`,
    domain: d.code,
    kind: boothKind,
    name: name.trim(),
    ownerUnitId: ownerHat.id,
    execUnitId: execHat?.id,
    operatorContainerId: user.containerId,
    chain: boothKind === 'supply' ? 'source' : (d.clientFace === 'mall' && execRole === MALL_EXEC_HAT ? 'face' : 'du'),
    mode: boothKind === 'supply' ? `${ownerRole} → ${prefix}（源头产能）` : `DU·${execRole} → ${prefix}（组织经营）`,
    frontDesc: '新铺·铺面（售卖面，面向客户询价/报价/合同/下单）',
    backDesc: 'Booth 实体·五大作业系统 FAB/WH/DL/SVC/LAB（拎包经营，作业层占位）',
    franchise: effFranchise,
    status: 'open',
    rating: 0,
    listingCount: 0,
  };
  store.booths.push(booth);
  ok(res, decorateBooth(store)(booth));
});

/* ============ B2B 闭环：询价 → 报价 → 合同 → 下单（P6，Market 铺面层） ============ */
api.post('/market/inquiries', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const { boothId, domain, title, detail } = (req.body ?? {}) as { boothId?: string; domain?: DomainCode; title?: string; detail?: string };
  const store = getStore();
  const booth = store.booths.find((b) => b.id === boothId);
  if (!booth) {
    res.status(404).json({ success: false, error: '目标铺面不存在' });
    return;
  }
  // 三权映射先行：带权位口径的 403 优先于业务校验
  if (!checkPower('market_inquiry', req, res, booth.code)) return;
  if (!can(user, 'b2b_purchase')) {
    res.status(403).json({ success: false, error: '仅 B 端采购客户（XU）可发起企业询价' });
    return;
  }
  const id = `inq-${inquiries.length + 1}`;
  const code = `RFQ-${(inquiries.length + 1).toString().padStart(4, '0')}`;
  const inq: Inquiry = {
    id, code, domain: domain ?? booth.domain, boothId: boothId ?? booth.id, buyerContainerId: user.containerId,
    title: title?.trim() || '企业采购询价', detail: detail?.trim() || '',
    status: 'inquiry', createdAt: new Date().toISOString().slice(0, 10),
  };
  inquiries.push(inq);
  ok(res, inq);
});

api.get('/market/inquiries', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const line = lineOf(user);
  // 客户只见自己发起；经营方(DU/供给)见待报价；运营方见全部
  let list = inquiries;
  if (line === 'demand') list = inquiries.filter((i) => i.buyerContainerId === user.containerId);
  else if (line === 'admin') list = inquiries;
  else list = inquiries.filter((i) => i.status === 'inquiry' || i.status === 'quoted');
  ok(res, list);
});

/** 报价 → 合同 → 下单（占位流转，经营方操作） */
api.post('/market/inquiries/:id/quote', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const inq = inquiries.find((i) => i.id === req.params?.id);
  if (!inq) { res.status(404).json({ success: false, error: '询价单不存在' }); return; }
  // 三权映射先行：带权位口径的 403 优先于业务校验
  if (!checkPower('bid_quote', req, res, boothCodeOf(inq.boothId))) return;
  if (!can(user, 'operate_booth')) {
    res.status(403).json({ success: false, error: '仅经营/供给方可报价' });
    return;
  }
  const { quoteCents, quoteNote } = (req.body ?? {}) as { quoteCents?: number; quoteNote?: string };
  inq.status = 'quoted';
  inq.quoteCents = quoteCents ?? 0;
  inq.quoteNote = quoteNote ?? '';
  ok(res, inq);
});
api.post('/market/inquiries/:id/contract', requireAuth, (req: AuthReq, res) => {
  const inq = inquiries.find((i) => i.id === req.params?.id);
  if (!inq) { res.status(404).json({ success: false, error: '询价单不存在' }); return; }
  if (!checkPower('contract_sign', req, res, boothCodeOf(inq.boothId))) return;
  if (inq.status !== 'quoted') { res.status(400).json({ success: false, error: '请先报价再签合同' }); return; }
  inq.status = 'contracted';
  inq.contractNo = `CT-${inq.code.slice(4)}`;
  ok(res, inq);
});

/* ============ 运营治理（P7，V*M 运营方骨架） ============ */
api.get('/govern/cases', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const d = marketMetaOf(user.domainView ?? null);
  const role = roleOf(user);
  // X-MARKET-ROLE-01 治理分线：治理案件（market 市场秩序/经营治理）归 VDM 专属；
  // V*M 四源家族归 supply 四源治理台（/supply），此处 403 隔离（互不越界）
  if (role !== 'VDM') {
    res.status(403).json({ success: false, error: '治理案件归经营管理治理（VDM，market 面）；域内管家审批请走供给面审批台（X-MARKET-18）' });
    return;
  }
  ok(res, { cases: governanceCases, duties: OPERATOR_DUTIES, domain: d?.marketName ?? null });
});

// ================= X-MARKET-15 治理阈值配置（规则模块配置存储） ==================
// GET：登录即可见（DU 下单需要知道阈值以获知升级口径）；POST：治位帽可改（threshold_update 权位口径）
api.get('/govern/thresholds', requireAuth, (_req, res) => {
  ok(res, governThresholds);
});
api.post('/govern/thresholds', requireAuth, (req: AuthReq, res) => {
  if (!checkPower('threshold_update', req, res)) return;
  const { procurementAmountCents } = (req.body ?? {}) as { procurementAmountCents?: number };
  if (typeof procurementAmountCents !== 'number' || !Number.isFinite(procurementAmountCents) || procurementAmountCents <= 0) {
    res.status(400).json({ success: false, error: '采购单笔阈值须为正数（单位：分）' });
    return;
  }
  governThresholds.procurementAmountCents = Math.floor(procurementAmountCents);
  governThresholds.updatedAt = new Date().toISOString();
  governThresholds.updatedBy = req.user?.hatId ?? '';
  ok(res, governThresholds);
});

// ================= 订单流（六族 + C 族，按身份过滤 P3） ==================
api.get('/orders/families', (_req, res) => {
  ok(res, [
    { family: 'C', name: 'Order-C 消费订单', desc: 'Mall C 端 CU 自然人消费（B2C）' },
    { family: 'D', name: 'Order-D 门店产能订单', desc: '门店/产品产能，经 Booth-DE/DC → D-OFD 汇聚调度' },
    { family: 'H', name: 'Order-H 人力订单', desc: '人力/技能服务采购，Booth-DH/DHX 经营承接' },
    { family: 'E', name: 'Order-E 物资订单', desc: '物资/商品采购，Booth-E 源头 → Booth-DE/DEX 经营承接' },
    { family: 'Y', name: 'Order-Y 空间订单', desc: '空间租赁采购，Booth-DY/DYX 经营承接（捷租）' },
    { family: 'T', name: 'Order-T 技术订单', desc: '技术采购订单，Booth-DT/DTX 经营承接（新增）' },
  ]);
});

/** 订单按身份过滤（P3）：客户只见自己、DU 见名下多店、运营方见管辖域/全局 */
api.get('/orders', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const store = getStore();
  const line = lineOf(user);
  const role = roleOf(user);

  let list = store.orders.map((o) => {
    const booth = store.booths.find((b) => b.id === o.boothId);
    const listing = o.listingId ? store.listings.find((l) => l.id === o.listingId) : undefined;
    const buyer = containerById(o.buyerContainerId);
    const seller = containerById(o.sellerContainerId);
    return {
      ...o,
      boothCode: booth?.code ?? '',
      boothName: booth?.name ?? '',
      boothKind: booth?.kind ?? '',
      listingTitle: listing?.title ?? '—',
      buyerName: buyer?.name ?? '—',
      sellerName: seller?.name ?? '—',
    };
  });

  if (can(user, 'view_all_orders')) {
    // X-MARKET-ROLE-01 治理分线：VDM（经营治理）见全局总账；V*M 四源家族（VXM/VEM/VHM/VYM/VTM）
    // 归 supply 面治理，仅见大额采购审批队列（pending_approval/rejected），不见 market 全域订单（信息隔离）
    if (role !== 'VDM') list = list.filter((o) => o.status === 'pending_approval' || o.status === 'rejected');
  } else if (role === 'DU' || line === 'exec' || line === 'supply') {
    // DU 经营主体/执行/供给：见名下多店（数据血缘过滤）
    const myBoothIds = new Set(
      store.booths
        .filter((b) =>
          line === 'supply'
            ? b.ownerUnitId === user.hatId // 供给帽：仅名下供给实体 Booth（如 EU→Booth-E）
            : b.operatorContainerId === user.containerId || b.ownerUnitId === user.hatId,
        )
        .map((b) => b.id),
    );
    list = list.filter(
      (o) =>
        o.sellerContainerId === user.containerId ||
        o.buyerContainerId === user.containerId ||
        (o.boothId !== null && myBoothIds.has(o.boothId)),
    );
    // X-MARKET-15：待治理审批的采购单未生效，不进纯供给帽视野（HAT_LINE_OF.DU 也是 'supply'，
    // 故按帽位特判——DU 提交人/执行帽本人可见待审批单，VDM 全量可见）
    const isPureSupplier = user.hatRole === 'EU' || user.hatRole === 'HU' || user.hatRole === 'YU' || user.hatRole === 'TU';
    if (isPureSupplier) list = list.filter((o) => o.status !== 'pending_approval');
  } else {
    // 客户（CU/XU/OU 等下游）：只见自己下单
    list = list.filter((o) => o.buyerContainerId === user.containerId);
  }
  ok(res, list);
});

api.post('/orders', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const { listingId, amountCents, side, supplierProductId } = (req.body ?? {}) as { boothId?: string; listingId?: string; amountCents?: number; side?: 'C' | 'B'; supplierProductId?: string };
  const { qty } = (req.body ?? {}) as { qty?: number };
  const store = getStore();
  // X-MARKET-08：DU 采购商城一键下单（supplierProductId 关联合格供应商货品，复用采购单体系 EX-2026-100x）
  let targetBoothId: string | undefined = (req.body as { boothId?: string } | undefined)?.boothId;
  let amount = amountCents;
  let supplierId: string | undefined;
  let supplyNote = '';
  if (supplierProductId) {
    const prod = supplierProducts.find((p) => p.id === supplierProductId);
    if (!prod) {
      res.status(404).json({ success: false, error: '货品不存在或已删除' });
      return;
    }
    if (prod.status !== 'on') {
      res.status(400).json({ success: false, error: '货品已下架，不可采购' });
      return;
    }
    const app = supplierApplications.find((a) => a.supplierId === prod.supplierId);
    if (!app || app.status !== 'approved') {
      res.status(403).json({ success: false, error: '供应商未通过云中心准入评估，暂不可采购' });
      return;
    }
    targetBoothId = prod.boothId;
    const qtyN = qty && qty > 0 ? Math.floor(qty) : 1;
    amount = prod.priceCents * qtyN;
    supplierId = prod.supplierId;
    if (!checkPower('procurement_order', req, res, boothCodeOf(prod.boothId))) return;
    supplyNote = `DU 采购单：${prod.name}×${qtyN}${prod.unit}（合格供应商·云中心准入通过）`;
  }
  const booth = store.booths.find((b) => b.id === targetBoothId);
  if (!booth) {
    res.status(404).json({ success: false, error: 'Booth 不存在' });
    return;
  }
  // X-MARKET-08 交易单向：供给实体铺仅 DU 经营线可下单（供给方唯一交易对手 = DU），客户越权采购禁止
  if (booth.kind === 'supply') {
    const role = roleOf(user);
    const buyerOk = role === 'DU' || (HAT_LINE_OF[role] as string | undefined) === 'exec';
    if (!buyerOk) {
      res.status(403).json({ success: false, error: '交易单向：供给实体铺仅 DU 经营主体可采购；客户请经 DU 经营实体铺（Market/Mall）交易' });
      return;
    }
  }
  // 客户界面校验：DCX/Mall 仅 CU；其余 Market 面 XU
  const execRole = store.units.find((u) => u.id === booth.execUnitId)?.role;
  const effSide: 'C' | 'B' = side ?? (execRole === 'DCX' ? 'C' : 'B');
  if (effSide === 'C' && roleOf(user) !== 'CU') {
    res.status(403).json({ success: false, error: 'Mall C 端门店仅 CU 自然人客户下单；企业采购请走 Market 询价' });
    return;
  }
  const listing = listingId ? store.listings.find((l) => l.id === listingId) : undefined;
  const finalAmount = amount ?? listing?.priceCents ?? 0;
  const d = DOMAINS.find((x) => x.code === booth.domain)!;
  const tradeCode = effSide === 'C' ? 'C' : d.tradeCode;
  const family = effSide === 'C' ? 'C' : familyOfDomain(booth.domain);
  // X-MARKET-15：采购单笔金额（单价×数量）> 阈值 → 升级 V*M 治理审批（PENDING_APPROVAL），批准后才生效
  const isProcurement = Boolean(supplierId);
  const overThreshold = isProcurement && finalAmount > governThresholds.procurementAmountCents;
  const id = nextSeq('order');
  const code = nextOrderCode(tradeCode, family);
  const order: Order = {
    id, code, family, side: effSide, boothId: targetBoothId ?? null, listingId: listingId ?? null,
    buyerContainerId: user.containerId, sellerContainerId: booth.operatorContainerId,
    tradeCode, status: overThreshold ? 'pending_approval' : 'pending', amountCents: finalAmount,
    note: supplyNote || (effSide === 'B' ? `企业采购（${d.marketTitle}市场，${booth.kind === 'du' ? booth.code : (d.duBoothCode ?? booth.code) + ' 经营承接'}）` : undefined),
  };
  if (overThreshold) {
    order.note = `${order.note ?? ''}（单笔 ¥${(finalAmount / 100).toLocaleString()} 超阈值 ¥${(governThresholds.procurementAmountCents / 100).toLocaleString()}，升级治理审批，批准后生效）`;
    const prow = marketPowerMap.find((r) => r.action_code === 'procurement_order') ?? null;
    powerAudit(prow, 'procurement_order', req, normalizePowerHat(user.hatRole), booth.code, 'escalated',
      `单笔金额 ¥${(finalAmount / 100).toLocaleString()} 超阈值 ¥${(governThresholds.procurementAmountCents / 100).toLocaleString()}，升级 V*M 治理审批（order_approval），采购单 ${code} 待生效`);
  }
  if (supplierId) order.supplierId = supplierId;
  store.orders.push(order);
  // B2B 询价转下单
  const { inquiryId } = (req.body ?? {}) as { inquiryId?: string };
  if (inquiryId) {
    const inq = inquiries.find((i) => i.id === inquiryId);
    if (inq) { inq.status = 'ordered'; inq.contractNo = inq.contractNo ?? code; }
  }
  ok(res, order);
});

// ================= X-MARKET-15 大额采购治理审批（治位帽，V*M；DU 不可自批） ==================
api.post('/orders/:id/approval', requireAuth, (req: AuthReq, res) => {
  if (!checkPower('order_approval', req, res)) return;
  const order = getStore().orders.find((o) => o.id === req.params?.id);
  if (!order) {
    res.status(404).json({ success: false, error: '采购单不存在' });
    return;
  }
  if (order.status !== 'pending_approval') {
    res.status(400).json({ success: false, error: '仅待治理审批（pending_approval）的采购单可审批' });
    return;
  }
  const { action, note } = (req.body ?? {}) as { action?: 'approve' | 'reject'; note?: string };
  if (action === 'approve') {
    order.status = 'pending'; // 批准 → 回到正常待履约流转，订单生效（供给方自此可见）
    order.approvalNote = note?.trim() || '治理审批通过，采购单生效';
  } else if (action === 'reject') {
    order.status = 'rejected';
    order.approvalNote = note?.trim() || '治理审批驳回，采购单不生效';
  } else {
    res.status(400).json({ success: false, error: 'action 须为 approve 或 reject' });
    return;
  }
  ok(res, order);
});

// ================= X-MARKET-16 执行帽穿透追责：履约执行（办位，执行帽落地） ==================
// 族 → 执行帽：E→DEX / H→DHX / Y→DYX / T→DTX / D-OFD→DCX / C(Mall)→DCX（服务端定帽，客户端不可伪造）
const FAMILY_EXEC_HAT: Record<Order['family'], HatRole> = {
  E: 'DEX', H: 'DHX', Y: 'DYX', T: 'DTX', D: 'DCX', C: 'DCX',
};

// 作业履约回执（Booth 实体系统接口契约）：请求可选 note；响应回执含 actor_user/actor_hat（与审计表同口径，下游可追溯到真实人）
api.post('/orders/:id/fulfill', requireAuth, (req: AuthReq, res) => {
  const order = getStore().orders.find((o) => o.id === req.params?.id);
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' });
    return;
  }
  // 执行帽是 DU 名下作业帽：履约执行须 DU 经营号发起（权属主体），服务端按订单族自动映射执行帽
  if ((req.user?.hatRole ?? '') !== 'DU') {
    res.status(403).json({ success: false, error: `履约执行须 DU 经营号发起（执行帽权属主体），当前帽 ${req.user?.hatRole ?? '匿名'} 无此办权（X-MARKET-16 执行帽穿透追责）` });
    return;
  }
  // 业务状态先于权位闸门：状态不合规的请求不产生审计留痕（审计只记真实执行的写动作）
  if (order.status !== 'pending') {
    res.status(400).json({ success: false, error: `仅生效中（pending）订单可履约执行，当前状态 ${order.status}` });
    return;
  }
  const execHat = FAMILY_EXEC_HAT[order.family] ?? 'DCX';
  if (!checkPower('exec_fulfill', req, res, boothCodeOf(order.boothId), execHat)) return;
  const { note } = (req.body ?? {}) as { note?: string };
  const receipt: FulfillmentReceipt = {
    id: nextFulfillId(),
    order_id: order.id,
    actor_user: req.user?.hatId ?? '',
    actor_hat: execHat,
    booth_code: boothCodeOf(order.boothId),
    note: note?.trim() || `${execHat} 履约回执（交付确认，售后责任转移点）`,
    ts: new Date().toISOString(),
  };
  order.status = 'fulfilling';
  order.fulfillments = [...(order.fulfillments ?? []), receipt];
  ok(res, { order, receipt });
});

// ================= 三流占位（订单流/资源流/资金流） ==================
api.get('/flows', (_req, res) => {
  ok(res, [
    { kind: 'ORDER', label: '订单流', desc: 'Order-C/D/H/E/Y/T 六族', status: '已建模',
      detail: '交易订单在 Market 铺面层（询价→报价→合同→下单）；B2B=XU 走 Market，B2C=CU 走 Mall（DCX）。' },
    { kind: 'RESOURCE', label: '资源流', desc: 'Booth 实体五作业系统 FAB/WH/DL/SVC/LAB', status: '占位',
      detail: '作业系统归 Booth 实体（作业层）：交易订单 ↔ 履约采购/调度单回传；Market 不执行作业。' },
    { kind: 'FUND', label: '资金流（XCASE 收口）', desc: '三段：XCASE → ERP → X-FIN', status: '占位',
      segments: [
        { stage: 'XCASE', role: '结算流水', desc: '收口交易结算/支付流水（Market 交易资金归集）' },
        { stage: 'ERP', role: '总账/资产', desc: '企业资源计划记总账与资产（对接方：ERP-TENANT）' },
        { stage: 'X-FIN', role: '财务分析', desc: '财务数据建模与经营分析' },
      ] },
    { kind: 'INVOICE', label: '发票/税务流', desc: '供给方 → DU → 客户', status: '占位',
      segments: [
        { stage: '进项', role: '供给方 → DU', desc: 'DU 收供给方进项票（DU 采购合同对手方，仅经营台可见）' },
        { stage: '销项', role: 'DU → 客户', desc: 'DU 对客户开销售票（客户合同对手 = DU）' },
      ] },
    { kind: 'AFTER_SALES', label: '售后 SLA', desc: '客户只找 DU · 责任转移点 = 交付回执', status: '占位',
      segments: [
        { stage: '客户 → DU', role: '全责承担', desc: '客户售后仅向 DU（合同对手）发起，DU 对客户负全责' },
        { stage: 'DU → 供给方', role: '内部追偿', desc: '交付回执确认后责任转移，DU 凭采购/服务合同向供给方追偿（客户不可见）' },
      ] },
  ]);
});

// 兼容旧别名
/* ============ X-MARKET-08 供应商准入 + DU 采购商城 ============ */
/** 供给帽（EU/HU/TU/YU）：源头产能供给方 */
const isSupplyHat = (role: HatRole): boolean =>
  role === 'EU' || role === 'HU' || role === 'TU' || role === 'YU';
const mySupplyBooth = (user: SessionUser): Booth | undefined =>
  getStore().booths.find((b) => b.kind === 'supply' && b.ownerUnitId === user.hatId);
/** 经营线（DU 唯一经营主体 + 执行帽）：采购商城唯一可见/可采身份 */
const isDUBuyer = (user: SessionUser): boolean =>
  roleOf(user) === 'DU' || (HAT_LINE_OF[roleOf(user)] as string | undefined) === 'exec';

// 供给方：提交/重新提交准入登记（资质/品类/产能/报价意向 → 待评估）
api.post('/supply/applications', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  if (!checkPower('supplier_apply', req, res)) return;
  if (!isSupplyHat(roleOf(user))) {
    res.status(403).json({ success: false, error: '仅供给方帽（EU/HU/TU/YU）可提交供应商准入登记' });
    return;
  }
  const booth = mySupplyBooth(user);
  if (!booth) {
    res.status(404).json({ success: false, error: '未找到名下供给实体铺，请先在市场开供给铺' });
    return;
  }
  const { categories, capacity, qualification, priceIntent } = (req.body ?? {}) as {
    categories?: string; capacity?: string; qualification?: string; priceIntent?: string;
  };
  if (!categories?.trim() || !qualification?.trim()) {
    res.status(400).json({ success: false, error: '资质与供货品类为必填' });
    return;
  }
  const existing = supplierApplications.find((a) => a.supplierId === user.containerId);
  if (existing && existing.status === 'approved') {
    res.status(400).json({ success: false, error: '已是合格供应商，无需重复登记' });
    return;
  }
  if (existing && existing.status === 'pending') {
    res.status(400).json({ success: false, error: '登记申请云中心评估中，请耐心等待' });
    return;
  }
  if (existing) {
    // rejected → 重新提交：重置为待评估并更新材料（X-MARKET-15：重提计数 +1，超 3 次升级标记）
    existing.status = 'pending';
    existing.categories = categories.trim();
    existing.capacity = capacity?.trim() ?? '';
    existing.qualification = qualification.trim();
    existing.priceIntent = priceIntent?.trim() ?? '';
    existing.rejectReason = undefined;
    existing.resubmitCount = (existing.resubmitCount ?? 0) + 1;
    existing.escalated = existing.resubmitCount > 3; // 驳回重提超过 3 次 → 升级待复核（VYM 复核后续接入）
    existing.createdAt = new Date().toISOString().slice(0, 10);
    ok(res, existing);
    return;
  }
  const app: SupplierApplication = {
    id: nextSupplierId('sa'), supplierId: user.containerId, boothId: booth.id, domain: booth.domain,
    categories: categories.trim(), capacity: capacity?.trim() ?? '', qualification: qualification.trim(),
    priceIntent: priceIntent?.trim() ?? '', status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10),
  };
  supplierApplications.push(app);
  ok(res, app);
});

// 供给方：我的登记状态（待评估/合格/驳回附原因）
api.get('/supply/applications/mine', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  ok(res, supplierApplications.find((a) => a.supplierId === user.containerId) ?? null);
});

// V*M：供应商审核列表（平台运营侧可见，客户不可见）
const withSupplierNames = (a: SupplierApplication): SupplierApplication => {
  const store = getStore();
  const booth = store.booths.find((b) => b.id === a.boothId);
  return {
    ...a,
    supplierName: store.containers.find((c) => c.id === a.supplierId)?.name ?? a.supplierId,
    boothCode: booth?.code ?? a.boothId,
  };
};

api.get('/supply/applications', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const role = roleOf(user);
  // X-MARKET-ROLE-01 治理分线：审核列表归 supply 四源治理（VXM 全域 + 家族本源域过滤）；VDM（market 经营治理）不越界
  if (!isSupplyGovernHat(role)) {
    res.status(403).json({ success: false, error: '供应商准入审核归四源管家审批（supply 面审批台，X-MARKET-18）；market 经营治理（VDM）不参与' });
    return;
  }
  const govDomain = supplyGovernDomainOf(role);
  ok(res, supplierApplications.filter((a) => (govDomain ? a.domain === govDomain : true)).map(withSupplierNames));
});

// 四源治理：审核（通过→合格；驳回→附原因，供给方可重提）（X-MARKET-ROLE-01：VXM 全域 + 家族本源域分线）
api.post('/supply/applications/:id/review', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const role = roleOf(user);
  if (!isSupplyGovernHat(role)) {
    res.status(403).json({ success: false, error: `供应商评估归四源管家审批（V*M 家族/supply 面，X-MARKET-18 域内审批），帽 ${role} 无此席位` });
    return;
  }
  if (!checkPower('supplier_evaluate', req, res)) return;
  const app = supplierApplications.find((a) => a.id === req.params?.id);
  if (!app) {
    res.status(404).json({ success: false, error: '登记申请不存在' });
    return;
  }
  // 四源分线：家族帽仅可裁决本源域申请（VEM→E/VYM→Y/VHM→H/VTM→T；VXM 全域）
  const govDomain = supplyGovernDomainOf(role);
  if (govDomain && app.domain !== govDomain) {
    res.status(403).json({ success: false, error: `四源分线治理：${role} 仅可裁决 ${govDomain} 源准入申请（本申请属 ${app.domain} 源）` });
    return;
  }
  if (app.status !== 'pending') {
    res.status(400).json({ success: false, error: '仅待评估申请可审核' });
    return;
  }
  const { action, rejectReason } = (req.body ?? {}) as { action?: 'approve' | 'reject'; rejectReason?: string };
  if (action === 'approve') {
    app.status = 'approved';
    app.rejectReason = undefined;
  } else if (action === 'reject') {
    if (!rejectReason?.trim()) {
      res.status(400).json({ success: false, error: '驳回须附原因（供给方据此重新提交）' });
      return;
    }
    app.status = 'rejected';
    app.rejectReason = rejectReason.trim();
  } else {
    res.status(400).json({ success: false, error: 'action 须为 approve 或 reject' });
    return;
  }
  ok(res, withSupplierNames(app));
});

// 供给方：名下货品管理列表
api.get('/supply/products/mine', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  if (!isSupplyHat(roleOf(user))) {
    res.status(403).json({ success: false, error: '仅供给方帽可管理供应商货品' });
    return;
  }
  ok(res, supplierProducts.filter((p) => p.supplierId === user.containerId));
});

// 四源治理：货品治理列表（违规下架用，客户不可见）（X-MARKET-ROLE-01：VXM 全域 + 家族本源域过滤；VDM 不越界）
api.get('/supply/products', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const role = roleOf(user);
  if (!isSupplyGovernHat(role)) {
    res.status(403).json({ success: false, error: '货品治理列表归四源治理（supply 面治理台）；market 经营治理（VDM）不参与' });
    return;
  }
  const govDomain = supplyGovernDomainOf(role);
  ok(res, supplierProducts.filter((p) => (govDomain ? p.domain === govDomain : true)));
});

// 供给方：上架货品（需云中心准入合格）
api.post('/supply/products', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  if (!checkPower('product_publish', req, res)) return;
  const role = roleOf(user);
  if (!isSupplyHat(role)) {
    res.status(403).json({ success: false, error: '仅供给方帽可上架货品' });
    return;
  }
  const app = supplierApplications.find((a) => a.supplierId === user.containerId);
  if (!app || app.status !== 'approved') {
    res.status(403).json({ success: false, error: '仅合格供应商可上架货品（先通过 VXM 云中心准入评估）' });
    return;
  }
  const booth = mySupplyBooth(user);
  if (!booth) {
    res.status(404).json({ success: false, error: '未找到名下供给实体铺' });
    return;
  }
  const { name, category, spec, priceCents, unit, stock } = (req.body ?? {}) as {
    name?: string; category?: string; spec?: string; priceCents?: number; unit?: string; stock?: number;
  };
  if (!name?.trim() || !category?.trim() || !priceCents || priceCents <= 0) {
    res.status(400).json({ success: false, error: '名称/品类/报价（分）为必填且报价须大于 0' });
    return;
  }
  const prod: SupplierProduct = {
    id: nextSupplierId('sp'), supplierId: user.containerId, boothId: booth.id, domain: booth.domain,
    name: name.trim(), category: category.trim(), spec: spec?.trim() ?? '',
    priceCents, unit: unit?.trim() || '件', stock: stock && stock > 0 ? Math.floor(stock) : 0, status: 'on',
  };
  supplierProducts.push(prod);
  ok(res, prod);
});

// 上架/下架：供给方本人切换；VXM 可治理下架违规货品（重新上架须由供给方操作）
api.post('/supply/products/:id/toggle', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const role = roleOf(user);
  const prod = supplierProducts.find((p) => p.id === req.params?.id);
  if (!prod) {
    res.status(404).json({ success: false, error: '货品不存在' });
    return;
  }
  const owner = isSupplyHat(role) && prod.supplierId === user.containerId;
  // 三权映射：owner 路径按目标状态选动作（下架→product_remove / 上架→product_publish）；治理路径放宽为治位帽；其余身份走必 deny 兜底
  if (owner) {
    const action = prod.status === 'on' ? 'product_remove' : 'product_publish';
    if (!checkPower(action, req, res, boothCodeOf(prod.boothId))) return;
  } else if (isSupplyGovernHat(role)) {
    // X-MARKET-ROLE-01 四源分线：家族帽仅可治理本源域货品（VEM→E/VYM→Y/VHM→H/VTM→T；VXM 全域）
    const govDomain = supplyGovernDomainOf(role);
    if (govDomain && prod.domain !== govDomain) {
      res.status(403).json({ success: false, error: `四源分线治理：${role} 仅可治理 ${govDomain} 源货品（本货品属 ${prod.domain} 源）` });
      return;
    }
    if (!checkPower('product_govern_remove', req, res, boothCodeOf(prod.boothId))) return;
  } else {
    if (!checkPower('product_remove', req, res, boothCodeOf(prod.boothId))) return;
  }
  if (!owner) {
    // VXM 治理动作：只能下架（违规治理），不可替供给方重新上架
    if (prod.status === 'on') {
      prod.status = 'off';
      ok(res, prod);
      return;
    }
    res.status(403).json({ success: false, error: '治理下架后重新上架须由供给方本人操作' });
    return;
  }
  prod.status = prod.status === 'on' ? 'off' : 'on';
  ok(res, prod);
});

// 治理下架（V*M 治理台调用）：三权映射 product_govern_remove（治位专属）；仅下架，不代供给方重新上架
api.post('/supply/products/:id/take-down', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const prod = supplierProducts.find((p) => p.id === req.params?.id);
  if (!prod) {
    res.status(404).json({ success: false, error: '货品不存在' });
    return;
  }
  if (!checkPower('product_govern_remove', req, res, boothCodeOf(prod.boothId))) return;
  // X-MARKET-ROLE-01 四源分线：家族帽仅可治理下架本源域货品（VXM 全域）
  const govDomain = supplyGovernDomainOf(roleOf(user));
  if (govDomain && prod.domain !== govDomain) {
    res.status(403).json({ success: false, error: `四源分线治理：${roleOf(user)} 仅可治理 ${govDomain} 源货品（本货品属 ${prod.domain} 源）` });
    return;
  }
  if (prod.status !== 'on') {
    res.status(403).json({ success: false, error: '货品已下架，重新上架须由供给方本人操作' });
    return;
  }
  prod.status = 'off';
  ok(res, prod);
});

// DU 采购商城：合格供应商 + 在架货品（仅 DU 经营线下发；客户/匿名 → 隔离提示）
api.get('/supply/mall', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  if (!isDUBuyer(user)) {
    res.status(403).json({ success: false, error: '采购商城仅对 DU 经营主体开放（客户界面信息隔离：全程不出现供给方名称/报价/产能）' });
    return;
  }
  const store = getStore();
  const approvedIds = new Set(supplierApplications.filter((a) => a.status === 'approved').map((a) => a.supplierId));
  const items: SupplyMallItem[] = supplierProducts
    .filter((p) => p.status === 'on' && approvedIds.has(p.supplierId))
    .map((p) => ({
      ...p,
      supplierName: containerById(p.supplierId)?.name ?? '',
      boothCode: store.booths.find((b) => b.id === p.boothId)?.code ?? '',
    }));
  ok(res, items);
});

api.get('/power/map', requireAuth, (_req: AuthReq, res) => {
  ok(res, marketPowerMap);
});
api.get('/power/audit', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const hat = normalizePowerHat(roleOf(user));
  // 治位帽（V*M/VXM）见全量审计；其余身份仅见本人（actor_user）动作留痕（X-MARKET-13：本人口径，含 denied 越权尝试）
  const isGovern = (HAT_POWER_BITS[hat] ?? []).includes('govern');
  const base = isGovern ? marketPowerAudit : marketPowerAudit.filter((a) => a.actor_user === user.hatId);
  // 可选筛选（X-MARKET-13）：action=动作码 / result=allowed|denied；可选时间窗 timeFrom/timeTo（毫秒，X-MARKET-14）；无参行为不变
  const query = req.query ?? {};
  const action = typeof query.action === 'string' ? query.action : '';
  const result = typeof query.result === 'string' ? query.result : '';
  const timeFrom = typeof query.timeFrom === 'string' && query.timeFrom !== '' ? Number(query.timeFrom) : 0;
  const timeTo = typeof query.timeTo === 'string' && query.timeTo !== '' ? Number(query.timeTo) : Number.MAX_SAFE_INTEGER;
  const from = Number.isFinite(timeFrom) ? timeFrom : 0;
  const to = Number.isFinite(timeTo) ? timeTo : Number.MAX_SAFE_INTEGER;
  const rows = base
    .filter((a) => (action ? a.action_code === action : true))
    .filter((a) => (result === 'allowed' || result === 'denied' ? a.result === result : true))
    .filter((a) => {
      const t = Date.parse(a.ts);
      return Number.isFinite(t) && t >= from && t <= to;
    });
  ok(res, rows);
});

// X-MARKET-14 治-管-办运行看板聚合（治位帽 only；数据同源 marketPowerAudit 审计表 + 供应商/货品业务 store）
api.get('/power/dashboard', requireAuth, (req: AuthReq, res) => {
  const hat = normalizePowerHat(roleOf(req.user!));
  const isGovern = (HAT_POWER_BITS[hat] ?? []).includes('govern');
  if (!isGovern) {
    res.status(403).json({ success: false, error: `三权运行看板属治位（云审批评估）查询，帽 ${hat} 无此权（需 VXM/VEM/VDM）` });
    return;
  }
  const now = Date.now();
  const d7 = now - 7 * 24 * 3600 * 1000;
  const d30 = now - 30 * 24 * 3600 * 1000;
  const allowedRows = marketPowerAudit.filter((a) => a.result === 'allowed');
  const volOf = (rows: MarketPowerAuditRow[]) => ({
    govern: rows.filter((a) => a.power_bit === 'govern').length,
    manage: rows.filter((a) => a.power_bit === 'manage').length,
    operate: rows.filter((a) => a.power_bit === 'operate').length,
  });
  const volume = volOf(allowedRows);
  const volume7d = volOf(allowedRows.filter((a) => { const t = Date.parse(a.ts); return Number.isFinite(t) && t >= d7; }));
  const volume30d = volOf(allowedRows.filter((a) => { const t = Date.parse(a.ts); return Number.isFinite(t) && t >= d30; }));

  // 审批时效：已裁决供应商申请（approved/rejected）的 createdAt → 最近一次 allowed 评估审计 ts
  const evaluateTs = allowedRows
    .filter((a) => a.action_code === 'supplier_evaluate')
    .map((a) => Date.parse(a.ts))
    .filter((t) => Number.isFinite(t))
    .sort((x, y) => x - y);
  const approveHours: number[] = [];
  const rejectHours: number[] = [];
  for (const app of supplierApplications) {
    if (app.status !== 'approved' && app.status !== 'rejected') continue;
    const created = Date.parse(app.createdAt);
    if (!Number.isFinite(created)) continue;
    const done = [...evaluateTs].reverse().find((t) => t >= created);
    if (done === undefined) continue;
    const hours = Math.max(0, Math.round(((done - created) / 3600000) * 10) / 10);
    if (app.status === 'approved') approveHours.push(hours);
    else rejectHours.push(hours);
  }
  const avgOf = (arr: number[]): number | null => (arr.length === 0 ? null : Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10);

  // 审计覆盖度：审计表出现过的动作数 / 三权映射写入口总数
  const auditedCodes = new Set(marketPowerAudit.map((a) => a.action_code));
  const coverage = {
    audited: auditedCodes.size,
    total: marketPowerMap.length,
    percent: marketPowerMap.length === 0 ? 0 : Math.round((auditedCodes.size / marketPowerMap.length) * 100),
  };

  // 待办队列：待评估申请 / 在架货品（可治理对象）/ 治理下架累计
  const todo = {
    pendingReviews: supplierApplications.filter((a) => a.status === 'pending').length,
    listedProducts: supplierProducts.filter((p) => p.status === 'on').length,
    governedCount: marketPowerAudit.filter((a) => a.action_code === 'product_govern_remove' && a.result === 'allowed').length,
  };

  ok(res, {
    volume,
    volume7d,
    volume30d,
    timeliness: {
      approveAvgHours: avgOf(approveHours),
      rejectAvgHours: avgOf(rejectHours),
      approveCount: approveHours.length,
      rejectCount: rejectHours.length,
    },
    coverage,
    todo,
    generatedAt: new Date().toISOString(),
  });
});

// X-Supply 独立路由域（X-SUPPLY-01 补充约束：/supply 前缀固定，域内路由整体迁出预留）
api.use('/supply', xSupply);

router.use('/api', api);
export default router;
