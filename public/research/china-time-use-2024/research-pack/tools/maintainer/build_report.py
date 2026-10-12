#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_report.py — Act V's readable research report.

  1. Copies the upstream manuscript verbatim into docs/RESEARCH_MANUSCRIPT_ORIGINAL.md
     (immutable copy; hash recorded in docs/REPORT_BUILD_LOG.txt).
  2. Writes docs/RESEARCH_MANUSCRIPT_PUBLIC.md — the public reading version. The ONLY
     change is the removal of internal process notes ("按 Research Director 意见加入"
     style lines). The substantive rounding-method note is KEPT. No number, formula,
     table cell, heading or conclusion is altered.
  3. Renders report/index.html from the public version using the story's own stylesheet.

Usage:
    python tools/build_report.py [--source PATH_TO_RESEARCH_MANUSCRIPT.md]
"""
from __future__ import annotations

import argparse
import shutil
import hashlib
import html as htmlmod
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCES = [
    ROOT / "inputs_upstream" / "RESEARCH_MANUSCRIPT.md",
    ROOT.parent / "inputs" / "china_time_use_2024_final_figures" / "RESEARCH_MANUSCRIPT.md",
    # last resort, and always available locally: the byte-for-byte copy kept in the
    # internal directory (never published — see docs/ERRATA_AND_EDITS.md). Its hash is
    # pinned below so a tampered copy cannot silently regenerate a different report.
    ROOT / "docs" / "internal" / "RESEARCH_MANUSCRIPT_ORIGINAL.md",
]
# upstream research manuscript (china_time_use_2024_final_figures.zip, b8b96dd2…)
ORIGINAL_SHA256 = "262defbd216760ac7e8aad3b7673c2694aed57ef6aca42143e6c44d70fd2b132"
# Lines that are purely about the internal revision workflow. Matched exactly, and the
# script prints what it removed so a reviewer can see the edit was surgical.
INTERNAL_NOTE = re.compile(
    r"^>\s*_[^_]*（[^）]*(?:Research Director|按.{0,12}意见|审计意见)[^）]*）[^_]*_\s*$")


def sha(text) -> str:
    b = text if isinstance(text, bytes) else text.encode("utf-8")
    return hashlib.sha256(b).hexdigest()


def strip_internal_notes(md: str) -> tuple[str, list[str]]:
    lines = md.splitlines()
    kept, removed = [], []
    for ln in lines:
        if INTERNAL_NOTE.match(ln.strip()):
            removed.append(ln.strip())
            continue
        kept.append(ln)
    out = "\n".join(kept)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out + "\n", removed


# ---------------------------------------------------------------- source mapping (P0-1)
# The upstream manuscript's reference list points 「第三号」 at the 2025 group-tables topic
# page. The bulletin actually numbered 第三号 is t20241031_1957215.html — verified on this
# machine by fetching all three t20241031_19572xx pages, each of which states its own
# bulletin number in its body text (第一号 1957217, 第二号 1957216, 第三号 1957215).
# The public report carries the corrected mapping; the original manuscript copy in
# docs/ stays byte-for-byte unchanged, and this function is the single place the fix lives,
# so re-running the generator cannot restore the wrong label.
BULLETIN_3_URL = "https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957215.html"
GROUP_TABLES_URL = ("https://www.stats.gov.cn/zt_18555/zthd/lhfw/2025/2025_qgsjlydc/"
                    "202501/t20250127_1958534.html")
WRONG_THIRD_REF = re.compile(
    r"^3\.\s*国家统计局，《第三次全国时间利用调查公报（第三号）》，[^：]*：<"
    + re.escape(GROUP_TABLES_URL) + r">。$")

CORRECTED_THIRD_REF = (
    "3. 国家统计局，《第三次全国时间利用调查公报（第三号）》，2024-10-31：<"
    + BULLETIN_3_URL + ">。")
SUPPLEMENTARY_REF = (
    "4. 国家统计局，第三次全国时间利用调查分组汇总表专题页（2025-01-27 发布）：<"
    + GROUP_TABLES_URL + ">。该专题页汇总分性别、分城乡、分年龄组数据，作为补充核对入口。")


def fix_source_mapping(md: str) -> tuple[str, list[str]]:
    """Replace the mislabelled reference and add the topic page as a separate entry."""
    notes = []
    out = []
    for ln in md.splitlines():
        if WRONG_THIRD_REF.match(ln.strip()):
            out.append(CORRECTED_THIRD_REF)
            out.append(SUPPLEMENTARY_REF)
            notes.append("reference 3 (第三号): " + GROUP_TABLES_URL + "  →  " + BULLETIN_3_URL)
            notes.append("reference 4 added: 分组汇总表专题页（2025-01-27）as supplementary entry")
            continue
        out.append(ln)
    if not notes:
        raise SystemExit("FATAL: the expected mislabelled 第三号 reference was not found; "
                         "the upstream manuscript may have changed — do not ship a silent fix.")
    # hard guards: the wrong pairing must be gone, the right one present
    joined = "\n".join(out)
    for ln in joined.splitlines():
        if "公报（第三号）" in ln and GROUP_TABLES_URL in ln:
            raise SystemExit("FATAL: 第三号 is still paired with the 2025 topic page")
    if BULLETIN_3_URL not in joined:
        raise SystemExit("FATAL: corrected 第三号 URL missing from the public report")
    if joined.count(GROUP_TABLES_URL) != 1:
        raise SystemExit("FATAL: the 2025 topic page should appear exactly once, as the "
                         "supplementary entry")
    return joined + "\n", notes


# ------------------------------------------------------------------ line hygiene (P0-2)
# The upstream manuscript ends two header lines with two spaces — the classic Markdown
# hard break. Git's whitespace gate (`git diff --check`, which the site runs before a
# commit) warns on line-end spaces, and the release candidate has to pass it with zero
# warnings. The break is therefore rewritten into the OTHER CommonMark hard break: a line
# whose last non-space character is a backslash. Same meaning for a Markdown reader, no
# trailing whitespace in the file. Nothing else is touched.
# The internal copy of the manuscript is never passed through here: it stays byte-for-byte
# as upstream wrote it, and the erratum records this as EDIT 3.
def hard_breaks_to_backslash(md: str) -> tuple[str, int, int]:
    """'text␣␣' -> 'text\\'; returns (text, hard breaks converted, lone spaces stripped)."""
    out, breaks, singles = [], 0, 0
    for ln in md.splitlines():
        body = ln.rstrip(" \t")
        tail = ln[len(body):]
        if body.endswith("\\") and not body.endswith("\\\\"):
            raise SystemExit("FATAL: a line already ends in a backslash; refusing to guess "
                             "whether it is a hard-break marker: " + body[-60:])
        if not body:
            out.append("")                      # whitespace-only line: no text to break
            continue
        if len(tail) >= 2:
            out.append(body + "\\"); breaks += 1
        elif tail:
            out.append(body); singles += 1
        else:
            out.append(ln)
    return "\n".join(out) + "\n", breaks, singles


def inline(s: str) -> str:
    s = htmlmod.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)",
               r'<a href="\2" rel="noopener" target="_blank">\1</a>', s)
    # autolinks survive html.escape() as &lt;url&gt;, so match that form too
    s = re.sub(r"&lt;(https?://[^&]+)&gt;", r'<a href="\1" rel="noopener" target="_blank">\1</a>', s)
    s = re.sub(r"<(https?://[^>]+)>", r'<a href="\1" rel="noopener" target="_blank">\1</a>', s)
    return s


def table(rows: list[str]) -> str:
    def cells(r):
        return [c.strip() for c in r.strip().strip("|").split("|")]
    head, align, body = cells(rows[0]), cells(rows[1]), [cells(r) for r in rows[2:]]
    def is_num(i):
        a = align[i] if i < len(align) else ""
        return a.startswith("-:") or a.endswith(":")
    out = ['<table class="data-table report-table"><thead><tr>']
    for i, h in enumerate(head):
        cls = ' class="num"' if is_num(i) else ""
        out.append(f"<th{cls}>{inline(h)}</th>")
    out.append("</tr></thead><tbody>")
    for r in body:
        out.append("<tr>")
        for i, c in enumerate(r):
            cls = ' class="num"' if is_num(i) else ""
            out.append(f"<td{cls}>{inline(c)}</td>")
        out.append("</tr>")
    out.append("</tbody></table>")
    # wrap so a wide research table scrolls inside its own container instead of
    # pushing the page sideways on phones (found in the 375px visual pass)
    return '<div class="table-scroll">' + "".join(out) + "</div>"


def md_to_html(md: str) -> str:
    out: list[str] = []
    para: list[str] = []
    quote: list[str] = []
    ul: list[str] = []
    ol: list[str] = []
    tbuf: list[str] = []
    first_h1 = True

    def flush():
        nonlocal para, quote, ul, ol, tbuf
        if tbuf:
            out.append(table(tbuf)); tbuf = []
        if para:
            out.append(f"<p>{inline(' '.join(para))}</p>"); para = []
        if quote:
            out.append(f"<blockquote>{inline(' '.join(quote))}</blockquote>"); quote = []
        if ul:
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in ul) + "</ul>"); ul = []
        if ol:
            out.append("<ol>" + "".join(f"<li>{inline(x)}</li>" for x in ol) + "</ol>"); ol = []

    for ln in md.splitlines():
        s = ln.rstrip()
        # A trailing backslash is the hard-break marker that hard_breaks_to_backslash()
        # writes in place of the two-space form. This renderer has always joined
        # paragraph continuation lines with a single space and never emitted <br> for
        # either form, so the marker is dropped here exactly as the spaces were —
        # report/index.html comes out byte-for-byte unchanged by the line-hygiene edit.
        if s.endswith("\\") and not s.endswith("\\\\"):
            s = s[:-1]
        if s.startswith("|") and s.endswith("|"):
            if not tbuf:
                flush()
            tbuf.append(s)
            continue
        if tbuf:
            flush()
        if not s.strip():
            flush()
            continue
        m = re.match(r"^(#{1,4})\s+(.*)$", s)
        if m:
            flush()
            lvl = len(m.group(1))
            if lvl == 1 and first_h1:
                out.append(f"<h1>{inline(m.group(2))}</h1>")
                first_h1 = False
            else:
                out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
            continue
        if re.match(r"^---+$", s.strip()):
            flush(); out.append("<hr>"); continue
        if s.startswith(">"):
            if para: flush()
            quote.append(s.lstrip("> ").strip()); continue
        m = re.match(r"^\d+\.\s+(.*)$", s)
        if m:
            if para: flush()
            ol.append(m.group(1)); continue
        if s.startswith("- "):
            if para: flush()
            ul.append(s[2:].strip()); continue
        para.append(s.strip())
    flush()
    return "\n".join(out)


def rel(p):
    """Print a repo-relative path: build logs are published, so no machine paths."""
    try:
        return p.relative_to(ROOT).as_posix()
    except ValueError:
        return p.name



def build_en_report(docs: Path) -> int:
    """Render the English edition of the public report into en/report/index.html.

    The English markdown is a reviewed translation authored in this repository
    (docs/RESEARCH_MANUSCRIPT_EN.md); the Chinese version remains the text of record.
    The same source-mapping repair and the same number-token guard run here, so the two
    editions cannot drift apart in figures or in the official bulletin numbering.
    """
    src = docs / "RESEARCH_MANUSCRIPT_EN.md"
    if not src.exists():
        print("FATAL: docs/RESEARCH_MANUSCRIPT_EN.md is missing; refusing to publish a half-translated report")
        return 1
    md = src.read_text(encoding="utf-8")
    # The English edition is authored with the corrected bulletin mapping, so the repair
    # function is not applied to it — instead the mapping is asserted, which keeps the two
    # editions from ever pointing at different official pages.
    b3 = "https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957215.html"
    topic = "https://www.stats.gov.cn/zt_18555/zthd/lhfw/2025/2025_qgsjlydc/202501/t20250127_1958534.html"
    ref_lines = [l for l in md.splitlines() if re.match(r"^\d+\.\s", l)]
    if len(ref_lines) < 4 or b3 not in ref_lines[2] or topic not in ref_lines[3]:
        print("FATAL: the English report's official source mapping is not the corrected one")
        return 1
    notes = ["reference 3 = bulletin no. 3 (asserted, not rewritten); reference 4 = 2025 grouped tables"]
    for token in ["243.2", "169.3", "75.6", "175.4", "318.8", "344.7", "−73.9", "+99.8", "+25.9",
                  "60.2%", "47.7%", "404", "355", "67.5%", "83.9%", "112", "209",
                  "97.6%", "97.1%", "217", "202", "−47.4", "−26.4", "+26.3", "+73.4",
                  "−1.0", "−14.6", "−15.7"]:
        if token not in md:
            print(f"FATAL: English report lost a required figure: {token}")
            return 1
    if "一" <= md[0] <= "鿿":
        print("FATAL: the English report still begins with Chinese text")
        return 1
    for line in md.splitlines():          # no untranslated prose may ship
        if any("一" <= ch <= "鿿" for ch in line) and "第三号" not in line:
            print(f"FATAL: untranslated line in the English report: {line[:70]}")
            return 1

    out_dir = ROOT / "en" / "report"
    md, en_hard_breaks, en_lone_spaces = hard_breaks_to_backslash(md)
    print(f"     en line hygiene: {en_hard_breaks} two-space hard break(s) rewritten as "
          f"backslash breaks, {en_lone_spaces} lone line-end space(s) stripped")
    out_dir.mkdir(parents=True, exist_ok=True)
    body = md_to_html(md)
    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Research report (public reading version) | China Time Use 2024</title>
<meta name="description" content="Public reading version of the China Residents' Time Budget Study 2024: how the gender difference in time changes once unpaid work is counted.">
<link rel="alternate" hreflang="zh-CN" href="../../report/">
<link rel="alternate" hreflang="x-default" href="../../report/">
<link rel="stylesheet" href="../../styles.css">
<link rel="stylesheet" href="./report.css">
</head>
<body class="report-page">
<a class="skip-link" href="#report-body">Skip to the report</a>
<header class="masthead">
  <div class="shell masthead-grid">
    <div class="masthead-main">
      <p class="kicker">Act V annex · research report</p>
      <h1 class="display">Research report (public reading version)</h1>
      <p class="subtitle display">How the gender difference in Chinese residents' time changes once unpaid work is counted</p>
      <p class="standfirst">This is the English edition of the public reading version of the China Residents' Time Budget Study 2024.
        Every figure, formula, table and conclusion is identical to the Chinese edition, which is the text of record;
        the editorial differences from the upstream manuscript are listed in the erratum.</p>
      <p class="howto"><a href="../">← back to the five-act study</a> ·
        <a href="../../report/">中文研究稿</a> ·
        <a href="../../docs/ERRATA_AND_EDITS.md">erratum and editorial notes</a> ·
        <a href="../../research-pack/README.md">reproduction pack</a></p>
    </div>
    <div class="masthead-meta">
      <p class="meta-head">Descriptive study V1</p>
      <p>Field work, May 2024</p>
      <p>Usual residents aged 6 and over</p>
      <p class="dim">No causal claim · no composition adjustment</p>
    </div>
  </div>
</header>
<main class="shell report-shell" id="report-body">
{body}
<section class="report-notes">
  <h2>About this edition</h2>
  <ul>
    <li>The Chinese report is the text of record; this English edition is a reviewed translation of it,
      prepared by the author of the study. Both are generated from the same audited data layer.</li>
    <li>Official definitions quoted from the National Bureau of Statistics exist in Chinese only. Where this
      site renders them in English it labels the lines as our translation.</li>
    <li>Editorial differences from the upstream manuscript, and that manuscript's SHA-256, are recorded in
      <code>docs/ERRATA_AND_EDITS.md</code> (Chinese, text of record).</li>
    <li>Reproduction: <code>research-pack/README.md</code> and the Act V panel of the study.</li>
  </ul>
</section>
</main>
</body>
</html>
"""
    (out_dir / "index.html").write_text(page, encoding="utf-8", newline="\n")
    shutil.copy2(ROOT / "report" / "report.css", out_dir / "report.css")
    (docs / "RESEARCH_MANUSCRIPT_PUBLIC_EN.md").write_text(md, encoding="utf-8", newline="\n")
    print(f"OK  en/report/index.html  ({len(body)} chars of body; {len(notes)} source notes applied)")
    print(f"OK  docs/RESEARCH_MANUSCRIPT_PUBLIC_EN.md  sha256 {sha(md.encode())[:16]}…")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=None)
    args = ap.parse_args()

    src = Path(args.source) if args.source else next((p for p in DEFAULT_SOURCES if p.exists()), None)
    if src is None:
        print("FATAL: research manuscript not found (nor the shipped original copy);"
              " refusing to invent a report")
        return 1
    print(f"     source: {rel(src)}")
    raw = src.read_bytes()
    original = raw.decode("utf-8")
    if sha(raw) != ORIGINAL_SHA256:
        print(f"FATAL: source manuscript hash {sha(raw)[:16]}… != upstream {ORIGINAL_SHA256[:16]}…")
        print("       refusing to build a public report from an unrecognised manuscript.")
        return 1

    docs = ROOT / "docs"
    docs.mkdir(exist_ok=True)
    (docs / "internal").mkdir(exist_ok=True)
    # the upstream manuscript is preserved byte-for-byte for the audit trail, but it is
    # NOT published: it carries an internal revision-workflow note (see the erratum).
    (docs / "internal" / "RESEARCH_MANUSCRIPT_ORIGINAL.md").write_bytes(raw)

    public, removed = strip_internal_notes(original)
    public, source_notes = fix_source_mapping(public)
    public, hard_breaks, lone_spaces = hard_breaks_to_backslash(public)
    print(f"     zh line hygiene: {hard_breaks} two-space hard break(s) rewritten as "
          f"backslash breaks, {lone_spaces} lone line-end space(s) stripped")
    # guard: the public version must keep every number and the rounding note
    for token in ["243.2", "169.3", "75.6", "175.4", "318.8", "344.7", "−73.9", "+99.8", "+25.9",
                  "舍入", "p×t", "(p女 − p男)"]:
        if token not in public:
            print(f"FATAL: public report lost required content: {token}")
            return 1
    if "按 Research Director 意见" in public or "Research Director" in public:
        print("FATAL: internal process note still present")
        return 1
    (docs / "RESEARCH_MANUSCRIPT_PUBLIC.md").write_text(public, encoding="utf-8", newline="\n")

    # --------------------------- public erratum (replaces the unpublished original) ---
    erratum = f"""# 勘误与编辑说明（公开）

本文件说明公开研究稿相对上游研究稿《中国居民时间预算研究 · 2024》做了哪些**编辑性**改动。
没有任何数值、公式、表格单元格或结论被改动。

上游原稿**不随站点发布**：其中一条修订注记属于内部协作流程记录，对读者没有证据价值。
原稿以逐字节副本形式保留在仓库内部路径 `docs/internal/RESEARCH_MANUSCRIPT_ORIGINAL.md`，
其 SHA-256 为：

```
{sha(raw)}
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
本更正写在生成器 `tools/build_report.py` 里，因此重新构建不会把它改回去。

## 编辑 3 · 强制换行改写为反斜杠形式（不改变渲染）

上游原稿标题段的两行以**两个行尾空格**表示 Markdown 强制换行。站点的提交前检查
（`git diff --check`）会对行尾空格报警，发布候选必须零警告通过，因此公开版把这两行改写为
同一种语义的**另一种 CommonMark 强制换行**——行尾反斜杠：

```
**中国居民时间预算研究 · 2024年 · 描述性研究 V1 · 研究稿**\\
```

改写由生成器 `hard_breaks_to_backslash()` 按固定规则产生（≥2 个行尾空格 → 反斜杠；
单个行尾空格 → 删除；若某行本来就以反斜杠结尾则直接失败，不猜测其含义）。
语义等价性用 CommonMark 参考实现独立验证（两种写法都输出 `<br />`）；
本站报告渲染器 `md_to_html()` 过去就忽略行尾空格、现在同样忽略行尾反斜杠，
因此 `report/index.html` 与 `en/report/index.html` **逐字节不变**。
数字、公式、表格与结论未作任何改动，上游原稿的内部副本也未改写。

## 文献类型更正（同一研究专题）

Giurge, Whillans & West (2020) 的文献类型按出版商 *Nature Human Behaviour* 文章页自身的
栏目归类标为 **Perspective（观点文章）**；聚合站点（Crossref `dc.type=ReviewPaper`、
Semantic Scholar `publicationTypes=["Review", …]`）的取值作为二级记录保留。
依据与守卫见 `docs/LITERATURE_EVIDENCE_MAP.md` 的勘误节。

## 复现

```
公开研究稿 SHA-256：{sha(public)}
数据层 SHA-256　　：{sha((ROOT / "data" / "time-use-data.js").read_bytes())}
```

三步离线复现见 `README.md`（研究复现包根目录）与页面第五幕。
"""
    (docs / "ERRATA_AND_EDITS.md").write_text(erratum, encoding="utf-8", newline="\n")

    body = md_to_html(public)
    page = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>研究稿（公开阅读版）｜China Time Use 2024</title>
