# 勘误与编辑说明（公开）

本文件说明公开研究稿相对上游研究稿《中国居民时间预算研究 · 2024》做了哪些**编辑性**改动。
没有任何数值、公式、表格单元格或结论被改动。

上游原稿**不随站点发布**：其中一条修订注记属于内部协作流程记录，对读者没有证据价值。
原稿以逐字节副本形式保留在仓库内部路径 `docs/internal/RESEARCH_MANUSCRIPT_ORIGINAL.md`，
其 SHA-256 为：

```
262defbd216760ac7e8aad3b7673c2694aed57ef6aca42143e6c44d70fd2b132
```

若你手中有一份原稿，比对该哈希即可确认是否为同一份文件。

## 编辑 1 · 删除一条内部流程注记

公开版删除了原稿中一条只描述「该注记由谁在何时要求加入」的句子（属于内部协作流程记录，
不含数据、方法或结论）。删除范围：1 行。保留内容：§4 的舍入方法说明，以及全部数字与公式。

## 编辑 2 · 更正一条来源编号对应关系

原稿参考列表把 2025 年 1 月发布的**分组汇总表专题页**标注为「第三号」公报。
经 2026-10-11 逐一抓取核对，三个 `t20241031_1957xx` 页面的正文各自声明了自己的公报编号：

| 公报 | 正确地址 |
|---|---|
| 第一号 | https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957217.html |
| 第二号 | https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957216.html |
| 第三号 | https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957215.html |
| 补充（分组汇总表专题页，2025-01-27） | https://www.stats.gov.cn/zt_18555/zthd/lhfw/2025/2025_qgsjlydc/202501/t20250127_1958534.html |

公开版据此把第 3 条参考改为真正的第三号公报，并把专题页列为第 4 条补充来源。
本更正写在生成器里（复现包内 `tools/maintainer/build_report.py`），因此重新构建不会把它改回去。

## 编辑 3 · 强制换行改写为反斜杠形式（不改变渲染）

上游原稿标题段的两行以**两个行尾空格**表示 Markdown 强制换行。站点的提交前检查
（`git diff --check`）会对行尾空格报警，发布候选必须零警告通过，因此公开版把这两行改写为
同一种语义的**另一种 CommonMark 强制换行**——行尾反斜杠：

```
**中国居民时间预算研究 · 2024年 · 描述性研究 V1 · 研究稿**\
```

改写由生成器 `hard_breaks_to_backslash()` 按固定规则产生（≥2 个行尾空格 → 反斜杠；
单个行尾空格 → 删除；若某行本来就以反斜杠结尾则直接失败，不猜测其含义）。
语义等价性用 CommonMark 参考实现独立验证（两种写法都输出 `<br />`）；
本站报告渲染器 `md_to_html()` 过去就忽略行尾空格、现在同样忽略行尾反斜杠，
因此 `report/index.html` 与 `en/report/index.html` **逐字节不变**。
数字、公式、表格与结论未作任何改动，上游原稿的内部副本也未改写。

## 编辑 4 · 撤回一项从未交付过的文件承诺，并把读者按不到的路径改为发布面上的真实位置

上游原稿的「数据来源与复现」一节把 `time_budget_by_group.csv` 列为随研究提供的复核文件。
本研究所交付的分组数值实际位于 `data/audited/dataset.json`，对照与分解结果位于
`data/audited/gate2_results.json`，页面与报告使用的数据层 `data/time-use-data.js` 由前两者生成；
`time_budget_by_group.csv` 从未存在，因此公开版不再承诺该文件，改为按复现包内的真实布局点名：
`data/audited/` 下的两份 JSON、`data/time-use-data.js`，以及 `tools/` 下的
`verify_public_inputs.py`、`recompute_statistics.py`、`parity_check.mjs`、`self_test.py`。

同一次核查还发现三处「读者按不到」的路径写法，一并改为发布面上真实存在的位置：

- 公开报告页原写「快照与哈希见 `evidence/nbs/`」。该目录是仓库内部的证据留存，属第三方内容、
  不随站发布；改为指向复现包的 `evidence/EVIDENCE_MANIFEST.json`（其中逐条记录了四份快照的
  SHA-256），并说明快照本体不分发。
- 公开报告页与本勘误原把生成器写作 `tools/build_report.py`；复现包内的实际路径是
  `tools/maintainer/build_report.py`，两处均已改正。

这些都属于指位与承诺的文字更正：没有新增第二套数据来源，没有临时造文件来迁就旧句子。
本更正写在生成器里（复现包内 `tools/maintainer/build_report.py` 的 `fix_deliverables_claim()`）：
中文侧若找不到原句会直接让构建失败（上游文本被改动时不允许静默放行），并在替换后断言公开版
不再出现该文件名；公开文档引用的每个包内路径再由 `tools/maintainer/qa_data.mjs` 逐条解析，
解析不到即门禁失败。
**统计输入、公式、数值与结论未作任何改动。**

## 文献类型更正（同一研究专题）

Giurge, Whillans & West (2020) 的文献类型按出版商 *Nature Human Behaviour* 文章页自身的
栏目归类标为 **Perspective（观点文章）**；聚合站点（Crossref `dc.type=ReviewPaper`、
Semantic Scholar `publicationTypes=["Review", …]`）的取值作为二级记录保留。
依据与守卫见 `docs/LITERATURE_EVIDENCE_MAP.md` 的勘误节。

## 复现

```
公开研究稿 SHA-256：3c4bcadfdfae285ed237612100e27a689db54be68a69a6ee8f2638604921ac18
数据层 SHA-256　　：3788f87d270d05fb0946aa14dff82aaa2d43a97d994be336b246c9f699418996
```

三步离线复现见 `README.md`（研究复现包根目录）与页面第五幕。
