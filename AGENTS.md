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
├── shared/
│   ├── types.ts        # 共享类型（DomainMeta/Booth/BoothRow/Order/Inquiry/ProfessionalMarket/SessionUser 等，唯一公共底座）
│   └── x-supply.ts     # X-Supply 独立类型契约（XSupplyEntry/XSupplyBooth/XSupplyHubData，仅依赖 ./types）
├── server/
│   ├── domainConfig.ts # 五域元信息、帽表、JOB_SYSTEMS、chainLabel、duExecHatOf/boothOwnerRole/canOpenMarket
│   ├── store.ts        # 种子数据 + store() 单例 + nextSeq/nextOrderCode/containerById/unitById/domainStats
│   ├── auth.ts         # xm_ token 会话 + 登录底座公共契约（AuthReq/AuthRes/requireAuth/optionalAuth/roleOf）
│   ├── power.ts        # 三权公共底座（checkPower/powerAudit/boothCodeOf/crossCheckPowerMap）
│   ├── x-supply/       # X-Supply 后端域（routes.ts 三端点 + store.ts 独立供给表 xSupplyEntries）
│   ├── routes/index.ts # X-Market 全部 API（含身份权限过滤 P1/P3/P5；mount /api/supply → x-supply/routes）
│   ├── server.ts       # Express 入口
│   └── vite.ts         # Vite 中间件
├── src/
│   ├── api/client.ts   # api.*（login/oneclick/markets/marketBooths/inquiries/orders/governCases...）+ export req http 原语
│   ├── x-supply/       # X-Supply 前端域（api/du-supply.ts 数据层 + pages/SupplyHub.tsx 组件 XSupplyHub + index.ts）
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
- **治理分线（X-MARKET-ROLE-01）**：**VDM（经营管理治理，demoId=vdm）**：market 经营面——/govern 治理台（治理案件/全局订单总账/规则只读/三权审计/全局数据）+ supply 面 hub/applications 403 隔离；**V*M 四源家族（VXM/VEM/VHM/VYM/VTM）**：supply 治理面（governSupply 工作台落 /supply）——四源分视图各治本源（VEM 管 E 源/EU、VYM 管 Y 源/YU、VHM 管 H 源/HU、VTM 管 T 源/TU，域映射 `domainConfig.GOVERN_SUPPLY_DOMAIN_OF`+`supplyGovernDomainOf`/`isSupplyGovernHat` 公共底座），VXM 统筹全域+大额采购审批+阈值配置；两线互不越界（VDM applications/hub 403、家族 govern/cases 403、orders admin 分支 VDM 全量/家族仅 pending_approval|rejected 审批队列）。
- **VXM（云中心运营审批统筹，demoId=vxm-cloud）**：四源准入全域审核（通过/驳回附原因）、治理下架、大额采购审批、阈值配置；审核列表家族按域可见、审批操作=VXM 全域+对应域家族帽。
- 交易单向（P0）：供给实体铺仅 DU/执行帽可下单；客户越权采购 403；采购商城数据只在 DU/供给方/V*M 间流转。

## 三权映射（X-MARKET-12，治-管-办防呆）

- **权位**：治 govern（VXM/VEM/VHM/VYM/VTM/VDM 云审批评估）/ 管 manage（DU 经营决策 + YU/EU/HU/TU 供给经营）/ 办 operate（执行帽作业）；匿名/无帽归 `NONE`（`normalizePowerHat`），XU/CU 保留原帽参与 allow/forbid 匹配（B2B 双边 allow 依赖原帽，归一 NONE 会让 allow 失效）。权位→帽授予表：`shared/types.ts` `HAT_POWER_BITS`。
- **结构**（内存 store，重启清空）：`server/store.ts` `marketPowerMap`（10 动作种子）+ `marketPowerAudit`（审计留痕，allowed/denied 全记）。
- **执行点**：`server/routes/index.ts` `checkPower(actionCode, req, res, boothCode?)`——9 个写入口前置校验：`booth_new`/`market_inquiry`/`bid_quote`/`contract_sign`/`procurement_order`/`supplier_apply`/`supplier_evaluate`/`product_publish`/`product_remove`/`product_govern_remove`。无映射行默认拒绝+告警；帽∉allow 或∈forbid→403 带权位口径文案（如「supplier_evaluate 属治位，DU 无此权」）；tier=cloud 需云帽。
- **查询**：GET `/api/power/map`（任意登录）；GET `/api/power/audit`（治位帽全量，其余见本人留痕；界面归 13）。
- **启动交叉校验**：`crossCheckPowerMap()` 启动时比对 map.allow_hats 与 HAT_POWER_BITS，不一致 `console.warn('[POWER-MAP] ...')` 不阻断。
- **B2B 双边 allow 偏差**：`market_inquiry`/`contract_sign` 工单表 allow={DU}，但 B2B 询价/签约由客户发起（XU 询价→DU 报价→XU 签约），落库为 `{DU,XU,CU}` 保回归红线；`bid_quote` 仅 {DU}。
- **toggle 动作选择**：`/supply/products/:id/toggle` owner 路径按目标状态选 action（on→off 记 `product_remove`，off→on 记 `product_publish`）；治理路径放宽为四源治理帽（VXM/VEM/VHM/VYM/VTM，ROLE-01 起 VDM 移出——域校验家族仅本源货品）记 `product_govern_remove`；其余身份走 `product_remove` 必 deny 兜底。
- **take-down 治理下架**：`POST /supply/products/:id/take-down` 独立路由接入 `product_govern_remove`（仅下架不代上架）；X-MARKET-12 补修补注册，前端 api.takeDownProduct 依赖它。
- **审计查看界面（X-MARKET-13）**：`GET /api/power/audit` 支持可选 `action`/`result`（allowed|denied）筛选，默认无参行为不变；治位帽全量、其余按 `actor_user === 本人 hatId` 裁剪（XU/CU 保留原帽）。前端共享组件 `src/components/PowerAuditList.tsx`（scope='all'|'mine'，compact 紧凑模式）：Govern 台「三权审计」页（全量+筛选）；OperatorDesk/SupplyDesk 侧导航「我的留痕」、Market/Mall 底部紧凑块；越权 denied 尝试在工作台可见，形成「越权→403→审计→可查」闭环。API：`api.powerAudit(query?)` / `api.powerMap()`。
- **三权标识显性化（X-MARKET-11）**：`src/lib/domain.ts` `POWER_BADGE`（治·云审批紫 #6D28D9 / 管·端决策橙 #B45309 / 办·端执行蓝 #1D4ED8）+ `src/components/PowerBadge.tsx`（kind='govern'|'manage'|'operate'，text=false 仅徽章）。挂点：Govern 审核/治理下架（治）、SupplyMall 下单、SupplyDesk 登记/货品上下架、InquiryList 报价/签约（Market/OperatorDesk 共用）、Market 询价、OperatorDesk 开铺（管）。OperatorDesk 侧栏分「经营决策（管）」/「作业执行（办）」两组，办组（履约衔接 DYX/门店销执行 DCX）展示-only → sec='exec' 说明卡（操作归执行帽，Booth 实体系统）；Govern 顶部边界文案「只审不落：评估≠下单、治理下架≠经营」。403 权位口径感知：Govern(msgErr)/SupplyMall(msgErr)/SupplyDesk(pErr)/InquiryList(err 红条)/Market(inqErr) 服务端权位文案以红色错误态呈现。
- **治-管-办运行看板（X-MARKET-14）**：`GET /api/power/dashboard`（治位帽 only：VXM/VEM/VDM，非治位 403 带「属治位」权位口径）——数据同源聚合 marketPowerAudit + supplierApplications/supplierProducts：volume/volume7d/volume30d（allowed 审计按 power_bit 分组，7d/30d 按 ts 窗口）、timeliness（已裁决申请 createdAt→最近一次 allowed `supplier_evaluate` 审计 ts 的平均小时，无数据 null）、coverage（audit distinct action_code 数 / marketPowerMap.length 百分比）、todo（pendingReviews 待评估申请 / listedProducts 在架货品 / governedCount 治理下架累计）。audit 端点另补 `timeFrom`/`timeTo`（毫秒时间戳，可选，默认无参行为不变）。前端 `src/components/PowerDashboard.tsx` 挂 Govern「全局数据」顶部：四块卡（权位动作量+7d/30d 切换、审批时效、审计覆盖度、待办队列）+快照时间。API：`api.powerDashboard()`；类型 `shared/types.ts` `PowerDashboard`。
- **阈值自动升级（X-MARKET-15，治理触达）**：DU 采购商城下单单笔金额（unitPriceCents×qty）> `governThresholds.procurementAmountCents`（store 内存配置，默认 500000 分=5000 元）→ 订单 `status='pending_approval'`（Order.status 扩展 `pending_approval|rejected`，note 追加超阈值文案）+ 审计记 `escalated`（13 口径：escalated 不回填 governor）；审批 `POST /api/orders/:id/approval {action:approve|reject,note}` 接 `order_approval` 映射行（ROLE-01 后 allow=[VXM,VEM,VHM,VYM,VTM] 家族+统筹，VDM 移出；DU 自批 403「大额采购升级审批（X-MARKET-15）」）——approve→`pending` 正常生效（供给方自此可见）、reject→`rejected` 终态+approvalNote；GET /orders 对**纯供给帽（EU/HU/YU/TU，注意 HAT_LINE_OF.DU 也是 'supply'，须按帽位特判而非 line）**过滤 pending_approval，DU 本人/执行帽/V*M 可见。阈值配置 `GET/POST /api/govern/thresholds`（POST 接 `threshold_update` 治位映射行，GET 登录可见供 DU 下单提示）；marketPowerMap 扩至 12 动作（dashboard coverage total 自适应）。驳回重提计数（预留）：supply/applications rejected 重提时 `resubmitCount+1`，`>3` 置 `escalated=true`，审核列表提示「升级待复核」（VYM 复核后续接入）。前端：Govern 规则页阈值卡+审核页「大额采购审批」区块、SupplyMall 下单升级提示、OperatorDesk 采购单「待治理审批/已驳回」徽标。API：`api.governThresholds()/updateThresholds()/approveOrder()`。
- **执行帽穿透追责（X-MARKET-16，接口契约层）**：marketPowerMap 第 13 动作 `exec_fulfill`（办位 operate，allow=[DYX,DHX,DTX,DEX,DCX]，forbid 含 DU/XU/CU/治位/NONE）——首个纯办位动作。`POST /api/orders/:id/fulfill {note?}`（履约执行=交付回执，AFTER_SALES 责任转移点）：端点前置校验 `hatRole==='DU'`（执行帽权属主体，XU/CU/供给帽 403「履约执行须 DU 经营号发起」）→ **域映射执行帽** E→DEX/H→DHX/Y→DYX/T→DTX/D|C→DCX（服务端自动定帽，客户端不可伪造）→ 状态校验（仅 pending 可履约，400 不入审计，校验顺序先于 checkPower）→ `checkPower('exec_fulfill', req, res, boothCode, execHat)`——checkPower 第 5 参 `actorHatOverride` 穿透：audit `actor_user=u-du1（真实登录人）+ actor_hat=DEX/DYX（实际执行帽）` 双字段。副作用：order.status='fulfilling' + `order.fulfillments` 追加 `FulfillmentReceipt`（shared/types，snake_case 对齐审计：id/order_id/actor_user/actor_hat/booth_code/note/ts）——Booth 实体系统契约字段，orders 响应随单下发下游可读。前端 OperatorDesk「作业执行（办）」组从展示-only 升级为可操作：履约执行面板（名下 pending 单一键履约+回执清单 actor_user/actor_hat）。审计页/留痕页/看板自动支持（total=13 自适应）。API：`api.fulfillOrder(id, note?)`。
- **DU 三端体验设计（X-MARKET-UE-01）**：三端配合=管理 PC（管·决策 /operator）+ 操作手机（办·执行 /operator/mobile）+ 现场看板（展·状态 /board 深墨大屏）。状态彩色徽标组件 `src/components/OrderStatusBadge.tsx` + `src/lib/domain.ts` `ORDER_STATUS_META`/`orderStatusMeta`/`EXEC_ACCENT`（办蓝）：已完成绿 #16A34A / 处理中·待报价灰棕 #8a6d3b / 待审批琥珀 #D97706 / 待治理审批紫 #6D28D9 / 履约中蓝 #2563EB / 越权 denied 红 #DC2626，pill+前缀圆点全端统一。PC 驾驶舱：欢迎区（时段问候+身份副信息 hatId·Booth 码）+待办分级条（待报价/待审批/待履约红点跳转）+三张硬影数字卡（shadow-[4px_4px_0_rgba(23,24,29,0.12)]）+最近订单彩色徽标；货品卡用 `api.mallListings()` 过滤名下铺（BoothRow.listings 类型不存在勿引用）；采购单 sec 阈值说明文案；空态统一动作引导。手机端 `src/pages/OperatorMobile.tsx`：max-w-md 单手操作、三段切换（待履约/已完成/看单）、履约大按钮（≥44px）+回执内联 actor_user/actor_hat 双字段、底部 Tab 四区（作业/订单/回执/我的）、AuthCtx 无 refresh 用组件内 load()。看板 `src/pages/Board.tsx`：深墨 #17181D 大字远观、只展示不提醒（履约进度/累计成交额/待办数/订单流彩色）、10s 轮询同源接口、RoleGuard 支持 wb 数组（/board=operator|govern，客户/供给方 403 兜底）、Order 无时间戳字段勿用 createdAt/ts（今日履约判定用 fulfillments[].ts）。Header：operator 工作台徽标两行（经营者·单位名/hatId·Booth 码）+通知铃（Bell 待办数红点→/operator）；operator nav 加「手机作业端」/board 双端入口。

