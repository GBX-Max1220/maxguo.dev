# Historical Visibility Method v0.1｜历史可见性与时间证据协议

**Cross-case methods, research-only — 2026-11-01**  
适用范围：艾芬（PR #26）、李文亮（PR #23）、上海2022（PR #21）与未来《言说的边界》案例。本文是**方法设计**，并不声称其他分支已经实现。

## 1. Research question

给定一个历史叙述，区分“事件发生”“材料记录”“公众可以访问”“公众可以发现”“公众后来知道”这些状态的时间和证据来源。不要从孤立的页面缺失推定一种独一的机制。

## 2. Observation object and units

一个 `observation` 必须至少有以下字段：

```json
{
  "observation_id": "example-id",
  "case_id": "ai-fen-2020",
  "unit_type": "article_url|homepage|archived_copy|official_notice|disclosure",
  "original_url": "https://example.org/path",
  "archive_url": "https://web.archive.org/web/...",
  "capture_at_utc": "2020-03-10T19:06:34Z",
  "claimed_event_at": null,
  "published_at": null,
  "first_public_disclosure_at": null,
  "read_status": "readable|unavailable_notice|failed|partial|unknown",
  "discoverability_status": "linked|no_link_in_capture|unknown|not_applicable",
  "title_state": "verbatim_short_title_or_null",
  "content_fingerprint_sha256": "sha256_or_null",
  "source_lineage_id": "same-underlying-source-group",
  "capture_integrity": "complete|partial|unknown",
  "observation_basis": "direct_html|secondary_report|metadata_only",
  "uncertainty_note": "explicit limitation"
}
```

日期和状态不可以从另一个字段无说明地填充。捕获 URL 缺少内容时，状态是 failed/unknown，而非 no_link 或 unavailable_notice。

## 3. Claim and source dependence

每条 `claim` 记录：

- `claim_id`, `proposition`, `source_observation_ids`, `lineage_ids`
- `logical_support`: `direct|bounded_inference|secondary_attribution|unestablished`
- `scope`: 具体页面、时间、群体与载体
- `defeater`: 什么观察会直接推翻它
- `alternative_mechanisms`: 普通轮替、技术故障、链接变更、动态注入、编辑修改、政策执行等
- `independent_review`: `not_performed|pass|contradicted|inconclusive`

当两个来源出自同一复制链时，**不得**把它们计为两条独立 corroboration。索引摘要、新闻转引和原始材料也不能直接等量相加。

## 4. Temporal intervals and non-observation

观察到 2020-03-11 03:06 首页有链接，2020-03-12 14:31 首页无链接，只能定义两个离散状态和二者之间的区间。不得以区间中点估算编辑时刻。需要报告捕获完整性、链接识别算法、所有已查首页别名，以及失败查询。

对于变化至少记录：
`last_observed_A`, `first_observed_B`, `interval_seconds`, `missing_capture_coverage`。若序列显示 A→B→A，标记非单调状态，不能报告单次永久移除。

## 5. Alternative-explanation matrix

| 观测 | 至少需检查的竞争机制 | 区分证据 |
|---|---|---|
| 首页链接消失 | 常规新闻列表轮替；改版；动态模块；定向移除 | 同栏相邻文章轮替、页面模板/栏目更新、存档完整性、后台公告（若可公开验证） |
| 文章标题变化 | 原站编辑；转载规范化；抓取解析差异 | 同 URL 原始标题标签、正文标题、多个捕获、页面编码 |
| 原始 URL 不可查看 | 平台移除；作者撤回；政策/投诉；归档错误 | 平台提示的精确措辞、同期报道、原作者声明；后台操作缺席时不作执行者识别 |
| 转载版可读 | 多站异步更新；备份；编辑复刻 | 存档时间、转载标注、版本指纹、来源依赖 |
| 披露指令与后续状态时间接近 | 指令造成改变；先前已有状态；无关同时变化 | 签发/送达/执行证据；披露日期 caveat；可比对照站点 |

不能把提出竞争机制写成已验证该机制；它是识别设计的一部分。

## 6. Reproducibility and decision gates

- **E0 Provenance**：固定 URL、commit、捕获日期、摘要/指纹。
- **E1 Structural**：脚本/账本引用、时间格式、源 ID、反证条件可通过静态校验。
- **E2 Dynamic**：至少复现关键可读快照。网络服务不可用 = INCONCLUSIVE，不是 PASS。
- **E3 Independent historical review**：不同人员独立检查原始存档、来源依赖与引文边界。
- **E4 Interpretation**：把描述性发现与机制假说拆开，审查竞争解释和可识别性。
- **E5 Publication**：作者审阅、版权/隐私/中英文一致性与明确许可后发布。

E0–E2 成功不自动推导 E3–E5 成功。发表类型包括“作者审阅的来源链接评论”“短篇数字档案考证”“同行评审研究”，不得混淆。

## 7. Portfolio integration

- **艾芬**：正文可读、首页可发现、标题变迁、后来的指令披露。
- **李文亮**：某时点的公开事实、机构标签、正式撤销和后续更正。
- **上海**：官方解释、可获得的具体处置证据与公开时间。
- **《正确的废话》**：公文/采访回答的承诺、遗漏、主体归属与推论强度。

共同工具不是“每案证明审查”，而是**让权力与公共解释的时间痕迹可检验、可纠错**。社会时间研究的样本/因果问题不同，不强迫纳入该历史可见性 schema。

## 8. Interaction design (future only)

一个未来可能实现的双时钟 viewer：用户选择“截至某日公众可查材料”与“今日回顾材料”；界面只显示当时可查来源，后来披露的文件不倒灌到更早的时间。每条主张可展开源链接、来源谱系、不可支持的推论和反证条件。不得把交互渲染本身视为证据。

**Non-goals**：人物身份归因、未授权私人材料、原始全文重发、根据单个案例估算审查制度普遍发生率、将前端 demo 视为因果推断。