<meta name="description" content="中国居民时间预算研究 2024 的公开阅读版：当无酬劳动被计入，中国居民的性别劳动时间差异如何改变。">
<link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="./report.css">
</head>
<body class="report-page">
<a class="skip-link" href="#report-body">跳到正文</a>
<header class="masthead">
  <div class="shell masthead-grid">
    <div class="masthead-main">
      <p class="kicker">第五幕附件 · 研究报告</p>
      <h1 class="display">研究稿（公开阅读版）</h1>
      <p class="subtitle display">当无酬劳动被计入，中国居民的性别时间差异如何改变</p>
      <p class="standfirst">这是《中国居民时间预算研究 · 2024》的公开阅读版。
        全部数值、公式、表格与结论与研究稿一致；文末列出本版相对原始稿件的两处编辑性差异
        （删除一条流程性注记、更正一条来源编号）。</p>
      <p class="howto"><a href="../index.html">← 返回五幕交互叙事</a> ·
        <a href="../docs/ERRATA_AND_EDITS.md">勘误与编辑说明（公开）</a> ·
        <a href="../research-pack/README.md">研究复现包</a></p>
    </div>
    <div class="masthead-meta">
      <p class="meta-head">描述性研究 V1</p>
      <p>2024 年 5 月现场调查</p>
      <p>全国 6 岁及以上常住居民</p>
      <p class="dim">非因果结论 · 未作构成调整</p>
    </div>
  </div>
