// X-Supply 供给四源集市 · 域出口（X-SUPPLY-01 补充约束：路由域边界收口）
// X-Market 壳层（App.tsx）仅从此出口引入 X-Supply 组件/路由，不深入域内文件。
export { default as XSupplyHub } from './pages/SupplyHub';
export { xSupplyApi } from './api/du-supply';
