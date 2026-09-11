# EMBED-L2-R2 收票确认链路修复（终验 v2 · Market 端）

终验 v2 14:42 L2 = ZiwayOS(CU acc-yc1) → Market：**壳侧票送达成功**（新版状态机琥珀横幅「免登票已送达 · 等待业务端确认」，5 轮 poll 稳定），但 Market iframe（fhrrxb4t8g/mall?embed=ziway）始终未回确认，未达 authed 绿。对照 L3→ERP 已通。证据：browser/embed_final2_log.txt L2v3 段 + screenshots/embed_final2/l2v3_*.png。

## 排查方向（Market 前台+服务端）

1. 前台收票处理器注册时序（DOMContentLoaded/模块加载先后），确认 0db2453 bundle 真实生效（无多实例旧版）。
2. 收票后 /api/embed/exchange 调用、响应处理与失败静默点（任何 try/catch 吞错都列出）。
3. 验票成功后回发 ack 给壳：消息名、字段、targetOrigin（严禁 *）。
4. origin 白名单对 c8w9k9wq2g 的匹配（协议+域名精确）。

## 要求

- 你正在执行三层升级：本单在升级当前批次完成后处理，勿中断升级；嵌入契约红线不变（/api/embed/* 结构、三形态票、白名单两壳域、守卫横条）。
- 回报根因+commit hash；部署由主 Agent 执行（届时与 L2 复验一起错峰安排）。