</header>
<main class="shell report-shell" id="report-body">
{body}
<section class="report-notes">
  <h2>版本说明</h2>
  <ul>
    <li>上游原稿不随站发布（含一条内部协作流程注记）；其逐字节副本保留在仓库内部，
      SHA-256 与两处编辑性差异逐条记录在 <code>docs/ERRATA_AND_EDITS.md</code>。</li>
    <li>数值复现：审计输入、生成脚本与校验脚本随页发布，见
      <code>research-pack/README.md</code>。</li>
    <li><strong>来源编号更正：</strong>原始稿件的参考列表把 2025 年发布的分组汇总表专题页标注为
      「第三号」。第三号公报的正确地址是
      <a href="{BULLETIN_3_URL}" rel="noopener" target="_blank"><code>t20241031_1957215.html</code></a>
      （分性别、分城乡、分年龄组的参与者日均时间与活动参与率）；该专题页在本版中改列为
      第 4 条补充来源。更正依据：2026-10-11 本机抓取三个 <code>t20241031_19572xx</code> 页面，
      正文分别自述为第一号、第二号、第三号（快照与哈希见 <code>evidence/nbs/</code>）。
      统计数据本身未作任何改动。</li>
    <li><strong>删除一条流程性注记：</strong>第 4 节结果表下方原有 1 行关于稿件修订往来的说明，
      属于制作过程记录而非研究方法，故不在公开版出现；与之相邻的舍入方法说明属于方法内容，已保留。</li>
    <li>本页由 <code>tools/build_report.py</code> 生成，上述两处差异均由该脚本按固定规则产生，
      重新生成不会恢复原标注。</li>
  </ul>
