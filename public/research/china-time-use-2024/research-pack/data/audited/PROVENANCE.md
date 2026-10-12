# PROVENANCE — data/audited/（不可变输入 · D1 修订版）

本目录内的两个 JSON 是 D1 故事页内置的**审计通过原始输入**，使
`tools/build_data_layer.py` 可以仅凭本包重新生成 `data/time-use-data.js`。
两个文件与研究包 `china_time_use_2024_final_figures/` 中的 `source/` 副本**逐字节相同**
（`tools/verify_inputs.py` 在具备研究包本地副本时会自动比对；见下方 §4）。

## 1. 审计输入文件与哈希（SHA-256）

<!-- BEGIN:MANIFEST -->
| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `data/audited/dataset.json` | 28,136 | `7d310646c6a35ba355242fd76882b646f6d01e1477dab533d85345a409963095` |
| `data/audited/gate2_results.json` | 6,951 | `f986faaf6ea2409eff75fcce4619473ba9292e1a98670954c4254e8327009d55` |
<!-- END:MANIFEST -->

## 2. 上游包哈希（D1 修订：区分研究包与原型包）

| 包 | 角色 | SHA-256 |
|---|---|---|
| `china_time_use_2024_final_figures.zip` | **研究权威输入包**（§1 两个 JSON 的来源） | `b8b96dd270f0da2f8c350cbc77d5866a991aaaa523e12ab6b96fc83d43134478` |
| `china_time_use_D0_1_interactive_prototype.zip` | **原型基线包**（本轮开发的只读基线，不是数据来源） | `f5be7023c3e352212d87bf3c61d67c8a819fd8044af0990832abcb6f7bbab29c` |
| `china_time_use_D0_interactive_prototype.zip` | D0（未修订）原型包，历史版本 | `7f6f8dc067c56ade11b33929bce91801eb723aa8977b286a5f0dc40b4ae9eec4` |

### 2a. D0.1 文档笔误的更正（CHANGELOG_FROM_D0_1.md §3 同记）

D0.1 的 `data/audited/PROVENANCE.md` 在“来源链”图中把研究包哈希写成
`7f6f8dc067c56ade11b33929bce91801eb723aa8977b286a5f0dc40b4ae9eec4`，并把这一行标注为
“研究包 china_time_use_2024_final_figures.zip”。该值实际是 **D0（未修订）原型 ZIP** 的哈希：

```
$ sha256sum inputs/*.zip
b8b96dd270f0da2f8c350cbc77d5866a991aaaa523e12ab6b96fc83d43134478  china_time_use_2024_final_figures.zip   ← 研究包
f5be7023c3e352212d87bf3c61d67c8a819fd8044af0990832abcb6f7bbab29c  china_time_use_D0_1_interactive_prototype.zip ← 原型包
7f6f8dc067c56ade11b33929bce91801eb723aa8977b286a5f0dc40b4ae9eec4  china_time_use_D0_interactive_prototype.zip   ← D0.1 误写为该值
```

D1 更正了这一点，并把研究包与原型包在 §2 表格中分列。**§1 的两个数据文件哈希未变**，
说明笔误只影响文档表述，不影响数据链；`data/audited/` 内副本与 `dataset.json` /
`gate2_results.json` 在研究包内的原始字节仍然一致（`cmp` 逐字节通过，见 §4）。

## 3. 来源链

```
国家统计局《第三次全国时间利用调查》公报（本机于 2026-10-11 重新抓取并存档为纯文本/HTML 证据）
  第一号 t20241031_1957217.html  调查主要结果（现场时间 2024-05-11—31、6 周岁及以上常住成员、3.85 万户 / 10.7 万人）
  第二号 t20241031_1957216.html  全国居民主要活动领域/大类时间利用 + 无酬劳动领域官方注释
  第三号 t20241031_1957215.html  分城乡、分性别、分年龄组「参与者日均时间」与「活动参与率」
                                 ← 本页分性别参与率 × 参与者时长的原始来源
  分组汇总表专题页 t20250127_1958534.html（2025 年发布，补充核对用，非本页数值唯一来源）
        ↓ 编译（研究阶段，已独立审计）
研究包 china_time_use_2024_final_figures.zip（SHA-256 b8b96dd2…34478）
        → source/dataset.json, source/gate2_results.json（29 项数学校验 audit_gate3.py 通过）
        ↓ 逐字节复制（未修改）
D1 china_time_use_D1_story/data/audited/
        ↓ tools/verify_inputs.py（哈希不符即 FATAL）
        ↓ tools/build_data_layer.py（恒等式 + 分解 + 逐状态检查，缺失即失败）
D1 data/time-use-data.js（页面唯一数值/引用来源）
```

## 4. 复现与核验命令

```bash
python tools/verify_inputs.py                      # 校验 §1/§2 哈希、证据文件哈希
python tools/build_data_layer.py                   # 由审计输入重新生成数据层（含全部恒等式）
node tools/qa_data.mjs                             # 用页面同一套代码复核每个交互状态的数值
# 与研究包逐字节比对（本地存在研究包时）：
python tools/verify_inputs.py --research-package ../inputs/china_time_use_2024_final_figures
```

## 5. 治理规则

1. **本目录文件视为不可变**：不得编辑；如上游研究包更新，应整体替换并更新 §1 哈希表。
2. `build_data_layer.py` 在输出 `meta.generated_from` 中记录输入文件哈希，使生成物可回溯到确切输入。
3. 构建期与运行时的恒等式检查属于**内部算术一致性检查**（数据自洽、公式闭合），
   **不等于**对公报原文的独立来源核验。后者由独立审查者对照 §3 的 URL 执行；
   本页在 Act V 同时给出「内部一致性」与「来源核验」两类说明，并提供抓取快照及其哈希。
4. 心理学文献条目（Act IV）来自 `evidence/literature/crossref_*.json`（Crossref REST API 抓取记录），
   UI 中的标题/作者/年份/期刊/页码由这些数据生成，不是手工录入。
