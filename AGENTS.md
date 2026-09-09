# 项目上下文

## 产品定位

**X-Market 五域集市系统**（基于 ZiwayOS v2.2 口径）：

- **Market 系统 = 交易平台/铺面层**：五大专业市场（Y 智场 / E 通货 / H 人资 / T 技术 / DE 产品）、铺面（Booth 铺面）、询价→报价→合同→下单 B2B 闭环、DU 经营台、V*M 运营方治理。不经营、不持资源、不执行作业系统。
- **Booth 实体系统 = 经营实体/作业层**（另一窗口实现，本项目仅占位标注）：Booth 实体 + FAB/WH/DL/SVC/LAB 五大作业系统。
- **价值链**：供给方 Booth-Y/E/H/T（YU/EU/HU/TU 源头产能）→ DU 经营实体 Booth-DY/DH/DT/DE/DC（组织经营）→ Market(Mall)/客户界面。
- **Booth 权属（LOCKED）**：供给实体归各自供给帽；五类 DU 经营实体全部归 DU（唯一经营主体，直营或加盟）；执行帽一一对应 DYX/DHX/DTX/DEX/DCX；跨主体使用他方 Booth = 越权禁止。
- **客户双界面**：XU 企业客户走 Market（B 端）；CU 自然人走 Mall（C 端）；DCX（Booth-DC）在 Mall 面，DEX/DYX/DHX/DTX 在 Market 面。
- 域开店限制：Y/H/DE 可加盟；E/T 仅平台直营 DU。
- 订单六族 C/D/H/E/Y/T；资金流三段 XCASE→ERP→X-FIN。

## 技术栈

- **核心**: Vite 7, TypeScript, Express（单端口 5000，Vite middleware 挂 API + SPA）
- **UI**: Tailwind CSS，React 19
- **共享类型**: `shared/types.ts`（前后端唯一类型源，import 自 `../../shared/types`）

## 目录结构

```
├── scripts/            # 构建与启动脚本（dev.sh 含 1200s 自动回收）
├── shared/types.ts     # 共享类型（DomainMeta/Booth/BoothRow/Order/Inquiry/ProfessionalMarket/SessionUser 等）
├── server/
│   ├── domainConfig.ts # 五域元信息、帽表、JOB_SYSTEMS、chainLabel、duExecHatOf/boothOwnerRole/canOpenMarket
│   ├── store.ts        # 种子数据 + store() 单例 + nextSeq/nextOrderCode/containerById/unitById/domainStats
│   ├── auth.ts         # xm_ token 会话
│   ├── routes/index.ts # 全部 API（含身份权限过滤 P1/P3/P5）
│   ├── server.ts       # Express 入口
│   └── vite.ts         # Vite 中间件
├── src/
│   ├── api/client.ts   # api.*（login/oneclick/markets/marketBooths/inquiries/orders/governCases/supply*...）
│   ├── lib/domain.ts   # 颜色/帽标签/canOperate/canOpenMarket/marketLabel 等 helper
│   ├── components/     # ui.tsx / InquiryList.tsx（B2B 询价列表，Market 与 OperatorDesk 共用）
│   ├── pages/          # Home/Login/Mall/MallBooth/Market(客户工作台)/MarketBooth/Orders/Model/Govern(治理工作台)/SupplyMall/SupplyDesk(供应商工作台)/OperatorDesk(经营者工作台)
│   ├── Auth.tsx        # AuthContext
│   └── App.tsx         # 路由 + RoleGuard 角色守卫（未授权 403 兜底）+ Header 按角色收敛导航与主题徽标
└── index.html
```

## API 清单（/api 前缀）

- auth: POST login(password=test123) / oneclick(demoId) / GET me / GET demos / POST logout
- overview: GET（首页五域链路）
- model: GET containers / units / hierarchy / markets（五大市场+权属）
- mall: GET listings / booths（DCX 门店，C 端）
- market: GET booths / GET booths/:id / POST booths（开新铺，按域校验铺主帽）/ POST inquiries / GET inquiries / POST inquiries/:id/quote / inquiries/:id/contract
- orders: GET（按身份过滤：客户只见自己、DU 见名下多店、运营方见管辖域）/ POST（支持 side/inquiryId）/ GET families
- flows: GET（订单流/资源流/资金流三段 + INVOICE 发票流（供给方→DU→客户）+ AFTER_SALES 售后 SLA（责任转移点=交付回执））
- govern: GET cases（V*M 运营治理：市场秩序/规则制定/Booth 系统供给）
- market: GET supply-contracts（DU 采购合同，仅 DU/V*M 可见，客户 403）
- supply 准入+采购商城（X-MARKET-08）：POST supply/applications（供给帽登记，upsert 单条） / GET supply/applications（V*M 审核列表，带 supplierName/boothCode） / GET supply/applications/mine（供给帽） / POST supply/applications/:id/review {action:approve|reject,rejectReason}（仅 VXM） / GET/POST supply/products（供给帽货品，需 approved） / POST supply/products/:id/toggle（供给帽上下架） / POST supply/products/:id/take-down（VXM 治理下架） / GET supply/mall（**仅 DU/执行帽**，合格供应商+在架货品；客户 403 隔离提示）
- 采购单：POST orders 传 {supplierProductId, qty} → 按货品所属域生成族码（如 T 域 TX-2026-xxxx）+ Order.supplierId 关联；orders GET du/exec 分支含 buyer 血缘（DU 见自己采购单），supply 分支按 ownerUnitId（供给方见名下 Booth 单据）
- 隔离口径（补充单2）：客户视角 GET market/booths 只下发 kind='du' 铺；供给实体铺对客户 404；客户界面经 TRUST_EXPOSURE（shared/types）露出质检/脱敏产地/服务等级/交付时效/售后，严禁露出供给方名称/进价/联系方式/DU 采购合同

