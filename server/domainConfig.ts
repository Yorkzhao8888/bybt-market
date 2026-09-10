// X-Market 五域集市系统 · 领域常量配置
// X-MARKET-05 三方链路与 Booth 权属定版：
//   两套独立系统 —— Market（铺面层/交易平台）+ Booth 实体（作业层/经营实体）
//   价值链三层 —— 供给方 Booth-Y/E/H/T（源头产能）→ DU 经营实体 Booth-DY/DH/DT/DE/DC（组织经营）→ Market/Mall（客户界面）
//   DU 唯一经营主体，下辖五执行帽 DYX/DHX/DTX/DEX/DCX；取消 YDU/HDU/EDU/TDU 独立执业语义。

import type { DomainCode, DomainMeta, JobSystem, OrderFamily, HatRole, BoothKind } from '../shared/types';

/** 五域配置（X-MARKET-05 定版）。
 * supplyBooth/supplyOwner：供给方实体铺（源头产能）。
 * duBooth/duExecCode：DU 经营实体铺 + 一一对应执行帽。
 * clientFace：客户界面（Y/E/H/T/DE 走 Market=XU；DC 走 Mall=CU）。
 * canFranchise：Y/H/DE 可加盟；E/T 仅平台直营。 */
export const DOMAINS: DomainMeta[] = [
  {
    code: 'E',
    name: '物资',
    marketName: 'E-Market',
    unitCode: 'EU',
    supplyBoothCode: 'Booth-E',
    duBoothCode: 'Booth-DE',
    duExecCode: 'DEX',
    marketTag: 'E_MARKET',
    mode: 'EU(源头) → DU·Booth-DE(DEX 经营) → Market',
    tradeCode: 'EX',
    color: '#C27A1B',
    description: '通货市场：物料/商品/存货，供给方 EU 实体铺产源头产能，DU 经营实体 DEX 承接组织经营。',
    marketTitle: '通货',
    opRole: 'VEM',
    projectLine: 'EMX',
    ownerRoles: ['EU', 'DU'],
    hasFranchise: false,
    operationsFamily: 'WH',
    clientFace: 'market',
    duCanFranchise: false,
  },
  {
    code: 'H',
    name: '人力',
    marketName: 'H-Market',
    unitCode: 'HU',
    supplyBoothCode: 'Booth-H',
    duBoothCode: 'Booth-DH',
    duExecCode: 'DHX',
    marketTag: 'H_MARKET',
    mode: 'HU(源头) → DU·Booth-DH(DHX 经营) → Market',
    tradeCode: 'HX',
    color: '#E4572E',
    description: '人资市场：人力/技能服务，供给方 HU 实体铺持源头人力，DU 经营实体 DHX 组织派单。',
    marketTitle: '人资',
    opRole: 'VHM',
    projectLine: 'HMX',
    ownerRoles: ['HU', 'DU'],
    hasFranchise: true,
    operationsFamily: 'SVC',
    clientFace: 'market',
    duCanFranchise: true,
  },
  {
    code: 'Y',
    name: '空间',
    marketName: 'Y-Market',
    unitCode: 'YU',
    supplyBoothCode: 'Booth-Y',
    duBoothCode: 'Booth-DY',
    duExecCode: 'DYX',
    marketTag: 'Y_MARKET',
    mode: 'YU(源头) → DU·Booth-DY(DYX 经营) → Market',
    tradeCode: 'YX',
    color: '#17A290',
    description: '智场市场：场地/席位/空间租赁（保留捷租 Jezoom 子品牌），供给方 YU 实体铺持源头空间，DU 经营实体 DYX 组织撮合。',
    marketTitle: '智场',
    opRole: 'VYM',
    projectLine: 'YMX',
    ownerRoles: ['YU', 'DU'],
    hasFranchise: true,
    operationsFamily: 'LAB',
    clientFace: 'market',
    duCanFranchise: true,
  },
  {
    code: 'T',
    name: '技术',
    marketName: 'T-Market',
    unitCode: 'TU',
    supplyBoothCode: 'Booth-T',
    duBoothCode: 'Booth-DT',
    duExecCode: 'DTX',
    marketTag: 'T_MARKET',
    mode: 'TU(源头) → DU·Booth-DT(DTX 经营) → Market',
    tradeCode: 'TX',
    color: '#4A5FD5',
    description: '技术市场：算法/算力/IP，供给方 TU 实体铺持源头技术，DU 经营实体 DTX 承接技术经营，Order-T 经 Booth-DT 汇聚。',
    marketTitle: '技术',
    opRole: 'VTM',
    projectLine: 'TMX',
    ownerRoles: ['TU', 'DU'],
    hasFranchise: false,
    operationsFamily: 'LAB',
    clientFace: 'market',
    duCanFranchise: false,
  },
  {
    code: 'DE',
    name: '门店产能',
    marketName: 'DE-Market',
    unitCode: 'DU',
    supplyBoothCode: '',
    duBoothCode: 'Booth-DC',
    duExecCode: 'DCX',
    marketTag: 'DE_MARKET',
    mode: 'DU(产品产能直营/加盟) → Booth-DC(DCX 商城/Mall)',
    tradeCode: 'D-OFD',
    color: '#D6366E',
    description: '产品市场：门店服务与产品产能。Booth-DC/DCX 面向 Mall C 端（B2C）；Booth-DE/DEX 归 E 域通货经营。',
    marketTitle: '产品',
    opRole: 'VDM',
    projectLine: 'DMX',
    ownerRoles: ['DU'],
    hasFranchise: true,
    operationsFamily: 'SVC',
    clientFace: 'mall',
    duCanFranchise: true,
  },
];

