# 《发哨子的人》历史版本判决 v0.2｜公开、存档与不可查看

> **后续更新：** 本文件已由 [v0.3可见性状态重建](AI_FEN_VISIBILITY_RECONSTRUCTION_V03_20261030.md) 进一步修正。v0.3新增首页直接链接及其后续六次缺失的历史快照，并纳入CDT对“指令日期可能是泄露日期”的来源限制。v0.2仅保留为版本研究过程记录。

**项目：**《言说的边界》｜**日期：**2026-10-30｜**状态：**研究-only，未发表；PR #26 保持 Draft。

## 核心结论

这一轮突破并非重复“《人物》采访被删、网民接力传播”的既有研究，而是把同一历史事件的**两份可读存档、原微信链接的不可查看提示、站点标题修改**放到不同时间和不同传播载体中核对。均有可检查的捕获 URL、脚本和不含全文的指纹证据。

## 1. 证据的时间顺序（北京时间）

| 时点 | 来源与状态 | 支持范围 |
|---|---|---|
| 2020-03-10 **13:23:09** | [端点星GitHub历史提交](https://github.com/Terminus2049/Terminus2049.github.io/commit/4dee83a23f66c4a2d7f4433b8e0ce5381101632b) | 有验证签名的仓库提交，非原微信首发 |
| 2020-03-10 **21:50:52** | [yyrw历史Wayback](https://web.archive.org/web/20200310135052/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256) | 转载全文可读，历史标题“**吹哨子的人：……**” |
| 2020-03-10 **21:59:35** | [端点星Wayback](https://web.archive.org/web/20200310135935/https://terminus2049.github.io/archive/2020/03/10/fa-shao-zi-de-ren.html) | 另一个存档正文可读，标题“**发哨子的人**” |
| 2020-03-11 **06:58:25** | [原《人物》微信URL的Wayback](https://web.archive.org/web/20200310225825/https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg) | 快照记录“**此内容因违规无法查看**”，载有投诉及公众账号规定提示，**不是原始采访全文** |
| 2020-03-11 **12:19:23** | [yyrw后续Wayback](https://web.archive.org/web/20200311041923/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256) | yyrw另有一次可读历史快照 |
| 2026-10-30 | [现存yyrw转载](https://yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256) | 同URL的当前标题以“**发哨子的人**”开头 |

以上 Wayback 时间均按UTC捕获编号转北京时间UTC+8。**捕获时间并非原站首发时间**。原微信链接快照呈现不可查看提示，证明该时点网页处于不可读状态，但不能证明初次删除时刻、内部命令签发者或最初《人物》正文的全部字节。

## 2. 规范化正文和标题并非一回事

### 当前端点星固定版本对比当前yyrw

[CI真实抓取与比对](https://github.com/GBX-Max1220/maxguo.dev/actions/runs/40956016103)显示：两份采访主体分别为**200个**NFKC规范化、移除空白后分割的类句子单元；**198/200**匹配。两处差异为一个独立“艾芬”图片说明在另一版正文提取中缺失，以及“市卫健委”扩写为“市卫生健康委”。两份主体各有8239个规范化字符，但哈希不相同。这不是原始HTML逐字一致或原作版本认证。

### yyrw在2020年历史快照对比今天

[历史快照回读与比较](https://github.com/GBX-Max1220/maxguo.dev/actions/runs/40957538998)：两版主体各200单元，**199/200**匹配，唯一检测到的正文差异是“市卫健委”后被写作“市卫生健康委”；但页面标题已从历史存档的**“吹哨子的人：……”**变成当前的**“发哨子的人：……”**。这是一项可信的**页面版本事实**，不是修改原因或修改精确时刻的证据。

机器账本：[2020历史捕获与标题变动](https://github.com/GBX-Max1220/maxguo.dev/blob/research/ai-fen-version-audit-20261030/research/critical-inquiry/ai-fen/historical-captures-v01.json)；[当前跨站正文比对](https://github.com/GBX-Max1220/maxguo.dev/blob/research/ai-fen-version-audit-20261030/research/critical-inquiry/ai-fen/cross-site-comparison-v01.json)。所有校验代码均在PR #26中，未转载采访全文。

## 3. 与PR #24披露指令记录的同URL关联

[PR #24先前的来源审计](https://github.com/GBX-Max1220/maxguo.dev/blob/research/ai-fen-source-provenance-20261029/research/critical-inquiry/ai-fen-2020/DIRECTIVE_DISCLOSURE_AND_PUBLIC_VISIBILITY_AUDIT_20261029.md)已找到[中国数字时代2020-12-11英文稿](https://chinadigitaltimes.net/2020/12/minitrue-diary-march-10-2020-tibet-independence-covid-rent-relief-whistleblower-epidemic-transmission-and-treatments/)中的一条据称**2020-03-10**媒体管理指令，限制相关报道在首页展示；[中文记录](https://chinadigitaltimes.net/chinese/655981.html)列出的被指向URL正是yyrw该篇转载页（外加跟踪参数）。本轮的新贡献是逐条验证该URL的2020历史存续时间、原微信链接的不可查看状态及正文版本变迁，**不是重新发现指令文本**。

必须明确四项限制：

1. 该文书是**中国数字时代披露并称核验的材料**，本项目未得到独立原始签发和接收记录；2020年12月或2026年可查的材料，不能冒充2020年3月普通公众当时已经知道的内容。
2. “不上首页，如有请撤下”中的“撤下”具体作用对象，若无原始流转语境不能武断解释为**只撤首页推荐**或**必然下架正文URL**。
3. **原微信已不可查看而下游转载曾可读**，符合平台异质性、传播路径差异和存档留存的事实；它不等于曾获得任何官方“豁免”，更不能直接认定谁命令某站修改标题。
4. yyrw站点自述与2023国家卫健委协会名单不能代替2020年网页的实际运营/审查链证据。

## 4. 与Sun & Wright（2023/2024）的原创性边界

已阅读[伯恩茅斯大学开放存档的完整研究稿](https://eprints.bournemouth.ac.uk/39019/1/final%20proof.pdf)的核心方法与结果，并形成[先行研究对照备忘录](AI_FEN_PRIOR_ART_METHOD_CHECK_20261030.md)。该论文在2020年3月10日至20日找到15806条候选微信公众号文章，约1600条人工抽查，相关比例80.94%；因删稿无法读全文者不计入相关。这些数字是该研究报告的结果，**不是本项目重测的传播量**。

研究新意可以局限于**历史证据链、同URL标题变化、失效URL记录与正文继续存在的精细对照**。不能把“公众利用emoji、摩斯码、GitHub等接力传播”当作首次发现。

## 5. 研究判决与下一个封闭任务

**继续一个有限问题：**用Wayback CDX查找2020之后同URL的后续可读取标题快照，尽可能收窄“吹”变“发”的编辑区间；同时核验2020年3月10日前后**yyrw首页**是否有可靠快照，以判断“首页限制”是否能被直接观察。不进行用户身份归因，不搜索私人聊天原件。

如果找不到进一步的版本时间或首页证据，停止扩展成大型因果调查；将现有结果整理为**短篇数字史料考证**或《六个时钟》补充案例。主张可以保留明确的审查与权力分析，但不能由标题差异推断内部因果。

**当前发布状态：**G3/G4/G6的独立审校与公开批准未完成；PR #24与#26均保持Draft，网站正式版不受影响。