## 四类角色工作台（X-MARKET-09）

- **登录落点**：Login 成功后按 `workbenchOf(hatRole)` 跳 `WORKBENCH_HOME`——客户 CU/XU→`/market`（CU entry=C→`/mall`）、供给帽 YU/EU/HU/TU→`/supplier`、DU+执行帽→`/operator`、**VDM→`/govern`（经营治理）、V*M 四源家族 VXM/VEM/VHM/VYM/VTM→`/supply`（governSupply 四源治理视图，ROLE-01）**。**UE-01-FIX-补修单（A1/A3）**：demo 账号 `boothTarget`（du-hehe→b-de1、eu-qiuchen→b-e1）曾抢跳铺面页致 DU/EU 落错，已移除抢跳分支——四类工作台必达优先，boothTarget 不再参与落点导航。
- **主题色**（`src/lib/domain.ts` WORKBENCH_THEME，用于顶栏激活态/侧栏/身份徽标/主按钮；全局浅米白+炭黑不变）：客户蓝 `#1D4ED8`（浏览引导型：五市场 tab+DU 铺网格+B2B 询价面板）、供应商绿 `#15803D`（业务操作型：登记/货品/采购单/产能）、经营者橙 `#B45309`（驾驶舱型：KPI 总览/五域铺面/采购商城/采购单/合同/上新铺/询价报价）、治理者紫 `#6D28D9`（管控型：治理案件/规则/全局数据 + governSupply 四源治理台）。
- **路由守卫**：App.tsx `RoleGuard` 按 `workbenchOf` 判断——客户直访 /supplier、/operator、/govern，供给方直访 /operator 等一律 403 兜底页（含"返回我的工作台"）；/supply-mall 保持服务端 403+页面隔离提示口径。
- **导航收敛**：Header 按角色渲染（客户 Market/Mall/交易单；供给商 供给集市/供给台/交易单；经营者 D*U 经营台/采购商城/供给集市/交易单；VDM 治理台/交易单（无 supply 入口）；V*M 家族 governSupply 仅「供给集市」）+ 主题色身份徽标（operator 双行：大号「店主·单位名」/小号「D*U·子DU·hatId·Booth 码」；govern「经营治理·单位名」；governSupply「四源治理·单位名」；双称呼词条 CONCEPT_TERMS.duChild）。
- **红线**：B2B 报价入口保留在 InquiryList（Market 与 OperatorDesk 共用）；orders 按身份过滤、隔离 12-14 条款不破。

## 全局规范：双称呼体验方案 v1.1

- **口径**：用户可见文案启用双称呼——大号=市面常态称呼（店主/平台监管/采购方/买家/供货商/店铺/商品/留痕台账/大额审批），小号=系统称呼（经营者 DU/治理者 VXM/执行帽 DEX/铺面 Booth/货品/审计/超阈值升级审批）。底层代码/接口/权限/审计/存储字段不改，只改 UI 文案层。
- **落地**：`src/lib/terminology.ts`（ROLE_TERMS/CONCEPT_TERMS 唯一口径 + roleTerm/conceptTerm helper）+ `src/components/DualTerm.tsx`（大号主显+小号弱化副标，compact 单显）。禁止页面写死双称呼文案；新概念先入术语表再上 UI。
- **红线**：治理穿透字段（actor_hat/governor/actor_user/booth_code）保留系统标识原文，禁止大号化。
- **节奏**：UE-02（客户）起立即套用；UE-01（DU 三端）存量文案不返工，统一在后续收口单处理。

## 全局规范：角色层级链对照 3.0 + D*X 双上级（双称呼 v1.2 定版）

- **定版背景**：双称呼体验方案 v1.2 已定版（UE-02 客户三端试行通过，后续推广至 UE-03 供应商端 / UE-04 治理者端）；本节为 UE-03/UE-04 发单依据，与术语表（`src/lib/terminology.ts`）配套生效。
- **治理线**：V*M 高管 → *MX 经理（上下级，例：VEM 供给高管 → EMX 供给管理经理）。
- **经营线**：DU 店主 → D*U 子 → D*X 下属 → D*XX 下下属（逐级下属链）。
- **E 线实例**：VEM → EMX → DEX → DEXX（E = 供给/通货线，EU = 供应商）。
- **D*X 双上级（关键口径）**：D*X 有两个老大——D*U（经营线）与 *MX（管理线），两条指挥线在 D*X 汇合；E 域实例：DEX 亦受 D*U 管辖。
- **链路语义**：DU→D*U→D*X→D*XX——D*U 是 DU 的子（范畴帽，非独立角色）、D*X 是下属（执行帽=店员）、D*XX 是下下属（执行者）。
- **试行校准**：「店员 DEX」定位=经营线下属层，不是独立他人。
- **UI 红线**：展示按「大号市面称呼 + 小号系统称呼」双称呼规范执行（DualTerm/terminology.ts 唯一口径，禁页面写死）；治理穿透字段（actor_hat/actor_user/booth_code）保留系统标识原文不大号化。
- **写法更新（2026-09-10）**：本节中经营线「D*U 子」的实例写法已由「*DU 分经营号命名规范」定版替代——D*U 保留星号派生概念语义，实例化展示统一写 *DU，见下节。

## 全局规范：*DU 分经营号命名规范（2026-09-10 定版 · 去星号实例修正 + V/D 双系定位）

- **决策**：分经营号统一采用「域 + *DU」写法，替代原 D*U 实例写法（DYU/DEU/DCU/DHU/DTU），消除与供给源 *U 系字母级碰撞。**修正（2026-09-10 补充澄清）：星号=域字母变量记号，实例化不带星号**——分经营号实例写作 **YDU/EDU/DCU/HDU/TDU**（不是 Y*DU）；模板总称保留星号（*DU）表示可替换域字母。命名展示规范化，**权限帽 ID 语义不变**（后端字段/审计 actor_hat/权限逻辑/路由零改动）。
- **V/D 双系定位（本修正新增）**：
  - **V 系列（VU → V*U）= 生态方（平台方）拥有的运营体系**：VU 总运营 → VYU/VEU/VHU/VTU/VCU 域运营分身（子 VU），展示标注「平台方运营」；
  - **D 系列（DU → *DU）= 经营体系**：DU 主经营号（唯一经营主体，可直营/加盟/合伙）→ YDU/EDU/DCU/HDU/TDU 分经营号（域级经营范畴帽）；
  - V 系与治理家族 V*M（VXM/VEM/VHM/VYM/VTM，M 结尾）区分：V*U（U 结尾）是生态方域运营，V*M 是治理帽家族。
- **三系区分（防碰撞口径）**：①经营号系：主=DU、分=**YDU/EDU/DCU/HDU/TDU**（模板记号 *DU）；②供给源系：YU/EU/HU/TU（不变）；③执行帽系：D*X 系（DYX/DEX/DCX/DHX/DTX，不变）。星号派生语义与 D*X 一致（「星号分/派生」概念保留在规范说明中，仅实例化写法去星号）。
- **域对照（terminology.ts `DU_CHILD_BY_DOMAIN`/`duChildTermOf` 唯一口径）**：YDU 智场经营 / EDU 产品经营（E/DE 域同归 E 线）/ DCU 客户经营 / HDU 人资经营 / TDU 技术经营；无域匹配兜底「*DU · 分经营号」（模板总称）。**V 系对照**（`VU_CHILD_BY_DOMAIN`/`vuChildTermOf`）：VYU 智场域运营 / VEU 产品域运营 / VCU 客户域运营 / VHU 人资域运营 / VTU 技术域运营，兜底「V*U · 生态方域运营」；词条 CONCEPT_TERMS.vuRoot{big:'平台方运营',sys:'VU · 总运营'}/vuChild{big:'生态方域运营',sys:'V*U · 域运营分身'}。
- **术语表**：CONCEPT_TERMS.duChild 为 {big:'店主', sys:'*DU · 分经营号'}（sys 为模板总称，实例展示经 duChildTermOf 去星号）。
- **徽标文案**：Header operator 徽标第二行「D*U · 子DU · hatId · Booth 码」→ `{duChildTermOf(user.domainView)} · hatId · Booth 码`（按域展示经营范畴，如「EDU · 产品经营 · u-du1 · b-de1」；**勿出现 Y*DU 带星号实例**）；OperatorDesk 徽标「经营工作台 · *DU」、欢迎区身份按 duChildTermOf 范畴化；SupplyPurchaseDesk 分拨说明「D*U 子店」→「*DU 分店」。
- **登入端（ENTRANCE-01）**：EntranceRole 角色卡 DU 职责按 *DU 规范书写（「分经营号经营（*DU）：铺面管理 / 询价报价 / 采购商城 / 履约衔接」，*DU 为模板记号），避免后续返工。
- **v1.2 增补（2026-09-10 定稿）**：经营板块六类 **DDU（主业 domain）/EDU/CDU/HDU/TDU/YDU**（DCU 废除改 CDU；`DU_CHILD_BY_DOMAIN` 增 D 键 DDU 主业经营）；执行层双线 **\*MX→\*MXX（运营）+ \*DX→DXX（业务）**，实例 DDX/EDX/CDX/TDX/YDX/HDX/ODX 及 DDXX 等（terminology `EXEC_DISPLAY_OF`/`execDisplayOf` 展示映射，库内帽 ID DYX 等不动）；**VDU=产品事业部全域壳**（整合六类，DDU 直属/五域引用 VDU::EDU）；**VTM=技术运营管理兼任白名单，无 VTU 无 VOU**（`VU_CHILD_BY_DOMAIN` 已删 T 键）。
- **红线**：历史章节中 D*U 实例写法为当时实现记录，展示层一律以本规范为准；「店主」大号市面称呼保留；审计 actor_hat 保留系统标识原文（DU/DEX 等）不大号化；实例禁带星号（Y*DU 违规），星号仅出现在模板记号与规范说明。

## 角色·界面归位（X-MARKET-ROLE-01，A 批：界面收敛 + 治理分线）

