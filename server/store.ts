// X-Market 五域集市系统 · 内存数据仓库（含种子数据）
// 以「容器（主体）→ 帽（13U 身份）→ 角色（域角色）→ 交易对象」四级建模。
// 13U 口径（09-08 LOCKED）：PU→TU；13 = 12U + YU(域主)。

import type {
  Booth, Container, DomainStats, Fulfillment, Listing, Order, Unit, UnitRole13,
} from '../shared/types';
import { DOMAINS } from './domainConfig';

export interface Store {
  containers: Container[];
  units: Unit[];
  booths: Booth[];
  listings: Listing[];
  fulfillments: Fulfillment[];
  orders: Order[];
  seq: Record<string, number>;
}

let store: Store | null = null;

function stamp(): string {
  return new Date().toISOString();
}

function buildSeed(): Store {
  // ===== 主体：容器 =====
  const containers: Container[] = [
    { id: 'c-plat', type: 'XOPZ', name: 'X-Market 平台', region: '平台总部', credit: 99 }, // T-PLAT
    { id: 'c-hf', type: 'XEPZ', name: '恒丰供应链', region: '华东·上海', credit: 96 }, // B端经营主体
    { id: 'c-xl', type: 'XHPZ', name: '消费者·小林', region: '华东·杭州', credit: 88 }, // C端
    { id: 'c-may', type: 'XHPZ', name: '消费者·阿May', region: '华南·深圳', credit: 92 },
    { id: 'c-qc', type: 'XEPZ', name: '启辰物资', region: '华北·天津', credit: 94 },
    { id: 'c-fs', type: 'XEPZ', name: '丰山仓储', region: '西南·重庆', credit: 90 },
    { id: 'c-xc', type: 'XEPZ', name: '迅驰人力', region: '华东·苏州', credit: 91 },
    { id: 'c-yj', type: 'XEPZ', name: '云阶空间', region: '华南·广州', credit: 89 },
    { id: 'c-xm', type: 'XEPZ', name: '星脉科技', region: '华东·杭州', credit: 95 },
    { id: 'c-jz', type: 'XEPZ', name: '矩阵算法实验室', region: '华北·北京', credit: 91 },
    { id: 'c-hw', type: 'XEPZ', name: '好味连锁', region: '华中·武汉', credit: 88 },
    { id: 'c-ym', type: 'XEPZ', name: '原麦烘焙', region: '西南·成都', credit: 85 },
    { id: 'c-gou', type: 'XGPZ', name: '华东区采购办', region: '华东·上海', credit: 90 }, // 政府容器
    { id: 'c-hr', type: 'XEPZ', name: '华瑞资产', region: '华南·珠海', credit: 87 }, // AU
    { id: 'c-rx', type: 'XEPZ', name: '融信金服', region: '华东·上海', credit: 92 }, // FU
    { id: 'c-zz', type: 'XEPZ', name: '中智信息', region: '华北·北京', credit: 89 }, // IU
    { id: 'c-jy', type: 'XEPZ', name: '捷运车队', region: '西南·成都', credit: 86 }, // VU
    { id: 'c-fh', type: 'XEPZ', name: '泛华综合服务', region: '华南·广州', credit: 88 }, // SU
  ];

  const u = (
    id: string, code: string, name: string, role: UnitRole13, side: 'C' | 'B',
    containerId: string, domainTags: string[], dispatch = false,
  ): Unit => ({
    id, code, name, role, side, containerId,
    domainTags: domainTags as Unit['domainTags'],
    dispatch, tier: 'L2', credit: 85,
  });

  // ===== 身份：13U 帽 =====
  const units: Unit[] = [
    // CU 顾客（C端双入口之 Mall）
    u('u-cu1', 'CU-001', '小林', 'CU', 'C', 'c-xl', []),
    u('u-cu2', 'CU-002', '阿May', 'CU', 'C', 'c-may', []),
    // 经营主体恒丰持有的帽：EU(物资) + OU(组织采购需求)
    u('u-op1', 'OP-HF1', '恒丰·经营帽', 'OU', 'B', 'c-hf', ['E', 'H']),
    u('u-ou1', 'OU-001', '恒丰采购需求', 'OU', 'B', 'c-hf', ['E', 'H']),
    // EU 物资
    u('u-eu1', 'EU-101', '启辰物资', 'EU', 'B', 'c-qc', ['E']),
    u('u-eu2', 'EU-102', '丰山仓储', 'EU', 'B', 'c-fs', ['E']),
    // HU 人力（含调度能力 HDU 并入）
    u('u-hu1', 'HU-201', '迅驰人力', 'HU', 'B', 'c-xc', ['H'], true),
    // YU 空间·域主（含调度 YDU 并入）
    u('u-yu1', 'YU-401', '云阶空间', 'YU', 'B', 'c-yj', ['Y'], true),
    // TU 技术
    u('u-tu1', 'TU-601', '星脉科技', 'TU', 'B', 'c-xm', ['T']),
    u('u-tu2', 'TU-602', '矩阵算法', 'TU', 'B', 'c-jz', ['T']),
    // DU 门店产能
    u('u-du1', 'DU-701', '好味一门店', 'DU', 'B', 'c-hw', ['DE']),
    u('u-du2', 'DU-702', '原麦烘焙店', 'DU', 'B', 'c-ym', ['DE']),
    // GU 政府需求
    u('u-gu1', 'GU-001', '华东采购办·需求', 'GU', 'B', 'c-gou', ['E', 'Y']),
    // AU 资产
    u('u-au1', 'AU-001', '华瑞资产', 'AU', 'B', 'c-hr', ['Y']),
    // FU 金融
    u('u-fu1', 'FU-001', '融信金服', 'FU', 'B', 'c-rx', ['T', 'E']),
    // IU 信息
    u('u-iu1', 'IU-001', '中智信息', 'IU', 'B', 'c-zz', ['T']),
    // VU 车辆
    u('u-vu1', 'VU-001', '捷运车队', 'VU', 'B', 'c-jy', ['E']),
    // SU 综合服务
    u('u-su1', 'SU-001', '泛华综合服务', 'SU', 'B', 'c-fh', ['H', 'DE']),
  ];

  // ===== 交易对象：摊位（双层） =====
  const containerOf = (unitId: string): string => units.find(x => x.id === unitId)?.containerId ?? 'c-plat';
  const booths: Booth[] = [
    { id: 'b-e1', code: 'Booth-E-01', domain: 'E', name: '启辰·工业物资铺', ownerUnitId: 'u-eu1', operatorContainerId: containerOf('u-eu1'), mode: 'EU → Booth-E', frontDesc: 'MRO 物资、包装耗材现货直售', backDesc: '仓内分拣打包，48h 发货履约', status: 'open', rating: 4.8, listingCount: 4 },
    { id: 'b-e2', code: 'Booth-E-02', domain: 'E', name: '丰山·冷链仓储铺', ownerUnitId: 'u-eu2', operatorContainerId: containerOf('u-eu2'), mode: 'EU → Booth-E', frontDesc: '生鲜冷链物资代发', backDesc: '冷库暂存 + 干线运输', status: 'open', rating: 4.6, listingCount: 3 },
    { id: 'b-h1', code: 'Booth-H-01', domain: 'H', name: '迅驰·临时用工铺', ownerUnitId: 'u-hu1', operatorContainerId: containerOf('u-hu1'), mode: 'HU → HDU → Booth-H', frontDesc: '展会/物流高峰临时用工', backDesc: 'HDU 排班调度 + 保险核验', status: 'open', rating: 4.7, listingCount: 3 },
    { id: 'b-y1', code: 'Booth-Y-01', domain: 'Y', name: '云阶·共享工位铺', ownerUnitId: 'u-yu1', operatorContainerId: containerOf('u-yu1'), mode: 'YU → YDU → Booth-Y', frontDesc: '联合办公工位/会议室', backDesc: 'YDU 撮合入驻 + 门禁授权', status: 'open', rating: 4.9, listingCount: 3 },
    { id: 'b-t1', code: 'Booth-T-01', domain: 'T', name: '星脉·算法授权铺', ownerUnitId: 'u-tu1', operatorContainerId: containerOf('u-tu1'), mode: 'TU → Booth-T', frontDesc: 'OCR/风控模型 API 授权', backDesc: '算力调度 + 沙箱交付', status: 'open', rating: 4.9, listingCount: 3 },
    { id: 'b-t2', code: 'Booth-T-02', domain: 'T', name: '矩阵·数据标注铺', ownerUnitId: 'u-tu2', operatorContainerId: containerOf('u-tu2'), mode: 'TU → Booth-T', frontDesc: '标注数据集与模型微调', backDesc: '标注管线 + 质检闭环', status: 'open', rating: 4.5, listingCount: 2 },
    { id: 'b-de1', code: 'Booth-DE-01', domain: 'DE', name: '好味·堂食产能铺', ownerUnitId: 'u-du1', operatorContainerId: containerOf('u-du1'), mode: 'DU → Booth-DE', frontDesc: '午市餐位&包间时段', backDesc: '后厨排产 + 履约 D-OFD', status: 'open', rating: 4.7, listingCount: 3 },
    { id: 'b-de2', code: 'Booth-DE-02', domain: 'DE', name: '原麦·下午茶产能铺', ownerUnitId: 'u-du2', operatorContainerId: containerOf('u-du2'), mode: 'DU → Booth-DE', frontDesc: '现烤甜品+茶饮时段', backDesc: '出品排期 + 到店自取 D-OFD', status: 'open', rating: 4.6, listingCount: 2 },
  ];

  const listings: Listing[] = [
    { id: 'l-e1-1', boothId: 'b-e1', domain: 'E', title: '工业润滑油(200L桶)', spec: 'ISO VG 46 抗磨液压油', unit: '桶', price: 2680, stock: 120, supplierUnitId: 'u-eu1', category: 'MRO耗材' },
    { id: 'l-e1-2', boothId: 'b-e1', domain: 'E', title: '瓦楞纸箱 5层加固', spec: '600×400×200mm', unit: '只', price: 4.2, stock: 5000, supplierUnitId: 'u-eu1', category: '包装耗材' },
    { id: 'l-e1-3', boothId: 'b-e1', domain: 'E', title: '防静电手套(丁腈)', spec: 'M码·无粉', unit: '盒', price: 58, stock: 800, supplierUnitId: 'u-eu1', category: '防护用品' },
    { id: 'l-e2-1', boothId: 'b-e2', domain: 'E', title: '冷链干线舱位', spec: '2~8℃ 单日整托', unit: '托', price: 480, stock: 90, supplierUnitId: 'u-eu2', category: '冷链服务' },
    { id: 'h1', boothId: 'b-h1', domain: 'H', title: '展会布展临时工', spec: '8小时/班·含保险', unit: '人日', price: 320, stock: 60, supplierUnitId: 'u-hu1', category: '临时用工' },
    { id: 'h2', boothId: 'b-h1', domain: 'H', title: '仓库分拣小时工', spec: '晚班分段排班', unit: '人时', price: 26, stock: 400, supplierUnitId: 'u-hu1', category: '临时用工' },
    { id: 'y1', boothId: 'b-y1', domain: 'Y', title: '独立工位(月租)', spec: '开放区·含水电', unit: '位', price: 1200, stock: 20, supplierUnitId: 'u-yu1', category: '办公空间' },
    { id: 'y2', boothId: 'b-y1', domain: 'Y', title: '8人会议室(4小时)', spec: '含投屏·茶歇', unit: '间', price: 600, stock: 6, supplierUnitId: 'u-yu1', category: '会议空间' },
    { id: 't1', boothId: 'b-t1', domain: 'T', title: '票据 OCR API 授权', spec: 'QPS 50·年度授权', unit: '个', price: 8800, stock: 30, supplierUnitId: 'u-tu1', category: 'API服务' },
    { id: 't2', boothId: 'b-t1', domain: 'T', title: '风控评分模型', spec: '本地部署·GPU', unit: '套', price: 36000, stock: 10, supplierUnitId: 'u-tu1', category: '模型' },
    { id: 'de1', boothId: 'b-de1', domain: 'DE', title: '午市四人餐位', spec: '11:30-13:30·含服务', unit: '台', price: 88, stock: 24, supplierUnitId: 'u-du1', category: '门店产能' },
    { id: 'de2', boothId: 'b-de1', domain: 'DE', title: '6人包间(晚市)', spec: '18:00 起·低消580', unit: '间', price: 580, stock: 4, supplierUnitId: 'u-du1', category: '门店产能' },
    { id: 'de3', boothId: 'b-de2', domain: 'DE', title: '现烤招牌蛋挞(12只)', spec: '14:00 出品·到店自取', unit: '份', price: 68, stock: 40, supplierUnitId: 'u-du2', category: '门店产能' },
  ];

  const fulfillments: Fulfillment[] = [
    { id: 'f-e1-1', boothId: 'b-e1', domain: 'E', title: 'MRO 分拣打包线', task: '按单拣货→贴标→出库', capacity: 500, used: 340, status: 'processing' },
    { id: 'f-e2-1', boothId: 'b-e2', domain: 'E', title: '冷链干线调度', task: '托盘装载→温控运输', capacity: 120, used: 90, status: 'processing' },
    { id: 'f-h1-1', boothId: 'b-h1', domain: 'H', title: '临时工排班派单', task: 'HDU 接单→派班→核验', capacity: 200, used: 150, status: 'ready' },
    { id: 'f-y1-1', boothId: 'b-y1', domain: 'Y', title: '工位入驻授权', task: 'YDU 撮合→门禁开通', capacity: 50, used: 32, status: 'ready' },
    { id: 'f-t1-1', boothId: 'b-t1', domain: 'T', title: '模型算力调度', task: '申请算力→沙箱部署', capacity: 40, used: 18, status: 'processing' },
    { id: 'f-de1-1', boothId: 'b-de1', domain: 'DE', title: '堂食排产履约', task: '排台→后厨排产→出品 D-OFD', capacity: 80, used: 55, status: 'done' },
    { id: 'f-de2-1', boothId: 'b-de2', domain: 'DE', title: '甜品出品排期', task: '订单排期→现烤→自取 D-OFD', capacity: 60, used: 40, status: 'processing' },
  ];

  const orders: Order[] = [
    { id: 'o1', type: 'MALL', tradeCode: 'EX-2024-0001', domain: 'E', buyerUnitId: 'u-cu1', sellerUnitId: 'u-eu1', boothId: 'b-e1', listingId: 'l-e1-3', title: '防静电手套(丁腈)', qty: 20, amount: 1160, status: 'done', createdAt: stamp() },
    { id: 'o2', type: 'MARKET', tradeCode: 'EX-2024-0002', domain: 'E', buyerUnitId: 'u-op1', sellerUnitId: 'u-eu1', boothId: 'b-e1', listingId: 'l-e1-1', title: '工业润滑油(200L桶)', qty: 6, amount: 16080, status: 'fulfilling', createdAt: stamp() },
    { id: 'o3', type: 'MARKET', tradeCode: 'HX-2024-0001', domain: 'H', buyerUnitId: 'u-op1', sellerUnitId: 'u-hu1', boothId: 'b-h1', listingId: 'h1', title: '展会布展临时工', qty: 40, amount: 12800, status: 'fulfilling', createdAt: stamp() },
    { id: 'o4', type: 'MALL', tradeCode: 'YX-2024-0001', domain: 'Y', buyerUnitId: 'u-cu2', sellerUnitId: 'u-yu1', boothId: 'b-y1', listingId: 'y2', title: '8人会议室(4小时)', qty: 1, amount: 600, status: 'paid', createdAt: stamp() },
    { id: 'o5', type: 'MARKET', tradeCode: 'TX-2024-0001', domain: 'T', buyerUnitId: 'u-op1', sellerUnitId: 'u-tu1', boothId: 'b-t1', listingId: 't1', title: '票据 OCR API 授权', qty: 1, amount: 8800, status: 'done', createdAt: stamp() },
    { id: 'o6', type: 'MALL', tradeCode: 'D-OFD-2024-0001', domain: 'DE', buyerUnitId: 'u-cu1', sellerUnitId: 'u-du1', boothId: 'b-de1', listingId: 'de1', title: '午市四人餐位', qty: 2, amount: 176, status: 'paid', createdAt: stamp() },
    { id: 'o7', type: 'MALL', tradeCode: 'D-OFD-2024-0002', domain: 'DE', buyerUnitId: 'u-cu2', sellerUnitId: 'u-du2', boothId: 'b-de2', listingId: 'de3', title: '现烤招牌蛋挞(12只)', qty: 3, amount: 204, status: 'done', createdAt: stamp() },
  ];

  return { containers, units, booths, listings, fulfillments, orders, seq: { EX: 2, HX: 1, YX: 1, TX: 1, OFD: 2 } };
}

export function getStore(): Store {
  if (!store) {
    store = buildSeed();
  }
  return store;
}

export function nextSeq(code: string): number {
  const s = getStore();
  const key = code === 'D-OFD' ? 'OFD' : code;
  s.seq[key] = (s.seq[key] ?? 0) + 1;
  return s.seq[key];
}

export function domainStats(): DomainStats[] {
  const s = getStore();
  return DOMAINS.map(d => {
    const dom = d.code;
    const domBooths = s.booths.filter(b => b.domain === dom);
    const domListings = s.listings.filter(l => l.domain === dom);
    const domOrders = s.orders.filter(o => o.domain === dom);
    const turnover = domOrders.filter(o => o.status !== 'pending').reduce((sum, o) => sum + o.amount, 0);
    return {
      domain: dom,
      booths: domBooths.length,
      listings: domListings.length,
      orders: domOrders.length,
      turnover,
    };
  });
}

export function containerById(id: string): Container | undefined {
  return getStore().containers.find(c => c.id === id);
}