export const domainByCode = (code: string): DomainMeta =>
  DOMAINS.find(d => d.code === code) ?? DOMAINS[0];

/** Booth-DC（C 端门店）特殊执行帽：DCX 在 Mall；其余 DU 经营实体 DEX/DYX/DHX/DTX 在 Market。 */
export const MALL_EXEC_HAT: HatRole = 'DCX';

/** Booth kind → 权属帽：supply 实体铺归供给帽；du 经营实体铺归 DU。 */
export const boothOwnerRole = (domain: DomainCode, kind: BoothKind): HatRole => {
  const d = domainByCode(domain);
  return kind === 'supply' ? (d.unitCode as HatRole) : 'DU';
};

/** 域 → DU 经营执行帽（DE 域市场面 DEX；C 端 DCX） */
export const duExecHatOf = (domain: DomainCode): HatRole =>
  domainByCode(domain).duExecCode as HatRole;

/** 执行帽 → 对应 Booth code（一一对应） */
export const BOOTH_OF_EXEC_HAT: Partial<Record<HatRole, string>> = {
  DYX: 'Booth-DY', DHX: 'Booth-DH', DTX: 'Booth-DT', DEX: 'Booth-DE', DCX: 'Booth-DC',
};

/** 域交易码 → 订单族（D-OFD 归 D 族；EX→E, HX→H, YX→Y, TX→T） */
export const ORDER_FAMILY_OF_TRADECODE: Record<string, OrderFamily> = {
  EX: 'E', HX: 'H', YX: 'Y', TX: 'T', 'D-OFD': 'D',
};

/** 域 → 订单族（Market 采购按域；Mall C端归 C 族） */
export const familyOfDomain = (domain: DomainCode): OrderFamily =>
  domain === 'DE' ? 'D' : (domain as OrderFamily);

/** 五大作业系统（铺主"拎包经营"内置赋能）。
 * X-MARKET-05：归 Booth 实体系统（作业层）；Market 铺面层仅"引用展示"，不执行作业。 */
export const JOB_SYSTEMS: { code: JobSystem['code']; label: string; scene: string }[] = [
  { code: 'FAB', label: '制造', scene: '生产/制作作业' },
  { code: 'WH', label: '仓储', scene: '库存/仓配作业' },
  { code: 'DL', label: '配送', scene: '物流/履约配送' },
  { code: 'SVC', label: '服务', scene: '服务/履约作业' },
  { code: 'LAB', label: '实验', scene: '研发/测试实验' },
];

/** 平台运营方 V*M 五大职责（市场秩序/规则/Booth 系统供给） */
export const OPERATOR_DUTIES = ['市场秩序建设', '规则制定', '专业 Booth 系统供给'];

/** 五大专业市场（主视角），按 Y/E/H/T/DE 顺序 */
export const PUBLIC_MARKETS: DomainCode[] = ['Y', 'E', 'H', 'T', 'DE'];

export const marketMetaOf = (d: DomainCode | null) =>
  d ? DOMAINS.find((x) => x.code === d) ?? null : null;

/** X-MARKET-ROLE-01 治理分线（A 批）：V*M 四源家族 → 本源域（VEM→E / VYM→Y / VHM→H / VTM→T）；
 *  VMX 云中心统筹四源全域；VDM 归 market 经营治理（/govern），不入四源治理面（信息隔离）。 */
export const GOVERN_SUPPLY_DOMAIN_OF: Partial<Record<HatRole, DomainCode>> = {
  VEM: 'E',
  VYM: 'Y',
  VHM: 'H',
  VTM: 'T',
};

/** 四源治理帽（supply 面治理席位：VMX 统筹 + 四家族分源；VDM 不在内） */
export const isSupplyGovernHat = (hat: HatRole | null): boolean =>
  hat === 'VMX' || hat === 'VEM' || hat === 'VHM' || hat === 'VYM' || hat === 'VTM';

/** 四源家族治理域（VMX 统筹返回 null 表示全域；VDM/其他帽返回 null） */
export const supplyGovernDomainOf = (hat: HatRole | null): DomainCode | null =>
  hat ? GOVERN_SUPPLY_DOMAIN_OF[hat] ?? null : null;