- **最终口径**：market 界面=XU/CU（客户）+VDM（经营治理）+D*U（子 DU，经营端）；supply 界面=DU（采购）+V*M 四源家族（VEM/VYM/VHM/VTM 四源治理）+VXM（统筹）+各 *U 供应方（四源供给）。X-Market 与 X-Supply 是两个独立交易面，界面角色归属唯一、治理权分面。
- **落点分线（workbenchOf）**：`src/lib/domain.ts` WorkbenchKind 扩 `governSupply`——V*M 家族五帽（VXM/VEM/VHM/VYM/VTM）→ `governSupply`→`/supply`（四源治理台）；VDM→`govern`→`/govern`（经营治理）；DU/执行帽→operator、供给帽/EX/EXX→supplier 不变。WORKBENCH_THEME.governSupply=治理紫 #6D28D9。RoleGuard：`/supply` wb=['supplier','operator','governSupply']（VDM 直访 403 兜底）；`/govern` wb=['govern']（家族直访 403 兜底）；`/board` 仍 operator/govern（家族 403 口径内）。
- **market 经营端 D*U 标识**：OperatorDesk 徽标「经营工作台 · D*U」+欢迎区身份「D*U（子DU）· hatId」；Header operator 徽标两行（大号「店主 · 合和经营」小号「D*U · 子DU · u-du1 · Booth 码」，CONCEPT_TERMS.duChild）；执行帽 D*X 不变。
- **治理分面（后端强制）**：`marketPowerMap` 四个治理动作 `supplier_evaluate`/`product_govern_remove`/`order_approval`/`threshold_update` allow 改 `[VXM,VEM,VHM,VYM,VTM]`（**VDM 移出**，from [VXM,VEM,VDM]；HAT_POWER_BITS 治位六帽不变，VDM 仍可读 audit/dashboard）；`server/domainConfig.ts` 新增底座映射 `GOVERN_SUPPLY_DOMAIN_OF`（VEM→E/VYM→Y/VHM→H/VTM→T）+`isSupplyGovernHat`+`supplyGovernDomainOf`。
- **端点域校验**（routes/index.ts）：GET `supply/applications` 与 GET `supply/products` 收敛 `isSupplyGovernHat`（VDM 403「四源治理归 supply 面」），家族帽按 `supplyGovernDomainOf` 域过滤（VEM 只见 E 域，VXM 全域）；POST `supply/applications/:id/review`、POST `supply/products/:id/take-down`、POST `supply/products/:id/toggle`（治理路径）——checkPower 过 map 后补域校验（家族帽越界审/下架他源 → 403「四源分线治理：VEM 仅可审核 E 源准入」式文案）；`POST /api/govern/thresholds` 接 `threshold_update`（家族+VXM 可配，VDM 403）。
- **orders 分线**：GET /orders 的 `view_all_orders`（line=admin）分支拆两档——VDM=全域总账；V*M 家族=仅 `pending_approval|rejected` 大额采购审批队列（不见 market 全域订单，信息隔离）；DU/执行帽/供给帽分支不变。
- **govern cases 收敛**：GET /api/govern/cases 仅 VDM（家族 403「治理案件归经营管理治理（VDM）」）；govern/thresholds GET 登录可见。
- **hub 读权限收敛**：`server/x-supply/routes.ts` `isSupplyReader` 移除 VDM（V*M 家族保留）；hub 家族视角 booths/entries 按 `supplyGovernDomainOf` 域过滤（VXM 全量）——VDM 访 /api/supply/hub 403。
- **supply 治理台（SupplyGovernDesk）**：`src/x-supply/pages/SupplyGovernDesk.tsx` 挂 SupplyHub（家族+VXM 渲染）——家族：本源统计卡（本域 pending/approved 申请、在架货品）+本域准入审核表（approve/reject+rejectReason）+本域货品治理下架+OfdCenter；VXM 增：全域四源+大额采购审批面板（orders pending_approval→approve/reject）+阈值配置卡。数据源 `xSupplyApi.govern.*`（du-supply.ts 扩展：applications/reviewApplication/products/takeDown/orders/approveOrder/thresholds/updateThresholds，req 原语直调，依赖单向白名单合规）。
- **Govern（VDM）收敛**：`src/pages/Govern.tsx` 移除 CloudReview（VXM 审核）/ThresholdCard 表单/ApprovalList（迁 supply 治理台）；NAV=cases/rules/data/audit/ofd；KPI=全局订单/交易总额/在办案件/办结案件；规则页阈值只读卡（「配置归四源治理」）；规则页治理下架只读提示；新增「履约中心」sec。
- **X-OFD 只读接入（A5）**：`src/components/OfdCenter.tsx`（iframe `https://2jr2ym36zz.coze.site` + 顶部「X-OFD 履约中心 · 模拟契约期」标注条 + 新窗口打开按钮）挂 Govern 'ofd' sec 与 SupplyGovernDesk 底部；API 基址 `https://2jr2ym36zz.coze.site/api/ofd/*`（只读，不代理不转发）。
- **demo 账号**：`vdm`（VDM，label「经营管理治理 VDM」）、`vem-e`（VEM）、`vxm-cloud`（VXM）已有；末位追加 `vym-y`（VYM）/`vhm-h`（VHM）/`vtm-t`（VTM）（DEMO_ROUTE 补 VYM/VHM/VTM 三行）；units u-vdm1 name→「经营管理治理长」。
- **术语**：terminology.ts ROLE_TERMS 补 VDM{big:'经营监管',sys:'治理者 VDM'}；CONCEPT_TERMS 补 duChild{big:'店主',sys:'D*U · 子DU'}/governMarket{big:'经营治理',sys:'VDM'}/governSupply{big:'四源治理',sys:'V*M 家族'}/ofdCenter{big:'履约中心',sys:'X-OFD · 模拟契约期'}。
- **回归口径（冒烟全绿）**：vdm cases 200/applications+hub 403；vxm cases 403/applications 全域/orders 仅审批队列；VEM/VHM/VYM/VTM hub 与 applications 各见本源域；VHM 审 H 源 200+VYM 驳回 Y 源 200+VHM 越界审 Y 源 403 域隔离+VDM 审 403 权位；阈值 VDM 403/VEM 200；DU 大额采购 o-1018 pending_approval→VXM 审批生效+家族订单视图仅审批队列；VTM 下架 T 源 200+越界下架 H 源 403；XU/CU hub 403；SPA /supply /supplier /govern /operator /market /mall 全 200；B2B 询价回归。

## 客户三端体验设计（X-MARKET-UE-02，双称呼首个试行单）

- **采购方 XU（/market PC 采购工作台）**：全局搜索框（搜在架货品标题/标签/店铺名，`containerName` 反查容器）+「只看准入」开关（`admittedOf(booth)=franchise==='direct'`，加盟铺过滤；基线 5 direct+1 franchise 有真实区分度）+合格供给卡片（准入徽章「准入合格」+资质摘要=域 TRUST_EXPOSURE 核验项+店主/店员执行帽双称呼身份+在架货品价格状态，`api.boothDetail` 批量拉取）+采购进度流 5 段 stepper（询价→报价→合同→下单→交付，由 `inquiries[].status` inquiry/quoted/contracted + `orders[].status` pending*/fulfilling/done 推导当前步）+我的采购单表格（OrderStatusBadge dual 大号状态名）。侧栏「我的留痕台账」用 DualTerm concept='powerAudit'。
- **买家 CU（/mall 手机商城）**：商品卡营销化（域色封面块+价格大字+准入徽章+店铺归属 `booth.name`+库存归属小字「库存 · Booth 实体系统」）+**立即购买确认弹层（P0 防误触）**：`buyTarget` state，点「立即购买」先弹确认（商品名/单价/数量 stepper/合计/店铺归属），确认后才 `api.createOrder({boothId,listingId,amountCents:priceCents*qty,side:'C'})`——服务端接受任意 amountCents（默认回落 listing 价），已冒烟 C-2026-0018 ×2 金额 39800 分验证。
- **双称呼试行落地（6 处抽查点）**：Header 客户徽标「采购方 · 企业客户 XU」/「买家 · 自然人客户 CU」+通知铃（未读询价+未完成订单红点→/orders）；OrderStatusBadge `dual` prop（默认 false 不破 UE-01 存量，客户面 true）——STATUS_TERMS 大号：fulfilling→交付中/pending→待交付/pending_approval→大额审批中/done→已完成；CONCEPT_TERMS 补 powerAudit{big:'留痕台账',sys:'三权审计'}/booth{big:'店铺',sys:'铺面 Booth'}/listing{big:'商品',sys:'货品'}/admission{big:'准入合格'}/platformGovern{big:'平台监管',sys:'治理者 VXM'}/progressFulfill{big:'发货交付',sys:'履约执行'}。页面文案全部取 terminology.ts 常量，禁写死。
- **红线**：底层接口/权限/审计/存储零改动（服务端本单未触碰）；穿透字段保留系统标识；搜索与准入均为客户端过滤不改 orders/inquiries 服务端口径。

## X-Supply 供给四源集市（X-SUPPLY-01，首单：路由域骨架 + EU 登记/铺子 + 供给列表只读）

- **定位**：X-Supply=供给四源集市（YU/EU/HU/TU 上游供给，DU 为采购者），X-Market=五域经营面（DU 经营者）；两交易面中间隔 DU，独立路由域 `/supply`，不拆仓库不换域名。价值链 EU→Booth-E→X-Supply→DU→X-Market→XU（含 CU）。
- **EX/EXX 供给执行帽（X-SUPPLY-01 新增，办位）**：`SupplyExecHat='EX'|'EXX'`（types HatRole 扩展）；EX=物资供给执行（Booth-E 驻场执行）、EXX=Booth-E 执行端（铺内作业）。UNIT_ROLE_LABEL/HAT_LINE_OF（='supply'）/HAT_POWER_BITS（=['operate']）三表同步；BOOTH_OF_EXEC_HAT 补 EX/EXX→Booth-E。demo `ex-qiuchen`（EX 帽，u-ex1，c-qc 启辰，boothTarget b-e1，DEMO_ROUTE 末位 index13——**demoAccounts 中段插行会错位硬编码索引路由，只能追加末尾**）。store.units 增 u-ex1（L3 tier）/u-exx1（L2）。workbenchOf(EX/EXX)→'supplier'。
- **落点迁移**：WORKBENCH_HOME.supplier='/supply'（eu-qiuchen/tu-chiyuan/ex-qiuchen 登录落 X-Supply 集市）；`/supplier` 保留渲染 SupplyDesk（X-09 供给工作台，旧链接不 404=同渲染兼容）；Header：supplier nav「供给集市」/supply+「供给工作台」/supplier，operator/govern nav 加「供给集市」，**客户（CU/XU）无 /supply 入口（前端隐藏）**。
- **marketPowerMap 15 动作**：新增 `supply_register`（办位 operate，allow=[EX,EXX]，forbid 含 EU/HU/YU/TU/DU/执行帽/治位/XU/CU/NONE）与 `supply_booth_maintain`（办位，allow=[EX,EXX]）——dashboard coverage total 自适应。**防呆要点：EU 是管位，不能代办办位动作**（EU 调 supply_register→403「属办位」；EX 调 supplier_apply→403「属管位」、supplier_evaluate→403「属治位」）。
- **API（/api 前缀）**：GET `/api/supply/hub`（读权限=供给帽+EX/EXX+DU+执行帽+V*M 家族五帽（ROLE-01 后 VDM 移除，403；家族视角 booths/entries 按本源域过滤）；XU/CU 403 双保险——前端 RoleGuard wb=['supplier','operator','governSupply']+后端 isSupplyReader 拒绝；返回 viewer/canRegister/canMaintain/maintainBoothCode/booths（kind='supply' 四源铺：ownerContainerId 经 unitById 反查、ownerName=containerById(unit.containerId).name=供货商名、execHat 域映射 E→EXX、frontDesc/backDesc/rating）+entries 登记台账）；POST `/api/supply/register`（EX/EXX checkPower，body {boothId,qualification,note}，落 server/x-supply/store.ts xSupplyEntries id=`se-N`）；POST `/api/supply/booths/:id/maintain`（id 支持 boothId/boothCode 双形态；前置校验：非供给铺 404「非供给实体铺」、非本铺 403「仅可维护本铺」——归属=unitById(booth.ownerUnitId).containerId===user.containerId，不入审计；后 checkPower('supply_booth_maintain') 更新 frontDesc/backDesc）。
- **前端**：`src/x-supply/api/du-supply.ts` 供给数据源归一（xSupplyApi={hub,register,maintain} 命名空间，仅依赖 client req 原语+shared/x-supply 契约）；`src/x-supply/pages/SupplyHub.tsx` 组件 XSupplyHub（双称呼 UI：供给集市/供货商/入驻登记/店铺维护词条入 CONCEPT_TERMS；EX/EXX 登记表单+维护面板（用 hub.maintainBoothCode）、EU 只读+办位说明、DU 采购者视角占位（X-SUPPLY-02）、VXM 治理视角占位（X-SUPPLY-02）；供给列表卡=域色+准入徽章（TRUST_EXPOSURE quality/serviceLevel/afterSales+entry.qualification））；App.tsx 路由 `/supply` import 自 `./x-supply`。
- **明确不在首单（X-SUPPLY-02）**：货品维护、DU 采购视图、X-Supply 供给单→X-Market 采购单→ERP 采购入库单串联、EMX 资质审核流（办→管 EU→EMX）、VXM 准入治理页。
- **红线**：四源入口不对客户露出（双保险）；X-Supply 不是第二个 X-Market；穿透字段（actor_hat/actor_user/booth_code）保留系统标识不大号化。

