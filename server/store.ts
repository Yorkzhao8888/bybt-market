// X-Market 五域集市系统 · 内存数据存储（演示开发版）
// X-MARKET-05：两套系统 + 三方链路 + Booth 权属定版
//   容器(主体) → 帽(身份) → 域角色(标签) → Booth 实体(作业层) / 交易对象(铺面层)

import type { Container, Unit, Booth, Order, Listing } from '../shared/types';

/* ============ 容器（主体） ============ */
export const containers: Container[] = [
  { id: 'c-xl', type: 'XHPZ', name: '消费者·小林', region: '华东', credit: 80 },
  { id: 'c-may', type: 'XHPZ', name: '消费者·阿May', region: '华南', credit: 78 },
  { id: 'c-hf', type: 'XEPZ', name: '恒丰供应链', region: '华东', credit: 90 },
  // 供给方实体（源头产能）
  { id: 'c-qc', type: 'XEPZ', name: '启辰物资', region: '华东', credit: 92, domainTag: 'E_MARKET' },
  { id: 'c-rs', type: 'XHPZ', name: '任仕人力服务', region: '华北', credit: 85, domainTag: 'H_MARKET' },
  { id: 'c-cy', type: 'XEPZ', name: '驰远智联云仓', region: '华东', credit: 95, domainTag: 'T_MARKET' },
  { id: 'c-yj', type: 'XEPZ', name: '捷租·云间', region: '华南', credit: 91, domainTag: 'Y_MARKET' },
  // DU 经营实体（唯一经营主体，平台直营/加盟，一个 DU 可开多店）
  { id: 'c-du', type: 'XEPZ', name: '合和经营(平台直营)', region: '全国', credit: 96, domainTag: 'DE_MARKET' },
  { id: 'c-fs', type: 'XEPZ', name: '丰时经营(加盟)', region: '华西', credit: 88, domainTag: 'H_MARKET' },
  // 平台运营方（V*M 挂平台容器）
  { id: 'c-plat', type: 'XOPZ', name: 'X-Market 平台运营', region: '全国', credit: 99 },
  // B 端客户（XU 企业采购）
  { id: 'c-gou', type: 'XEPZ', name: '华东区采购办', region: '华东', credit: 89 },
];

