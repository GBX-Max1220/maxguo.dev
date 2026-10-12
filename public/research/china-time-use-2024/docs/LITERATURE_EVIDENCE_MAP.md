# LITERATURE_EVIDENCE_MAP.md — 文献、理论与「本调查实际测量」的对应关系

**版本**：D1.1（2026-10-11 修订）。本轮按独立审计意见收紧了第四幕的表述精度，
逐条改动见 `D1_1_REVISION_LOG.md` §P0-4；本文件同步更新「理论主张」与「被允许的表述」两栏。

**目的**：第四幕引用了三篇外部文献作为「解释视角」。本文件把每一篇的**书目事实**（可核验）、
**它主张什么**、**本次调查测到了什么 / 没测到什么**、以及**在本页被允许说什么**逐条对齐。
任何无法证实的推论，在本页一律降级为「还需要什么证据」，不写成结论。

**书目事实来源**：Crossref REST API 抓取记录，随包存于 `evidence/literature/crossref_*.json`，
哈希见 `evidence/EVIDENCE_MANIFEST.json` 与数据层 `meta.generated_from.literature`。
页面上的作者、年份、标题、期刊、卷期页码由这些记录生成，不是手工录入。
**DOI 可达性**：`evidence/literature/landing_checks.json`（本机 2026-10-11 观察）。

---

## 1. Eagly & Wood (2016) — 社会角色理论

| 字段 | 值（来自 Crossref 记录） |
|---|---|
| 标题 | Social Role Theory of Sex Differences |
| 作者 | Alice H. Eagly, Wendy Wood |
| 出处 | The Wiley Blackwell Encyclopedia of Gender and Sexuality Studies（Wiley） |
| 类型 / 年份 | encyclopedia entry（`type: other`）/ 2016-04-21 |
| 页码 | 1–3 |
| DOI | 10.1002/9781118663219.wbegss183 |
| 链接 | https://doi.org/10.1002/9781118663219.wbegss183 |
| 本机可达性 | Wiley 返回 **HTTP 403**（站点对自动抓取的拦截；DOI 解析本身成功跳转到 onlinelibrary.wiley.com） |
| D1.1 表述收紧 | 页面不再使用任何按生理性别二分的断言式措辞；改为「社会角色、家庭结构、机会与规范**可能**与劳动分配相关」，并把该框架定位为**可检验的假说**（若差异不随角色分布变化，其解释力应被削弱） |
| 记录哈希 | `24791a0bb6dcba44…`（见清单） |

**理论主张（该文献的通用内容）**：性别在心理与行为上的差异，主要来自劳动分工产生的**角色分布**
（谁照顾家庭、谁参与有偿劳动），角色分工再催生相应的期待与特质（communal / agentic），
期待反过来引导行为与时间分配。它是一个**生成假说的框架**，不是对某一次调查的测量结果。

| 本调查测到了 | 本调查没测到 |
|---|---|
| 分工的**结果**：有酬劳动参与率 男 60.2% / 女 47.7%，无酬劳动参与率 男 67.5% / 女 83.9%；参与者时长 404/355 与 112/209 分钟 | 角色信念、角色期待、家庭内协商、对「谁该做什么」的态度；没有任何心理测量题项 |

**页面被允许的表述**：「该理论提供研究假说」「这份数据能显示分工结果，不能验证这些机制」
「当前汇总表未测量角色信念，不能归因」。
**禁止并已排除**：任何「中国女性的角色期待导致其无酬劳动更多」式的因果或机制断言。
**注意**：这是百科条目（3 页），不是原始实证研究；页面把它作为**理论入口**而非证据来源，
其效应量、实验证据一概不引用（本调查也无从对照）。

---

## 2. Daminger (2019) — 家庭认知劳动

| 字段 | 值 |
|---|---|
| 标题 | The Cognitive Dimension of Household Labor |
| 作者 | Allison Daminger |
| 出处 | American Sociological Review, 84(4), 609–633 |
| 年份 | 2019-07-09（SAGE） |
| DOI | 10.1177/0003122419859007 |
| 链接 | https://doi.org/10.1177/0003122419859007 |
| 本机可达性 | HTTP 200 |
| 记录哈希 | `c99b2dd4130827bc…` |
| D1.1 表述收紧 | 标题与正文统一为「家庭劳动的**认知维度**」，并明确写出「**不是与家务并列的另一类活动，而是家庭劳动的一个维度**」；样本量按摘要原文表述为「35 对伴侣共 70 次深度访谈」 |

**研究设计与主张（摘要原文，`evidence/literature/s2_daminger.json`）**：
“Using **70 in-depth interviews with members of 35 couples**, this study argues that such tasks are
better understood as examples of a unique dimension of housework: cognitive labor. The data
demonstrate that cognitive labor entails **anticipating needs, identifying options for filling them,
making decisions, and monitoring progress**.” 研究还发现认知劳动在双职工伴侣中高度性别化。

| 本调查测到了 | 本调查没测到 |
|---|---|
| 以 15 分钟为单位记录的**正在进行的活动**时长（含家务劳动、陪伴照料家人、购买商品或服务等活动大类） | 「预判、寻找方案、决定、监督」这类无明确起止的心智活动；活动日志没有对应大类 |

**页面被允许的表述**：认知劳动可能无法完整由活动分钟数体现；原研究基于 35 对伴侣共 70 次访谈，
是美国双职工家庭的研究，**不是**本次中国时间利用调查的结果。
**禁止并已排除**：把「中国女性的无酬劳动被低估了 X 分钟」写成该研究或本数据的结论；
把认知劳动的测量缺口量化成任何具体数值。
**样本口径提示**：35 对伴侣 = 70 名受访者（摘要原文），页面按此表述，未写「35 人」。