## X-SUPPLY-01 补充约束（模块化与未来独立化预留，硬约束）

- **①路由域边界（目录归置）**：X-Supply 代码统一收独立目录，不散落 X-Market 业务代码——前端 `src/x-supply/{api,pages,index.ts}`（数据层 du-supply.ts / 页面 SupplyHub.tsx→组件 XSupplyHub / 桶导出）、后端 `server/x-supply/{store,routes}.ts`（独立供给表 xSupplyEntries+nextSupplyEntryId / 三端点 Router）、类型契约 `shared/x-supply.ts`（XSupply* 前缀：XSupplyEntry/XSupplyBooth/XSupplyHubData，viewer=Pick<SessionUser,...>）。旧位已清：routes/index.ts 三权定义段迁 server/power.ts、requireAuth/optionalAuth/AuthReq/AuthRes/roleOf 迁 server/auth.ts（登录底座公共契约）、SupplyHub* 三接口迁 shared/x-supply.ts、client.ts 仅 export req 原语（supplyApi 三方法已删）。
- **②依赖单向（白名单）**：X-Supply 只依赖公共底座，禁止反向依赖 X-Market 业务模块（禁 import 对方页面组件/routes/index 业务段）。前端白名单：`../../../shared/x-supply`、`../../api/client`（仅 req http 原语）、`../../components/{ui,PowerBadge,DualTerm}`、`../../lib/{domain,terminology}`、`../../Auth`；后端白名单：`../../shared/{types,x-supply}`、`../auth`、`../power`（checkPower 系）、`../domainConfig`、`../store`（getStore/unitById 等）、express。跨域扩展走服务层（未来 X-SUPPLY-02 供给单→采购单串联也走服务层接口，禁页面互引）。
- **③命名空间**：组件/页面 `XSupplyHub`（src/x-supply/pages/SupplyHub.tsx）、API `xSupplyApi={hub,register,maintain}`（src/x-supply/api/du-supply.ts）、路由文件 server/x-supply/routes.ts（app.use('/supply', xSupplyRouter) 挂载于 routes/index.ts）、类型 XSupply*、store 前缀 xSupply*（xSupplyEntries/xSupplyNextEntryId）。
- **④数据层独立成层**：前端 du-supply.ts 独立成层（x-supply 前缀命名空间，X-Market 面数据不混入）；后端供给表 xSupplyEntries 独立于 store 主数据（供给登记/查询与经营数据隔离，未来迁独立库有准备——只搬 server/x-supply/store.ts 与 shared/x-supply.ts 即可解耦）。
- **⑤路由稳定**：`/supply` 前缀与 `/supplier` 别名规则固定（别名渲染 SupplyDesk 同渲染兼容，旧链接不 404）；`/api/supply/*` 前缀固定；maintain 路径支持 boothId 与 boothCode 双形态（b-e1/Booth-E-01）。
- **⑥隔离不降级**：前端 RoleGuard wb=['supplier','operator','governSupply']（客户与 VDM 直访 403 兜底，ROLE-01 收敛）+ Header 无 /supply 入口（前端隐藏）；后端 hub/register/maintain 全部 isSupplyReader/isSupplyExecHat 校验（XU/CU 403 双保险），X-08 supply/mall DU-only 403 照旧。
- **回归口径**：冒烟全绿——hub 403 矩阵（EX/EU/DU/VXM 200，XU/CU 403）、register EX allowed+EU/XU 403 权位文案、审计 actor_user=u-ex1+actor_hat=EX 双字段、maintain 本铺 200/他铺 403/编码路径兼容、B2B 链（RFQ→quoted→contracted→YX-2026-0018）、power-map 15 动作、dashboard 治位、SPA /supply+/supplier 200。

## X-SUPPLY-02 供给单体系（DU 采购端 + 四源收件 + 基础闭环）

- **定位**：X-Supply 供给单（XS 单）独立单号体系 `XS-2026-xxxx`（id=xo-N，事件 xe-N 全局递增），不占 X-Market 六族码段；采购主体=DU 唯一经营号；**D*U 分拨机制本期只落 DU 主体视图**（SupplyPurchaseDesk 顶部说明卡，分拨口径待架构确认）。不在本单：EMX 资质审核流、供给单→X-Market 采购单→ERP 全链串联。
- **状态机**：`initiated`（DU 发起）→ `accepted`（供给方接单）→ `quoted`（供给方报价）→ `confirmed`（DU 确认，基础闭环终态）；事件流 `XSupplyOrderEvent`（snake_case：id/order_id/action='initiate'|'accept'|'quote'|'confirm'/actor_user/actor_hat/booth_code/note/ts——穿透字段保留系统标识原文）。类型 `shared/x-supply.ts`（XSupplyOrderStatus/XSupplyOrderEvent/XSupplyOrder，buyer*/supplier* 双侧快照）；表 `server/x-supply/store.ts`（xSupplyOrders+xSupplyNextOrderId/xSupplyNextOrderCode/xSupplyAppendEvent）。
- **API（/api/supply 前缀，全走 isSupplyReader 门禁，XU/CU/VDM 403）**：GET `orders`（角色过滤：VXM 全域/家族本源域/供给方 EU/HU/YU/TU+EX/EXX 名下供给铺收件（ownerUnitId→containerId 反查）/DU+执行帽 buyer 本人）；POST `orders`（DU 发起，body {boothId|boothCode,title,qty,unit,note}，booth 必须供给实体铺）；POST `orders/:id/accept`（供给方，仅本铺 supplierContainerId===user.containerId，仅 initiated）；POST `orders/:id/quote`（仅 accepted，body {quotedCents>0,note?}）；POST `orders/:id/confirm`（仅 buyer 本人，仅 quoted）。校验顺序：归属→状态（400）→checkPower（403 入审计）。
- **marketPowerMap 19 动作**（+4）：`supply_order_initiate`/`supply_order_confirm`（manage，allow=[DU]）、`supply_order_accept`/`supply_order_quote`（manage，allow=[EU,HU,YU,TU]，仅本铺）——forbid 均含对侧主体/EX/EXX/执行帽/六治位/XU/CU/NONE；dashboard coverage 自适应。**防呆**：EX/EXX 接单/报价→403「属管位（经营决策）」（管位不代办的镜像：管位也不代办办位登记）；403 带「（X-SUPPLY-02）」治理口径文案。
- **前端**：`src/x-supply/api/du-supply.ts` 扩 `supplyOrders={list,create,accept,quote,confirm}`；新建 `src/x-supply/pages/SupplyPurchaseDesk.tsx`（命名导出，DU/执行帽渲染：四源货源卡发起弹层+我的供给单列表+状态徽标+quoted「确认成单」按钮+D*U 分拨预留说明卡；执行帽 D*X 看单不代办——发起/确认禁用并提示管位口径）；新建 `src/x-supply/pages/SupplyInboxPanel.tsx`（命名导出，供给方渲染：收件列表+接单/报价表单（元→分 quotedCents）；EX/EXX 只读+办位看单提示）；`SupplyHub.tsx` 挂接 `isProcure`（DU/DYX/DHX/DTX/DEX/DCX→采购台）/`isSupplierSide`（EU/HU/YU/TU/EX/EXX→收件箱）分面+DU 指引条更新。术语 `terminology.ts` 补 `supplyOrder{big:'供货单',sys:'X-Supply 供给单 XS'}`/`supplyInbox{big:'供货收件箱',sys:'供给方收件（仅本铺）'}`。
- **回归口径（冒烟全绿）**：E 源全闭环 xo-1/XS-2026-0001（DU initiate b-e1→EX accept 403 权位→EU accept→EU quote 2580000 分→DU confirmed）；Y 源全闭环 xo-2/XS-2026-0002（DU initiate b-y1→YU accept/quote→DU confirm）；事件流 initiate/accept 双字段 actor_user=u-du1+actor_hat=DU、u-eu1+EU 留痕；XU list/initiate 403+VDM list 403（治理分线）；VEM 仅见 E 域单/VXM 全域 2 条；audit supply_order_confirm allowed×2；VDM cases/XU orders/SPA 六路由 200。

## Market 登入端框架（X-MARKET-ENTRANCE-01，一角色一登入 P0）

- **定位**：专注/收敛/务实——只做「容器分流 → 登录 → 角色选择 → 视角容器」闭环（设计方案 v1.0），不动各视角业务内容（P1 客户侧收敛/P2 经营采购侧收敛/P3 治理侧收敛为后续单）。独立模块 `src/entrance/`（登入端代码独立成组，仅依赖底座 Auth/api/lib）。
- **容器分流（/entrance）**：`EntranceGate.tsx`——#xhpz 个人容器 / #xepz 企业容器 两入口卡（进入 → `/entrance/login?container=personal|enterprise`）；#xgpz 政府容器/#xopz 平台容器 置灰「预留 · 未开放」（不做功能）。容器映射 `entrance.ts containerOf`：XU/CU→personal（客户侧兼容）、其余（DU/*U/EX/V*M/VDM）→enterprise；**不做容器数据迁移**。已登录用户访问 /entrance*：activeRole 在→直进工作台、不在→角色选择页。
- **登录表单（/entrance/login）**：`EntranceLogin.tsx`——账号+密码（password=test123）+ demo 快捷网格按容器过滤（personal 只显 XU/CU、enterprise 显其余，demos 现含 CU×2/DU×2/各 1）；企业容器顶部企业徽标（Building2+「企业容器 XEPZ」）。**落点分流**：表单 login → `/entrance/role`（强制走角色选择）；demo 一键 loginDemo → `roleHomeOf` 直进视角（oneclick 调试通道 V6 不破坏）。旧链 `/login` 保留渲染 Login.tsx（goLogin→/entrance/role、goDemo→直进，同口径）。
- **角色选择页（/entrance/role）**：`EntranceRole.tsx`——卡片列当前账号可担任角色（P0 单帽数组 `[user.hatRole]`，多帽扩展预留）；每卡含：角色大号称呼+小号帽名（roleTerm 双称呼）、所属面（ROLE_BRIEF.face：Market 客户/经营/经营治理面 · Mall 客户面 · Supply 供给/四源治理面，归位矩阵 v3 口径）、职责一句话（ROLE_BRIEF.duty）、进入按钮；`workbenchOf` 默认落点标「默认进入」徽标（P0 单帽恒默认）。顶部容器徽标（enterprise→containerName 企业名；personal→自然人）。进入按钮 → `setActiveRole(role)` → `roleHomeOf`。
- **视角状态（AuthContext.activeRole）**：`src/Auth.tsx` 扩 `activeRole: HatRole | null`（sessionStorage key `entrance.activeRole`，刷新不丢）+ `setActiveRole/clearActiveRole`。规则：`login()` 成功 → clearActiveRole（强制角色选择）；`oneClick/loginDemo` 成功 → setActiveRole(user.hatRole)（一键带默认角色直进）；`logout`/初始化 hatRole 漂移 → clear。
- **视角容器+路由守卫（App.tsx RoleGuard P0 升级）**：未登录直访工作台 → `/entrance`（原 /login 改）；`activeRole` 空或不等于 `user.hatRole` → `/entrance/role`（V4 重定向）；其余 403 逻辑不变。**五路由 /market /mall /operator /govern /supply 全部挂入守卫，页面业务内容零改动**。Header（user 存在时）加「切换角色」按钮（Repeat 图标 → clearActiveRole + nav /entrance/role，V5 清空当前视角会话状态）；未登录 Header 按钮改挂 /entrance。
- **落点函数**：`entrance.ts roleHomeOf(u)`=（entry==='C' 且 workbenchOf='client' → '/mall'，否则 WORKBENCH_HOME[workbenchOf]）——V3 映射：du-hehe→/operator、vxm-cloud→/supply、vdm→/govern、xu-huadong→/market、xiaolin→/mall。
- **回归口径（冒烟全绿）**：SPA 十路由（/entrance /entrance/login /entrance/role /market /mall /operator /govern /supply /login /）全 200；五角色 oneclick /api/orders 全 200（du-hehe/eu-qiuchen/xu-huadong/xiaolin/vxm-cloud）；overview/demos/me 200；lint+ts-check 一次过。

