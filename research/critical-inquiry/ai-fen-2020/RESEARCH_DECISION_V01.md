# 《发哨子的人》｜独立来源试验与跨案例政治信息定性审计

**2026-10-29 · v0.1 · 仅研究草稿 · G3/G4/G6 HOLD · 不在公开网站建立页面**

## 一、研究判断：题目可做，但不能只是“删文后网民用火星文接力”

这一现象已有明确的学术先行成果：

- Sun, Yu & Wright, Scott, *Relay activism and the flows of contentious publicness on WeChat: a case study of COVID-19 in China*, *Information, Communication & Society*, online 2023-05-24, 2024卷27(2):257–277, DOI [10.1080/1369118X.2023.2205474](https://doi.org/10.1080/1369118X.2023.2205474)。其摘要说明研究采用文本分析和参与式观察，重点分析微信、GitHub上的接力传播与抗审查公共性。当前仅复核摘要/元数据，不能假称审毕全文。
- Wu, Xiaoping, *Passing on the “whistle”: Users’ creative engagement with platform censorship in an online relay campaign in China*, *Media, Culture & Society*, online 2024-01-06, 卷46(5):905–924, DOI [10.1177/01634437231219132](https://doi.org/10.1177/01634437231219132)。摘要已区分文本、复合符号/多模态、技术编码三类策略；目前未审阅论文全部结果。

**禁止**将“接力传播”“Emoji/盲文/火星文变体的分类”包装为本站新发现。若只做它们的重述，应PASS独立论文，改写为有引用的科普而非原创研究。

更有差异化的研究问题是：
1. **版本认证与失去可见性**：2020年3月10日究竟有哪些可验证的原始载体、初版正文与平台错误记录？后期转载与编目如何产生伪精确的删除时刻？
2. **历史事实定性在转载中如何固化**：长文中的编辑导语把早期共享检测报告的人同“八位被警方训诫的医生”连接；但1月1日警讯未列八人身份，1月29日八人处置说明与李个人书面训诫有不同法律对象。能否找到原版并判断此句属于最初的编辑文字还是后续转载者增加？
3. **作为政治问责的档案元数据**：一个被平台限制的采访能被多处转载保存，但其传播伴随的个别未经验证叙事也可以同样被保存。保护表达和审查可靠性必须同时成立，而非互相抵消。

## 二、按史料强度排列的源群

| 层级 | 目前可核实的对象 | 允许的论断 | 不允许的论断 |
|---|---|---|---|
| A：同期可读媒体 | [博谈网 3月10日21:05](https://botanwang.com/articles/202003/%E5%8F%91%E5%93%A8%E5%AD%90%E7%9A%84%E4%BA%BA.html?page=1)、[独立中文笔会同日](https://www.chinesepen.org/blog/archives/145003)、[Matters同日转载](https://matters.town/a/b7mibe20eq6f/history) | 具有2020年3月10日标示日期的访谈副本目前仍可阅读 | 这些副本逐字等于《人物》首版，或已证当时任何分钟可读 |
| B：2020年3月11日 contemporaneous reports | [CDT编目](https://chinadigitaltimes.net/chinese/637953.html)、[RFA](https://www.rfa.org/mandarin/Xinwen/wul0311b-03112020045013.html)、[BBC](https://www.bbc.com/zhongwen/simp/chinese-news-51831652) | 当时媒体记录原刊失去可见性、网民再传播以及不同格式 | 原刊恰在11:40被平台服务器删除、删除由某一具名官员直接命令 |
| C：后期保存的全文、目录 | [HRIC](https://www.hrichina.org/en/node/26590)、[Katsura](https://katsura.me/2020/03/12/COVID-19-Ai-Fen/)、[nCovMemory](https://chinatimeline.github.io/nCovMemory/) | 存在采访的多个可读副本与候选截图档案索引 | 多份相近内容等于多场独立采访；目录中的截图已经过本研究法证验真 |
| D：原始平台候选 | [nCovMemory 3142 CSV登记](https://github.com/2019ncovmemory/nCovMemory/blob/master/data/data.csv)：[微信原文候选](https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg)、[archive.vn/OLdHs](https://archive.vn/OLdHs)与[Terminus2049](https://github.com/Terminus2049/Terminus2049.github.io/blob/master/_posts/2020-03-10-fa-shao-zi-de-ren.md)；[微博文章ID](https://www.weibo.com/ttarticle/p/show?id=2309404480863474679890)及候选Wayback `20200310051416` | 原刊候选**网址已定位**，存在档案目录索引与同日保存副本 | 微信上游原版或archive.vn快照已验证；保存副本逐字等于首版 |
| E：外部实证/前人研究 | [Sun & Wright](https://doi.org/10.1080/1369118X.2023.2205474)、[Wu](https://doi.org/10.1177/01634437231219132)、[Citizen Lab](https://citizenlab.ca/research/censored-contagion-ii-a-timeline-of-information-control-on-chinese-social-media-during-covid-19/) | 已有相邻问题的方法与观察，指导差异化设计 | 它们在未被查阅的细节中已经证明本案直接删稿命令或本研究发现 |

## 二点一、来源发现：档案编号3142将原始链接定位到了具体地址

本轮对 [nCovMemory GitHub源CSV](https://github.com/2019ncovmemory/nCovMemory/blob/master/data/data.csv) 进行了定点读取。记录ID `3142` 明确列出：

- 标题《发哨子的人》；类别 `non_fiction`；媒体 `人物/每日人物`；标注日期2020-03-10。
- 候选原始微信URL：`https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg`。
- `is_deleted=TRUE` 是**档案编目人的状态标注**，不是本研究在原网站对2020年3月10日进行的实测。
- 该条提供 `http://archive.vn/OLdHs` 及 Terminus2049 的替代链接。该存档站本轮仍不能直接打开；不得声称已经取得首版。
- Terminus2049 GitHub正文文件 `_posts/2020-03-10-fa-shao-zi-de-ren.md` 的前50行已能阅读，含日期frontmatter、记者署名、编辑导语与图像链接；它是**可读取的副本**，不是微信官方首发的认证拷贝。

**本次最实质性的来源收获是：把“原文链接未知”修订为“原文候选URL已经从同年建立的档案索引中定位，但其原版内容仍不可认证”。** 这为版本比较与审查可见性研究提供可操作的下一步，而不夸大证据等级。

## 二点二、新证据：原文件名对应2020年3月10日13:23的Git添加提交

本轮继续检查 [Terminus2049的真实Git版本链](https://github.com/Terminus2049/Terminus2049.github.io)，发现14:02“rename”提交以前，原中文路径 `_posts/发哨子的人.md` 在**2020-03-10 13:23:09 北京时间**的提交 `4dee83a` 中已经增加了201行内容。之后14:02、14:03、14:13三次提交均可读，各有不同Git blob SHA。

- 两端版本各75个经空格归一化后的较长段落，其中73个相同；差异只表现为文章元数据和格式控制，尚未证明与原微信首版同字节。
- 早期文件的编辑性概括“八位被警方训诫的医生”出现两次，艾芬自身声明未受公安局训诫出现一次。**按单个文件内的词频计数会把重复导语误认为多条事实证据。**
- Git author/committer time只是仓库提交者可控制的元数据，而非原始微信公众号发表时刻或经第三方封存的证据。
- [完整审计与四个固定SHA](https://github.com/GBX-Max1220/maxguo.dev/blob/research/ai-fen-source-provenance-20261029/research/critical-inquiry/ai-fen-2020/HISTORICAL_GIT_EDITION_AND_ATTRIBUTION_AUDIT_20261029.md)；本地可选择用以下脚本重复检查源文件的Git blob SHA、时间字段和锚定短句数量，不自动执行网络抓取。

```bash
git clone https://github.com/Terminus2049/Terminus2049.github.io.git
node scripts/audit-ai-fen-source-git.mjs --repo ./Terminus2049.github.io
```

**该命令应从`maxguo.dev`仓库根目录运行**，Git clone保存到同级可访问目录；或自行传入绝对路径。CI只运行脚本的语法检查和研究证据表的静态验证，不会自动克隆版权采访内容或宣称完成原微信验真。

## 二点三、当日可读网页快照：标题从“发”变成了“吹”

本轮在 [Wayback Machine 2020-03-10 13:50:52 UTC的抓取](https://web.archive.org/web/20200310135052/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256) 直接读取了中国医院人文建设网站当日的转载。与13:23 Git保存版（标题为**《发哨子的人》**）相比：

| 字段 | 13:23 Git保存版 | 21:50 Wayback机构网站转载 |
|---|---|---|
| 公开标题 | 发哨子的人 | **吹哨子的人**：如果这些医生都能够得到及时的提醒，或许就不会有这一天 |
| 署名/职责 | 文：龚菁琦；编辑：金石；摄影：尹夕远 | 页面作者栏显示：龚菁琦 尹夕远 |
| 正文开头 | 不含“我爱我的祖国。” | 页面在新闻叙述前增加“我爱我的祖国。” |
| 采访对象自述 | 区别“不吹哨，是发哨” | 同样保留了该区别 |

**严格的发现范围：** 两个有历史时间标记的**下游版本**出现了标题角色归类、署名字段和引文前文字差异。它证明不同传播载体并不总是原样复现人物角色，但**不能证明原微信初版标题的每个字节，更不能证明谁改动、为何改动或有政治指令**。

来源目录另出现`https://archive.today/20200310021029/https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg`，若其数字编码确为UTC抓取时间，将对应北京时间10:10:29。该目标本轮无法打开，**仅登记为待检线索，不纳入已取证的10:10历史可见集合**。

## 二点四、针对相同URL的据称内部报道限制指令：不得把“下首页”写成“全网删稿”

在2020年12月11日，[中国数字时代英文编辑文章](https://chinadigitaltimes.net/2020/12/minitrue-diary-march-10-2020-tibet-independence-covid-rent-relief-whistleblower-epidemic-transmission-and-treatments/)称已获取并核验一批当年发给媒体的内部宣传指令，记录3月10日不把“发哨人”相关报道放上首页。其[中文转载](https://chinadigitaltimes.net/chinese/655981.html)还把本站已经找到历史快照的`yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256`具体网址列入参考对象。2026年[乐视内部指令总目录](https://chinadigitaltimes.net/chinese/728404.html)另给出据称2月7日用词要求及3月10日展示位置限制。

**这也是跨案例的稿源垄断线索：** 同一份2月7日乐视档案还称李文亮去世报道只可转载央视电视和央视新闻客户端内容，属于限制可引用来源，而非仅禁用某个称谓。它不自动证明所有媒体实际遵守，也不是直接针对三月艾芬专访的指令。

**这是此前的来源可行性审计遗漏的重要证据类别。** 但我们目前不能访问原始下发件，也不能证明三种二次公开载体相互独立、命令是谁下达、哪家网站在几点实际执行。*Homepage demotion*、*lexical choice constraint*、*source-side takedown*应分别建模。尤其，2020年3月10日公众没有理由知道2020年12月或2026年才公开的内部文书详情。不能据此制造一部“公众在2020年已知指令”的时间机器。

[专项证据、双时钟和政治信息控制分类审核](https://github.com/GBX-Max1220/maxguo.dev/blob/research/ai-fen-source-provenance-20261029/research/critical-inquiry/ai-fen-2020/DIRECTIVE_DISCLOSURE_AND_PUBLIC_VISIBILITY_AUDIT_20261029.md)。

## 三、核心交叉审计：记者导语 ≠ 受访者原话 ≠ 已认证行政身份

现存《人物》转载文本的前言以“八位被警方训诫的医生”概括早期传播者；**这是一项要审计的编辑/叙述性主张，不应自动归于艾芬的采访原话**。在文中对“八人”的编者导语，与对艾芬自身的第一人称回答之间应有明确的字段区分。

**与李文亮研究的关键桥梁：**

- **LW01/LW16**：1月1日警方最初公告说八人被传唤/处理，未提供完整公开逐人名册。
- **LW10/LW02**：1月29日警方强调八人受到教育批评、未受到法定警告/罚款/拘留。
- **LW12/LW13/LW04**：李个人1月3日收到书面训诫；1月31日个人报道已公开，3月19日正式调查认定问题并促成撤销。
- **AFC05**：3月《人物》及其副本的导语将“八人”进一步表述为被训诫的医生并联系一张检测材料。**只能证明转载文字有这句话**，无法仅凭这些文字完成八人身份的排他匹配，也不能断言全部八人受到李式书面训诫。
- 研究更关心何种**信息缺口**允许叙事归类发生。不得以无法确认身份作为否定那篇采访所呈现的医疗风险、院内纪律约束及其公共表达价值的借口。

这属于信息治理下的**叙事归属漂移（attribution drift）**研究假说，不是我们现在已经证明发生了有意造假或审查操纵。

## 四、传播版次与政治信息控制：证据的四种不对称

1. **可读副本 ≠ 首版原件**：几十篇转载可能保留重要采访，却无法还原初版的确切字节序列。
2. **404/无法访问 ≠ 单次删稿命令链**：技术错误、平台规则、人工删除、网页迁移、账号状态均需区分；但这些替代解释不能抹掉2020年同期公众对审查现象的独立报道。
3. **编码形式 ≠ 成功抵抗率**：截图、倒置、Emoji、外文译写能显示创造性，不直接证明持续可见或触达多少人。
4. **早期故事证据 ≠ 法律身份/制度结局**：同一组转载会继承导语中的不确定归类，需要回到公安声明、采访位置与正式撤销文书核对。

## 五、停止条件与明确下一步

**仅追三类可能改变判断的来源**：

- 原载体：已定位候选微信原帖URL `nEy0jq5wjj-g6DQVZep1Wg`，下一步核验`archive.vn/OLdHs`网页存档的抓取时间、原始页面元数据与可读内容，或微博ID`2309404480863474679890`的可信首版截图及时间。
- 版本差异：对原版与2–3份代表性副本只比较标题、导语、作者署名、预警报告归属、“八人/训诫”短句的位置和写法；**不公开全文**。
- 证据性的删除观测：有日期、来源、明确URL及“违规无法查看”等界面状态的同期记录或平台变更日志，排除“2026年打不开→2020年被删”的倒推。

如果这些仍无法获得，不应填造“原始首发分钟”或“谁下的命令”；可以把成果写成**带有明确证据限制的比较评论**，但不要声称完成取证级调查或全网传播计量。

## 六、出版决策

**PILOT GO / PUBLICATION HOLD.** 新增了2020年12月与2026年公开的被报道内部编辑指令，说明存在有针对性的词汇与首页展示管控记录；但网页具体删稿执行、原始发令链、2020年3月公众知情时间和改标题因果仍未认证。

已有两篇明确的直接相关同行评审研究，使“传播变体如何抵抗审查”不应成为本站原创主轴；更可发表、且连接上海—李文亮的，是“在审查与平台消失条件下，谁能定义、复制和纠正一个历史叙述”。这有可能形成《言说的边界》独立可复核的方法与调查系列，但必须先通过原始版次证据门槛。

本文件没有二次发布《人物》访谈全文、私人微信记录、证件或患者信息；全部个案陈述仍受第二人事实与版权审查。
