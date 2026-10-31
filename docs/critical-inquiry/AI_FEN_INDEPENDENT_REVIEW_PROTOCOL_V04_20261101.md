# 艾芬 / 《发哨子的人》｜v0.4 独立证据复核协议

**状态：REVIEW PROTOCOL ONLY — NOT A COMPLETED REVIEW.**  
**研究分支：** PR #26（Draft）；**公开页面：**无；**出版授权：**无。  
**建立日期：** 2026-11-01；本协议不更改 v0.3 冻结研究结果。

## 1. 复核目标与独立性

复核者必须从归档 URL 和捕获日期重新读取原始存档 HTML，不能仅从 PR 描述、JSON 摘要或作者截图推导结论。每项记录 `PASS / CONTRADICTED / INCONCLUSIVE`，附访问时间、最终 URL、HTTP 状态、页面摘要/指纹、原始截图路径（如允许）及有限文字摘录。

禁止以 GitHub Actions 成功替代人工历史解释；网页不可访问标为 INCONCLUSIVE，不能当作不存在。

## 2. 最小独立核对集

| 编号 | 待检查对象 | 来源 | 可支持的有限主张 | 反证/失败条件 |
|---|---|---|---|---|
| R1 | 2020-03-11 03:06:34 北京时间 yyrw 首页 | https://web.archive.org/web/20200310190634/https://www.yyrw.org.cn/ | HTML 中有指向 `/e/action/ShowInfo.php?classid=5&id=2256` 的列表链接 | 链接并非该 article ID、页面为误重定向/不同捕获、只在 Wayback 注入结构中出现 |
| R2 | 2020-03-12 14:31:01 北京时间 yyrw 首页 | https://web.archive.org/web/20200312063101/http://www.yyrw.org.cn/ | 该份完整可读 HTML 不包含对应直接链接；不能推出连续下架 | 抓取不完整、关键导航动态载入、存档根本不是可比首页；或实际存在目标链接 |
| R3 | 2020-03-11 01:09:54 标题 | https://web.archive.org/web/20200310170954/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256 | 捕获页面标题以“吹哨子的人”开头 | HTML 标题缺失或实际不是该文本 |
| R4 | 2020-03-11 12:19:23 标题 | https://web.archive.org/web/20200311041923/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256 | 捕获页面标题以“发哨子的人”开头 | HTML 标题缺失或实际不是该文本 |
| R5 | 原《人物》微信 URL 失效状态 | https://web.archive.org/web/20200310225825/https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg | 在该捕获时点页面出现不可查看提示 | 页面实际上包含原采访主体，或捕获重定向不对应目标 URL |
| R6 | 21join / 合传媒衍生副本 | https://web.archive.org/web/20200312004223/http://www.21join.com/index.php?m=content&c=index&a=show&catid=9&id=2703 | 当时的快照包含采访相关正文、标题及署名线索 | 不是文章页、内容与预期不对应、时间戳或载体不可靠 |
| R7 | 披露指令的转述及其 caveat | https://chinadigitaltimes.net/chinese/655981.html ; https://chinadigitaltimes.net/2020/12/minitrue-diary-march-10-2020-tibet-independence-covid-rent-relief-whistleblower-epidemic-transmission-and-treatments/ | CDT 披露材料含目标 URL 和首页相关文字；日期/适用范围不确定 | 页面不含该 URL/措辞，或被错误当成原始签发记录 |
| R8 | 2020 年其余 5 份首页归档 | 冻结账本 `research/critical-inquiry/ai-fen/title-homepage-cdx-v01.json` 中的 5 个具体捕获时间 | 分别观察到后续 HTML 无目标直接链接 | 某个完整可读捕获仍含该链接；或缺失导致覆盖不足 |

## 3. 来源依赖图的复核

- 原《人物》微信原始发布字节：**未取得**。
- Terminus、yyrw、21join 是衍生文本，不自动计为三份独立原始证据。
- CDT 对合传媒的归属是来源自身的声明；CDT 与 21join 不视为两个互相独立的源头。
- CDT 中文/英文披露属于同一披露谱系，不视为两个独立签发记录。
- 题名转换、首页可发现性和微信链接不可查看属于不同可观测状态，不能合并成一项“删除事件”。

## 4. 时间与因果限制

- 对 R3/R4，只能写“标题状态在两次存档观测之间变化”，不能写准确编辑时刻、编辑者或动机。
- 对 R1/R2，只能写“首页快照显示链接先在、后不在”，不能断言命令执行、首页推荐排序或连续不可见。
- 对 R7，必须保留“指令日期可能是泄露日期，不一定是签发日期”的 caveat。
- 对 R5，不可由失效页面判定平台内部操作人。
- 不可将 21join 计数接口的站点 hits 当作独立阅读人数。

## 5. 输出与停止规则

独立复核者提交每行的证据状态、原始链接、访问时间、失败原因与对研究结论的影响。只要 R1–R4 任一关键记录被确证推翻，就暂停对应时间线主张并修订原账本；若只是档案服务失效，维持冻结记录，但公开标注不可再现。R7 的来源归属或时间 caveat 发生冲突，暂停所有指令—首页联动叙述。

当且仅当核心快照经第二位研究者独立复核、版权与发表声明由作者确认后，可考虑将案例编成短篇**数字史料考证**；不能自动从本协议的创建进入公开出版。

## 6. CI 与人工复核的区分

`scripts/verify-ai-fen-live-audit.mjs` 的 `VERIFIED_BOUNDED` 仅表示该次动态抓取与冻结快照中的指定状态一致，不表示独立人工审查、全档案覆盖、指令真实性或因果识别。若 CI 输出 `INCONCLUSIVE` 或 `DRIFT`，保留 artifact 与原始日志，不重写历史记录制造通过结果。