## X-MARKET-19/17/18：复合经营 + 执行双线验证 + 治理帽语义对齐（2026-09-10）

- **X-MARKET-19（P0 复合经营 D*U 多挂）**：`SessionUser`/`DemoAccount` 加可选 `duChildDomains?: string[]`（shared/types.ts，向后兼容扩展）；`buildSession` 透出；demo `du-hehe` 配五域多挂 `['Y','H','T','DE','C']`（对应五类经营实体铺 DY/DH/DT/DE/DC）。`terminology.ts` 加 `DuChildBadge`/`duChildDomainsOf`/`duChildBadgeTextOf`（过滤未识别域；无多挂回空串由调用方回退单域 `duChildTermOf`）。展示点：Header operator 徽标第二行复合串（EDU · 产品经营 / HDU · 人资经营 / …）、OperatorDesk 欢迎区分经营号徽章组+「复合经营核算按 *DU 分经营号维度呈现」说明行。**权限链不重复加帽**：多挂纯展示/核算维度，三权 checkPower/审计仍按 DU 单帽；**ERP-HAT-01 边界声明**：ERP 只认 DU 主经营号（OperatorDesk 欢迎区+types 注释落字）。
- **X-MARKET-17（P1 执行双线验证，不迁移）**：验证结论=***MX 域内运营执行 L2 与 *DX 业务执行 L1 分工成立，本期先验证不迁移***。D*X 单帽（DYX/DHX/DTX/DEX/DCX）保持办位标注。落点：entrance.ts ROLE_BRIEF 五执行帽 duty 改「业务执行（*DX·L1）：…（办位）」；OperatorDesk exec 卡与侧栏小字补双线验证结论（*MXX 运营 L2 / *DX 业务 L1 一一对应执行铺面；展示名口径，Booth 码与帽 ID 不变）。
- **X-MARKET-18（P1 治理帽语义对齐，含 VXM→VMX）**：治理者工作台定位「治理者（VXM）」→「管家审批（V*M，域内审批）」。terminology ROLE_TERMS：VXM{big:'管家审批统筹',sys:'VMX · 总运执行（归 OVM）'}；VEM/VHM/VYM sys=「EMX/HMX/YMX · 管家审批（域内）」；VTM sys=「TMX · 技术运营管理（白名单兼任，域内）」；CONCEPT_TERMS.fmx{big:'总财执行',sys:'FMX · 归 OFM（预留概念，不建真帽）'}。POWER_BADGE.govern：short'治'→'审'、text'云审批'→'管家审批（域内）'、desc 补总级归 OAS O*M（VMX 归 OVM/FMX 归 OFM）。WORKBENCH_THEME.governSupply.label '四源治理工作台'→'管家审批工作台'。demo 账号 **vxm-cloud→vmx-cloud**（id 替换、数组索引不变、DEMO_ROUTE.VXM 仍 demoAccounts[12]）、label'管家审批统筹 VMX'、unit u-vxm1 name'管家审批统筹（总运执行 VMX）'；四家族 demo label/note 改管家审批域内口径。store.ts 四个治理行（supplier_evaluate/product_govern_remove/order_approval/threshold_update）governance 字段追加「V*U 平台方监管系 VEU/VYU/VHU/VTU/VCU+VDU 全域壳 · 域内审批记 V*M 管家帽，总级归 O*M」——v1.1 修正（2026-09-10）：**allow_hats 已落 VXM→VMX**（12 治位行 allow 数组+forbid 无涉；V*U 非真帽仍不入 allow）。governor/actor_hat 语义现状已正确：域内审批审计记 V*M 登录帽原文，不新建 O*M 帽。UI 文案对齐：SupplyGovernDesk 标题/边界、Govern 归口文案、routes 三处 403 文案（cases/supply applications/supplier_evaluate）、App.tsx 注释、entrance ROLE_BRIEF V*M face'管家审批面'。
- **v1.1 修正版收口（X-MARKET-19/17/18，覆盖 v1.0，2026-09-10）**：①**帽 ID 真改名 VXM→VMX 全链落地**——shared/types（OperatorHat/HAT_POWER_BITS/HAT_LINE_OF/ROLE_LABEL 注释）、store.ts（marketPowerMap 治位行 allow_hats+units role u-vxm1+governance 文案）、routes/index.ts（demoAccounts hatRole 'VMX'+DEMO_ROUTE 键 VMX+403 文案）、domainConfig.isSupplyGovernHat、x-supply routes isSupplyReader/hub 视角、前端 domain.ts GOV 判断+WORKBENCH_GOVERN_SUPPLY_HATS、App/Board/SupplyDesk/SupplyMall/SupplyGovernDesk/SupplyHub/du-supply/PowerBadge 文案、terminology ROLE_TERMS 键、entrance ROLE_BRIEF 键，共 16 文件；demo vmx-cloud hatRole='VMX'（demoId 不变），历史审计内存态重启清零无存量迁移（「保留旧值兼容」口径）；②17 六域双线实例写全（运营线 *MX：DMX 主业/EMX/CMX/TMX/YMX/HMX→*MXX；业务线 *DX：DDX 主业/EDX/CDX/TDX/YDX/HDX→DXX）+「执行身份不独立登录，依附经营视角（代办/只读）」入 OperatorDesk 分工卡；③19 复合多挂六类 DDU/EDU/CDU/HDU/TDU/YDU——du-hehe duChildDomains 扩为 ['D','Y','H','T','DE','C']（含 DDU 主业，六类齐）。
- **v1.2 终版修正（X-MARKET-18，覆盖 v1.1 的 VMX 口径，2026-09-10）**：业财中心裁定 **VXM→VMX→VDM（总经营管理执行）**，VMX 名称废弃；**FMX（总财执行）保留**归 OFM（ERP 高频角色，概念预留不建真帽）。①帽 ID 全链 **VMX→VDM**：shared/types（OperatorHat 删 'VMX'、HAT_POWER_BITS/HAT_LINE_OF/ROLE_LABEL VMX 行并入 VDM）、store.ts（12 治位行 allow_hats=['VDM','VEM','VHM','VYM','VTM']、u-vxm1 code 'VDM-PLAT-B' name「总经营管理执行（云统筹）」role 'VDM'、governance 文案）、routes/index.ts（demo **vmx-cloud→vdm-cloud** id、hatRole 'VDM'、label「总经营管理执行 VDM · 云统筹」；demo vdm label「总经营管理执行 VDM」；DEMO_ROUTE.VMX 键删除）、domainConfig.isSupplyGovernHat=['VDM','VEM','VHM','VYM','VTM']（VDM 入 supply 治理席位=统筹全域，supplyGovernDomainOf(VDM)=null）、x-supply routes isSupplyReader/hub 视角、前端 domain.ts（77 GOV 判断/136 WORKBENCH_GOVERN_SUPPLY_HATS=['VEM','VHM','VYM','VTM'] **不含 VDM——VDM 保持 workbench 'govern' 落 /govern**、143 isSupplyGovernHat 前端判断数组含 VDM/232 POWER_BADGE desc）、App/Board/SupplyDesk/SupplyMall/SupplyGovernDesk（isVdm 判断）/SupplyHub/du-supply/PowerBadge、terminology ROLE_TERMS（VDM{big:'总经营管理执行',sys:'VDM'}、VMX 键删）、entrance ROLE_BRIEF（VDM duty 两台并管、VMX 键删）。②workbench/守卫：**VDM 两台并管**——workbenchOf('VDM')='govern'（Home 落 /govern 经营治理台不变）；RoleGuard /supply wb=['supplier','operator','governSupply','govern']（VDM 可直访 /supply 管家审批统筹台）；Header govern 分支加「管家审批」入口（/supply，ClipboardCheck）。③orders 分线：VDM 走全域总账分支（role==='VDM' 先判），V*M 家族仍审批队列（`role !== 'VDM'` 过滤不变）。④治理口径定版：总级治理执行=VDM（总经营管理执行）/FMX（总财执行，归 OFM）；治理决策=O*M（OVM/OFM，OAS 治理台后续）；域内审批=V*M 管家（EMX/YMX/HMX/TMX 等，不进 ERP）。CONCEPT_TERMS.guanjia 词条（V*M 管家=V*U 内嵌管家 v4.8：VTM/VEM/VCM/VHM/VYM，域内审批不独立进 ERP；VDU 激活含 VDM 主业管家，VEU/VCU/VTU 未激活管家先行归 VDU）；fmx 词条更新（ERP 高频角色，保留）。⑤XU/CU 双身份口径不变（已拍板落地）。
- **回归口径（红线不破）**：Booth 权属 LOCKED、交易单向、客户不占权位、越权 403 兜底、XU/CU 交易链路全部沿用；权限逻辑/帽 ID/路由/接口/审计字段零改动（duChildDomains 为纯新增可选字段）。历史注释中「四源治理」为当时实现记录，活文案以管家审批域内口径为准。
- **客户双身份定义（X-MARKET-18 术语增补，09-10 拍板并入）**：XU 主身份=采购方（B端走 Market）+第二身份=客户资源供给方（B端客户资源）；CU 主身份=消费客户（C端走 Mall）+第二身份=客户资源供给方（C端客户资源）。落地（纯术语层，代码与权位不动）：TermPair 扩可选 `sub`（双身份副身份）+ROLE_TERMS.XU/CU 带 sub+`roleSubTermOf(hat)` helper；CONCEPT_TERMS.custResource{big:'客户资源供给',sys:'需求侧资源（客户/流量/需求线索）· 授权式/贡献式，不占权位不登录操作；区别于供给四源'}；entrance ROLE_BRIEF XU/CU duty 追加第二身份；Model 价值链段双身份标注（客户本体供给=源头侧 vs VCU 平台方运营=管理侧，分层不冲突）；domain.ts 价值链注释同步。红线：客户资源供给=授权式/贡献式贡献，不占权位、不登录操作（保住「客户不占权位」）；与供给四源（EU/YU/HU/TU）专名区分。

## ERP 嵌入首批（X-MARKET-ERP-01，P2 经营+采购线）