## 权限口径（服务端强制）

- 客户（CU/XU）：不可开铺/上架/报价（403），不可进入开铺面板；orders 只见 buyerContainerId === 自己容器；**采购商城直访 403 隔离提示**（SupplyMall 页面 catch 同口径）。
- DU：开 du 实体铺（E/T 域仅直营）、报价、名下多店订单总览、**采购商城一键下单（唯一可与供给方交易的主体）**。
- 供给帽（EU/HU/TU/YU）：开 supply 实体铺（本域）；供应商准入登记（驳回可重提）→ 合格后货品上架/下架。
- V*M（VEM/VYM/VHM/VTM/VDM）：全域订单总账 + 治理台。
- **VXM（云中心运营审批统筹，demoId=vxm-cloud）**：供应商审核（通过/驳回附原因）、治理下架违规货品；审核列表 V*M 可见、审批操作仅 VXM。
- 交易单向（P0）：供给实体铺仅 DU/执行帽可下单；客户越权采购 403；采购商城数据只在 DU/供给方/V*M 间流转。

## 三权映射（X-MARKET-12，治-管-办防呆）

- **权位**：治 govern（VXM/VEM/VHM/VYM/VTM/VDM 云审批评估）/ 管 manage（DU 经营决策 + YU/EU/HU/TU 供给经营）/ 办 operate（执行帽作业）；匿名/无帽归 `NONE`（`normalizePowerHat`），XU/CU 保留原帽参与 allow/forbid 匹配（B2B 双边 allow 依赖原帽，归一 NONE 会让 allow 失效）。权位→帽授予表：`shared/types.ts` `HAT_POWER_BITS`。
- **结构**（内存 store，重启清空）：`server/store.ts` `marketPowerMap`（10 动作种子）+ `marketPowerAudit`（审计留痕，allowed/denied 全记）。
- **执行点**：`server/routes/index.ts` `checkPower(actionCode, req, res, boothCode?)`——9 个写入口前置校验：`booth_new`/`market_inquiry`/`bid_quote`/`contract_sign`/`procurement_order`/`supplier_apply`/`supplier_evaluate`/`product_publish`/`product_remove`/`product_govern_remove`。无映射行默认拒绝+告警；帽∉allow 或∈forbid→403 带权位口径文案（如「supplier_evaluate 属治位，DU 无此权」）；tier=cloud 需云帽。
- **查询**：GET `/api/power/map`（任意登录）；GET `/api/power/audit`（治位帽全量，其余见本人留痕；界面归 13）。
- **启动交叉校验**：`crossCheckPowerMap()` 启动时比对 map.allow_hats 与 HAT_POWER_BITS，不一致 `console.warn('[POWER-MAP] ...')` 不阻断。
- **B2B 双边 allow 偏差**：`market_inquiry`/`contract_sign` 工单表 allow={DU}，但 B2B 询价/签约由客户发起（XU 询价→DU 报价→XU 签约），落库为 `{DU,XU,CU}` 保回归红线；`bid_quote` 仅 {DU}。
- **toggle 动作选择**：`/supply/products/:id/toggle` owner 路径按目标状态选 action（on→off 记 `product_remove`，off→on 记 `product_publish`）；治理路径放宽为治位帽（VXM/VEM/VDM）记 `product_govern_remove`；其余身份走 `product_remove` 必 deny 兜底。
- **take-down 治理下架**：`POST /supply/products/:id/take-down` 独立路由接入 `product_govern_remove`（仅下架不代上架）；X-MARKET-12 补修补注册，前端 api.takeDownProduct 依赖它。
- **审计查看界面（X-MARKET-13）**：`GET /api/power/audit` 支持可选 `action`/`result`（allowed|denied）筛选，默认无参行为不变；治位帽全量、其余按 `actor_user === 本人 hatId` 裁剪（XU/CU 保留原帽）。前端共享组件 `src/components/PowerAuditList.tsx`（scope='all'|'mine'，compact 紧凑模式）：Govern 台「三权审计」页（全量+筛选）；OperatorDesk/SupplyDesk 侧导航「我的留痕」、Market/Mall 底部紧凑块；越权 denied 尝试在工作台可见，形成「越权→403→审计→可查」闭环。API：`api.powerAudit(query?)` / `api.powerMap()`。
- **三权标识显性化（X-MARKET-11）**：`src/lib/domain.ts` `POWER_BADGE`（治·云审批紫 #6D28D9 / 管·端决策橙 #B45309 / 办·端执行蓝 #1D4ED8）+ `src/components/PowerBadge.tsx`（kind='govern'|'manage'|'operate'，text=false 仅徽章）。挂点：Govern 审核/治理下架（治）、SupplyMall 下单、SupplyDesk 登记/货品上下架、InquiryList 报价/签约（Market/OperatorDesk 共用）、Market 询价、OperatorDesk 开铺（管）。OperatorDesk 侧栏分「经营决策（管）」/「作业执行（办）」两组，办组（履约衔接 DYX/门店销执行 DCX）展示-only → sec='exec' 说明卡（操作归执行帽，Booth 实体系统）；Govern 顶部边界文案「只审不落：评估≠下单、治理下架≠经营」。403 权位口径感知：Govern(msgErr)/SupplyMall(msgErr)/SupplyDesk(pErr)/InquiryList(err 红条)/Market(inqErr) 服务端权位文案以红色错误态呈现。
- **治-管-办运行看板（X-MARKET-14）**：`GET /api/power/dashboard`（治位帽 only：VXM/VEM/VDM，非治位 403 带「属治位」权位口径）——数据同源聚合 marketPowerAudit + supplierApplications/supplierProducts：volume/volume7d/volume30d（allowed 审计按 power_bit 分组，7d/30d 按 ts 窗口）、timeliness（已裁决申请 createdAt→最近一次 allowed `supplier_evaluate` 审计 ts 的平均小时，无数据 null）、coverage（audit distinct action_code 数 / marketPowerMap.length 百分比）、todo（pendingReviews 待评估申请 / listedProducts 在架货品 / governedCount 治理下架累计）。audit 端点另补 `timeFrom`/`timeTo`（毫秒时间戳，可选，默认无参行为不变）。前端 `src/components/PowerDashboard.tsx` 挂 Govern「全局数据」顶部：四块卡（权位动作量+7d/30d 切换、审批时效、审计覆盖度、待办队列）+快照时间。API：`api.powerDashboard()`；类型 `shared/types.ts` `PowerDashboard`。

