// X-Market 五域集市系统 · 后端 Express API 路由
// X-MARKET-05：两套独立系统（Market 铺面层 / Booth 实体作业层）+ 三方链路 + Booth 权属
//   Market：五大专业市场、铺面、询价/报价/合同/订单、DU 经营台、运营方治理（不经营/不持资源/不执行作业）
//   Booth 实体：FAB/WH/DL/SVC/LAB 五作业系统（占位，另一窗口实现），铺面仅引用

import { Router } from 'express';
import {
  DOMAINS, domainByCode, familyOfDomain, marketMetaOf, PUBLIC_MARKETS,
  JOB_SYSTEMS, OPERATOR_DUTIES, boothOwnerRole, duExecHatOf, BOOTH_OF_EXEC_HAT, MALL_EXEC_HAT,
} from '../domainConfig';
import {
  getStore, nextSeq, containerById,
  inquiries, governanceCases, nextOrderCode,
  type Inquiry,
} from '../store';
import { createToken, getUserByToken, revokeToken, DEV_PASSWORD } from '../auth';
import type { DemoAccount, DomainCode, HatRole, Order, SessionUser, Booth } from '../../shared/types';
import { CONTAINER_TYPE_LABEL, UNIT_ROLE_LABEL, HAT_LINE_OF } from '../../shared/types';

const router = Router();
const api = Router();

function ok(res: { json: (v: unknown) => void }, data: unknown): void {
  res.json({ success: true, data });
}

type AuthReq = { headers: { authorization?: string }; user?: SessionUser; body?: unknown; query?: Record<string, unknown>; params?: Record<string, string> };
type AuthRes = { status: (n: number) => { json: (v: unknown) => void }; json: (v: unknown) => void };