- **定位与红线**：Market 是 ERP 的新外壳——**ERP 独立资源底座不变、不迁移数据、不改主库结构、不重做业务逻辑**；只做「外壳嵌入+导航归位+权限裁剪」，操作复用既有三权 checkPower/审计留痕与双称呼术语表。零新后端端点（全复用 api.orders/myStores/mallListings/supplyMall/myProducts + xSupplyApi.supplyOrders）。治理线（P3）、客户侧收敛（P1）、撤拒流转（X-SUPPLY-02b）不在本单。
- **经营线（DU→/operator，目标 95%）**：OperatorDesk 新增 sec='erp'「ERP · 经营台（嵌入）」——四单据卡（采购单→procurement sec / 销售单→overview / 入库单=confirmed 供给单联动清单 / 出库单→exec 履约）+库存总览与预警（api.supplyMall() DU 采购视野货品，stock<20 预警红标）+最近单据表（前 5）+confirmed 供给单联动清单（「入库去向：Booth 实体系统（WH）· 待接线」占位，入库作业归 Booth 实体系统另一窗口）+留守声明卡。侧栏分两组：「Market 经营（既有）」/「ERP · 嵌入台（ERP-MARKET-01）」共存不混杂。
- **供给线（→/supply/vendor，目标 90%）**：新建 `src/pages/SupplyVendorDesk.tsx` 挂路由 /supply/vendor（RoleGuard wb=['supplier']，客户/治理帽 403 兜底）——**按帽过滤只读**：本帽货品库存表（api.myProducts() owner 过滤，stock+预警）、名下 Booth 单据（api.orders() supply 分支 ownerUnitId 过滤）、本帽供给单全状态表（xSupplyApi.supplyOrders() owner 过滤）、结算依据汇总卡（confirmed 供给单 quotedCents 合计）；Header supplier 导航加「ERP 供给台」（Landmark）；SupplyDesk 顶部加跳转链接。「不串源」由服务端既有过滤保证（products owner/orders ownerUnitId/supplyOrders owner）。
- **菜单收敛贯通**：Market 侧等价实现「容器→帽→三权 checkPower→sec/菜单按角色裁剪」（RoleGuard wb 数组+服务端 403+前端 sec 分支）；OAS JWT/13U 对接层在 ERP 侧同源收敛（文档声明，本期不实现 JWT）。
- **留守项（不进 Market，仍从 ERP 进，V5）**：租户管理/适配层/月结/CSV 导出/权限矩阵——界面不复制，仅声明卡注明（OperatorDesk erp sec 与 SupplyVendorDesk 底部均有）。
- **回归口径（V1-V6）**：DU /operator 单据/库存/预警入口可勾验；EU /supply/vendor 本帽数据不串源；XU/CU/VDM 直访 ERP 供给台 403（RoleGuard）；菜单按帽裁剪无残留；五页面+登入端 V1-V7 不回退；审计留痕沿用 checkPower（嵌入视图只读为主，写操作走既有端点已留痕）。


## 内测版质量修复（X-MARKET-TI-02，P0 三项）

- **①登录态 ≥2h（TI-02①）**：TTL 本为 6h（`server/auth.ts`）已达标，「分钟级失效」真因=**内存会话随进程重启/回收清空**（dev.sh 1200s 回收≈20 分钟，与现象吻合）。修复：a) 会话落盘持久化 `XM_SESSION_FILE`（默认 /tmp/xm-sessions.json，启动 loadSessions 恢复+写侧 500ms 防抖，上限 2000 条防膨胀）；b) **滑动续期**——`getUserByToken` 命中即 `expiresAt=Date.now()+TTL`（活跃会话不过期）；c) revoke/create/过期删除均触发落盘。quick-login/oneclick 通道与 401 文案不变。
- **②审批业务失败不落 allowed（TI-02②）**：`POST /api/orders/:id/approval` 曾把 `checkPower('order_approval')` 放第一行（allowed 先落库 pa-20）→ 后续 status 400（如 VEM 审批非 pending_approval 单 o-1017）业务失败也留 allowed。已重排对齐 fulfill 端点范式：**读单 404 → status!=='pending_approval' 400 → action 参数 400 → checkPower → 执行**。权威口径：**allowed=权限放行且业务前置校验已过（真实执行的写动作）；denied=权位拒绝（403）；400/404 业务态失败不入审计**。历史脏数据标注不强改。
- **③审计覆盖度联动（TI-02③）**：dashboard coverage 与 `/api/power/audit` 本就同源 `marketPowerAudit`、字段 `action_code` 对齐（代码层无回退，ERP-01 零 server 改动与此无关）；「0/19 vs 留痕 22 条」真因=**内存审计随进程重启清空**的观察时序错位。修复：审计表落盘持久化 `XM_AUDIT_FILE`（默认 /tmp/xm-power-audit.json，loadPowerAudit 启动恢复+合法性过滤+**pa-N id 序列起点同步防回绕**+5000 条上限；写入侧 `powerAudit()` push 后 `schedulePowerAuditPersist()` 防抖）。dashboard 与 audit 端点零改动。
- **回归口径（V1-V3）**：V1 同 token 两次请求均 200+重启后会话仍在+oneclick 全角色 200；V2 非 pending_approval 单审批 400 且审计无 allowed 新增、approve 成功留 allowed；V3 dashboard coverage>0 且与 audit distinct 一致+五页面+登入端 V1-V7 不回退。

## EU 演示供应商批量预置（X-MARKET-TI-03，方案 A：纯种子数据）

- **范围**：`/api/auth/demos` 预置 **10 个 EU 演示账号**（尾部追加，DEMO_ROUTE 数字索引不受影响），配套容器+unit+供给铺+准入+货品全链种子；**不开放注册/建号 API**（方案 B 另行排期），纯预置数据不动业务逻辑，Login 页演示清单经 `api.demos()` 动态拉取**零前端改动**（bSupply 组 filter EU 自动收纳）。
- **种子清单**（store.ts）：容器 `c-eu01~c-eu10`（XEPZ，E_MARKET）｜unit `u-eu2~u-eu11`（code EU-HS/LK/ZM/TH/KS/HY/GT/RF/HX/LF，role EU，tier L2）｜供给铺 `b-e3~b-e12`（code **Booth-E-03~12**，kind supply，chain source，ownerUnitId 对应 unit）｜准入 `sa-3~sa-12`（**预置 approved**——mall 过滤 approvedIds 必需）｜货品 `sp-3~sp-15`（每铺 1~2 个 status on，合计 13 个：恒晟螺纹钢+镀锌管/联科内六角/正茂水泥/泰和液压油/凯盛冲击扳手/泓远轴承+电机/广泰角钢/瑞丰劳保手套/华信膨胀螺栓/力锋空压机+砂轮片）。
- **demo 账号**（routes/index.ts demoAccounts 尾部）：`eu-hengsheng/eu-lianke/eu-zhengmao/eu-taihe/eu-kaisheng/eu-hongyuan/eu-guangtai/eu-ruifeng/eu-huaxin/eu-lifeng`——统一 entry B/hatRole EU/domainView E/boothTarget 对应铺；口令统一 test123（DEV_PASSWORD），oneclick demoId 即登。
- **防回绕（关键）**：`store.ts` `supplierSeq` 由固定 `2` 改为**按 supplierApplications+supplierProducts 历史 id 最大号动态计算**——预置 sa-12/sp-15 后运行时 nextSupplierId 从 16 续起，避免新申请/新货品 id 与种子撞号。
- **回归口径（V1/V2）**：V1 10 个 EU oneclick→me（hatRole EU+boothTarget Booth-E-xx）→/api/supply/products/mine 各见本铺货品；V2 原 17 demo 账号登录回归+DU supplyMall 见新货品（approved 链路通）+上架/供给单链路不破。


## 四源全链路样板建设（X-MARKET-TI-04，12 样板三态+6 *DU 采购样板+全链实跑）

- **目标**：四源（EU/YU/HU/TU）各 3 个「注册申请态/认证通过态/已上架可交易态」样板账号+DDU/EDU/CDU/HDU/TDU/YDU 六类 *DU 采购样板账号（并入 TI-03 十 EU 之上，demo 总量 27→45）；并**用样板实际跑通**注册申请→V*M 认证→开供给铺（Booth）→供货上架→DU 系列采购→使用/生产→交付全链路（六类 DU 各至少 1 单）。
- **三态种子口径**：**申请态**=sa pending（待 V*M 认证，无铺无货，sa-13/sa-16/sa-19/sa-22）；**认证通过态**=sa approved+无铺无货（sa-14/sa-17/sa-20/sa-23，上架入口已解锁）；**已上架态**=sa approved+供给铺+货品 on（sa-15/sa-18/sa-21/sa-24+铺 b-e13/b-y2/b-h2/b-t2+货 sp-17~sp-24）。cert/apply 态 boothId 空串（无铺）。
- **种子清单**（store.ts）：容器 `c-eu11~13/c-yu1~3/c-hu1~3/c-tu1~3`（12 供给方）+`c-ddu/c-edu/c-cdu/c-hdu/c-tdu`（5 *DU）；unit `u-eu12~14/u-yu2~4/u-hu2~4/u-tu2~4/u-du10~14`（tier L2）；铺 `b-e13`（灵动·电子元器件）`b-y2`（高格·标准厂房）`b-h2`（优派·产线劳务）`b-t2`（云图·技术方案）；货品 `sp-17~24`（每 list 铺 2 个，含大额样板 sp-19 厂房 98000 元/月与 sp-22 技术员 580 元可触发 X-MARKET-15 阈值）；sa `sa-13~24`（12 条三态）。
- **demo 账号**（demoAccounts 尾部 18 行）：供给样板 `eu-apply-1/eu-cert-1/eu-list-1`、`yu-apply-1/yu-cert-1/yu-list-1`、`hu-apply-1/hu-cert-1/hu-list-1`、`tu-apply-1/tu-cert-1/tu-list-1`（note 标注三态与 sa 编号；list 态 boothTarget 指向本铺）；*DU `ddu/edu/cdu/hdu/tdu/ydu`（hatRole DU，hatId u-du10~15，domainView DDU/CDU 归 DE、edu DE、hdu H、tdu T、ydu Y；duChildDomains 单元素 ['D']/['DE']/['C']/['H']/['T']/['Y'] 驱动 Header 徽标 duChildBadgeTextOf 显示 DDU/EDU/CDU/HDU/TDU/YDU）。
- **DEMO_ALIAS 陷阱（TI-04 实证）**：`oneclick` 经 `DEMO_ALIAS=Object.fromEntries(demoAccounts.map(a=>[a.id,a]))` 全量自动生成（模块加载时快照）——demoAccounts 追加行即可命中，**无需手工补别名**；但 oneclick 对未知 demoId 静默兜底 `demoAccounts[0]`（小林 CU，仍 200）——**冒烟断言必须验 hatRole/boothTarget 而非仅 HTTP 200**（L2 首跑 ydu 漏种→兜底 CU→「帽 CU 无此权」即此因）。
- **全链路实跑剧本**（每源一条串行链，验收冒烟用）：V*M 审批预置 pending 申请（POST supply/applications/:id/review，VEM=sa-13/VYM=sa-16/VHM=sa-19/VTM=sa-22）→申请态账号上架货品（POST supply/products，动态 sp-25+）→对应 *DU 采购（POST orders，E→EX/Y→YX/H→HX/T→TX 族码）→DU 履约交付（POST orders/:id/fulfill，X-MARKET-16 域映射执行帽 DEX/DYX/DHX/DTX，status→fulfilling+回执 actor_user/actor_hat）——「使用/生产→交付闭环」以交付回执落 fulfillments 为终态。DDU 补采 sp-1（恒晟 E 域）。小额单（<5000 分阈值）直通 pending 不入审批，大额 sp-19 留作 X-MARKET-15 演示。
- **回归口径（V1/V2/V3）**：V1 12 样板 oneclick+三态断言（apply/cert mine=0、list mine≥1、boothTarget 正确）；V2 EU 13 个账号（TI-03 十个+TI-04 三个）全通+原 17 demo 回归+supplyMall/上架/供给单链路不破；V3 四源链路实跑全绿+五 DU 各 1 单+cert 态上架验证（eu-cert-1 上架成功终态）。

## 用户教育训练·新手引导（X-MARKET-TI-05，纯前端展示层）

