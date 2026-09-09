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

## 全局规范：*DU 分经营号命名规范（2026-09-10 定版）

- **决策**：分经营号统一采用「域 + *DU」写法，替代原 D*U 实例写法（DYU/DEU/DCU/DHU/DTU），消除与供给源 *U 系字母级碰撞。命名展示规范化，**权限帽 ID 语义不变**（后端字段/审计 actor_hat/权限逻辑/路由零改动）。
- **三系区分（防碰撞口径）**：①经营号系：主=DU、分=**{Y,E,C,H,T}\*DU**；②供给源系：YU/EU/HU/TU（不变）；③执行帽系：D*X 系（DYX/DEX/DCX/DHX/DTX，不变）。星号派生语义与 D*X 一致（「星号分/派生」概念保留在规范说明中，仅实例化写法统一为 *DU）。
- **域对照（terminology.ts `DU_CHILD_BY_DOMAIN`/`duChildTermOf` 唯一口径）**：Y*DU 智场经营 / E*DU 产品经营（E/DE 域同归 E 线）/ C*DU 客户经营 / H*DU 人资经营 / T*DU 技术经营；无域匹配兜底「*DU · 分经营号」。
- **术语表**：CONCEPT_TERMS.duChild 更新为 {big:'店主', sys:'*DU · 分经营号'}。
- **徽标文案**：Header operator 徽标第二行「D*U · 子DU · hatId · Booth 码」→ `{duChildTermOf(user.domainView)} · hatId · Booth 码`（按域展示经营范畴，如「E*DU · 产品经营 · u-du1 · b-de1」）；OperatorDesk 徽标「经营工作台 · *DU」、欢迎区身份按 duChildTermOf 范畴化；SupplyPurchaseDesk 分拨说明「D*U 子店」→「*DU 分店」。
- **登入端（ENTRANCE-01）**：EntranceRole 角色卡 DU 职责按 *DU 规范书写（「分经营号经营（*DU）：铺面管理 / 询价报价 / 采购商城 / 履约衔接」），避免后续返工。
- **红线**：历史章节中 D*U 实例写法为当时实现记录，展示层一律以本规范为准；「店主」大号市面称呼保留；审计 actor_hat 保留系统标识原文（DU/DEX 等）不大号化。

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