function requireAuth(req: AuthReq, res: AuthRes, next: () => void): void {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const user = token ? getUserByToken(token) : null;
  if (!user) {
    res.status(401).json({ success: false, error: '未登录或会话已过期' });
    return;
  }
  req.user = user;
  next();
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
/** 当前会话帽角色（兜底 SU，理论上登录后必有） */
const roleOf = (user: SessionUser): HatRole => user.hatRole ?? 'OU';
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
  { id: 'du-hehe', entry: 'B', hatRole: 'DU', containerId: 'c-du', hatId: 'u-du1', label: '合和经营 · 平台直营 DU', note: '以 DU 身份经营 5 类经营实体铺（DY/DH/DT/DE/DC），执行帽 DYX/DHX/DTX/DEX/DCX 分管', domainView: 'DE', boothTarget: 'b-de1' },
  { id: 'du-fengshi', entry: 'B', hatRole: 'DU', containerId: 'c-fs', hatId: 'u-du2', label: '丰时经营 · 加盟 DU', note: '加盟 DU（Y/H/DE 可加盟），经营 Booth-DH', domainView: 'H', boothTarget: 'b-dh2' },
  // B 端客户 XU（买家，走 Market）
  { id: 'xu-huadong', entry: 'B', hatRole: 'XU', containerId: 'c-gou', hatId: 'u-xu1', label: '华东区采购办 · 客户 XU', note: 'B 端采购客户（走 Market，企业采购/询价报价）', domainView: 'E' },
  // 平台运营方 V*M
  { id: 'vdm', entry: 'B', hatRole: 'VDM', containerId: 'c-plat', hatId: 'u-vdm1', label: '产品市场运营长 VDM', note: '平台运营管理方·产品市场（DMX 项目线），市场秩序/规则/Booth 系统供给', domainView: 'DE' },
];
const DEMO_ALIAS: Record<string, DemoAccount> = Object.fromEntries(demoAccounts.map((a) => [a.id, a]));
// 帽角色路由 → 演示账号（快捷）
const DEMO_ROUTE: Partial<Record<HatRole, DemoAccount>> = {
  EU: demoAccounts[3], HU: demoAccounts[4], TU: demoAccounts[5], YU: demoAccounts[6],
  DU: demoAccounts[7], XU: demoAccounts[9], VDM: demoAccounts[10],
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
api.get('/market/booths', (req, res) => {
  const store = getStore();
  const domain = (req.query?.domain as string) || null;
  const kind = (req.query?.kind as string) || null; // supply | du
  let list = [...store.booths];
  if (domain) list = list.filter((b) => b.domain === domain);
  if (kind === 'supply' || kind === 'du') list = list.filter((b) => b.kind === kind);
  ok(res, list.map(decorateBooth(store)));
});

api.get('/market/booths/:id', (req, res) => {
  const store = getStore();
  const booth = store.booths.find((b) => b.id === req.params?.id);
  if (!booth) {
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

/** 新开 Booth（B 端经营）：按专业市场约束铺主帽与权属（P4/P5）
 *  Y/H：供给帽(YU/HU) 或 DU 经营均可；E/T：供给帽(EU/TU) 或平台直营 DU（无加盟）；DE：DU 直营/加盟。
 *  供给方实体铺归供给帽；DU 经营实体铺归 DU + 合法执行帽；跨主体选帽拒绝。 */
api.post('/market/booths', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
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
  if (!can(user, 'b2b_purchase')) {
    res.status(403).json({ success: false, error: '仅 B 端采购客户（XU）可发起企业询价' });
    return;
  }
  const { boothId, domain, title, detail } = (req.body ?? {}) as { boothId?: string; domain?: DomainCode; title?: string; detail?: string };
  const store = getStore();
  const booth = store.booths.find((b) => b.id === boothId);
  if (!booth) {
    res.status(404).json({ success: false, error: '目标铺面不存在' });
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
  if (!can(user, 'operate_booth')) {
    res.status(403).json({ success: false, error: '仅经营/供给方可报价' });
    return;
  }
  const inq = inquiries.find((i) => i.id === req.params?.id);
  if (!inq) { res.status(404).json({ success: false, error: '询价单不存在' }); return; }
  const { quoteCents, quoteNote } = (req.body ?? {}) as { quoteCents?: number; quoteNote?: string };
  inq.status = 'quoted';
  inq.quoteCents = quoteCents ?? 0;
  inq.quoteNote = quoteNote ?? '';
  ok(res, inq);
});
api.post('/market/inquiries/:id/contract', requireAuth, (req: AuthReq, res) => {
  const inq = inquiries.find((i) => i.id === req.params?.id);
  if (!inq) { res.status(404).json({ success: false, error: '询价单不存在' }); return; }
  if (inq.status !== 'quoted') { res.status(400).json({ success: false, error: '请先报价再签合同' }); return; }
  inq.status = 'contracted';
  inq.contractNo = `CT-${inq.code.slice(4)}`;
  ok(res, inq);
});

/* ============ 运营治理（P7，V*M 运营方骨架） ============ */
api.get('/govern/cases', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const d = marketMetaOf(user.domainView ?? null);
  const line = lineOf(user);
  const role = roleOf(user);
  // 运营方见管辖域；产品市场运营长(VDM) 兼看产品；其余平台运营长见本域
  const list = line === 'admin'
    ? governanceCases.filter((g) => g.opRole === role || role === 'VDM')
    : [];
  ok(res, { cases: list, duties: OPERATOR_DUTIES, domain: d?.marketName ?? null });
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
    // 运营方：全局总账
  } else if (role === 'DU' || line === 'exec' || line === 'supply') {
    // DU 经营主体/执行/供给：见名下多店
    const myBoothIds = new Set(
      store.booths
        .filter((b) => b.operatorContainerId === user.containerId || b.ownerUnitId === user.hatId || line === 'supply')
        .map((b) => b.id),
    );
    list = list.filter((o) => o.sellerContainerId === user.containerId || (o.boothId !== null && myBoothIds.has(o.boothId)));
  } else {
    // 客户（CU/XU/OU 等下游）：只见自己下单
    list = list.filter((o) => o.buyerContainerId === user.containerId);
  }
  ok(res, list);
});

api.post('/orders', requireAuth, (req: AuthReq, res) => {
  const user = req.user!;
  const { boothId, listingId, amountCents, side } = (req.body ?? {}) as { boothId?: string; listingId?: string; amountCents?: number; side?: 'C' | 'B' };
  const store = getStore();
  const booth = store.booths.find((b) => b.id === boothId);
  if (!booth) {
    res.status(404).json({ success: false, error: 'Booth 不存在' });
    return;
  }
  // 客户界面校验：DCX/Mall 仅 CU；其余 Market 面 XU
  const execRole = store.units.find((u) => u.id === booth.execUnitId)?.role;
  const effSide: 'C' | 'B' = side ?? (execRole === 'DCX' ? 'C' : 'B');
  if (effSide === 'C' && roleOf(user) !== 'CU') {
    res.status(403).json({ success: false, error: 'Mall C 端门店仅 CU 自然人客户下单；企业采购请走 Market 询价' });
    return;
  }
  const listing = listingId ? store.listings.find((l) => l.id === listingId) : undefined;
  const amount = amountCents ?? listing?.priceCents ?? 0;
  const d = DOMAINS.find((x) => x.code === booth.domain)!;
  const tradeCode = effSide === 'C' ? 'C' : d.tradeCode;
  const family = effSide === 'C' ? 'C' : familyOfDomain(booth.domain);
  const id = nextSeq('order');
  const code = nextOrderCode(tradeCode, family);
  const order: Order = {
    id, code, family, side: effSide, boothId: boothId ?? null, listingId: listingId ?? null,
    buyerContainerId: user.containerId, sellerContainerId: booth.operatorContainerId,
    tradeCode, status: 'pending', amountCents: amount,
    note: effSide === 'B' ? `企业采购（${d.marketTitle}市场，${booth.kind === 'du' ? booth.code : (d.duBoothCode ?? booth.code) + ' 经营承接'}）` : undefined,
  };
  store.orders.push(order);
  // B2B 询价转下单
  const { inquiryId } = (req.body ?? {}) as { inquiryId?: string };
  if (inquiryId) {
    const inq = inquiries.find((i) => i.id === inquiryId);
    if (inq) { inq.status = 'ordered'; inq.contractNo = inq.contractNo ?? code; }
  }
  ok(res, order);
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
  ]);
});

// 兼容旧别名
router.use('/api', api);
export default router;
