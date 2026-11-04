# Ai Fen v0.5｜审查状态与出版判决（2026-11-01）

**Status: DRAFT — NOT PUBLICATION AUTHORIZATION.**

## 本轮做了什么

1. 复查 PR #26 的冻结首页与标题状态账本、三源文本比较和 v0.4 独立审阅协议。
2. 尝试从单独网页检索入口打开四份核心 Wayback 页面；本入口均未能取回页面，因此**没有获得独立的原始快照验证**。这不否定先前 GitHub Actions 的限定范围复现。
3. 重新读取中国数字时代中文披露页面，确认页面文本确实显示“涉发哨人，此类报道不上首页，如有请撤下”和 yyrw 同一文章 URL。这是**CDT 的披露内容被确认可读**，不是原始签发记录被认证。
4. 将 PR #26 已有的动态复现结果 21 份文章标题+7 份首页状态与人工审阅状态严格分开。
5. 形成独立成文的数字史料考证审阅草稿，及跨案例可见性方法协议。

## 分项审查状态

| 项目 | 自本轮获取的独立网页证据 | 先前 CI 复现 | 独立人类复核 |
|---|---|---|---|
| R1/R2 首页前后状态 | NOT RETRIEVED | VERIFIED_BOUNDED | NOT PERFORMED |
| R3/R4 标题前后状态 | NOT RETRIEVED | VERIFIED_BOUNDED | NOT PERFORMED |
| R5 原微信链接 | NOT RETRIEVED THIS ROUND | 已有冻结来源记录 | NOT PERFORMED |
| R6 21join 备份 | NOT RETRIEVED THIS ROUND | 已有三源比较 | NOT PERFORMED |
| R7 CDT 中文披露 | PAGE TEXT RE-READ | 独立于 CI 内容比对 | NOT PERFORMED |
| R8 后续首页 | NOT RETRIEVED THIS ROUND | VERIFIED_BOUNDED | NOT PERFORMED |

注意：上述 `NOT RETRIEVED` 指本轮独立检索入口受限，而不是存档不存在，也不是历史结论被推翻。

## 编辑上的重要限制：自然轮替替代解释

“3月11日首页有链接、3月12日首页无链接”与宣传审查指令的披露关联具有研究意义，但**新闻首页自然轮替**同样能产生这种状态。若无法找到同栏相邻文章的更新规律或更强执行链证据，就不能将个案归因为审查执行，不能把“首页消失”作为独立的审查识别指标。

## 不应继续投入的工作

- 不再因多个转载副本文本一致就增加所谓独立来源数。
- 不根据站点自述推断 2020 年的实际主管或审查授权关系。
- 不根据 21join 的 hits 字段推测真实传播规模。
- 不扩成新的大规模传播论文；已有 Sun & Wright 的相关研究，应保留原创性边界。
- 不因 CI 绿灯就认为人工复审完成。

## 可交付物与决策

- **短篇数字档案考证审阅稿**：`docs/critical-inquiry/AI_FEN_ARCHIVAL_MICROHISTORY_REVIEW_DRAFT_V05_20261101.md`
- **跨案例可复用方法**：`docs/critical-inquiry/HISTORICAL_VISIBILITY_METHOD_V01_20261101.md`
- **独立人工核验清单**：`docs/critical-inquiry/AI_FEN_INDEPENDENT_REVIEW_PROTOCOL_V04_20261101.md`

**建议：暂停进一步自动扩展艾芬单案。** 下一笔研究投入应优先用于检查首页自然轮替的竞争性解释，或让第二位审阅者复核 R1–R8。如果得不到新的区分证据，可将其明确发表为有边界的档案考证，而非机制识别论文。此前成果不因缺乏因果识别而失效。

**出版门槛**：独立人工检查、作者确认版权和用语、中文/英文内容校准、明确发布授权。当前仍然 **HOLD**。PR #26 继续 Draft，不合并、不触碰 main。