- **目标**：登录后按角色弹出分步引导向导（四源供应商 / DU 经营者 / 客户 XU·CU 三套），每步三要素=做什么（what）/去哪个入口点（entry）/完成标准（done）；支持跳过与重开；引导纯前端，零 API 调用/零输入收集/零数据变更/非模态不阻塞业务。
- **数据层 `src/lib/onboarding.ts`（唯一口径）**：`TourKind='supplier'|'operator'|'client'`；`tourStepsOf(kind,{domainView,hatRole})`——supplier 7 步（注册申请→提交资质→V*M 认证→开 Booth 铺面→供货上架→接收 DU 采购单→履约交付，`SUPPLY_TOUR_TERMS` 按 domainView 差异化：E 物资/YU 空间/HU 人力/TU 技术/DE 归并 E 线）、operator 6 步、client 3 步（XU/CU 文案与入口分流）；`tourKindOf(hatRole,wb)` 按 `workbenchOf` 分发，govern/governSupply 返回 null→三选一入口；本地状态 `localStorage['xm_tour_v1']` 按 hatId 记录 `{status:'done'|'skipped',kind,ts}`（`readTourState`/`writeTourState`）；`TOUR_OPEN_EVENT`+`dispatchTourOpen` 重开事件；`TOUR_IDENTITY_CHOICES` 三选一身份卡（供货商/店主/采购方·买家）。
- **组件 `src/components/OnboardingTour.tsx`**：默认导出 `OnboardingTour`——首登检测（无本地记录）700ms 延迟自动弹出；浮层 fixed bottom-right 白底硬阴影+工作台主题色（`workbenchThemeOf`），步骤条 dots+三要素行+「前往入口」Link（react-router）+上一步/下一步/完成引导+跳过引导；三选一居中卡轻遮罩（点遮罩=记 skipped）；`TourRestartButton` 导出（Header 登录区「引导」按钮，事件重开不重置完成记录）。
- **挂载**：`App.tsx` Shell 内 `<OnboardingTour />`（全 Shell 页面可用）+Header 登录区 `<TourRestartButton />`；`terminology.ts` `CONCEPT_TERMS.onboarding={big:'新手引导',sys:'Onboarding · 分步教学向导'}`。
- **步骤口径**：供应商套「开 Booth 铺面」置于「供货上架」之前——真实业务路径（TI-04 实证：POST supply/products 要求名下供给铺，先开铺才能上架）；工单步骤清单全覆盖。
- **截图凭证**：`assets/onboarding-ti05/*.png` 22 张（EU 全 7 步/YU·HU·TU 首步差异化/operator 全 6 步/client-CU 全 3 步/client-XU 首步/picker 两张）；复跑 `node scripts/onboarding-shots.mjs`（devDependencies `playwright-core`+沙箱 chromium-1161 缓存，脚本用 `ctx.addInitScript` 预注入 token 消除 me() 竞态——`page.evaluate` 后置注入会被 401→clear 竞态清掉，勿回退）。
- **回归口径**：lint/ts-check 全绿；业务接口回归（overview/mall listings/market booths/supply mall/orders/demos=45）+SPA 十路由 200 不受引导影响。

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

## MARKET-CONN-01：Market 侧 Booth 履约时间线（消费侧展示，双端同景）

- **OAS 鉴权链（server 独持，token 不落地浏览器）**：OAS 站 `https://62j75kfyn3.coze.site`（issuer=ziway-oas，Go）——发现文档 `/.well-known/openid-configuration`（authorization_code only）+ JWKS `/.well-known/jwks.json`（RS256，kid=oas-rsa-001）；**dev-token 换取路径**：`POST /api/v1/auth/dev-token {role:'SU',expires_minutes}` → `{code:200,data:{token,expires_at}}`（RS256，Booth 端持 OAS 公钥验签）；**平台 workload identity token 被 Booth 拒（invalid signature）**——Booth-SEC-01 验的是 OAS 公钥非平台 JWKS，勿再走 workload 路径。
- **server/boothConn.ts（Booth 连接底座）**：`OAS_BASE/BOOTH_BASE/OAS_ROLE` 常量（环境变量 `BOOTH_OAS_BASE/BOOTH_TIMELINE_BASE/BOOTH_OAS_ROLE/BOOTH_OAS_TOKEN` 可覆盖；BOOTH_OAS_TOKEN 优先=主 Agent 线上可注入长效 token）；`getBoothToken()` 内存缓存至 expires_at-5min 到期重签；`fetchBoothTimeline()` 拉 `GET {BOOTH_BASE}/api/booth/fulfillment/timeline`（Bearer；**Booth API 无过滤参数返回全量 orders[]**，503 冷启动重试 1 次，token 失效重签）；`boothDeepLink(token,orderNo)` 拼 `{BOOTH_BASE}/fulfillment-track?token=..&orderNo=..`（Booth 端 ?token= 透传是其既有设计）。
- **代理端点 `GET /api/orders/:id/booth-timeline`**：requireAuth+订单可见性（buyer/seller 容器、VDM view_all_orders、DU/执行帽/供给帽按铺归属——与 /orders 列表口径一致，403/404/401 分明）；匹配 `boothOrderNo===order.code`（契约单 v1.1 订单透传对齐后自动生效）+可选 `?match=<boothOrderNo>` 调试参数；响应 `{matched,orderCode,boothOrderNo,timeline,deepLink,fetchedAt,unreachable?}`；Booth 不可达时 unreachable 兜底不报错。
- **前端 `src/components/BoothTimelineCard.tsx`**：四节点固定序 stepper（placed/accepted/fulfilling/delivered；`NODE_FALLBACK_LABEL` 缺节点补 pending 占位；`STATE_META` done 绿 #16A34A/doing 蓝 #2563EB「处理中」/pending 灰「待推进」）；actor 保留 Booth 脱敏原文（XEPZ-****001）；底部「在 Booth 中查看 ↗」深链新窗口（target=_blank rel=noreferrer）；占位态「暂未进入履约」+深链；unreachable 态琥珀提示；**30s 轮询**（卡内 setInterval，orderId 切换重置）。挂 Orders.tsx 行点击展开（openId），api.boothTimeline(orderId)。
- **类型**：shared/types.ts `BoothFulfillmentNode/BoothFulfillmentOrder/BoothTimelineResp`；术语词条 CONCEPT_TERMS.boothTimeline（履约时间线/Booth·履约四节点）。
- **凭证复跑**：`scripts/booth-timeline-check.mjs`（V2 数据一致性比对）+`scripts/booth-timeline-ui-check.mjs`（V1 UI 四节点渲染断言 12 项+截图 assets/conn-01/market-timeline-matched.png；route 注入 Booth 真实结构——Booth 端无公开建单 API，未越权造数）。
- **已知边界**：①Booth 侧 timeline 当前为手工样板单（orderNo=M+时间戳），与 Market 单号（EX-2026-xxxx）零交集——Booth 侧建 orderNo=Market code 的履约单（或透传落地）后 UI 自动渲染 matched 时间线；②Booth timeline API 全量返回无分页（数据量大时需 Booth 侧补过滤参数）；③dev-token 30min 时效由 boothConn 缓存/重签机制消化。

## MARKET-CONN-02：线上 token 签发路径确认（A 路径成立 + 降级归一）

- **结论：dev-token 线上可用，唯一有效参数 `role:"SU"`（大写）**：`POST https://62j75kfyn3.coze.site/api/v1/auth/dev-token` body `{"role":"SU","expires_minutes":45}` → 200（user=admin / user_id=XHPZ#SU-TEST001，RS256 token ~922B）。主 Agent 曾传 `role:"du"/"ddu"/"admin"`（404 no user found for role）与 `{"username":"ddu"}`（404 user not found）——OAS dev-token 仅内置 SU 系种子用户，小写/其他角色均无对应用户。
- **boothConn.ts 零改动即线上可用**：`OAS_ROLE` 默认 `'SU'`（env `BOOTH_OAS_ROLE` 可覆盖）；`BOOTH_OAS_TOKEN` env 注入长效 token 优先（B 方案备份，签发命令=上式，取 `data.token` 全文注入）。主 Agent 线上复验 EX-2026-0020 时无需设置任何 env——代理自动以 SU 签发。
- **降级归一（CONN-02 加固）**：`BoothTimelineCard` unreachable 态不再渲染报错样式——与无履约占位同口径显示「暂未进入履约」+弱化小字「Booth 履约通道暂不可达，稍后自动重试」；端点 catch 返回 200+`{matched:false,unreachable:true}`（实证：BOOTH_OAS_BASE 指向不可达地址重启→200 占位非 5xx）。token 缺失/过期/签发失败→时间线卡永远优雅占位。
- **认证闸门未放松**：代理端点 requireAuth 401 实证保持；token 仍不落浏览器数据接口（仅深链 URL 按 Booth 端既有 ?token= 设计）。
- **主 Agent 线上复验步骤**：①du-hehe 一键登录→交易单→点 EX-2026-0020 行展开→时间线卡（matched 时四节点/未对齐时占位）；②curl 复核：`curl -H "Authorization: Bearer <du-hehe token>" https://<线上域>/api/orders/o-2001/booth-timeline?match=M20260909142124423`（matched 四节点）与无 token 401。

## X-MARKET-EMBED-01：ZiwayOS 嵌入握手 adapter（免登端到端，协议 v1）

- **嵌入检测（双条件防误判）**：`src/lib/embed.ts` `detectEmbedMode()`——`window.parent !== window` 且 URL 显式 `embed=ziway`；仅同时满足才进入嵌入模式。
- **前端握手（`src/components/EmbedGate.tsx`）**：EmbedGate 挂 Shell 顶——加载即向 `window.parent` postMessage `{type:'ziway-embed-hello',app:'market'}`（targetOrigin 固定白名单，严禁 `*`）；监听 message 收 `{type:'ziway-embed-ticket',ticket:'zt_...'}`——`isTicketMsg` 校验 `event.origin === ZIWAY_EMBED_ORIGIN`（白名单单值拒绝通配）+ 类型 + `zt_` 前缀；票到即 `api.embedExchange(ticket)` → `applySession(token,user)` 落会话；8s 无票/交换失败呈游客态+弱提示条+「重新握手」按钮；任意接口 401 清会话后自动重握手（`hadUser` 回落检测）。
- **后端核销桥（`server/embed.ts` + `POST /api/embed/exchange`）**：票格式校验（非 `zt_`/长度<8/>512 → 400）→ `verifyTicket()` **服务端到服务端**调 ZiwayOS `POST /api/embed/ticket/verify` body `{ticket,app:'market'}`（8s 超时，env `ZIWAY_EMBED_BASE` 可指 mock）→ 失败/超时一律 401（reason 透出 `verify_unreachable`/`ticket_replayed`/`app_mismatch` 等，不造假会话）→ `realm !== 'market'`（env `ZIWAY_EMBED_REALM`）→ 403 → `role ∉ {CU,GU}` → 403（仅消费态角色可嵌入）→ 通过则映射内置 CU 演示身份（DEMO_ALIAS['xiaolin']=u-cu1 小林）签发 xm_ token（既有认证链路复用，不自建 JWT 信任锚）→ `{success,data:{token,user,embed:{role,jti}}}`。票单次消费由 ZiwayOS verify 负责（重放在 verify 侧被拒→401）。
- **嵌入壳收敛（`src/App.tsx`）**：Shell 内 `useEmbedMode()` 分支——嵌入态渲染 `{EmbedGate}` 并隐藏 Header/footer/OnboardingTour（隐藏自家外壳）；`RoleGuard` 未登录且嵌入态渲染「嵌入模式 · 等待免登握手」游客提示而非跳 `/entrance`（握手完成 applySession 后自动放行）。非嵌入行为完全不变。
- **白名单覆盖口**：`ZIWAY_EMBED_ORIGIN = import.meta.env.VITE_ZIWAY_EMBED_ORIGIN || 'https://ebb131cf-...coze.site'`——生产/E2E 外不设 VITE 变量=硬编码 ZiwayOS 宿主域；`src/vite-env.d.ts` 提供 vite/client 类型。
- **红线落实**：ticket 不落 URL/localStorage/日志（服务端日志仅前缀+长度 `ticketTag`）；双向 origin 白名单（hello/ticket 均 targetOrigin|origin 校验，无 `*`）；realm/app 服务端校验；非嵌入零行为变化；信任锚=ZiwayOS verify。
- **自测证据（mock verify `scripts/embed-verify-mock.mjs` :9301，语义=app 不匹配拒/app_mismatch、重放拒/ticket_replayed、role DU 放行、realm other 放行、合法票 CU）**：`scripts/embed-exchange-check.mjs` 六态 6/6（合法票 200 会话 xm_ token+CU；同票重放 401 ticket_replayed；zt_bad_role_ 403；zt_bad_realm_ 403；zt_bad_app_ 401；非法票 400）。E2E `scripts/embed-e2e.mjs` 8/8（真 iframe+postMessage 握手：hello 送达→回票→token 落位→嵌入态无 Header→握手提示收敛→商品渲染；非嵌入顶层 /mall Header 存在无握手提示；截图 assets/embed-01/embed-iframe-mall.png+nonembed-mall.png；E2E 以 `ZIWAY_EMBED_BASE=http://127.0.0.1:9301 VITE_ZIWAY_EMBED_ORIGIN=http://localhost:5000` 重启跑完已恢复常态）。
- **真实 ZiwayOS verify 探测**：`POST https://ebb131cf-37e1-493f-8717-36c8905a080a.dev.coze.site/api/embed/ticket/verify` → **401 `{"code":401,"message":"ticket 不存在或已过期"}`**——端点可达且语义正确（假票正确拒绝，非 instance_not_found）；端到端联调仅差宿主侧发放真实票（ticket 签发权在 ZiwayOS 宿主，Market 侧无需也无权自造）。