/* ============ 帽（身份） ============ */
export const units: Unit[] = [
  // —— C 端顾客帽 ——
  { id: 'u-cu1', code: 'CU-XL', name: '小林', role: 'CU', side: 'C', containerId: 'c-xl', domainTags: [], tier: 'L1', credit: 80 },
  { id: 'u-cu2', code: 'CU-MAY', name: '阿May', role: 'CU', side: 'C', containerId: 'c-may', domainTags: [], tier: 'L1', credit: 78 },
  { id: 'u-op1', code: 'OU-HF', name: '恒丰·组织需求', role: 'OU', side: 'B', containerId: 'c-hf', domainTags: [], tier: 'L2', credit: 90 },
  // —— 供给方帽（源头产能，各持供给实体铺）——
  { id: 'u-eu1', code: 'EU-QC', name: '启辰物资', role: 'EU', side: 'B', containerId: 'c-qc', domainTags: ['E_MARKET'], tier: 'L2', credit: 92 },
  { id: 'u-hu1', code: 'HU-RS', name: '任仕人力服务', role: 'HU', side: 'B', containerId: 'c-rs', domainTags: ['H_MARKET'], tier: 'L2', credit: 85 },
  { id: 'u-tu1', code: 'TU-CY', name: '驰远智联云仓', role: 'TU', side: 'B', containerId: 'c-cy', domainTags: ['T_MARKET'], tier: 'L3', credit: 95 },
  { id: 'u-yu1', code: 'YU-YJ', name: '捷租·云间', role: 'YU', side: 'B', containerId: 'c-yj', domainTags: ['Y_MARKET'], tier: 'L3', credit: 91 },
  // —— DU 唯一经营主体（经营帽），一个 DU 开多店 ——
  { id: 'u-du1', code: 'DU-HH', name: '合和经营(直营)', role: 'DU', side: 'B', containerId: 'c-du', domainTags: ['Y_MARKET', 'E_MARKET', 'H_MARKET', 'T_MARKET', 'DE_MARKET'], tier: 'L3', credit: 96 },
  { id: 'u-du2', code: 'DU-FS', name: '丰时经营(加盟)', role: 'DU', side: 'B', containerId: 'c-fs', domainTags: ['H_MARKET', 'Y_MARKET', 'DE_MARKET'], tier: 'L2', credit: 88 },
  // DU 经营实体五执行帽（DX 系，一一对应 Booth-DY/DH/DT/DE/DC）
  { id: 'u-dyx', code: 'DYX-HH', name: '合和·空间经营执行', role: 'DYX', side: 'B', containerId: 'c-du', domainTags: ['Y_MARKET'], tier: 'L2', credit: 93, dispatch: true },
  { id: 'u-dhx', code: 'DHX-HH', name: '合和·人力经营执行', role: 'DHX', side: 'B', containerId: 'c-du', domainTags: ['H_MARKET'], tier: 'L2', credit: 90, dispatch: true },
  { id: 'u-dtx', code: 'DTX-HH', name: '合和·技术经营执行', role: 'DTX', side: 'B', containerId: 'c-du', domainTags: ['T_MARKET'], tier: 'L3', credit: 94 },
  { id: 'u-dex', code: 'DEX-HH', name: '合和·产品经营执行', role: 'DEX', side: 'B', containerId: 'c-du', domainTags: ['DE_MARKET', 'E_MARKET'], tier: 'L2', credit: 92 },
  { id: 'u-dcx', code: 'DCX-HH', name: '合和·门店经营执行', role: 'DCX', side: 'C', containerId: 'c-du', domainTags: ['DE_MARKET'], tier: 'L2', credit: 93, dispatch: true },
  { id: 'u-dhx2', code: 'DHX-FS', name: '丰时·人力经营执行', role: 'DHX', side: 'B', containerId: 'c-fs', domainTags: ['H_MARKET'], tier: 'L2', credit: 86 },
  // —— B 端客户帽 XU（买家，按域隔离）——
  { id: 'u-xu1', code: 'XU-GOU', name: '华东区采购办·客户', role: 'XU', side: 'B', containerId: 'c-gou', domainTags: ['E_MARKET', 'T_MARKET', 'H_MARKET'], tier: 'L2', credit: 89 },
  { id: 'u-xu2', code: 'XU-CY', name: '驰远·企业采购', role: 'XU', side: 'B', containerId: 'c-cy', domainTags: ['T_MARKET'], tier: 'L2', credit: 90 },
  // —— 平台运营管理方 V*M（挂平台容器）——
  { id: 'u-vem1', code: 'VEM-PLAT', name: '通货市场运营长', role: 'VEM', side: 'B', containerId: 'c-plat', domainTags: ['E_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vhm1', code: 'VHM-PLAT', name: '人资市场运营长', role: 'VHM', side: 'B', containerId: 'c-plat', domainTags: ['H_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vym1', code: 'VYM-PLAT', name: '智场市场运营长', role: 'VYM', side: 'B', containerId: 'c-plat', domainTags: ['Y_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vtm1', code: 'VTM-PLAT', name: '技术市场运营长', role: 'VTM', side: 'B', containerId: 'c-plat', domainTags: ['T_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vdm1', code: 'VDM-PLAT', name: '产品市场运营长', role: 'VDM', side: 'B', containerId: 'c-plat', domainTags: ['DE_MARKET'], tier: 'L3', credit: 99 },
];

/* ============ Booth 实体（作业层；Market 铺面引用） ============ */
export const booths: Booth[] = [
  // —— 供给方实体铺 ——
  { id: 'b-e1', code: 'Booth-E-01', domain: 'E', kind: 'supply', name: '启辰·工业物资铺', ownerUnitId: 'u-eu1', operatorContainerId: 'c-qc', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '钢材/五金/工业耗材现货直供（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 2 },
  { id: 'b-e2', code: 'Booth-E-02', domain: 'E', kind: 'supply', name: '启辰·MRO 集采铺', ownerUnitId: 'u-eu1', operatorContainerId: 'c-qc', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: 'MRO 工业辅料集采（铺面层展示）', backDesc: 'Booth 实体·WH/SVC 作业系统（作业层）', status: 'open', rating: 4.6, listingCount: 1 },
  { id: 'b-h1', code: 'Booth-H-01', domain: 'H', kind: 'supply', name: '任仕·人力派遣铺', ownerUnitId: 'u-hu1', operatorContainerId: 'c-rs', chain: 'source', mode: 'HU → Booth-H（源头人力）', frontDesc: '产线/仓储人力，按日按周（铺面层展示）', backDesc: 'Booth 实体·SVC 派单作业系统（作业层）', status: 'open', rating: 4.7, listingCount: 2 },
  { id: 'b-t1', code: 'Booth-T-01', domain: 'T', kind: 'supply', name: '驰远·云仓 SaaS 铺', ownerUnitId: 'u-tu1', operatorContainerId: 'c-cy', chain: 'source', mode: 'TU → Booth-T（源头技术）', frontDesc: '云仓/调度 SaaS 订阅与定制（铺面层展示）', backDesc: 'Booth 实体·LAB 研发作业系统（作业层）', status: 'open', rating: 4.9, listingCount: 2 },
  { id: 'b-y1', code: 'Booth-Y-01', domain: 'Y', kind: 'supply', name: '捷租·共享仓库', ownerUnitId: 'u-yu1', operatorContainerId: 'c-yj', chain: 'source', mode: 'YU → Booth-Y（源头空间，捷租 Jezoom）', frontDesc: '园区仓库/共享仓按天租赁（铺面层展示）', backDesc: 'Booth 实体·DL/WH 空间作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 2 },
  // —— DU 经营实体铺（组织经营，归 DU，执行帽一一对应）——
  { id: 'b-dy1', code: 'Booth-DY-01', domain: 'Y', kind: 'du', name: '合和·智场经营店', ownerUnitId: 'u-du1', execUnitId: 'u-dyx', operatorContainerId: 'c-du', chain: 'du', mode: 'DU·DYX → Booth-DY（经营·智场）', frontDesc: '空间经营店：承接源头空间，面向 XU 企业撮合（铺面层）', backDesc: 'Booth 实体·五大作业系统（DYX 履约，作业层）', franchise: 'direct', status: 'open', rating: 4.7, listingCount: 1 },
  { id: 'b-dh1', code: 'Booth-DH-01', domain: 'H', kind: 'du', name: '合和·人资经营店', ownerUnitId: 'u-du1', execUnitId: 'u-dhx', operatorContainerId: 'c-du', chain: 'du', mode: 'DU·DHX → Booth-DH（经营·人资）', frontDesc: '人力经营店：组织派单承接企业用工（铺面层）', backDesc: 'Booth 实体·SVC/DL 作业系统（DHX 履约）', franchise: 'direct', status: 'open', rating: 4.6, listingCount: 1 },
  { id: 'b-dh2', code: 'Booth-DH-02', domain: 'H', kind: 'du', name: '丰时·人资加盟店', ownerUnitId: 'u-du2', execUnitId: 'u-dhx2', operatorContainerId: 'c-fs', chain: 'du', mode: 'DU(加盟)·DHX → Booth-DH', frontDesc: '加盟人资经营店（铺面层）', backDesc: 'Booth 实体·SVC 作业系统（DHX 履约）', franchise: 'franchise', status: 'open', rating: 4.5, listingCount: 1 },
  { id: 'b-dt1', code: 'Booth-DT-01', domain: 'T', kind: 'du', name: '合和·技术经营店', ownerUnitId: 'u-du1', execUnitId: 'u-dtx', operatorContainerId: 'c-du', chain: 'du', mode: 'DU·DTX → Booth-DT（经营·技术）', frontDesc: '技术经营店：承接技术源头，Order-T 采购（铺面层）', backDesc: 'Booth 实体·LAB/FAB 作业系统（DTX 履约）', franchise: 'direct', status: 'open', rating: 4.8, listingCount: 1 },
  { id: 'b-de1', code: 'Booth-DE-01', domain: 'E', kind: 'du', name: '合和·物资经营部', ownerUnitId: 'u-du1', execUnitId: 'u-dex', operatorContainerId: 'c-du', chain: 'du', mode: 'DU·DEX → Booth-DE（经营·通货，Market B端）', frontDesc: '物资经营部：通货面向 XU 企业批量采购（Market 铺面层）', backDesc: 'Booth 实体·五大作业系统（DEX 履约，作业层）', franchise: 'direct', status: 'open', rating: 4.7, listingCount: 1 },
  { id: 'b-dc1', code: 'Booth-DC-01', domain: 'DE', kind: 'du', name: '合和·直营门店(Mall)', ownerUnitId: 'u-du1', execUnitId: 'u-dcx', operatorContainerId: 'c-du', chain: 'face', mode: 'DU·DCX → Booth-DC（Mall C端门店）', frontDesc: '直营门店：面向 CU 自然人零售（Mall C端）', backDesc: 'Booth 实体·SVC 门店作业系统（DCX 履约）', franchise: 'direct', status: 'open', rating: 4.9, listingCount: 2 },
];

/* ============ 商品/服务/产能（挂铺面，引用 Booth 实体） ============ */
export const listings: Listing[] = [
  { id: 'l1', boothId: 'b-e1', domain: 'E', title: 'Q235 螺纹钢 现货', unit: '吨', priceCents: 420000, tags: ['现货', '集采'] },
  { id: 'l2', boothId: 'b-e1', domain: 'E', title: '工业五金耗材包', unit: '套', priceCents: 8900, tags: ['MRO'] },
  { id: 'l3', boothId: 'b-e2', domain: 'E', title: 'MRO 季度集采框架', unit: '季', priceCents: 1200000, tags: ['框架协议'] },
  { id: 'l4', boothId: 'b-h1', domain: 'H', title: '仓储分拣人力（日）', unit: '人日', priceCents: 26000, tags: ['灵活用工'] },
  { id: 'l5', boothId: 'b-h1', domain: 'H', title: '产线外包（周）', unit: '人周', priceCents: 180000, tags: ['外包'] },
  { id: 'l6', boothId: 'b-t1', domain: 'T', title: '云仓调度 SaaS（年）', unit: '年', priceCents: 6000000, tags: ['Order-T'] },
  { id: 'l7', boothId: 'b-t1', domain: 'T', title: 'WMS 定制开发', unit: '项目', priceCents: 20000000, tags: ['Order-T', '定制'] },
  { id: 'l8', boothId: 'b-y1', domain: 'Y', title: '园区仓库 100㎡（天）', unit: '天', priceCents: 36000, tags: ['捷租Jezoom'] },
  { id: 'l9', boothId: 'b-y1', domain: 'Y', title: '共享仓工位（月）', unit: '月', priceCents: 480000, tags: ['共享仓'] },
  { id: 'l10', boothId: 'b-dy1', domain: 'Y', title: '智场·企业空间整包(月)', unit: '月', priceCents: 900000, tags: ['经营承接'] },
  { id: 'l11', boothId: 'b-dh1', domain: 'H', title: '人资·企业用工整包(月)', unit: '月', priceCents: 600000, tags: ['经营承接'] },
  { id: 'l12', boothId: 'b-dh2', domain: 'H', title: '丰时加盟·灵活用工包', unit: '月', priceCents: 520000, tags: ['加盟'] },
  { id: 'l13', boothId: 'b-dt1', domain: 'T', title: '技术·数字化整包(年)', unit: '年', priceCents: 12000000, tags: ['Order-T', '经营承接'] },
  { id: 'l14', boothId: 'b-de1', domain: 'E', title: '通货·企业批量采购框架', unit: '季', priceCents: 3000000, tags: ['B2B'] },
  { id: 'l15', boothId: 'b-dc1', domain: 'DE', title: '门店·生活服务套餐(个人)', unit: '次', priceCents: 19900, tags: ['B2C', 'Mall'] },
  { id: 'l16', boothId: 'b-dc1', domain: 'DE', title: '门店·零售商品(个人)', unit: '件', priceCents: 8900, tags: ['B2C', 'Mall'] },
];

/* ============ 订单（三流之订单流） ============ */
let orderSeq = 1001;
export const orders: Order[] = [
  { id: 'o-1001', code: 'C-2026-0001', family: 'C', side: 'C', boothId: 'b-dc1', listingId: 'l15', buyerContainerId: 'c-xl', sellerContainerId: 'c-du', tradeCode: 'C', status: 'done', amountCents: 19900, settledAt: '2026-09-05', paid: true },
  { id: 'o-1002', code: 'C-2026-0002', family: 'C', side: 'C', boothId: 'b-dc1', listingId: 'l16', buyerContainerId: 'c-may', sellerContainerId: 'c-du', tradeCode: 'C', status: 'pending', amountCents: 8900 },
  { id: 'o-1003', code: 'E-2026-0001', family: 'E', side: 'B', boothId: 'b-dh1', listingId: null, buyerContainerId: 'c-gou', sellerContainerId: 'c-du', tradeCode: 'EX', status: 'done', amountCents: 260000, settledAt: '2026-09-03', paid: true, note: '企业用工整包（Booth-DH/DHX 履约）' },
  { id: 'o-1004', code: 'T-2026-0001', family: 'T', side: 'B', boothId: 'b-dt1', listingId: 'l13', buyerContainerId: 'c-gou', sellerContainerId: 'c-du', tradeCode: 'TX', status: 'pending', amountCents: 12000000, note: '数字化整包（Order-T，Booth-DT/DTX 经营承接）' },
  { id: 'o-1005', code: 'Y-2026-0001', family: 'Y', side: 'B', boothId: 'b-dy1', listingId: 'l10', buyerContainerId: 'c-gou', sellerContainerId: 'c-du', tradeCode: 'YX', status: 'fulfilling', amountCents: 2700000, note: '企业空间整包·3 月（Booth-DY/DYX 履约，捷租）' },
  { id: 'o-1006', code: 'D-2026-0001', family: 'D', side: 'B', boothId: 'b-de1', listingId: 'l14', buyerContainerId: 'c-hf', sellerContainerId: 'c-du', tradeCode: 'D-OFD', status: 'pending', amountCents: 9000000, note: '企业产品批量框架（Booth-DE/DEX→D-OFD 汇聚调度）' },
  { id: 'o-1007', code: 'C-2026-0003', family: 'C', side: 'C', boothId: 'b-dc1', listingId: 'l15', buyerContainerId: 'c-may', sellerContainerId: 'c-du', tradeCode: 'C', status: 'done', amountCents: 19900, settledAt: '2026-08-28', paid: true },
];

export const nextOrderCode = (tradeCode: string, family: string): string => {
  orderSeq += 1;
  return `${family === 'C' ? 'C' : tradeCode}-2026-${String(orderSeq - 1000).padStart(4, '0')}`;
};

/* ============ B2B 询价/报价/合同（Market 铺面层，占位内存态） ============ */
export interface Inquiry {
  id: string;
  code: string;
  domain: string;
  boothId: string;
  buyerContainerId: string;
  title: string;
  detail: string;
  status: 'inquiry' | 'quoted' | 'contracted' | 'ordered';
  quoteCents?: number;
  quoteNote?: string;
  contractNo?: string;
  createdAt: string;
}
export const inquiries: Inquiry[] = [];

/* ============ 运营治理（V*M，占位） ============ */
export const governanceCases: { id: string; domain: string; opRole: string; kind: string; desc: string; status: 'open' | 'closed' }[] = [
  { id: 'g1', domain: 'E', opRole: 'VEM', kind: '市场秩序', desc: '通货市场价格巡检：MRO 集采报价合规核对', status: 'open' },
  { id: 'g2', domain: 'Y', opRole: 'VYM', kind: '规则制定', desc: '智场空间租赁合同模板 v2 评审（捷租子品牌）', status: 'open' },
  { id: 'g3', domain: 'T', opRole: 'VTM', kind: 'Booth 系统供给', desc: '技术经营店 LAB 作业系统能力清单审核', status: 'closed' },
  { id: 'g4', domain: 'DE', opRole: 'VDM', kind: '市场秩序', desc: '产品市场 Booth-DE/DC 直营加盟资质巡检', status: 'open' },
];

/* ================= 内存态访问助手（演示开发版，单例可变） ================= */
export interface Store {
  containers: Container[];
  units: Unit[];
  booths: Booth[];
  listings: Listing[];
  orders: Order[];
}
export function getStore(): Store {
  return { containers, units, booths, listings, orders };
}
export const containerById = (id: string): Container | undefined =>
  containers.find((c) => c.id === id);
export const unitById = (id: string): Unit | undefined => units.find((u) => u.id === id);
/** 生成业务自增 ID（演示版用长度计数） */
export function nextSeq(kind: 'booth' | 'order'): string {
  if (kind === 'booth') return `b-${booths.length + 1}0${Date.now() % 100}`;
  const n = orders.length + 1008;
  orderSeq = Math.max(orderSeq, n);
  return `o-${n}`;
}
export function domainStats(): Record<string, { booths: number; listings: number; orders: number }> {
  const acc: Record<string, { booths: number; listings: number; orders: number }> = {};
  for (const b of booths) {
    acc[b.domain] ??= { booths: 0, listings: 0, orders: 0 };
    acc[b.domain].booths += 1;
  }
  for (const l of listings) {
    acc[l.domain] ??= { booths: 0, listings: 0, orders: 0 };
    acc[l.domain].listings += 1;
  }
  for (const o of orders) {
    const b = booths.find((x) => x.id === o.boothId);
    const dom = b?.domain ?? 'DE';
    acc[dom] ??= { booths: 0, listings: 0, orders: 0 };
    acc[dom].orders += 1;
  }
  return acc;
}
