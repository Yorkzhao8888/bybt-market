/* ============ X-Supply 供给四源集市 · 供给数据源归一（X-SUPPLY-01） ============ *
 * 供给面 API 单一出口：
 *  - 新（X-SUPPLY-01）：supplyHub（供给列表只读，XU/CU 403）/ supplyRegister（入驻登记，EX/EXX 办位）
 *    / supplyBoothMaintain（Booth-E 铺子维护，EX/EXX 仅本铺）
 *  - 归口（X-MARKET-08 存量）：准入申请 / 货品 / 采购商城 / DU 采购合同
 * 红线：四源入口不对客户露出；穿透字段 actor_hat/governor 不大号化（双称呼红线）
 */
import { api } from './client';
import type {
  SupplyHubData,
  SupplyHubEntry,
  SupplyHubBooth,
  SupplierApplication,
  SupplierProduct,
  SupplyMallItem,
  SupplyContract,
} from '../../shared/types';

export type { SupplyHubData, SupplyHubEntry, SupplyHubBooth };

/** 供给集市（读：EU/HU/YU/TU/EX/EXX/DU/执行帽/V*M；XU/CU 一律 403） */
export const supplyHub = () => api.supplyHub();

/** 入驻登记（办位 EX/EXX；EU 管位不代办 → 403 权位口径） */
export const supplyRegister = (payload: { boothId: string; qualification: string; note?: string }) =>
  api.supplyRegister(payload);

/** Booth 铺面维护（办位 EX/EXX，仅本铺：本铺校验前置 403） */
export const supplyBoothMaintain = (boothId: string, payload: { frontDesc?: string; backDesc?: string }) =>
  api.supplyBoothMaintain(boothId, payload);

/** 命名空间出口（SupplyHub 页统一引用） */
export const supplyApi = { hub: supplyHub, register: supplyRegister, maintain: supplyBoothMaintain };

/* ---- X-MARKET-08 归口（存量接口经此单一出口引用） ---- */
export const submitApplication = api.submitApplication;
export const myApplication = api.myApplication;
export const allApplications = api.allApplications;
export const reviewApplication = api.reviewApplication;
export const myProducts = api.myProducts;
export const allProducts = api.allProducts;
export const addProduct = api.addProduct;
export const toggleProduct = api.toggleProduct;
export const takeDownProduct = api.takeDownProduct;
export const supplyMallList = api.supplyMall;
export const supplyContracts = api.supplyContracts;

export type { SupplierApplication, SupplierProduct, SupplyMallItem, SupplyContract };
