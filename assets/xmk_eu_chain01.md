# XMK-EU-CHAIN-01 供给链收口大单（大单制：连续执行到交付，一次回报）

## 背景
主人企业推演 EU 断链收口：企业准入审批从未端到端走过；EU 上架卖货链未通；企业采购 C/B 双开放（主人拍板：mall 与 goods 都开放，按企业需求）。ZiwayOS 侧 SupplyHub 已按态分流（并行单），本单收口 Market 侧供给链。

## 目标

### A（P0）准入审批端到端闭环
- 状态机：submitted → reviewing → approved / rejected（附原因，可重提）
- 审批主体按 X-MARKET-08 定版口径（VXM 评估统筹）+GOV-01 治理体系现状对齐，不新造帽
- 审批操作面挂 /api/governance/*（治理命名空间独立，XVPZ 帽守卫）
- 状态回写：GET /api/supply/profile 返回审批态（ZiwayOS SupplyHub 反向代理自动可见）
- E2E：提交→审批→合格→profile 态变 approved→驳回场景→重提

### B（P0）EU 上架卖货链
- 供集经营台上架 API：合格供应商上架货品（名称/品类/规格/报价/单位/库存，可下架）
- 上架主体=准入 approved 的供给身份（XEPZ 系供给帽）
- DU 采购商城承接：合格供应商货品进商城可见（X-MARKET-08 口径：仅 DU 可见）
- 治理联动：治理可下架违规货品（GOV-01 freeze 联动已有先例）

### C（P1）/goods B 端采购下单
- 企业（DU 系）在 /goods 一键下单→采购单落库（X-MARKET-08：复用 EX-/YX- 采购单口径）
- mall C 端（消费者零售）与 goods B 端（企业采购）双轨并存，按企业需求选择
- B 端下单守卫：企业身份可下、匿名引导登录、CU 按矩阵

### D 品牌口径（轻）
- 界面品牌露出可用「百泰OS」；**bybt/百业百泰零出现**

## 红线
- 六套回归零破（embed-e2e 8/8+embed-diag 12/12+exchange 7/7+api01 33/33+gov01 38/38+oneclick 48/48）+crm-ui-check 27/27+mall-check 22/22
- 身份矩阵不变；嵌入四消息协议不动；API 契约冻结面不破；治理命名空间独立
- 真实落库禁 mock；新增 check 建议名 eu-chain-check

## 验收回报（一次）
commit hash + eu-chain-check 结果 + 六套回归 + 截图（assets/euchain01/）+ 端到端证据（提交→审批→上架→下单全链）