</section>
</main>
<footer class="foot"><div class="shell">
  <p>China Time Use 2024 · 五幕交互研究叙事 · 研究报告</p>
  <p class="dim">数据来源：国家统计局《第三次全国时间利用调查》公报第一号、第二号、第三号；分组汇总表专题页为补充来源。</p>
</div></footer>
</body>
</html>
"""
    rep = ROOT / "report"
    rep.mkdir(exist_ok=True)
    (rep / "index.html").write_text(page, encoding="utf-8", newline="\n")
    (rep / "report.css").write_text("""/* report page: reading column + numeric alignment for the research tables */
.report-shell { max-width: 78ch; padding-block: 40px 56px; }
.report-page main h1 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.1rem); line-height: 1.25; }
.report-page main h2 { font-family: var(--font-display); font-weight: 400; font-size: 1.45rem;
  margin: 34px 0 10px; padding-bottom: 8px; border-bottom: 1px solid var(--rule); }
.report-page main h3 { font-size: 1.08rem; margin: 26px 0 8px; }
.report-page main p { margin: 12px 0; font-size: 16px; line-height: 1.78; color: var(--ink); }
.report-page main strong { color: var(--ink); }
.report-page main ul, .report-page main ol { padding-left: 22px; }
.report-page main li { margin: 7px 0; font-size: 15.5px; color: var(--ink-light); }
.report-page blockquote { margin: 16px 0; padding: 10px 14px; background: var(--page);
  border-left: 3px solid var(--unpaid); border-radius: 0 6px 6px 0; font-size: 14.5px; }
