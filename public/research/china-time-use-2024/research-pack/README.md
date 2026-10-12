# China Time Use 2024 — Research Pack（公开复现包）

配套页面：**谁每天花在劳动上的时间更长？**（五幕交互研究专题）
本包让一位读者在**不访问本网站、不下载任何额外文件**的情况下，离线重算页面上的每一个数字。

要求：Python 3.9+（仅标准库）与 Node.js 18+。无需安装任何依赖。

## 1. 三步离线复现（Level A）

```bash
python tools/verify_public_inputs.py      # 只读：核对包内每个文件的 SHA-256
python tools/recompute_statistics.py      # 由冻结输入独立重算全部数值（Python）
node tools/parity_check.mjs               # 用页面自身的 derive.js 再算一遍并逐量对照
```

预期输出（数字必须完全一致）：

```
pack integrity: OK — nothing was written by this check
Level A reproduction: OK — next run: node tools/parity_check.mjs
parity: the page's numbers and the offline reproduction are the same numbers
```

三条命令分别产出 `out/statistics_python.json`、`out/statistics_js.json`，可以自行核对。
所有断言都是**失败即退出码非 0**，不会只打印警告。

再运行一次即可确认这道门禁真的会咬：

```bash
python tools/self_test.py    # 篡改冻结输入、篡改页面数据层，都必须被抓到
```

### 这套复现证明了什么

* **同一份输入**：`data/audited/dataset.json`（SHA-256 `7d310646…`）与
  `gate2_results.json`（`f986faaf…`）就是页面使用的全部统计输入，未做任何修改。
* **同一套算术**：全体居民平均 = 参与率 ÷ 100 × 参与者平均时长；差值一律为女性 − 男性；
  分解使用对称恒等式 `p_f·t_f − p_m·t_m = (p_f−p_m)(t_f+t_m)/2 + (t_f−t_m)(p_f+p_m)/2`。
* **两条独立实现**：Python 与页面所用的 `js/derive.js` 分别计算，逐项对照到 1e-9（存储为 3 位小数的量用 1e-3）。
  两边不一致就失败——这防止「网页显示一套、脚本算另一套」。
* **页面上的数字**：−73.9 / +99.8 / +25.9 / −15.7 分钟/天由上述计算舍入得到，不是手写常量。

### 这套复现不证明什么

不提供抽样误差、显著性、因果解释、群体交叉或趋势结论；官方公布的是舍入后的汇总表，
本包只能复现「由同一张表可推出什么」，不能推出「个体层面发生了什么」。

## 2. 官方来源核对（Level B）与其局限

页面引用的官方定义逐字文本已冻结在 `data/audited/official_notes.json`（含每条出处 URL 与
抓取时快照的 SHA-256），`evidence/EVIDENCE_MANIFEST.json` 记录了当时快照的哈希。

原始网页快照（国家统计局 HTML）**不随本包分发**，因为那是第三方页面内容。因此：

* 你**不能**指望重新下载公报页面就得到与记录一致的字节哈希——官方会在原 URL 上更新页面
  样式与脚本，版式一变哈希就变；
* 正确的在线核对方式是**人工比对**：打开 URL，确认注释编号与文字与 `official_notes.json`
  中的 `text` 一致；
* 若你确实要做字节级核对，可先抓取快照再计算哈希并**自行记录**，但不要把新哈希写回本包的任何
  清单：清单是审计基线，重新建立基线属于维护者流程（§4），不属于读者验证。

```bash
# 官方页面（人工核对用）
# 公报第一号  https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957217.html
# 公报第二号  https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957216.html
# 公报第三号  https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957215.html
# 分组汇总表专题页（补充） https://www.stats.gov.cn/zt_18555/zthd/lhfw/2025/2025_qgsjlydc/202501/t20250127_1958534.html
```

## 3. 包内文件

| 路径 | 内容 |
|---|---|
| `data/audited/dataset.json`、`gate2_results.json` | 唯一统计输入（冻结，哈希钉在 `tools/verify_public_inputs.py` 内） |
| `data/audited/PROVENANCE.md` | 输入的来源链与一次哈希勘误记录 |
| `data/audited/official_notes.json` | 页面逐字引用的官方定义 + 出处 URL + 当时快照哈希 |
| `data/time-use-data.js` | 页面加载的数据层（由上述输入生成；`parity_check.mjs` 直接读它） |
| `js/derive.js` | 页面与 QA 共用的纯函数模块（无依赖、不碰 DOM） |
| `docs/RESEARCH_MANUSCRIPT_PUBLIC.md` | 公开研究稿（清理版）；`docs/ERRATA_AND_EDITS.md` 说明它相对上游原稿改了什么 |
| `docs/LITERATURE_EVIDENCE_MAP.md` | 三篇文献的书目事实与「测到 / 未测到」映射，含 Giurge 类型勘误 |
| `docs/DATA_LAYER_BUILD.txt` | 本次数据层构建的输入哈希与产物哈希 |
| `evidence/literature/*.json` | Crossref、Semantic Scholar 与出版商文章页的记录（含 `nature_article_type.json`） |
| `evidence/EVIDENCE_MANIFEST.json` | 审计期证据文件哈希清单（只读核对用） |
| `tools/verify_public_inputs.py`、`recompute_statistics.py`、`parity_check.mjs`、`self_test.py` | §1 的读者流程 |
| `tools/maintainer/` | 维护者脚本（见 §4），**不在读者流程内** |

## 4. 维护者流程（读者不需要）

`tools/maintainer/` 里的脚本用于**重新生成**页面数据层与研究稿，依赖未随包分发的官方 HTML 快照：

* `verify_inputs.py`：审计期完整性检查；其 `--write-manifest` 会**重写证据哈希清单**，
  属于「主动重新建立基线」，绝不能放进读者的验证指令；
* `build_data_layer.py`：从快照逐字提取官方定义并重建 `data/time-use-data.js`
  （含 Giurge 文献类型守卫：出版商快照缺失或解析不出 `Perspective` 即失败）；
* `build_report.py`：生成公开研究稿；
* `qa_data.mjs`、`shoot.mjs`：整站页面与浏览器断言（需要完整页面与 Playwright），
  与 §1 的数值复现分属两层。

## 5. 不随本包发布的内容

上游研究稿的未清理原件（含内部协作流程注记）、开发阶段的逐轮修订与审计记录、
测试截图全集、浏览器验证 JSON、国家统计局网页快照、任何本机绝对路径与依赖缓存。
公开侧的对应说明在 `docs/ERRATA_AND_EDITS.md` 与 `docs/LITERATURE_EVIDENCE_MAP.md` 的勘误节。
