# MKT-SYNC-01 三层升级协调单（主 Agent → Market 窗口）

主人已同步：X-Customer / X-Market&Mall / X-Supply 三层架构升级已授权你窗口执行（主人 13:56）。收到本单请确认升级范围并遵守以下红线，无需停下开发。

## 红线（升级期间嵌入契约冻结）

1. `/api/embed/*` 全部端点契约冻结：`/api/embed/exchange`（POST，400 校验行为保留）、`/api/embed/verify`、白名单逻辑——不得变更请求/响应结构。
2. `/xhpz/embed/market` 嵌入页路由与握手协议保持稳定：三形态票兼容（`e.data.ticket` / `payload.ticket` / `data.ticket`）不得删除任一形态。
3. origin 白名单必须继续包含生产壳域 `c8w9k9wq2g.coze.site`（ZiwayOS 壳）与 `8vyt5xfk57.coze.site`（ZiwayDS 壳）——EMBED-03-M 修过未部署的教训已收口，勿回归。
4. 守卫横条逻辑（8s 无 hello→游客条）保持。

## 时序协调

- 三链路终验 v2 正在跑（L2=CU→Market 免登）。若你升级后中途部署，L2 可能验到中间版本。
- 因此：升级完成部署前，先回一条消息报「三层升级部署中」；部署完成后再报 commit hash，我统一安排 L2 复验。

## 需要你回复的升级范围确认（简短即可）

1. 三层是拆新模块还是重构现有 repo？客集 `/api/customer/*` 新开是否含在本期？
2. 是否涉及 `/api/embed/*` 或嵌入页 UI 改动？有则列出，便于终验错峰。
3. 预计部署时间点。
