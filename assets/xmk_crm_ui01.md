# XMK-CRM-UI-01 客集 UI 单（X-Customer PRD v1.1 P0 全量）

## 定版依据（务必以此为准，禁止另造口径）
- **PRD：/Coze/Drive/扣子/XCustomer客集PRD_v1.1_20260911.md**（主人 16:53-16:55 定版）——F1-F5 逐条按 PRD 验收标准实现
- 术语：terminology v1.4+ 常量；上位口径：集市三层定版 v1.2

## 任务（PRD 第 7 节 P0：F1-F5）
1. **F1 客集工作台**：三区块（我的需求单/我的采购意向/我的客户档案）；入口挂 /mall 三层导航客集区；非 CU 访问显示守卫拒绝页（复用 GovernanceDesk 拒绝页模式）
2. **F2 需求单管理**：对接 /api/customer/demands——列表（本人容器过滤）/发布（title 必填+desc）/详情状态；POST 后即时可见
3. **F3 采购意向管理**：对接 /api/customer/intents，同构 F2，意向可关联需求单展示
4. **F4 客户档案页**：对接 /api/customer/profile——只读展示派生身份（identity_id/容器/帽），明示「档案由 OAS 派生，不可编辑」，零编辑入口
5. **F5 时间线+confirm 动线**：读 /api/supply/orders 时间线（CU=buyer 视角）；confirm 按钮带「确认=责任转移+触发结算」知情提示；重复 confirm 409 正确呈现

## 身份矩阵（UI 侧守卫，API 已保，UI 不得绕过）
- XHPZ#CU / XEPZ#CU：全功能 ✅（XEPZ#CU 仅见本人 buyer 单）
- XDPZ#DU：403 守卫页；匿名：跳登录；XVPZ 系：引导至 /governance

## 红线
- /api/embed/* 与客集/供集/治理 API 契约零改动（UI 不得要求新字段；确需走契约升版另议）
- 零帽名（界面只用用户语言）；零硬编码中文名（全走 terminology）；禁 mock
- Non-Goals 遵守：客集不做撮合/承接/客户资源供应/结算执行（PRD v1.1 第 5、13 节）
- 回归基线：oneclick 48/48 + api01-check 33/33 + gov01-check 38/38 + embed 全量 + cont01-shots 17/17 + struct01-shots 7/7 零回归

## 回报
commit hash + 改动文件清单 + 自测证据（截图/check 脚本；新增 crm-ui-check 建议覆盖 F1-F5 验收点+身份矩阵负向用例）；部署归主 Agent。
