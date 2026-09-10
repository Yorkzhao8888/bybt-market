/**
 * X-MARKET-TI-05 用户教育训练（新手引导）—— 数据层（唯一口径）
 *
 * 纯前端展示层：不调任何 API、不收集用户输入、不改任何业务数据。
 * - 三套引导：四源供应商（EU/YU/HU/TU 共用模板，文案按源差异化）/ DU 经营者 / 客户（XU·CU）
 * - 每步三要素：做什么（what）/ 去哪个入口点（entry）/ 完成标准（done）
 * - 完成状态记录 localStorage（xm_tour_v1），首次登录自动弹出，可跳过、可重开
 * - 步骤口径与真实业务路径一致（X-MARKET-TI-04 全链路实证：认证通过 → 先开供给铺 → 才能供货上架）
 */
import type { WorkbenchKind } from './domain';

export type TourKind = 'supplier' | 'operator' | 'client';

export interface TourStep {
  key: string;
  title: string;
  /** 做什么 */
  what: string;
  /** 去哪个入口点 */
  entryLabel: string;
  entryPath: string;
  /** 完成标准 */
  done: string;
}

/** 四源差异化词汇（EU 物资 / YU 空间 / HU 人力 / TU 技术；DE 归并 E 线） */
const SUPPLY_TOUR_TERMS: Record<string, { label: string; goods: string }> = {
  E: { label: '物资', goods: '钢材 / 芯片 / 元器件' },
  DE: { label: '产品', goods: '成品 / 组合包' },
  Y: { label: '空间', goods: '厂房 / 仓储 / 办公位' },
  H: { label: '人力', goods: '产线工人 / 技术员 / 劳务' },
  T: { label: '技术', goods: '方案 / 授权 / 算力' },
};

export const supplyTourTermOf = (domainView: string | null | undefined) =>
  (domainView && SUPPLY_TOUR_TERMS[domainView]) || { label: '物资', goods: '货品 / 产能' };

/* ============ 三套分步引导内容 ============ */

/** 四源供应商套：注册申请 → 提交资质 → V*M 认证 → 开 Booth 铺面 → 供货上架 → 接收 DU 采购单 → 履约交付 */
const supplierSteps = (domainView: string | null | undefined): TourStep[] => {
  const t = supplyTourTermOf(domainView);
  return [
    {
      key: 'register',
      title: '注册申请',
      what: `以${t.label}供给帽身份进入供给集市，提交入驻登记（注册申请）。`,
      entryLabel: '供给集市 → 入驻登记',
      entryPath: '/supply',
      done: '入驻记录出现在「入驻记录」中，状态为待认证。',
    },
    {
      key: 'qualification',
      title: '提交资质',
      what: `在登记表中补齐单位信息与${t.label}资质 / 产能说明，确保字段完整。`,
      entryLabel: '供给集市 → 入驻登记表单',
      entryPath: '/supply',
      done: '资质信息完整提交成功，进入待认证队列。',
    },
    {
      key: 'certify',
      title: '平台认证（等待 / 通过）',
      what: '等待管家审批家族认证你的供给资质；被驳回可修改后重新提交。',
      entryLabel: '供给集市 → 入驻记录（查看认证状态）',
      entryPath: '/supply',
      done: '申请状态变为「已认证」，获得供货上架资格。',
    },
    {
      key: 'booth',
      title: '开 Booth 铺面',
      what: `认证通过后先开通${t.label}供给实体铺（供给铺是上架的前置条件）。`,
      entryLabel: '供给台 → 新开铺面（供给铺）',
      entryPath: '/supplier',
      done: '获得 Booth 铺码（如 Booth-E-xx），铺面在集市可见。',
    },
    {
      key: 'publish',
      title: '供货上架',
      what: `在名下供给铺上架可售货品 / 产能（如：${t.goods}）。`,
      entryLabel: '供给台 → 我的货品 → 新增货品',
      entryPath: '/supplier',
      done: '至少 1 个货品在架，可被商家采购。',
    },
    {
      key: 'receive',
      title: '接收商家采购单',
      what: '商家经营者从采购商城下单后，你会在交易单中收到采购单（供给方只与商家交易）。',
      entryLabel: '供给台 → 交易单',
      entryPath: '/orders',
      done: '收到待履约采购单，进入履约准备。',
    },
    {
      key: 'deliver',
      title: '履约交付',
      what: '按单备货交付，确认交付回执（交付回执 = 责任转移点）。',
      entryLabel: '供给台 → 交易单详情',
      entryPath: '/orders',
      done: '订单状态流转至「履约中 / 已完成」。',
    },
  ];
};