### EMBED-01-FIX：exchange 对 ZiwayOS verify 响应解析修正

- **根因**：真实 verify 响应是 ZiwayOS 统一包装格式 `{code:200, data:{ok,role,realm,jti}}`（401 时 `{code:401,message:"ticket 不存在或已过期"}`，http 同码）；原 verifyTicket 按裸 `{ok:true}` 顶层判定→真实响应下钻失败误判 `verify_rejected`（mock 裸格式掩盖）。
- **解析修正（server/embed.ts）**：`payload = j.data ?? j`（包装优先/裸兼容）→ `res.ok && payload.ok && role/realm/jti 齐备` 成功；失败 reason 读 `j.message ?? j.error ?? j.data?.message ?? verify_http_${status}`——ZiwayOS 诊断文案（如「ticket 不存在或已过期」）直接透出到 exchange 401 响应。
- **realm 期望值对齐（关键）**：真实 ZiwayOS 签发 **`realm:'xhpz'`**（主 Agent 真票实测）——`EXPECTED_REALM` 默认 'market'→**'xhpz'**（env `ZIWAY_EMBED_REALM` 仍可覆盖）；不改则真票 403 realm 不匹配。
- **自测升级**：mock（embed-verify-mock.mjs）成功路径全部改为**包装格式** `{code:200,data:{...}}`（realm xhpz）+ 新增 `zt_bare_` 裸格式兼容用例 + 失败路径 `{code,message}`；`embed-exchange-check.mjs` **7/7**（包装 200 会话/裸格式 200 会话/重放 401/role 403/realm 403/app 401/非法 400）；**真域失败分支实证**：恢复常态（verify 指真域）后 exchange 假票 → 401 `reason:"ticket 不存在或已过期"`（message 透出）。
- **真票端到端脚本（主 Agent 执行）**：`node scripts/embed-real-verify-check.mjs <zt_真票> [基址，默认 http://localhost:5000]`——三断言：真票 exchange 200 会话（xm_ token+CU）→ token 调 /api/auth/me 200 → 同票重放 401；本地 dev 默认 ZIWAY_EMBED_BASE 指真实 ZiwayOS（服务端到服务端），真票本地即可核销。

## X-MARKET-UX-01 体验断链修复（P0 批次）

- **FIX1 游客购买引导（Mall.tsx）**：游客（含嵌入手柄中）点「立即购买」不再静默吞点击（原仅顶部黄条易出视口）——弹「需要登入」确认卡（文案「下单前需要先登入」+主按钮 Link /entrance「去登入端 →」+次按钮「先逛逛」）；登录用户维持原确认下单弹层。
- **FIX2 待付款状态改向（domain.ts+Orders.tsx）**：`ORDER_STATUS.pending` label '待付款'→**'待店铺交付'**（客户交易单页视角；工作台侧 ORDER_STATUS_META pending '待履约' 不变）；客户视角说明块新增「演示环境暂不支持在线支付：下单后由店铺直接安排履约，无需付款操作」——真支付另立业务单。
- **FIX3 跳过引导持久化（复现实证已生效）**：OnboardingTour closeWith('skipped')→writeTourState(uid,'skipped',kind)→localStorage xm_tour_v1 按 hatId——`scripts/ux01-tour-skip-check.mjs` 4/4（首登弹/跳过关/存储有记录/同号重登不弹）；UX 报告现象与当前实现不符（疑旧版或路径差异），脚本固化防回归。
- **FIX4 下单成功引导（Mall.tsx）**：CU 下单成功由一次性 notice 升级为**成功横条**（绿底 CheckCircle2：「下单成功 · 单号 · 金额 · 待店铺交付」+Link「查看交易单 →」/orders）；错误反馈仍走 notice。
- **FIX5 留痕台账文案对齐（Mall.tsx）**：C 端购买不进三权审计（createOrder 无 checkPower）——原「购买与越权尝试全部留痕」不实，改「越权操作与平台治理动作会留痕（购物订单见交易单页），仅本人可见」。
- **FIX6 术语收敛第一批（主界面去工程代号）**：entrance.ts 企业容器 desc「经营 DU / 供给 *U·EX / 治理 V*M（Market 与 Supply 双面）」→「单位视角：开店经营 / 供货入驻 / 平台管理（多角色企业账号）」；ROLE_BRIEF duty/face 全用户语言化（去 *DU/*DX·L1/EMX/（办位）/X-Supply 等代号）；Orders.tsx「客户视角（XU/CU）」→「买家 / 采购方视角」、「（P3 隐私过滤）」→「为保护双方隐私，对方名称与进价信息不在列表展示」、订单六族条折叠 `<details>「订单编号规则说明」`（详情层保留 C/D/H/E/Y/T）；'Mall·C端'/'Market·B端'→'商城购买'/'企业采购'、'合同对手与售后（DU 承载）'→'合同与售后说明'、CU 侧「供货商→商家（进项）→你」用户语言化；Mall 副标/门店行/留痕块去 '（个人客户 CU）'/'CDX 在 Mall' 等代号；onboarding.ts 三套引导步骤去 *DU/*DX/V*M 代号（如「采购商城（*DU 分店）」→「采购商城」）。
- **验收证据（scripts/ux01-shots.mjs 15/15+截图 assets/ux01/）**：A 游客购买弹登入引导（弹窗+链接）/B 登录下单→成功横条→一键到交易单/C 交易单页「买家 / 采购方视角」+「演示环境暂不支持在线支付」+六族折叠且主界面 0 曝光/D 登入端企业容器用户语言+工程代号 0 命中/E Mall 代号 0 命中；FIX3 脚本 4/4；**EMBED-01 协议回归 embed-e2e 8/8**（iframe 握手/免登/嵌入壳隐藏/非嵌入 Header 正常）；lint/ts-check 全绿。

## XMK-CONT-01 登入端六容器卡 + 命名规范 v1.3（2026-09-11）

- **定版口径**：容器六类（取代 09-08 四类）——XHPZ 自然个人 **HP** / XEPZ 自然企业 **EP** / XDPZ 生态方经营户 **DP** / XVPZ 生态方平台 **VP** / XOPZ 生态方治理 **OP** / XGPZ 政府 **GP**（简称规则 X?PZ→?P）；Booth 六形态中文定名——零售店 Xshop / 项目台 Xdomain / 制造厂 Xfactory / 研发室 Xlab / 人事部 Xmate / 空间场 Xplaz（尾字字辈：店-台-厂-室-部-场）。
- **entrance.ts**：`ContainerKind` 扩 'dp'；`CONTAINER_META` 三实卡（personal #xhpz / enterprise #xepz / **dp #xdpz**——name 经营户容器，desc「生态方经营户：登录 XDPZ#DU 经营账号，进 DU 经营视角（开铺 / 采购 / 履约衔接）」，accent 橙 #B45309）全带 `short` 徽标字段；`RESERVED_CONTAINERS` 三预留卡 **xvpz 平台容器（生态方平台：平台运营总控，预留）/ xopz 治理容器（生态方治理：治理与规则维护，预留——原「平台容器」文案修正）/ xgpz 政府容器**，均带 short。
- **EntranceGate.tsx**：`ENTERABLE=['personal','enterprise','dp']`+`ENTER_ICON` 映射（dp→Store）；六卡渲染（实卡 3+预留 3），实卡右上角简称徽标（accent 色边框 mono），预留卡同款徽标+「预留」灰标；预留卡无入口。
- **EntranceLogin.tsx**：container 参数校验扩 'dp'；`CONTAINER_SIDE` 徽标行（dp='经营户 / 生态方侧'）；**dp 容器 demo 过滤 `d.id==='dp1'`**（XDPZ 演示账号唯一）；登录页流程与既有 personal/enterprise 完全同构。
- **XDPZ 账号种子**：store.ts containers 加 `c-dp1`（type **'XDPZ'**——ContainerType 联合类型同步扩 XDPZ，units 加 `u-dp1`（code DU-DP1，role 'DU'，side B，containerId c-dp1，domainTags ['DE_MARKET']）；routes demoAccounts 加 dp1 条目（label「生态方经营户 · XDPZ#DU」，entry B）+`DEMO_ALIAS['acc-dp1']=DEMO_ALIAS['dp1']` 别名+**login 密码特例 `acc-dp1/Test1234`**（其余账号仍 DEV_PASSWORD test123，错密码 401 回归）。
- **DU 视角一致性（红线）**：dp1 hatRole='DU'→workbenchOf→/operator，与恒产六 DU 完全同构（KPI/铺面/采购商城/履约），不另起炉灶；buildSession 走标准容器/帽查找（c-dp1/u-dp1 实体 seed）。
- **术语表（terminology.ts）**：`CONTAINER_TERMS` 六容器词条（code/short/big/sys）+`BOOTH_FORM_TERMS` 六形态词条（en/big/sys）——后续 UI 引用统一走词条，禁止页面写死。
- **命名规范 v1.3**：`X-Market_原型_20260908/知味数智生态_命名体系规范_v1.3_20260911.html`（六容器全谱表：全称/简称/主体线/开放状态；六形态中文定名表：英文/中文/尾字字辈/定位；变更记录 v1.2→v1.3）。
- **验收**：cont01-check **10/10**（oneclick dp1 200+hatRole DU、me DU、container c-dp1、acc-dp1 别名 200、密码 Test1234 200+DU、错密码 401、V3 抽样 xiaolin CU/xu-huadong XU/du-hehe DU、**红线 46 账号 oneclick 全通**）；cont01-shots **17/17**（六卡+六徽标+xopz 非「平台容器」+dp 登录页+XDPZ#DU demo 卡+一键登录落 /operator+Header 经营者徽标；截图 assets/cont01/entrance-six-cards.png、xdpz-login-page.png、xdpz-operator-view.png）；**CONN 履约时间线回归 booth-timeline-ui-check 10/10**；lint/ts-check 全绿。

## MKT-SYNC-01 三层升级协调单（红线收口 + 升级范围确认，2026-09-11）

- **协调单全文**：`assets/mkt_sync01.md`——主人授权三层升级（X-Customer / X-Market&Mall / X-Supply），嵌入契约升级期间冻结。
- **红线（遵守状态）**：①`/api/embed/*` 全部端点契约冻结（exchange POST 400 校验保留 / verify / 白名单逻辑，请求响应结构不变）——**未动**；②`/xhpz/embed/market` 路由+握手协议稳定，三形态票兼容（data.ticket / payload.ticket / data.ticket）不删任一——**未动**；③origin 白名单必须含 ZiwayOS 生产壳 `c8w9k9wq2g.coze.site` + ZiwayDS 生产壳 `8vyt5xfk57.coze.site`——**本次收口**（lib/embed.ts `ZIWAY_EMBED_ORIGINS` 补 8vyt5xfk57，EMBED-03-M 教训防回归）；④守卫横条逻辑（8s 无票→游客条）——**未动**。
- **范围确认（回主 Agent 三问）**：①拆新模块渐进升级，不重构现有 repo 路由；客集 `/api/customer/*` 新开含本期；②本期不涉 `/api/embed/*` 与嵌入页 UI（唯一白名单追加已随本次 commit 落地）；③部署时点=白名单收口 commit 即可部署，后续三层升级按工单分批。
