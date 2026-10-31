# 李文亮：公共可知时间与正式纠错的状态映射 v0.1

**Research-only. 2026-11-01. PR #23 Draft; G3 HOLD.** 本文件将已建立的李文亮 evidence-v01.json 与 Historical Visibility Method v0.1 进行概念映射，不修改原始账本或公开的《六个时钟》。

## 1. 映射原则

| 原数据/研究语义 | 新统一字段 | 禁止事项 |
|---|---|---|
| event occurrence / actor speech | `claimed_event_at` / `event_at` | 以作者事后看到的报告出版时刻冒充发言时刻 |
| public-as-of 13 snapshots | `first_public_disclosure_at` + `public_asof_eligibility` | 当前存档页显示历史日期就默认为同期可知 |
| institutional label actions | `unit_type=official_notice`, `action=label_applied` | 把八人未列名的通知自动匹配李本人所有举动 |
| 1月3日书面训诫 | `action=individual_admonition`, `target=Li` | 训诫=法定警告或拘留 |
| 3月19日调查建议 | `action=correction_recommended` | 调查建议=已经完成撤销 |
| 3月19日警方宣布撤销 | `action=admonition_withdrawn` | 媒体显示出版时刻=原微博首发 |
| 责任警员处分 | `action=officer_discipline`, `target=officer` | 把警员被处分编码为李本人受处分 |
| signed court-adjacent legal commentary | `basis=attributed_opinion` | 署名法律评论=最高法司法裁判 |

## 2. 独立核验的最小时间锚

- **2020-01-01**：LW16 同日报道页显示 18:53，可作为当天警方相关表述已公开的媒体锚，不能证明原警方微博发表于该分钟；LW01 当前政府归档页面显示 11:36，但 URL 属后来的归档路径，不应默认进入当天 public-as-of 集合。
- **2020-01-03**：个人训诫发生的时点，由事后调查与1月31日当事人采访支撑，二者的证据类型不同。
- **2020-01-31**：LW12 与 LW13 记录当事人自述和文书照片；不能把3月19日的调查首次披露当作1月31日前社会完全不知道训诫。
- **2020-03-19**：19:04短讯、19:14摘要、19:28新华社较完整版本；20:55的新浪页面先于21:47的后续转载。它们不是五份独立调查，也不等于五个被认证的原始官方微博时间。
- **3月19日正式纠错类型：** 国家监委提出纠正建议，武汉警方宣布撤销并道歉，处分警员是第三个不同机构行为。

本轮独立检索补充可核查的公开转述：
- 人民日报海外版3月20日刊国家监委调查摘要：https://paper.people.com.cn/rmrbhwb/html/2020-03/20/content_1977304.htm
- 新华社载国家监委报告：https://www.xinhuanet.com/politics/2020-03/19/c_1125737457.htm
- 2020-03-19 21:08:13 的每经新华社转载已记载撤销与道歉：https://www.nbd.com.cn/articles/2020-03-19/1418407.html

注意 **21:08:13 是另一个转载页面标示的发表时刻**，不是可以替换 LW15 20:55 的更早媒体页，也不能证实原微博首次发布时间。此新对照不更改冻结数据。

## 3. 两个反事实错误测试

### T1. 把“后来纠正”倒灌到最初时点

错误：2020年1月3日公众已经掌握2020年3月19日国家监委的全部程序调查发现。  
正确：当时知识集合不能包含事后调查。原始消息是否公开需要对应时间的同步材料。

### T2. 把不同主体合成一个“官方态度”

错误：1月1日八人通报、1月3日李的训诫、3月19日针对李训诫的撤销、对警员的纪律处分，属于同一个法律对象。  
正确：官方公开行动存在多个对象和程序；应按主体—目标—时间—行为分别编码。

## 4. 三态纠错字段

推荐跨案例采用：
`correction_observability = formal_correction_documented | scoped_search_no_disposition_located | not_applicable`。
该状态表示**研究者能观察到哪类记录**，不是两个地区的真实纠错率、制度强度评分，更不是一个样本量为两例的因果结论。

## 5. 研究后续与发表阻断

- 按 `INDEPENDENT_REVIEW_PACK_V06_20261030.md` 逐条完成 14 项命题的不同人独立审查；当前 0/14 被第二人签署。
- 《六个时钟》已另有公开方法版本，但 PR #23 新增研究性声明仍需独立G3批准。
- 不将原训诫文书完整照片、私人聊天或个人标识重新公布。
- 任何未来公共交互 viewer 必须从统一来源状态生成，而不是直接用人工编辑叙事覆盖 as-of 规则。
