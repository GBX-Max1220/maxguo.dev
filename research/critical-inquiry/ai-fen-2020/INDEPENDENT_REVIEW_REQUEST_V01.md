# 《发哨子的人》专题：独立复核者检查表 v0.1

**本文件仅是供未来真人审阅的核验任务，不是复核已完成的签署记录。2026-10-29，G3=HOLD，G4=HOLD，G6=HOLD。**

## 审阅对象和基本约定

- 两篇研究文章草稿：`editorial/visibility-is-not-preservation-zh-v01.md` / `...-en-v01.md`。
- 命题与来源：`evidence-v01.json`，重点`AFC05`、`AFC11`、`AFC12`、`AFC13`、`AFC14`、`AFC15`—`AFC19`。
- 指令特别说明：`DIRECTIVE_DISCLOSURE_AND_PUBLIC_VISIBILITY_AUDIT_20261029.md`。版本来源：`HISTORICAL_GIT_EDITION_AND_ATTRIBUTION_AUDIT_20261029.md`。
- **方法纪律**：区分 **(i) 直接取得的历史对象**、**(ii) 二手编辑/新闻的陈述**、**(iii) 当事人被引述的自述**、**(iv) 官方或平台所称政策**、**(v) 研究者的批判性推论**。一项资料可以支持其文本“存在”，但不必然证明其事实陈述为真。拒绝假设某材料发表于它标题标出的历史日期即可作为当时公众可见信息。

## 五个优先核验题

1. **原微信档案**：打开[nCovMemory源CSV](https://github.com/2019ncovmemory/nCovMemory/blob/master/data/data.csv)查第3142行，复核原微信链接及`archive.vn/OLdHs`。可否取得独立保存的初版正文、抓取UTC时间和原始网页标识？若失败：记录 `UNAVAILABLE / NOT VERIFIED`，不能补写“2020-03-10 10:10已证实”。
2. **Git历史版次**：从[Terminus2049 4dee83a提交](https://github.com/Terminus2049/Terminus2049.github.io/commit/4dee83a23f66c4a2d7f4433b8e0ce5381101632b)检查旧中文路径与之后3次修改，核对blob SHA、条目内容、两处八人导语与一处艾芬自述；**不得把Git提交时间当原微信发表时间**。
3. **机构转载与标题**：打开[2020-03-10 21:50 Wayback快照](https://web.archive.org/web/20200310135052/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256)，确认页面标题是否真的以“吹哨子的人”开头、文中是否保留“发哨子”的第一人称描述、是否有与Git版不同的署名字段和附加首句。即便属实，也不能直接推测动机。
4. **涉发哨人的限制文本**：复核[CDT 2020-12-11披露](https://chinadigitaltimes.net/2020/12/minitrue-diary-march-10-2020-tibet-independence-covid-rent-relief-whistleblower-epidemic-transmission-and-treatments/)、[中文引用链接](https://chinadigitaltimes.net/chinese/655981.html)、[2026-06乐视总目录](https://chinadigitaltimes.net/chinese/728404.html)、[2026导入的3月10日条目](https://chinadigitaltimes.net/space/%E4%B9%90%E8%A7%86%E6%8C%87%E4%BB%A420200310)。**重点**：一致的同一URL、CDT声称如何取得/核验、2020报道与2026存档有无复用关系、真正的原始发令件缺失。把“首页撤下”严格与“页面URL删除”分开。
5. **2月7日与李文亮跨案例比较**：核对[乐视2月7日档案](https://chinadigitaltimes.net/space/%E4%B9%90%E8%A7%86%E6%8C%87%E4%BB%A420200207)是否分别记载“只允许央视来源转载李文亮去世报道”与“避免‘吹哨的人’概念”。这两个内容是否来自同一日资料？能否避免把不同控制手段写成已被逐站执行的事实？

## 复核记录模板（留空，由真正审阅人填写）

| 项目 | 当前提交者侧状态 | 独立复核结果 | 冲突/缺失与证据URL | 日期/审阅者 |
|---|---|---|---|---|
| W1 原微信首版与Archive.today | **HOLD** | 未签核 | 未签核 | 未签核 |
| W2 Git提交与版次重复 | 可重复操作，**未签核** | 未签核 | 未签核 | 未签核 |
| W3 Wayback 转载标题差异 | 作者侧观察，**未签核** | 未签核 | 未签核 | 未签核 |
| W4 3月10日宣传指令及URL对应 | CDT已公开文本，**未独立认证原件** | 未签核 | 未签核 | 未签核 |
| W5 2月7日的用词与央视稿源限制 | 2026乐视档案，**未独立认证原件** | 未签核 | 未签核 | 未签核 |
| B1 中文/英文含义与法律用语对齐 | 机器检查部分通过，**未签核** | 未签核 | 未签核 | 未签核 |
| P1 版权/图片/私人医疗信息检查 | **HOLD** | 未签核 | 未签核 | 未签核 |

**强制结论等级：** `CONFIRMED_SOURCE_CONTENT`（独立确认存世文本），`SUPPORTED_ATTRIBUTED_REPORT`（媒体/平台所说），`UNKNOWN_OR_NOT_AUTHENTICATED`（不能补证），`CONTRADICTED`（发现反证），`NOT_APPLICABLE`（不适用）。在“发现个别证据的错误”时允许降低主张强度或整句删除；不得为了完成发布而自动把UNKNOWN升级为确认。

## 出版签署（截至2026-10-29全部待办）

- **G3 历史/学术独立审核：HOLD**（必须真实的第二审阅人留下逐条依据与日期；AI二次检查不算）。
- **G4 版权、隐私与安全：HOLD**（只做必要短摘，不上传采访全文、私人微信和患者报告）。
- **G5 清洁出版PR：NOT OPENED**（仅从最新main新建，仅文章与必要交互，不合并研究分支）。
- **G6 编辑批准：HOLD**（人类明确决策之后再上线）。