.report-page .report-table { min-width: 0; width: 100%; font-size: 13.5px; margin: 16px 0; }
.report-page .report-table td.num, .report-page .report-table th.num { text-align: right;
  font-variant-numeric: tabular-nums; font-family: var(--font-num); }
.report-page a, .report-page code, .report-page li, .report-page p { overflow-wrap: anywhere; }
.report-page hr { border: 0; border-top: 1px solid var(--rule); margin: 30px 0; }
.report-page code { font-size: .88em; }
.report-notes { margin-top: 40px; padding-top: 18px; border-top: 2px solid var(--ink); }
.report-notes h2 { margin-top: 0; }
.report-notes li { font-size: 14px; }
@media (max-width: 640px) { .report-shell { padding-inline: 20px; } .report-page main p { font-size: 15.5px; } }
""", encoding="utf-8", newline="\n")

    log = ("REPORT BUILD LOG\n"
           f"source: {rel(src)}\n"
           f"original bytes: {len(raw)} (copy written byte-for-byte)\n"
           f"original sha256: {sha(raw)}\npublic  sha256: {sha(public)}\n"
           "\nEDIT 1 — process note removed from the public version "
           f"({len(removed)} line, verbatim, kept here as the audit trail):\n"
           + "".join(f"  - {r}\n" for r in removed)
           + "  kept: the rounding-method note in §4 and every number/formula/table cell\n"
           "\nEDIT 2 — source numbering corrected in the public version:\n"
           + "".join(f"  - {n}\n" for n in source_notes)
           + "  basis: three t20241031_19572xx pages fetched 2026-10-11 each state their own "
             "bulletin number (snapshots + hashes in evidence/nbs/)\n"
           + "\nEDIT 3 — line hygiene in the public version "
             f"(source: git's `git diff --check` whitespace gate):\n"
           + f"  - {hard_breaks} line(s) ending in two spaces rewritten as the CommonMark "
             f"backslash hard break; {lone_spaces} line(s) ending in a single space stripped\n"
           + "  both forms mean the same thing to a Markdown reader; this renderer ignored "
             "the trailing spaces before and ignores the backslash now, so report/index.html "
             "and en/report/index.html are byte-for-byte unchanged\n"
           + "  the internal manuscript copy is NOT rewritten by this edit\n"
           + "  the original manuscript copy is NOT edited; statistical values are NOT edited\n")
    (docs / "REPORT_BUILD_LOG.txt").write_text(log, encoding="utf-8", newline="\n")

    print(f"OK  docs/internal/RESEARCH_MANUSCRIPT_ORIGINAL.md  sha256 {sha(raw)[:16]}…  (not published)")
    print(f"OK  docs/ERRATA_AND_EDITS.md")
    print(f"OK  docs/RESEARCH_MANUSCRIPT_PUBLIC.md    sha256 {sha(public)[:16]}…")
    print(f"OK  report/index.html  ({len(removed)} process line removed; source mapping corrected)")
    for r in removed:
        print("    removed:", r[:100])
    for n in source_notes:
        print("    source :", n[:120])

    rc_en = build_en_report(docs)
    if rc_en:
        return rc_en
    return 0


if __name__ == "__main__":
    sys.exit(main())