/** DU 经营者套：进入经营台 → 浏览供给四源集市 → 发起采购 → 收货/使用 → 商品上架自身铺 → 服务客户 */
const operatorSteps = (hatRole: string | null | undefined): TourStep[] => {
  const isExecHat = !!hatRole && hatRole !== 'DU';
  return [
    {
      key: 'desk',
      title: '进入经营台',
      what: '打开经营台查看 KPI 总览、名下铺面与待办（待报价 / 待审批 / 待履约）。',
      entryLabel: '顶栏 → 经营台',
      entryPath: '/operator',
      done: '能看到经营总览与名下铺面列表。',
    },
    {
      key: 'browse',
      title: '浏览供给四源集市',
      what: '在采购商城按源（物资 / 空间 / 人力 / 技术）浏览合格供应商的在架货品。',
      entryLabel: '顶栏 → 采购商城（商家经营号专属）',
      entryPath: '/supply-mall',
      done: '能按源筛选并查看在架货品详情。',
    },
    {
      key: 'purchase',
      title: '发起采购',
      what: '选好货品一键下单生成采购单；单笔超 5000 元会升级平台治理审批（通过后生效）。',
      entryLabel: '采购商城 → 货品卡 → 下单',
      entryPath: '/supply-mall',
      done: '采购单生成（待治理审批或待履约）。',
    },
    {
      key: 'receive',
      title: '收货 / 使用',
      what: '在交易单跟踪供货方履约进度，收货并投入使用 / 生产。',
      entryLabel: '顶栏 → 交易单',
      entryPath: '/orders',
      done: '采购单履约完成，货品 / 产能到位。',
    },
    {
      key: 'resell',
      title: '商品上架自身铺',
      what: '把到手的货品 / 产能挂到你的商家铺面，对客户可见可售。',
      entryLabel: isExecHat ? '经营台 → 铺面 / 货品（按执行帽作业）' : '经营台 → 新开铺面 / 我的铺面',
      entryPath: '/operator',
      done: '商家铺有在架货品，客户在市场 / 商城可见。',
    },
    {
      key: 'serve',
      title: '服务客户',
      what: '客户在 Market 询价 → 你报价 → 签约 → 下单，形成 B2B 交易闭环。',
      entryLabel: '顶栏 → Market（询价报价面板）',
      entryPath: '/market',
      done: '询价单走完报价 / 签约 / 下单闭环。',
    },
  ];
};

/** 客户套：浏览市场 → 下单 → 收货/评价（XU 走 B 端 Market，CU 走 C 端 Mall） */
const clientSteps = (hatRole: string | null | undefined): TourStep[] => {
  const isCU = hatRole === 'CU';
  return [
    {
      key: 'browse',
      title: isCU ? '浏览商城' : '浏览市场',
      what: isCU
        ? '在 Mall 商城浏览商品卡（含准入徽章与店铺归属），进入店铺看详情。'
        : '在市场按五大分类挑选商家经营铺，查看合格供给与在架货品。',
      entryLabel: isCU ? '顶栏 → Mall' : '顶栏 → Market',
      entryPath: isCU ? '/mall' : '/market',
      done: '找到目标商品 / 铺面。',
    },
    {
      key: 'order',
      title: '下单',
      what: isCU
        ? '点「立即购买」在确认弹层核对单价与数量后提交。'
        : '走企业采购流程：询价 → 商家报价 → 签合同 → 下单。',
      entryLabel: isCU ? '商品卡 → 立即购买' : 'Market → 发起询价',
      entryPath: isCU ? '/mall' : '/market',
      done: '交易单生成，可在「交易单」查看。',
    },
    {
      key: 'track',
      title: '收货 / 评价',
      what: '在交易单跟踪履约状态，交付完成后收货并评价。',
      entryLabel: '顶栏 → 交易单',
      entryPath: '/orders',
      done: '订单状态「已完成」。',
    },
  ];
};

export const tourStepsOf = (
  kind: TourKind,
  opts: { domainView?: string | null; hatRole?: string | null } = {},
): TourStep[] => {
  if (kind === 'supplier') return supplierSteps(opts.domainView);
  if (kind === 'operator') return operatorSteps(opts.hatRole);
  return clientSteps(opts.hatRole);
};

/** 角色识别：按工作台类别分发引导；治理类（govern/governSupply）返回 null → 弹三选一入口 */
export const tourKindOf = (hatRole: string | null | undefined, wb: WorkbenchKind): TourKind | null =>
  wb === 'supplier' ? 'supplier' : wb === 'operator' ? 'operator' : wb === 'client' ? 'client' : null;

/* ============ 本地完成状态（localStorage，按账号 hatId 隔离） ============ */

const TOUR_KEY = 'xm_tour_v1';

export interface TourRecord {
  status: 'done' | 'skipped';
  kind: TourKind | null;
  ts: number;
}

export const readTourState = (uid: string | null | undefined): TourRecord | null => {
  try {
    const raw = localStorage.getItem(TOUR_KEY);
    if (!raw || !uid) return null;
    const map = JSON.parse(raw) as Record<string, TourRecord>;
    return map[uid] ?? null;
  } catch {
    return null;
  }
};

export const writeTourState = (uid: string | null | undefined, status: 'done' | 'skipped', kind: TourKind | null): void => {
  try {
    if (!uid) return;
    const raw = localStorage.getItem(TOUR_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, TourRecord>) : {};
    map[uid] = { status, kind, ts: Date.now() };
    localStorage.setItem(TOUR_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

/** 重开引导事件（Header「引导」按钮触发；重开不重置完成记录，完成后仍记 done） */
export const TOUR_OPEN_EVENT = 'xm-onboarding-open';
export const dispatchTourOpen = (): void => {
  try {
    window.dispatchEvent(new CustomEvent(TOUR_OPEN_EVENT));
  } catch {
    /* ignore */
  }
};

/** 三选一入口（未识别角色：治理类 / 未知帽自选身份体验引导） */
export interface TourIdentityChoice {
  kind: TourKind;
  big: string;
  sys: string;
  desc: string;
}

export const TOUR_IDENTITY_CHOICES: TourIdentityChoice[] = [
  { kind: 'supplier', big: '供货商', sys: '四源供给帽 YU/EU/HU/TU', desc: '入驻登记 → 认证 → 开铺上架 → 交付' },
  { kind: 'operator', big: '店主', sys: '经营者 DU / 执行帽 D*X', desc: '采购商城 → 采购 → 上架 → 服务客户' },
  { kind: 'client', big: '采购方 · 买家', sys: '企业客户 XU / 个人客户 CU', desc: '浏览市场 → 下单 → 收货' },
];
