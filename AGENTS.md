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
│   ├── api/client.ts   # api.*（login/oneclick/markets/marketBooths/inquiries/orders/governCases...）
│   ├── lib/domain.ts   # 颜色/帽标签/canOperate/canOpenMarket/marketLabel 等 helper
│   ├── components/ui.tsx
│   ├── pages/          # Home/Login/Mall/MallBooth/Market/MarketBooth/Orders/Model/Govern
│   ├── Auth.tsx        # AuthContext
│   └── App.tsx         # 路由（/mall /market /orders /model /govern）
└── index.html
```

## API 清单（/api 前缀）

- auth: POST login(password=test123) / oneclick(demoId) / GET me / GET demos / POST logout
- overview: GET（首页五域链路）
- model: GET containers / units / hierarchy / markets（五大市场+权属）
- mall: GET listings / booths（DCX 门店，C 端）
- market: GET booths / GET booths/:id / POST booths（开新铺，按域校验铺主帽）/ POST inquiries / GET inquiries / POST inquiries/:id/quote / inquiries/:id/contract
- orders: GET（按身份过滤：客户只见自己、DU 见名下多店、运营方见管辖域）/ POST（支持 side/inquiryId）/ GET families
- flows: GET（订单流/资源流/资金流三段）
- govern: GET cases（V*M 运营治理：市场秩序/规则制定/Booth 系统供给）

## 权限口径（服务端强制）

- 客户（CU/XU）：不可开铺/上架/报价（403），不可进入开铺面板；orders 只见 buyerContainerId === 自己容器。
- DU：开 du 实体铺（E/T 域仅直营）、报价、名下多店订单总览。
- 供给帽（EU/HU/TU/YU）：开 supply 实体铺（本域）。
- V*M（VEM/VYM/VHM/VTM/VDM）：全域订单总账 + 治理台。

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
