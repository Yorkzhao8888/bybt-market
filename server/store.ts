// X-Market 五域集市系统 · 内存数据存储（演示开发版）
// X-MARKET-05：两套系统 + 三方链路 + Booth 权属定版
//   容器(主体) → 帽(身份) → 域角色(标签) → Booth 实体(作业层) / 交易对象(铺面层)

import { readFileSync, writeFileSync } from 'node:fs';
import type { Container, Unit, Booth, Order, Listing, Inquiry, SupplyContract, SupplierApplication, SupplierProduct, MarketPowerMapRow, MarketPowerAuditRow, GovernThresholds, PowerHat } from '../shared/types';

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
  // X-MARKET-TI-03：10 个 EU 供应商演示实体（内测批量验证，源头产能容器；方案 A 预置数据）
  { id: 'c-eu01', type: 'XEPZ', name: '恒晟物资', region: '华东', credit: 90, domainTag: 'E_MARKET' },
  { id: 'c-eu02', type: 'XEPZ', name: '联科五金', region: '华南', credit: 88, domainTag: 'E_MARKET' },
  { id: 'c-eu03', type: 'XEPZ', name: '正茂建材', region: '华东', credit: 87, domainTag: 'E_MARKET' },
  { id: 'c-eu04', type: 'XEPZ', name: '泰和工业', region: '华北', credit: 89, domainTag: 'E_MARKET' },
  { id: 'c-eu05', type: 'XEPZ', name: '凯盛工具', region: '华中', credit: 86, domainTag: 'E_MARKET' },
  { id: 'c-eu06', type: 'XEPZ', name: '泓远机电', region: '华东', credit: 91, domainTag: 'E_MARKET' },
  { id: 'c-eu07', type: 'XEPZ', name: '广泰钢铁', region: '华北', credit: 92, domainTag: 'E_MARKET' },
  { id: 'c-eu08', type: 'XEPZ', name: '瑞丰耗材', region: '西南', credit: 85, domainTag: 'E_MARKET' },
  { id: 'c-eu09', type: 'XEPZ', name: '华信紧固', region: '华南', credit: 88, domainTag: 'E_MARKET' },
  { id: 'c-eu10', type: 'XEPZ', name: '力锋设备', region: '华东', credit: 90, domainTag: 'E_MARKET' },
  // X-MARKET-TI-04：四源三态样板供给方容器（EU apply/cert/list + YU/HU/TU 各三态）+ 五类 *DU 分经营号容器
  { id: 'c-eu11', type: 'XEPZ', name: '新航物资', region: '华东', credit: 88, domainTag: 'E_MARKET' },
  { id: 'c-eu12', type: 'XEPZ', name: '智芯元件', region: '华东', credit: 91, domainTag: 'E_MARKET' },
  { id: 'c-eu13', type: 'XEPZ', name: '灵动电子', region: '华南', credit: 90, domainTag: 'E_MARKET' },
  { id: 'c-yu1', type: 'XEPZ', name: '云栖空间', region: '华南', credit: 88, domainTag: 'Y_MARKET' },
  { id: 'c-yu2', type: 'XEPZ', name: '位来园区', region: '华东', credit: 90, domainTag: 'Y_MARKET' },
  { id: 'c-yu3', type: 'XEPZ', name: '高格仓储', region: '华北', credit: 92, domainTag: 'Y_MARKET' },
  { id: 'c-hu1', type: 'XHPZ', name: '匠星人力', region: '华北', credit: 87, domainTag: 'H_MARKET' },
  { id: 'c-hu2', type: 'XHPZ', name: '伯乐产线', region: '华东', credit: 89, domainTag: 'H_MARKET' },
  { id: 'c-hu3', type: 'XHPZ', name: '优派劳务', region: '华南', credit: 90, domainTag: 'H_MARKET' },
  { id: 'c-tu1', type: 'XEPZ', name: '智算引擎', region: '华东', credit: 88, domainTag: 'T_MARKET' },
  { id: 'c-tu2', type: 'XEPZ', name: '码力工场', region: '西南', credit: 90, domainTag: 'T_MARKET' },
  { id: 'c-tu3', type: 'XEPZ', name: '云图方案', region: '华东', credit: 93, domainTag: 'T_MARKET' },
  { id: 'c-ddu', type: 'XEPZ', name: '恒产集团主业(DDU)', region: '华东', credit: 94, domainTag: 'DE_MARKET' },
  { id: 'c-ydu', type: 'XEPZ', name: '恒产智场部(YDU)', region: '华东', credit: 92, domainTag: 'Y_MARKET' },
  { id: 'c-edu', type: 'XEPZ', name: '恒产产品线(EDU)', region: '华东', credit: 93, domainTag: 'E_MARKET' },
  { id: 'c-cdu', type: 'XEPZ', name: '恒产客服中心(CDU)', region: '华东', credit: 92, domainTag: 'DE_MARKET' },
  { id: 'c-hdu', type: 'XEPZ', name: '恒产人资部(HDU)', region: '华北', credit: 92, domainTag: 'H_MARKET' },
  { id: 'c-tdu', type: 'XEPZ', name: '恒产技术部(TDU)', region: '华东', credit: 93, domainTag: 'T_MARKET' },
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
  // X-MARKET-TI-03：10 个 EU 供应商演示帽（内测批量验证）
  { id: 'u-eu2', code: 'EU-HS', name: '恒晟物资', role: 'EU', side: 'B', containerId: 'c-eu01', domainTags: ['E_MARKET'], tier: 'L2', credit: 90 },
  { id: 'u-eu3', code: 'EU-LK', name: '联科五金', role: 'EU', side: 'B', containerId: 'c-eu02', domainTags: ['E_MARKET'], tier: 'L2', credit: 88 },
  { id: 'u-eu4', code: 'EU-ZM', name: '正茂建材', role: 'EU', side: 'B', containerId: 'c-eu03', domainTags: ['E_MARKET'], tier: 'L2', credit: 87 },
  { id: 'u-eu5', code: 'EU-TH', name: '泰和工业', role: 'EU', side: 'B', containerId: 'c-eu04', domainTags: ['E_MARKET'], tier: 'L2', credit: 89 },
  { id: 'u-eu6', code: 'EU-KS', name: '凯盛工具', role: 'EU', side: 'B', containerId: 'c-eu05', domainTags: ['E_MARKET'], tier: 'L2', credit: 86 },
  { id: 'u-eu7', code: 'EU-HY', name: '泓远机电', role: 'EU', side: 'B', containerId: 'c-eu06', domainTags: ['E_MARKET'], tier: 'L2', credit: 91 },
  { id: 'u-eu8', code: 'EU-GT', name: '广泰钢铁', role: 'EU', side: 'B', containerId: 'c-eu07', domainTags: ['E_MARKET'], tier: 'L2', credit: 92 },
  { id: 'u-eu9', code: 'EU-RF', name: '瑞丰耗材', role: 'EU', side: 'B', containerId: 'c-eu08', domainTags: ['E_MARKET'], tier: 'L2', credit: 85 },
  { id: 'u-eu10', code: 'EU-HX', name: '华信紧固', role: 'EU', side: 'B', containerId: 'c-eu09', domainTags: ['E_MARKET'], tier: 'L2', credit: 88 },
  { id: 'u-eu11', code: 'EU-LF', name: '力锋设备', role: 'EU', side: 'B', containerId: 'c-eu10', domainTags: ['E_MARKET'], tier: 'L2', credit: 90 },
  // X-MARKET-TI-04：四源三态样板帽 + 五类 *DU 分经营号帽
  { id: 'u-eu12', code: 'EU-XH', name: '新航物资', role: 'EU', side: 'B', containerId: 'c-eu11', domainTags: ['E_MARKET'], tier: 'L2', credit: 88 },
  { id: 'u-eu13', code: 'EU-ZX', name: '智芯元件', role: 'EU', side: 'B', containerId: 'c-eu12', domainTags: ['E_MARKET'], tier: 'L2', credit: 91 },
  { id: 'u-eu14', code: 'EU-LD', name: '灵动电子', role: 'EU', side: 'B', containerId: 'c-eu13', domainTags: ['E_MARKET'], tier: 'L2', credit: 90 },
  { id: 'u-yu2', code: 'YU-YX', name: '云栖空间', role: 'YU', side: 'B', containerId: 'c-yu1', domainTags: ['Y_MARKET'], tier: 'L2', credit: 88 },
  { id: 'u-yu3', code: 'YU-WL', name: '位来园区', role: 'YU', side: 'B', containerId: 'c-yu2', domainTags: ['Y_MARKET'], tier: 'L2', credit: 90 },
  { id: 'u-yu4', code: 'YU-GG', name: '高格仓储', role: 'YU', side: 'B', containerId: 'c-yu3', domainTags: ['Y_MARKET'], tier: 'L2', credit: 92 },
  { id: 'u-hu2', code: 'HU-JX', name: '匠星人力', role: 'HU', side: 'B', containerId: 'c-hu1', domainTags: ['H_MARKET'], tier: 'L2', credit: 87 },
  { id: 'u-hu3', code: 'HU-BL', name: '伯乐产线', role: 'HU', side: 'B', containerId: 'c-hu2', domainTags: ['H_MARKET'], tier: 'L2', credit: 89 },
  { id: 'u-hu4', code: 'HU-YP', name: '优派劳务', role: 'HU', side: 'B', containerId: 'c-hu3', domainTags: ['H_MARKET'], tier: 'L2', credit: 90 },
  { id: 'u-tu2', code: 'TU-ZS', name: '智算引擎', role: 'TU', side: 'B', containerId: 'c-tu1', domainTags: ['T_MARKET'], tier: 'L2', credit: 88 },
  { id: 'u-tu3', code: 'TU-ML', name: '码力工场', role: 'TU', side: 'B', containerId: 'c-tu2', domainTags: ['T_MARKET'], tier: 'L2', credit: 90 },
  { id: 'u-tu4', code: 'TU-YT', name: '云图方案', role: 'TU', side: 'B', containerId: 'c-tu3', domainTags: ['T_MARKET'], tier: 'L2', credit: 93 },
  { id: 'u-du10', code: 'DU-DDU', name: '恒产集团主业(DDU)', role: 'DU', side: 'B', containerId: 'c-ddu', domainTags: ['Y_MARKET', 'E_MARKET', 'H_MARKET', 'T_MARKET', 'DE_MARKET'], tier: 'L2', credit: 94 },
  { id: 'u-du11', code: 'DU-EDU', name: '恒产产品线(EDU)', role: 'DU', side: 'B', containerId: 'c-edu', domainTags: ['E_MARKET', 'DE_MARKET'], tier: 'L2', credit: 93 },
  { id: 'u-du12', code: 'DU-CDU', name: '恒产客服中心(CDU)', role: 'DU', side: 'B', containerId: 'c-cdu', domainTags: ['DE_MARKET'], tier: 'L2', credit: 92 },
  { id: 'u-du13', code: 'DU-HDU', name: '恒产人资部(HDU)', role: 'DU', side: 'B', containerId: 'c-hdu', domainTags: ['H_MARKET'], tier: 'L2', credit: 92 },
  { id: 'u-du14', code: 'DU-TDU', name: '恒产技术部(TDU)', role: 'DU', side: 'B', containerId: 'c-tdu', domainTags: ['T_MARKET'], tier: 'L2', credit: 93 },
  { id: 'u-du15', code: 'DU-YDU', name: '恒产智场部(YDU)', role: 'DU', side: 'B', containerId: 'c-ydu', domainTags: ['Y_MARKET'], tier: 'L2', credit: 92 },
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
  // —— X-Supply 供给线执行帽（X-SUPPLY-01：EX/EXX 办位，Booth-E 驻场执行/铺面维护）——
  { id: 'u-ex1', code: 'EX-QC', name: '启辰·物资供给执行', role: 'EX', side: 'B', containerId: 'c-qc', domainTags: ['E_MARKET'], tier: 'L2', credit: 91 },
  { id: 'u-exx1', code: 'EXX-QC', name: '启辰·Booth-E 执行端', role: 'EXX', side: 'B', containerId: 'c-qc', domainTags: ['E_MARKET'], tier: 'L2', credit: 90 },
  // —— B 端客户帽 XU（买家，按域隔离）——
  { id: 'u-xu1', code: 'XU-GOU', name: '华东区采购办·客户', role: 'XU', side: 'B', containerId: 'c-gou', domainTags: ['E_MARKET', 'T_MARKET', 'H_MARKET'], tier: 'L2', credit: 89 },
  { id: 'u-xu2', code: 'XU-CY', name: '驰远·企业采购', role: 'XU', side: 'B', containerId: 'c-cy', domainTags: ['T_MARKET'], tier: 'L2', credit: 90 },
  // —— 平台运营管理方 V*M（挂平台容器）——
  { id: 'u-vem1', code: 'VEM-PLAT', name: '通货市场运营长', role: 'VEM', side: 'B', containerId: 'c-plat', domainTags: ['E_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vhm1', code: 'VHM-PLAT', name: '人资市场运营长', role: 'VHM', side: 'B', containerId: 'c-plat', domainTags: ['H_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vym1', code: 'VYM-PLAT', name: '智场市场运营长', role: 'VYM', side: 'B', containerId: 'c-plat', domainTags: ['Y_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vtm1', code: 'VTM-PLAT', name: '技术市场运营长', role: 'VTM', side: 'B', containerId: 'c-plat', domainTags: ['T_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vdm1', code: 'VDM-PLAT', name: '总经营管理执行长（VDM）', role: 'VDM', side: 'B', containerId: 'c-plat', domainTags: ['E_MARKET', 'H_MARKET', 'Y_MARKET', 'T_MARKET', 'DE_MARKET'], tier: 'L3', credit: 99 },
  { id: 'u-vxm1', code: 'VDM-PLAT-B', name: '总经营管理执行（云统筹 VDM）', role: 'VDM', side: 'B', containerId: 'c-plat', domainTags: ['E_MARKET', 'H_MARKET', 'Y_MARKET', 'T_MARKET', 'DE_MARKET'], tier: 'L3', credit: 99 },
];

/* ============ Booth 实体（作业层；Market 铺面引用） ============ */
export const booths: Booth[] = [
  // —— 供给方实体铺 ——
  { id: 'b-e1', code: 'Booth-E-01', domain: 'E', kind: 'supply', name: '启辰·工业物资铺', ownerUnitId: 'u-eu1', operatorContainerId: 'c-qc', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '钢材/五金/工业耗材现货直供（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 2 },
  { id: 'b-e2', code: 'Booth-E-02', domain: 'E', kind: 'supply', name: '启辰·MRO 集采铺', ownerUnitId: 'u-eu1', operatorContainerId: 'c-qc', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: 'MRO 工业辅料集采（铺面层展示）', backDesc: 'Booth 实体·WH/SVC 作业系统（作业层）', status: 'open', rating: 4.6, listingCount: 1 },
  { id: 'b-h1', code: 'Booth-H-01', domain: 'H', kind: 'supply', name: '任仕·人力派遣铺', ownerUnitId: 'u-hu1', operatorContainerId: 'c-rs', chain: 'source', mode: 'HU → Booth-H（源头人力）', frontDesc: '产线/仓储人力，按日按周（铺面层展示）', backDesc: 'Booth 实体·SVC 派单作业系统（作业层）', status: 'open', rating: 4.7, listingCount: 2 },
  { id: 'b-t1', code: 'Booth-T-01', domain: 'T', kind: 'supply', name: '驰远·云仓 SaaS 铺', ownerUnitId: 'u-tu1', operatorContainerId: 'c-cy', chain: 'source', mode: 'TU → Booth-T（源头技术）', frontDesc: '云仓/调度 SaaS 订阅与定制（铺面层展示）', backDesc: 'Booth 实体·LAB 研发作业系统（作业层）', status: 'open', rating: 4.9, listingCount: 2 },
  { id: 'b-y1', code: 'Booth-Y-01', domain: 'Y', kind: 'supply', name: '捷租·共享仓库', ownerUnitId: 'u-yu1', operatorContainerId: 'c-yj', chain: 'source', mode: 'YU → Booth-Y（源头空间，捷租 Jezoom）', frontDesc: '园区仓库/共享仓按天租赁（铺面层展示）', backDesc: 'Booth 实体·DL/WH 空间作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 2 },
  // X-MARKET-TI-03：10 个 EU 供给铺（内测批量验证，Booth-E-03 起）
  { id: 'b-e3', code: 'Booth-E-03', domain: 'E', kind: 'supply', name: '恒晟·钢材建材铺', ownerUnitId: 'u-eu2', operatorContainerId: 'c-eu01', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '螺纹钢/镀锌管现货直供（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.7, listingCount: 0 },
  { id: 'b-e4', code: 'Booth-E-04', domain: 'E', kind: 'supply', name: '联科·五金紧固铺', ownerUnitId: 'u-eu3', operatorContainerId: 'c-eu02', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '螺栓/紧固件系列现货（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.6, listingCount: 0 },
  { id: 'b-e5', code: 'Booth-E-05', domain: 'E', kind: 'supply', name: '正茂·水泥建材铺', ownerUnitId: 'u-eu4', operatorContainerId: 'c-eu03', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '散装水泥/砂浆建材直供（铺面层展示）', backDesc: 'Booth 实体·WH/DL 作业系统（作业层）', status: 'open', rating: 4.5, listingCount: 0 },
  { id: 'b-e6', code: 'Booth-E-06', domain: 'E', kind: 'supply', name: '泰和·工业油品铺', ownerUnitId: 'u-eu5', operatorContainerId: 'c-eu04', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '液压油/润滑油/切削液（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.7, listingCount: 0 },
  { id: 'b-e7', code: 'Booth-E-07', domain: 'E', kind: 'supply', name: '凯盛·电动工具铺', ownerUnitId: 'u-eu6', operatorContainerId: 'c-eu05', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '电动/气动工具整机套装（铺面层展示）', backDesc: 'Booth 实体·WH/SVC 作业系统（作业层）', status: 'open', rating: 4.6, listingCount: 0 },
  { id: 'b-e8', code: 'Booth-E-08', domain: 'E', kind: 'supply', name: '泓远·机电设备铺', ownerUnitId: 'u-eu7', operatorContainerId: 'c-eu06', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '轴承/电机/传动件现货（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 0 },
  { id: 'b-e9', code: 'Booth-E-09', domain: 'E', kind: 'supply', name: '广泰·型钢型材铺', ownerUnitId: 'u-eu8', operatorContainerId: 'c-eu07', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '角钢/槽钢/H 型钢现货（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.7, listingCount: 0 },
  { id: 'b-e10', code: 'Booth-E-10', domain: 'E', kind: 'supply', name: '瑞丰·劳保用品铺', ownerUnitId: 'u-eu9', operatorContainerId: 'c-eu08', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '手套/防护/劳保耗材集采（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.5, listingCount: 0 },
  { id: 'b-e11', code: 'Booth-E-11', domain: 'E', kind: 'supply', name: '华信·膨胀紧固铺', ownerUnitId: 'u-eu10', operatorContainerId: 'c-eu09', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '膨胀螺栓/锚栓/幕墙件（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.6, listingCount: 0 },
  { id: 'b-e12', code: 'Booth-E-12', domain: 'E', kind: 'supply', name: '力锋·动力设备铺', ownerUnitId: 'u-eu11', operatorContainerId: 'c-eu10', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '空压机/磨具/动力设备（铺面层展示）', backDesc: 'Booth 实体·WH/SVC 作业系统（作业层）', status: 'open', rating: 4.7, listingCount: 2 },
  // X-MARKET-TI-04：四源「已上架可交易态」样板供给铺（EU/YU/HU/TU 各 1）
  { id: 'b-e13', code: 'Booth-E-13', domain: 'E', kind: 'supply', name: '灵动·电子元器件铺', ownerUnitId: 'u-eu14', operatorContainerId: 'c-eu13', chain: 'source', mode: 'EU → Booth-E（源头产能）', frontDesc: '芯片/元器件现货直供（铺面层展示）', backDesc: 'Booth 实体·WH 仓储作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 2 },
  { id: 'b-y2', code: 'Booth-Y-02', domain: 'Y', kind: 'supply', name: '高格·标准厂房铺', ownerUnitId: 'u-yu4', operatorContainerId: 'c-yu3', chain: 'source', mode: 'YU → Booth-Y（源头空间）', frontDesc: '厂房/仓储/办公位按月租赁（铺面层展示）', backDesc: 'Booth 实体·DL/WH 空间作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 2 },
  { id: 'b-h2', code: 'Booth-H-02', domain: 'H', kind: 'supply', name: '优派·产线劳务铺', ownerUnitId: 'u-hu4', operatorContainerId: 'c-hu3', chain: 'source', mode: 'HU → Booth-H（源头人力）', frontDesc: '产线工人/技术员派驻（铺面层展示）', backDesc: 'Booth 实体·SVC 派单作业系统（作业层）', status: 'open', rating: 4.7, listingCount: 2 },
  { id: 'b-t2', code: 'Booth-T-02', domain: 'T', kind: 'supply', name: '云图·技术方案铺', ownerUnitId: 'u-tu4', operatorContainerId: 'c-tu3', chain: 'source', mode: 'TU → Booth-T（源头技术）', frontDesc: '方案/授权/算力订阅（铺面层展示）', backDesc: 'Booth 实体·LAB 研发作业系统（作业层）', status: 'open', rating: 4.8, listingCount: 2 },
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
  // DU 采购单（供给关系单据）：DU 向供给方 Booth 备货，仅 DU 与对应供给帽可见，客户不可见
  { id: 'o-2001', code: 'EX-2026-1001', family: 'E', side: 'B', boothId: 'b-e1', listingId: null, buyerContainerId: 'c-du', sellerContainerId: 'c-qc', tradeCode: 'EX', status: 'done', amountCents: 2600000, settledAt: '2026-09-06', paid: true, note: 'DU 采购单：Booth-DE 备货（Booth-E 供给）' },
  { id: 'o-2002', code: 'YX-2026-1002', family: 'Y', side: 'B', boothId: 'b-y1', listingId: null, buyerContainerId: 'c-du', sellerContainerId: 'c-yj', tradeCode: 'YX', status: 'pending', amountCents: 1800000, note: 'DU 采购单：Booth-DY 备货（Booth-Y 供给，捷租）' },
];

export const nextOrderCode = (tradeCode: string, family: string): string => {
  orderSeq += 1;
  return `${family === 'C' ? 'C' : tradeCode}-2026-${String(orderSeq - 1000).padStart(4, '0')}`;
};

/* ============ B2B 询价/报价/合同（Market 铺面层，占位内存态；类型口径 shared/types.Inquiry） ============ */
export const inquiries: Inquiry[] = [];

/** DU 采购合同（供给方→DU）：仅 DU 经营台 / V*M 可见，客户界面严禁下发 */
export const supplyContracts: SupplyContract[] = [
  { id: 'sc1', duBoothId: 'b-dy1', duBoothCode: 'Booth-DY-01', supplyBoothCode: 'Booth-Y-01', supplyOwner: '捷租空间（YU）', items: '园区席位季度采购 200 席', amountCents: 3600000, period: '2026-Q4', invoiceFlow: '捷租空间开进项票 → 合和 DU 开销售票给客户' },
  { id: 'sc2', duBoothId: 'b-de1', duBoothCode: 'Booth-DE-01', supplyBoothCode: 'Booth-E-01', supplyOwner: '启辰物资（EU）', items: 'MRO 物料集采框架（月结）', amountCents: 5200000, period: '2026-09', invoiceFlow: '启辰物资开进项票 → 合和 DU 开销售票给客户' },
  { id: 'sc3', duBoothId: 'b-dh1', duBoothCode: 'Booth-DH-01', supplyBoothCode: 'Booth-H-01', supplyOwner: '合致人力（HU）', items: '运维班组 12 人外协服务', amountCents: 2880000, period: '2026-Q4', invoiceFlow: '合致人力开进项票 → 丰石 DU 开销售票给客户' },
];

/* ============ X-MARKET-08 供应商准入 + DU 采购商城（内存态，客户界面严禁下发） ============ */

/** 供应商准入申请：供给方登记 → VDM 云中心评估（pending/approved/rejected，驳回可重提） */
export const supplierApplications: SupplierApplication[] = [
  { id: 'sa-1', supplierId: 'c-qc', boothId: 'b-e1', domain: 'E', categories: 'MRO 工业辅料/五金紧固件/建材钢材', capacity: '月供 5000 件，仓储直发', qualification: 'ISO9001 / 危化品经营许可 / 一般纳税人', priceIntent: '月结 30 天，框架价下浮 5%', status: 'approved', createdAt: '2026-09-01' },
  { id: 'sa-2', supplierId: 'c-cy', boothId: 'b-t1', domain: 'T', categories: '边缘计算网关/物联网模组', capacity: '月产 800 台', qualification: 'CCC / 高新技术企业证书', priceIntent: '预付 30%，交付后 7 天结清', status: 'pending', createdAt: '2026-09-09' },
  // X-MARKET-TI-03：10 个 EU 演示供应商准入（预置 approved，采购商城直接可见）
  { id: 'sa-3', supplierId: 'c-eu01', boothId: 'b-e3', domain: 'E', categories: '螺纹钢/镀锌管/型材', capacity: '月供 6000 吨，厂库直发', qualification: 'ISO9001 / 一般纳税人', priceIntent: '月结 30 天', status: 'approved', createdAt: '2026-09-09' },
  { id: 'sa-4', supplierId: 'c-eu02', boothId: 'b-e4', domain: 'E', categories: '螺栓/紧固件/五金工具', capacity: '月供 80000 套', qualification: 'ISO9001 / ROHS', priceIntent: '月结 15 天', status: 'approved', createdAt: '2026-09-09' },
  { id: 'sa-5', supplierId: 'c-eu03', boothId: 'b-e5', domain: 'E', categories: '散装水泥/砂浆/建材', capacity: '月供 20000 吨', qualification: '生产许可 / 一般纳税人', priceIntent: '款到发货', status: 'approved', createdAt: '2026-09-09' },
  { id: 'sa-6', supplierId: 'c-eu04', boothId: 'b-e6', domain: 'E', categories: '液压油/润滑油/工业油品', capacity: '月供 1000 吨', qualification: '危化品经营许可 / ISO14001', priceIntent: '月结 30 天', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-7', supplierId: 'c-eu05', boothId: 'b-e7', domain: 'E', categories: '电动工具/气动工具', capacity: '月供 2000 套', qualification: '3C 认证 / ISO9001', priceIntent: '预付 20%，余款到货结清', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-8', supplierId: 'c-eu06', boothId: 'b-e8', domain: 'E', categories: '轴承/电机/传动件', capacity: '月供 12000 件', qualification: 'ISO9001 / 高新技术企业', priceIntent: '月结 30 天，框架价下浮 3%', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-9', supplierId: 'c-eu07', boothId: 'b-e9', domain: 'E', categories: '角钢/槽钢/H 型钢', capacity: '月供 5000 吨', qualification: 'ISO9001 / 一般纳税人', priceIntent: '月结 30 天', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-10', supplierId: 'c-eu08', boothId: 'b-e10', domain: 'E', categories: '劳保手套/防护用品/耗材', capacity: '月供 50000 包', qualification: 'LA 劳安认证', priceIntent: '款到发货，量大价优', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-11', supplierId: 'c-eu09', boothId: 'b-e11', domain: 'E', categories: '膨胀螺栓/锚栓/幕墙紧固', capacity: '月供 30000 盒', qualification: 'ISO9001 / ROHS', priceIntent: '月结 15 天', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-12', supplierId: 'c-eu10', boothId: 'b-e12', domain: 'E', categories: '空压机/磨具磨料/动力设备', capacity: '月供 200 台', qualification: '3C 认证 / 生产许可', priceIntent: '预付 30%，验收结清', status: 'approved', createdAt: '2026-09-10' },
  // X-MARKET-TI-04：四源三态样板准入记录（apply=pending 待认证 / cert=approved 尚无铺货 / list=approved 已配铺）
  { id: 'sa-13', supplierId: 'c-eu11', boothId: '', domain: 'E', categories: '线缆/接插件/钣金件', capacity: '月供 20000 件', qualification: 'ISO9001 / 一般纳税人', priceIntent: '月结 30 天', status: 'pending', createdAt: '2026-09-10' },
  { id: 'sa-14', supplierId: 'c-eu12', boothId: '', domain: 'E', categories: 'MCU/传感器/连接器', capacity: '月供 50000 片', qualification: 'ISO9001 / ROHS / 原厂授权', priceIntent: '预付 30%，月结 30 天', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-15', supplierId: 'c-eu13', boothId: 'b-e13', domain: 'E', categories: '芯片/元器件/模组', capacity: '月供 30000 片，保税仓直发', qualification: 'ISO9001 / 原厂授权分销', priceIntent: '月结 15 天', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-16', supplierId: 'c-yu1', boothId: '', domain: 'Y', categories: '厂房/库房/卸货位', capacity: '可租 8000 ㎡', qualification: '不动产权证 / 消防验收', priceIntent: '押二付一', status: 'pending', createdAt: '2026-09-10' },
  { id: 'sa-17', supplierId: 'c-yu2', boothId: '', domain: 'Y', categories: '园区办公位/会议室', capacity: '可租 300 工位', qualification: '不动产权证 / 物业资质', priceIntent: '押一付三', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-18', supplierId: 'c-yu3', boothId: 'b-y2', domain: 'Y', categories: '标准厂房/立体仓/办公位', capacity: '可租 12000 ㎡，24h 进出', qualification: '不动产权证 / 消防验收 / 特行许可', priceIntent: '月付，季缴 95 折', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-19', supplierId: 'c-hu1', boothId: '', domain: 'H', categories: '产线普工/质检员', capacity: '在册 600 人', qualification: '劳务派遣经营许可 / 社保合规', priceIntent: '按月结算', status: 'pending', createdAt: '2026-09-10' },
  { id: 'sa-20', supplierId: 'c-hu2', boothId: '', domain: 'H', categories: '设备技术员/维修工', capacity: '在册 260 人', qualification: '劳务派遣许可 / 特种作业证', priceIntent: '按月结算', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-21', supplierId: 'c-hu3', boothId: 'b-h2', domain: 'H', categories: '产线工人/技术员/仓储劳务', capacity: '在册 450 人，72h 到岗', qualification: '劳务派遣经营许可 / 社保合规', priceIntent: '按月结算，季度返点', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-22', supplierId: 'c-tu1', boothId: '', domain: 'T', categories: '算力租赁/模型训练', capacity: 'A100×64 卡池', qualification: 'IDC/ISP 许可 / 等保三级', priceIntent: '按卡时计费', status: 'pending', createdAt: '2026-09-10' },
  { id: 'sa-23', supplierId: 'c-tu2', boothId: '', domain: 'T', categories: '低代码工场/定制开发', capacity: '月交付 12 个模块', qualification: '双软认证 / ISO27001', priceIntent: '里程碑付款', status: 'approved', createdAt: '2026-09-10' },
  { id: 'sa-24', supplierId: 'c-tu3', boothId: 'b-t2', domain: 'T', categories: '行业方案/软件授权/算力', capacity: '月交付 20 单，7×24 支持', qualification: '双软认证 / ISO27001 / 等保三级', priceIntent: '订阅制，年付 9 折', status: 'approved', createdAt: '2026-09-10' },
];

/** 供应商货品：合格供应商上架（DU 采购商城数据源，含报价/规格/库存，客户不可见） */
export const supplierProducts: SupplierProduct[] = [
  { id: 'sp-1', supplierId: 'c-qc', boothId: 'b-e1', domain: 'E', name: 'Q235 螺纹钢 Φ12', category: '建材钢材', spec: 'Φ12×9m / GB1499.2', priceCents: 420000, unit: '吨', stock: 800, status: 'on' },
  { id: 'sp-2', supplierId: 'c-qc', boothId: 'b-e1', domain: 'E', name: '不锈钢紧固件组合包', category: '五金紧固', spec: 'M6-M12 / 304 不锈钢', priceCents: 8900, unit: '包', stock: 5000, status: 'on' },
  // X-MARKET-TI-03：EU 演示供应商初始货品（每铺 1~2 个，供上架/供给/采购验证）
  { id: 'sp-3', supplierId: 'c-eu01', boothId: 'b-e3', domain: 'E', name: 'HRB400 螺纹钢 Φ14', category: '建材钢材', spec: 'Φ14×9m / GB1499.2', priceCents: 410000, unit: '吨', stock: 600, status: 'on' },
  { id: 'sp-4', supplierId: 'c-eu01', boothId: 'b-e3', domain: 'E', name: '热镀锌钢管 DN40', category: '管材', spec: 'DN40×6m / Q235B', priceCents: 310000, unit: '吨', stock: 400, status: 'on' },
  { id: 'sp-5', supplierId: 'c-eu02', boothId: 'b-e4', domain: 'E', name: '304 内六角螺栓组套', category: '五金紧固', spec: 'M5-M16 / A2-70', priceCents: 7900, unit: '套', stock: 8000, status: 'on' },
  { id: 'sp-6', supplierId: 'c-eu03', boothId: 'b-e5', domain: 'E', name: 'P.O 42.5 散装水泥', category: '建材水泥', spec: 'P.O 42.5 / 散装罐车', priceCents: 45000, unit: '吨', stock: 2000, status: 'on' },
  { id: 'sp-7', supplierId: 'c-eu04', boothId: 'b-e6', domain: 'E', name: 'L-HM46 抗磨液压油', category: '工业油品', spec: '170kg / 钢桶', priceCents: 96000, unit: '桶', stock: 900, status: 'on' },
  { id: 'sp-8', supplierId: 'c-eu05', boothId: 'b-e7', domain: 'E', name: '锂电无刷冲击扳手套装', category: '电动工具', spec: '520N·m / 双电 6.0Ah', priceCents: 158000, unit: '套', stock: 350, status: 'on' },
  { id: 'sp-9', supplierId: 'c-eu06', boothId: 'b-e8', domain: 'E', name: '深沟球轴承 6204', category: '机械传动件', spec: '6204-2RS / GCr15', priceCents: 12500, unit: '个', stock: 12000, status: 'on' },
  { id: 'sp-10', supplierId: 'c-eu06', boothId: 'b-e8', domain: 'E', name: '三相异步电动机 3kW', category: '机电设备', spec: 'YE3-100L2-4 / 380V', priceCents: 438000, unit: '台', stock: 150, status: 'on' },
  { id: 'sp-11', supplierId: 'c-eu07', boothId: 'b-e9', domain: 'E', name: 'Q235B 等边角钢 50×5', category: '型材', spec: '50×50×5×6m', priceCents: 350000, unit: '吨', stock: 500, status: 'on' },
  { id: 'sp-12', supplierId: 'c-eu08', boothId: 'b-e10', domain: 'E', name: '浸胶防割劳保手套', category: '劳保用品', spec: '13 针尼龙 / PU 涂层', priceCents: 3600, unit: '包', stock: 20000, status: 'on' },
  { id: 'sp-13', supplierId: 'c-eu09', boothId: 'b-e11', domain: 'E', name: '304 不锈钢膨胀螺栓', category: '五金紧固', spec: 'M10×100 / 304', priceCents: 5200, unit: '盒', stock: 15000, status: 'on' },
  { id: 'sp-14', supplierId: 'c-eu10', boothId: 'b-e12', domain: 'E', name: '螺杆式空压机 7.5kW', category: '动力设备', spec: '0.8MPa / 风冷固定式', priceCents: 268000, unit: '台', stock: 60, status: 'on' },
  { id: 'sp-15', supplierId: 'c-eu10', boothId: 'b-e12', domain: 'E', name: '树脂增强砂轮片 400', category: '磨具磨料', spec: '400×3×32 / A46P', priceCents: 3200, unit: '片', stock: 30000, status: 'on' },
  // X-MARKET-TI-04：四源「已上架可交易态」样板货品（list 态铺各 2 个；低价品供全链路直采，高价品留作大额审批样板）
  { id: 'sp-17', supplierId: 'c-eu13', boothId: 'b-e13', domain: 'E', name: 'STM32 主控 MCU', category: '芯片', spec: 'F103C8T6 / LQFP48', priceCents: 12800, unit: '片', stock: 5000, status: 'on' },
  { id: 'sp-18', supplierId: 'c-eu13', boothId: 'b-e13', domain: 'E', name: '贴片 LED 灯珠', category: '元器件', spec: '0805 / 白光 / 卷装', priceCents: 320, unit: '颗', stock: 80000, status: 'on' },
  { id: 'sp-19', supplierId: 'c-yu3', boothId: 'b-y2', domain: 'Y', name: '标准厂房 A 栋', category: '厂房租赁', spec: '2000㎡ / 层高 8m / 行车 10t', priceCents: 9800000, unit: '月', stock: 6, status: 'on' },
  { id: 'sp-20', supplierId: 'c-yu3', boothId: 'b-y2', domain: 'Y', name: '共享仓储位', category: '仓储租赁', spec: '50㎡ / 常温 / 24h 进出', priceCents: 39800, unit: '位·月', stock: 40, status: 'on' },
  { id: 'sp-21', supplierId: 'c-hu3', boothId: 'b-h2', domain: 'H', name: '产线普工派驻', category: '产线人力', spec: '26 天/月 / 白班 / 计件', priceCents: 22000, unit: '人·月', stock: 120, status: 'on' },
  { id: 'sp-22', supplierId: 'c-hu3', boothId: 'b-h2', domain: 'H', name: '设备技术员派驻', category: '技术人力', spec: '机电维修 / 特种作业证', priceCents: 58000, unit: '人·月', stock: 40, status: 'on' },
  { id: 'sp-23', supplierId: 'c-tu3', boothId: 'b-t2', domain: 'T', name: 'MES 轻量方案订阅', category: '行业方案', spec: '产线数据看板 / 年订阅', priceCents: 99000, unit: '套·年', stock: 30, status: 'on' },
  { id: 'sp-24', supplierId: 'c-tu3', boothId: 'b-t2', domain: 'T', name: 'GPU 算力包', category: '算力', spec: 'A100 / 100 卡时', priceCents: 68000, unit: '包', stock: 200, status: 'on' },
];

/** 供应商准入/货品自增序号（sa/sp 前缀；TI-03 预置种子后按历史最大号续起，防 id 回绕） */
let supplierSeq = [...supplierApplications, ...supplierProducts].reduce((m, r) => {
  const n = Number(r.id.split('-')[1]);
  return Number.isFinite(n) ? Math.max(m, n) : m;
}, 0);
export function nextSupplierId(prefix: 'sa' | 'sp'): string {
  supplierSeq += 1;
  return `${prefix}-${supplierSeq}`;
}

/** X-MARKET-16 履约回执自增（fr 前缀） */
let fulfillSeq = 0;
export function nextFulfillId(): string {
  fulfillSeq += 1;
  return `fr-${fulfillSeq}`;
}

/* ============ X-MARKET-12 三权映射（治-管-办防呆约束，内存 store 等价实现） ============ */

/** 动作→权位→帽 硬约束映射（重启随种子重置；结构照 G7 market_power_map 设计） */
export const marketPowerMap: MarketPowerMapRow[] = [
  { action_code: 'supplier_apply', action_name: '供应商登记', power_bit: 'manage', allow_hats: ['YU', 'EU', 'HU', 'TU'], forbid_hats: [], tier: 'edge', scope: 'booth', governance: 'VDM 评估', escalate_rule: '', enabled: true },
  // X-MARKET-ROLE-01 治理分线：四源治理动作 allow = VDM 统筹 + VEM/VHM/VYM/VTM 家族（按本源域）；
  // VDM 归 market 经营治理（经营管理），不再参与四源准入/货品/采购审批（allow 移除 VDM）
  { action_code: 'supplier_evaluate', action_name: '供应商评估（通过/驳回）', power_bit: 'govern', allow_hats: ['VDM', 'VEM', 'VHM', 'VYM', 'VTM'], forbid_hats: ['YU', 'EU', 'HU', 'TU', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'NONE'], tier: 'cloud', scope: 'cross_tenant', governance: '审批留痕（四源分线：家族帽仅本源域，端点域校验；V*U 平台方监管系 VEU/VYU/VHU/VTU/VCU+VDU 全域壳 · X-MARKET-18 域内审批记 V*M 管家帽，总级归 O*M）', escalate_rule: '', enabled: true },
  { action_code: 'product_publish', action_name: '货品上架', power_bit: 'manage', allow_hats: ['YU', 'EU', 'HU', 'TU'], forbid_hats: ['NONE'], tier: 'edge', scope: 'booth', governance: '平台治理下架', escalate_rule: '', enabled: true },
  { action_code: 'product_remove', action_name: '货品下架', power_bit: 'manage', allow_hats: ['YU', 'EU', 'HU', 'TU'], forbid_hats: ['NONE'], tier: 'edge', scope: 'booth', governance: '平台治理下架', escalate_rule: '', enabled: true },
  { action_code: 'product_govern_remove', action_name: '治理下架（平台运营）', power_bit: 'govern', allow_hats: ['VDM', 'VEM', 'VHM', 'VYM', 'VTM'], forbid_hats: ['YU', 'EU', 'HU', 'TU', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'NONE'], tier: 'cloud', scope: 'cross_tenant', governance: '治理动作（四源分线：家族帽仅本源域，端点域校验；V*U 平台方监管系 VEU/VYU/VHU/VTU/VCU+VDU 全域壳 · X-MARKET-18）', escalate_rule: '', enabled: true },
  { action_code: 'procurement_order', action_name: '采购商城一键下单', power_bit: 'manage', allow_hats: ['DU'], forbid_hats: ['NONE', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM'], tier: 'edge', scope: 'booth', governance: '大额升级 V*M（逻辑归 X-MARKET-15，本单只落映射）', escalate_rule: '单笔金额 ≥ 阈值时升级 V*M 审批（X-MARKET-15）', enabled: true },
  { action_code: 'market_inquiry', action_name: 'B2B 发起询价', power_bit: 'manage', allow_hats: ['DU', 'XU', 'CU'], forbid_hats: ['NONE', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM'], tier: 'edge', scope: 'booth', governance: '价格治理', escalate_rule: '', enabled: true },
  { action_code: 'bid_quote', action_name: 'B2B 报价', power_bit: 'manage', allow_hats: ['DU'], forbid_hats: ['NONE', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM'], tier: 'edge', scope: 'booth', governance: '价格治理', escalate_rule: '', enabled: true },
  { action_code: 'contract_sign', action_name: 'B2B 签订合同', power_bit: 'manage', allow_hats: ['DU', 'XU', 'CU'], forbid_hats: ['NONE', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM'], tier: 'edge', scope: 'booth', governance: '价格治理', escalate_rule: '', enabled: true },
  { action_code: 'booth_new', action_name: '上新铺', power_bit: 'manage', allow_hats: ['DU', 'YU', 'EU', 'HU', 'TU'], forbid_hats: ['NONE', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM'], tier: 'edge', scope: 'booth', governance: '—', escalate_rule: '', enabled: true },
  // X-MARKET-15 阈值自动升级：采购单笔金额 > 阈值 → PENDING_APPROVAL，本动作由治位审批后才生效
  { action_code: 'order_approval', action_name: '大额采购治理审批（通过/驳回）', power_bit: 'govern', allow_hats: ['VDM', 'VEM', 'VHM', 'VYM', 'VTM'], forbid_hats: ['YU', 'EU', 'HU', 'TU', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'NONE'], tier: 'cloud', scope: 'cross_tenant', governance: '大额采购升级审批（X-MARKET-15；X-MARKET-ROLE-01 归 supply 面 V*M 家族；V*U 平台方监管系+VDU 壳 · X-MARKET-18 域内审批记 V*M 管家帽）', escalate_rule: '仅可审批 pending_approval 采购单；DU 不可自批', enabled: true },
  { action_code: 'threshold_update', action_name: '采购单笔阈值配置', power_bit: 'govern', allow_hats: ['VDM', 'VEM', 'VHM', 'VYM', 'VTM'], forbid_hats: ['YU', 'EU', 'HU', 'TU', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'NONE'], tier: 'cloud', scope: 'platform', governance: '规则治理（X-MARKET-15；配置入口归四源管家审批台；V*U 平台方监管系+VDU 壳 · X-MARKET-18）', escalate_rule: '', enabled: true },
  // X-MARKET-16 执行帽穿透追责：履约作业由执行帽落地（办位纯动作）；DU 须以执行帽身份执行（服务端按订单域映射，客户端不可伪造）
  { action_code: 'exec_fulfill', action_name: '作业履约执行（交付回执）', power_bit: 'operate', allow_hats: ['DYX', 'DHX', 'DTX', 'DEX', 'DCX'], forbid_hats: ['DU', 'XU', 'CU', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM', 'NONE'], tier: 'edge', scope: 'booth', governance: '执行帽作业（X-MARKET-16 穿透追责）', escalate_rule: '审计 actor_user=真实登录人、actor_hat=域映射执行帽', enabled: true },
  // X-SUPPLY-01 供给四源集市：登记/入驻与 Booth-E 铺子维护 = 办位（EX/EXX）；管位（EU/EMX 资质提交）与治位（VDM 准入治理）归 X-SUPPLY-02
  { action_code: 'supply_register', action_name: '供给集市入驻登记', power_bit: 'operate', allow_hats: ['EX', 'EXX'], forbid_hats: ['EU', 'HU', 'YU', 'TU', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM', 'XU', 'CU', 'NONE'], tier: 'edge', scope: 'booth', governance: 'X-Supply 准入（治理归 X-SUPPLY-02）', escalate_rule: '办位动作管位不代办（EU 登记即 403）', enabled: true },
  { action_code: 'supply_booth_maintain', action_name: '供给铺面维护（Booth-E）', power_bit: 'operate', allow_hats: ['EX', 'EXX'], forbid_hats: ['EU', 'HU', 'YU', 'TU', 'DU', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM', 'XU', 'CU', 'NONE'], tier: 'edge', scope: 'booth', governance: '仅本铺（containerId 校验前置）', escalate_rule: '跨铺维护前置 403 不入审计', enabled: true },
  { action_code: 'supply_order_initiate', action_name: '供给单发起（询价下单）', power_bit: 'manage', allow_hats: ['DU'], forbid_hats: ['EU', 'HU', 'YU', 'TU', 'EX', 'EXX', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM', 'XU', 'CU', 'NONE'], tier: 'edge', scope: 'booth', governance: 'X-Supply 采购主体=DU 唯一经营号（X-SUPPLY-02）', escalate_rule: '', enabled: true },
  { action_code: 'supply_order_accept', action_name: '供给单接单', power_bit: 'manage', allow_hats: ['EU', 'HU', 'YU', 'TU'], forbid_hats: ['DU', 'EX', 'EXX', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM', 'XU', 'CU', 'NONE'], tier: 'edge', scope: 'booth', governance: '供给方管位经营决策，仅本铺（X-SUPPLY-02）', escalate_rule: '', enabled: true },
  { action_code: 'supply_order_quote', action_name: '供给单报价', power_bit: 'manage', allow_hats: ['EU', 'HU', 'YU', 'TU'], forbid_hats: ['DU', 'EX', 'EXX', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM', 'XU', 'CU', 'NONE'], tier: 'edge', scope: 'booth', governance: '接单后报价，仅本铺（X-SUPPLY-02）', escalate_rule: '', enabled: true },
  { action_code: 'supply_order_confirm', action_name: '供给单报价确认', power_bit: 'manage', allow_hats: ['DU'], forbid_hats: ['EU', 'HU', 'YU', 'TU', 'EX', 'EXX', 'DYX', 'DHX', 'DTX', 'DEX', 'DCX', 'VDM', 'VEM', 'VHM', 'VYM', 'VTM', 'VDM', 'XU', 'CU', 'NONE'], tier: 'edge', scope: 'booth', governance: 'DU 确认报价成单（X-SUPPLY-02 基础闭环终态）', escalate_rule: '', enabled: true },
];

/** 三权审计（本单建结构+写入通路；查询界面归 X-MARKET-13） */
export const marketPowerAudit: MarketPowerAuditRow[] = [];

/** X-MARKET-15 治理阈值配置（规则模块配置存储，内存态重启还原默认 5000 元） */
export const governThresholds: GovernThresholds = { procurementAmountCents: 500000, updatedAt: '', updatedBy: '' };

let powerAuditSeq = 0;
export function nextPowerAuditId(): string {
  powerAuditSeq += 1;
  return `pa-${powerAuditSeq}`;
}

/* ============ X-MARKET-TI-02 ③：三权审计落盘持久化 ============ */
// 修复「治理看板审计覆盖度 0/19 与『我的留痕』22 条并存」——真因是内存审计随进程重启清空（覆盖度与留痕同源，观察时序错位）。
// 进程启动时从磁盘恢复审计行（含 id 序列起点同步），写入侧防抖落盘；dashboard 聚合与 audit 端点同源 marketPowerAudit，无需改口径。
const AUDIT_FILE = process.env.XM_AUDIT_FILE || '/tmp/xm-power-audit.json';
const AUDIT_KEEP = 5000;
let auditSaveTimer: ReturnType<typeof setTimeout> | null = null;
export function persistPowerAudit(): void {
  try {
    writeFileSync(AUDIT_FILE, JSON.stringify(marketPowerAudit.slice(-AUDIT_KEEP)));
  } catch {
    /* 落盘失败不阻断审计主流程 */
  }
}
export function schedulePowerAuditPersist(): void {
  if (auditSaveTimer) return;
  auditSaveTimer = setTimeout(() => {
    auditSaveTimer = null;
    persistPowerAudit();
  }, 500);
}
(function loadPowerAudit(): void {
  try {
    const raw = readFileSync(AUDIT_FILE, 'utf8');
    const rows = JSON.parse(raw) as MarketPowerAuditRow[];
    if (!Array.isArray(rows)) return;
    for (const r of rows) {
      if (r && typeof r.id === 'string' && typeof r.action_code === 'string' && (r.result === 'allowed' || r.result === 'denied' || r.result === 'escalated')) {
        marketPowerAudit.push(r);
      }
    }
    // 同步审计 id 序列起点（pa-N 取历史最大，避免重启后 id 回绕重复）
    for (const r of marketPowerAudit) {
      const m = /^pa-(\d+)$/.exec(r.id);
      if (m) powerAuditSeq = Math.max(powerAuditSeq, Number(m[1]));
    }
  } catch {
    /* 首次启动/文件损坏 → 空表 */
  }
})();

/* ============ X-SUPPLY-01：供给集市数据层已迁 server/x-supply/store.ts（补充约束：供给表与经营数据隔离） ============ */

/** 把请求方帽规范化为映射口径：客户端帽（XU/CU）与无帽一律记 NONE（客户无帽，直访管理/治理动作=403） */
export function normalizePowerHat(hatRole: string | undefined | null): PowerHat {
  if (!hatRole) return 'NONE';
  // XU/CU 保留原帽参与 allow/forbid 匹配（B2B 双边 allow 依赖原帽）；NONE 仅表匿名/无帽
  return hatRole as PowerHat;
}

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
