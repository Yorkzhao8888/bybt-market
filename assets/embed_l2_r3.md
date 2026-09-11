# EMBED-L2-R3：部署后 L2 回归——核销失败快速红 + 踢会话

## 现象（终验 v3 实证，5 次尝试一致）
- 部署 d7e32b2（含 930c332 ack 回执 + 277aeeb XMK-API-01 + c36faa7 + 5f0d443）后，ZiwayOS 壳（CU acc-yc1）→ /xhpz/embed/market：**T0 即红**「免登未完成 · 嵌入票据核销失败」→ 轮询转「ticket_timeout」；琥珀 0/5 次、绿 0/5 次
- iframe 游客横条「嵌入免登未完成（票未送达或核销失败）」+「重新握手」
- **次生回归：壳会话被踢**（/xhpz/embed/market → /login → /xhpz/home）
- 对照基线：部署前 final2 为琥珀挂死（票送达+exchange 成功+applySession 成功，仅缺 ack）——说明 **exchange/verify 核销链路本身新引入回归**

## 判断
- 930c332 ack 回执已正常工作（红=ok:false 真实回传，不再琥珀悬挂）——不是它的锅
- 重点怀疑 **277aeeb XMK-API-01** 的 auth/三权中间件改动波及 embed 链路：/api/embed/exchange、对 ZiwayOS 的 POST /api/embed/ticket/verify 调用、SessionUser 会话逻辑（hatId 归一、CU 特判等）
- c36faa7（白名单）/5f0d443（STRUCT）影响逐一排除

## 排查要求
1. 本地复现：自签票 → exchange → verify 全链走 200；失败则断言到具体中间件/字段/状态码
2. git diff 277aeeb 检查 auth 中间件对 /api/embed/* 路由与内部 verify 调用的影响（新增 401 拦截？SessionUser 契约变化？）
3. 修复 + 独立 commit + 回归全绿：embed-diag 12/12 + embed-e2e 8/8 + exchange-check 7/7 + api01-check 33/33（API 面不回归）

## 红线
- 四消息协议（hello/ticket/exchange/verify + ack）字段与消息名不动
- 客集/供集 API 准入矩阵与 oneclick 47/47 零回归

## 回报
根因 + commit hash + 自测证据；部署归主 Agent，部署后主 Agent 线上复验 L2。