## 四类角色工作台（X-MARKET-09）

- **登录落点**：Login 成功后按 `workbenchOf(hatRole)` 跳 `WORKBENCH_HOME`——客户 CU/XU→`/market`（CU entry=C→`/mall`）、供给帽 YU/EU/HU/TU→`/supplier`、DU+执行帽→`/operator`、V*M/VXM→`/govern`；带 `boothTarget` 时优先跳铺面详情。
- **主题色**（`src/lib/domain.ts` WORKBENCH_THEME，用于顶栏激活态/侧栏/身份徽标/主按钮；全局浅米白+炭黑不变）：客户蓝 `#1D4ED8`（浏览引导型：五市场 tab+DU 铺网格+B2B 询价面板）、供应商绿 `#15803D`（业务操作型：登记/货品/采购单/产能）、经营者橙 `#B45309`（驾驶舱型：KPI 总览/五域铺面/采购商城/采购单/合同/上新铺/询价报价）、治理者紫 `#6D28D9`（管控型：供应商审核/治理案件/规则/全局数据）。
- **路由守卫**：App.tsx `RoleGuard` 按 `workbenchOf` 判断——客户直访 /supplier、/operator、/govern，供给方直访 /operator 等一律 403 兜底页（含"返回我的工作台"）；/supply-mall 保持服务端 403+页面隔离提示口径。
- **导航收敛**：Header 按角色渲染（客户 Market/Mall/交易单；供给商 供给台/交易单；经营者 经营台/采购商城/交易单；治理者 治理台/交易单）+ 主题色身份徽标（工作台类别·单位名）。
- **红线**：B2B 报价入口保留在 InquiryList（Market 与 OperatorDesk 共用）；orders 按身份过滤、隔离 12-14 条款不破。

## 调试要点

- dev server（tsx watch）修改 server 代码后**不会**可靠热重载路由/store：需 `kill -9 $(cat /app/work/logs/bypass/server.pid)` + `pkill -9 -f 'ts[x] watch'` 后 `(nohup bash ./scripts/dev.sh > logs/dev-start.log 2>&1 &)` 重启。
- `pkill -f` 模式务必用 `[]` 规避自匹配（如 `ts[x] watch`）。
- dev.sh 有 1200s 自动回收，探活失败先重启再查日志。
- test_run 冒烟：pipeline 会在 curl 输出尾部追加 `HTTP_CODE:` 行，用 python json.load 会报 Extra data，断言用 grep；oneclick 参数名是 `demoId`。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、Express `req`/`res`、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。
- 前后端字段命名以 `shared/types.ts` 为唯一口径，页面/客户端禁止私造字段名。