---

## 3. Giurge, Whillans & West (2020) — 时间贫困

| 字段 | 值 |
|---|---|
| 标题 | Why time poverty matters for individuals, organisations and nations |
| 作者 | Laura M. Giurge, Ashley V. Whillans, Colin West |
| 出处 | Nature Human Behaviour, 4(10), 993–1003 |
| 年份 | 2020-08-03（Springer Nature） |
| DOI | 10.1038/s41562-020-0920-z |
| 链接 | https://doi.org/10.1038/s41562-020-0920-z |
| 本机可达性 | HTTP 200 |
| 记录哈希 | `22bb7990fdb7b341…` |
| 文献类型 | **Perspective（观点文章）**：以出版商 *Nature Human Behaviour* 文章页自身的栏目归类为权威依据，快照存于 `evidence/literature/nature_article_type.json`（页面首块为 `Perspective Published: 03 August 2020`）。二级聚合记录保留供溯源：Crossref `dc.type` = `ReviewPaper`，Semantic Scholar `publicationTypes` = `["Review","JournalArticle"]`（`s2_giurge.json`）——两者与出版商栏目不一致时，以出版商为准，原始值不删除。页面上的「文献类型：Perspective」标签由数据层从该快照生成，并有 QA 断言：`build_data_layer.py` 在快照缺失或解析不出 Perspective 时直接失败，因此重新构建不会把类型恢复为 Review |
| 年份口径 | Crossref 版本记录为 2020-08-03（4(10): 993–1003），页面采用之；Semantic Scholar 标 2019（网络首发）。两值并存于此，不作取舍上的隐瞒 |
| 摘要可得性 | OpenAlex 与 Semantic Scholar 均未返回摘要，Nature 页面拦截自动抓取 ⇒ **本页不引用该文的具体论证、数据或政策建议**，只使用「客观时长 ≠ 主观充裕感」这一构念区分，并在卡片里写明「未在本包内逐字核对」 |

**主张**：把「时间贫困」区分为**客观上可支配时间的稀缺**与**主观上感觉没时间**（以及感觉拥有多少
时间自主权）两层，论证两者相关但不等价，并讨论其对个体、组织与国家层面研究的意义。
**性质**：这是一篇出版商标为 **Perspective（观点文章）** 的文章，不是对某一国时间利用数据的实证估计。

| 本调查测到了 | 本调查没测到 |
|---|---|
| 客观时长一侧：个人自由支配活动领域（运动健身、文化休闲娱乐等；公报第二号注释 [9]），女 − 男 −15.650 分钟/天 | 主观时间充裕感、时间压力、控制感/自主权；公报没有对应心理测量 |

**页面被允许的表述**：客观活动时长不等于主观时间充裕感或自主权；本调查无对应测量。
**禁止并已排除**：把「自由支配时间少 15.7 分钟」写成「自主权少 15.7 分钟」；
把该观点文章的跨国论述当作中国样本的证据；引用任何本页无法核验的效应量。

---

## 4. 什么算「本数据证据」（页面唯一允许直接陈述为事实的部分）

| 主张 | 证据类型 | 出处 |
|---|---|---|
| 六项分性别全体平均与三个差值、一个合计 | 审计通过的数据文件 | `data/audited/gate2_results.json`（`groups`、`contrasts`） |
| 参与率与参与者时长（6 个数） | 公布值 | 公报第三号附表 1/2（快照 `evidence/nbs/nbs_1957215.html`） |
| 有酬／无酬／自由支配领域定义 | 公报注释原文（逐字） | 公报第二号注释 [7][8][9]（快照 `nbs_1957216.html`） |
| 5/7 + 2/7 加权口径 | 公报注释原文（逐字） | 公报第二号注释 |
| 现场时间、对象、样本规模 | 公报正文（逐字摘录） | 公报第一号（快照 `nbs_1957217.html`） |
| 6—15 周岁无有酬劳动领域活动 | 公报注释原文（逐字） | 公报第三号注释 [1] |
| 对称分解四项与合计 | 恒等式的算术分配（由 p、t 复算并与 gate2 比对） | `derive.js` + `qa_data.mjs` |
| 纯舍入边界 [+24.042, +27.714] | 公布精度推导，**不是**抽样置信区间 | `gate2_results.json.rounding_only_gender_gaps_min` |
| 三篇外部理论 | 书目事实 + 明确的「未测量」标注 | Crossref 记录 + 本文件 |

## 5. 被本文件明确排除的内容

未引入：任何国家间比较、任何年份趋势、任何心理测量学效应量、任何「角色态度／认知劳动／
时间自主权」在中国样本上的估计值、任何虚构人物或日程、任何政策主张、任何统计显著性表述。
若未来要加入，需要新的可核验数据源与独立审计，而不是在本页改写文案。

---

## 勘误（D2 · 2026-10-11）

D1.1 及更早的本文件曾把 Giurge, Whillans & West (2020) 标为 `Review（综述文章）`，
依据是 Semantic Scholar 的聚合字段。独立审计指出出版商页面将其归入 **Perspective**；
本轮已抓取出版商页面快照（`evidence/literature/nature_article_type.json`，HTTP 200）并据此更正。

**未改动的历史文档**：`D1_1_REVISION_LOG.md`、`D1_1_SCIENTIFIC_QA.md`、`D1_1_VISUAL_REVIEW.md`、
`D1_INTERACTION_SPEC.md`、`D1_STORY_SCRIPT.md`、`D1_1_VALIDATION_REPORT.md` 中关于「Review」的表述
是各轮当时的记录，保留原样作为审计链，不代表当前分类。当前分类以本文件、数据层与页面为准。
