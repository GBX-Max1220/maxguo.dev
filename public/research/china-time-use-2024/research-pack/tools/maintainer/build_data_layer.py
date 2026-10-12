#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_data_layer.py — D1: generate the story page's single source of numbers,
official category definitions and literature citations.

Reads (all read-only; nothing here is hand-typed into the UI):
    data/audited/dataset.json        audit-passed statistical input (hash frozen)
    data/audited/gate2_results.json  audit-passed contrasts / decomposition / limits
    evidence/nbs/*.html              snapshots of the NBS bulletins (verbatim notes)
    evidence/literature/*.json       Crossref records + DOI landing checks

Writes:
    data/time-use-data.js            ES module consumed by every view + tools/qa_data.mjs
    index.html                       the <!-- BEGIN:NOJS --> block is regenerated in place

Governance
  * Every displayed number is derived from the two audited JSON files.
  * Official activity-domain definitions are extracted verbatim from the bulletin
    snapshots (fail loudly if a quote cannot be found) — not paraphrased by hand.
  * Literature strings in Act IV come from the stored Crossref records.
  * Identity checks run at build time AND again in the browser at load time, and
    again per interactive state in tools/qa_data.mjs.
  * Missing fields are FATAL. Nothing is defaulted, interpolated or rounded to fit.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ACTIVITIES = ["paid", "unpaid", "discretionary"]
GROUPS = ["male", "female"]
NBS_URLS = {
    "nbs_1957217.html": "https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957217.html",
    "nbs_1957216.html": "https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957216.html",
    "nbs_1957215.html": "https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202410/t20241031_1957215.html",
    "nbs_1958534.html": "https://www.stats.gov.cn/zt_18555/zthd/lhfw/2025/2025_qgsjlydc/202501/t20250127_1958534.html",
}
NBS_LABELS = {
    "nbs_1957217.html": "公报第一号（调查主要结果）",
    "nbs_1957216.html": "公报第二号（全国居民分领域/分大类时间利用）",
    "nbs_1957215.html": "公报第三号（分性别、分城乡、分年龄组参与者时间与参与率）",
    "nbs_1958534.html": "分组汇总表专题页（2025 年发布，补充核对）",
}


def fail(msg: str) -> None:
    print(f"FATAL: {msg}")
    sys.exit(1)


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def html_text(raw: bytes) -> str:
    """Deterministic normalisation used for quote extraction."""
    t = raw.decode("utf-8", errors="replace")
    t = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", t)
    t = re.sub(r"(?s)<[^>]+>", " ", t)
    t = html.unescape(t).replace("\xa0", " ").replace("\u3000", " ")
    return re.sub(r"\s+", " ", t).strip()


def extract(text: str, pattern: str, what: str) -> str:
    m = re.search(pattern, text)
    if not m:
        fail(f"verbatim quote not found in snapshot: {what} (pattern {pattern})")
    return m.group(0).strip()


def main() -> int:
    ds_path = ROOT / "data" / "audited" / "dataset.json"
    g2_path = ROOT / "data" / "audited" / "gate2_results.json"
    for p in (ds_path, g2_path):
        if not p.exists():
            fail(f"missing audited input: {p}")

    ds = json.loads(ds_path.read_text(encoding="utf-8"))
    g2 = json.loads(g2_path.read_text(encoding="utf-8"))

    # ------------------------------------------------------- raw record index
    rec = {(r["group_id"], r["activity_id"]): r for r in ds["records"]}

    groups: dict = {}
    for gid in GROUPS:
        g = {}
        for aid in ACTIVITIES:
            r = rec.get((gid, aid))
            if r is None:
                fail(f"missing record: {gid}/{aid} in dataset.json")
            rate_pct = r.get("participation_rate_pct")
            pmean = r.get("participant_mean_min")
            approx = r.get("all_resident_mean_min_approx")
            if rate_pct is None or pmean is None or approx is None:
                fail(f"missing field(s) in {gid}/{aid}: rate={rate_pct} "
                     f"participant_mean={pmean} approx={approx}")
            derived = round(rate_pct / 100.0 * pmean, 3)
            if abs(derived - approx) > 1e-3:
                fail(f"{gid}/{aid}: rate/100*pmean={derived} != audited approx={approx}")
            g[aid] = {
                "participation_rate_pct": rate_pct,
                "participant_mean_min": pmean,
                "all_resident_mean_min": approx,
                "label_zh": r.get("activity_label", aid),
                "value_kind": "derived_from_published_p_and_t",
            }
        groups[gid] = {"label_zh": "男性" if gid == "male" else "女性", **g}

    # ------------------------------------------- totals, gaps, bridge identity
    def armm(gid: str, aid: str) -> float:
        return groups[gid][aid]["all_resident_mean_min"]

    totals = {
        "male_total": round(armm("male", "paid") + armm("male", "unpaid"), 3),
        "female_total": round(armm("female", "paid") + armm("female", "unpaid"), 3),
    }
    gaps = {
        "paid": round(armm("female", "paid") - armm("male", "paid"), 3),
        "unpaid": round(armm("female", "unpaid") - armm("male", "unpaid"), 3),
        "total": round(totals["female_total"] - totals["male_total"], 3),
        "discretionary": round(armm("female", "discretionary") - armm("male", "discretionary"), 3),
    }
    if abs(gaps["paid"] + gaps["unpaid"] - gaps["total"]) > 1e-9:
        fail(f"bridge identity fails: {gaps['paid']} + {gaps['unpaid']} != {gaps['total']}")

    # cross-check every value against gate2_results.json (the other audited file)
    cg = g2["contrasts"]["female_minus_male"]
    for key in ("paid", "unpaid", "discretionary"):
        if abs(gaps[key] - cg[key]) > 5e-4:
            fail(f"gap mismatch {key}: derived {gaps[key]} vs gate2 {cg[key]}")
    for gid in GROUPS:
        s = round(armm(gid, "paid") + armm(gid, "unpaid"), 3)
        tl = next(x for x in g2["groups"] if x["group_id"] == gid)["total_labor_min"]
        if abs(s - tl) > 5e-4:
            fail(f"total_labor mismatch {gid}: {s} vs gate2 {tl}")

    # --------------------------------------- symmetric (non-causal) split
    decomposition = {}
    for aid in ACTIVITIES:
        p_m, p_f = groups["male"][aid]["participation_rate_pct"] / 100.0, \
                   groups["female"][aid]["participation_rate_pct"] / 100.0
        t_m, t_f = groups["male"][aid]["participant_mean_min"], \
                   groups["female"][aid]["participant_mean_min"]
        part_term = (p_f - p_m) * (t_f + t_m) / 2.0
        dur_term = (t_f - t_m) * (p_f + p_m) / 2.0
        gap = p_f * t_f - p_m * t_m
        if abs(part_term + dur_term - gap) > 1e-9:
            fail(f"{aid}: symmetric identity does not close ({part_term}+{dur_term} != {gap})")
        gate2 = g2["gender_gap_decomposition_noncausal"][aid]
        for mine, theirs, nm in ((part_term, gate2["participation_margin_min"], "participation"),
                                 (dur_term, gate2["participant_duration_margin_min"], "duration")):
            if abs(mine - theirs) > 1e-3:
                fail(f"{aid}/{nm}: recomputed {mine} vs gate2 {theirs}")
        decomposition[aid] = {
            "gap_min": round(gap, 3),
            "participation_term_min": round(part_term, 3),
            "duration_term_min": round(dur_term, 3),
            "terms_sum_min": round(part_term + dur_term, 3),
            "residual_min": round(part_term + dur_term - gap, 9),
            "p_male": round(p_m, 4), "p_female": round(p_f, 4),
            "t_male": t_m, "t_female": t_f,
            "label_zh": groups["female"][aid]["label_zh"],
        }

    # --------------------------------- national 24h context (published means)
    ndm = dict(g2["national_daily_minutes"])
    six = ["essential", "paid", "unpaid", "discretionary", "study", "transport"]
    six_sum = sum(ndm[k] for k in six)
    if abs(six_sum - 1440) > 3:
        fail(f"national six-domain sum {six_sum} deviates from 1440 beyond tolerance")

    # --------------------------------- rounding-only bounds (NOT a sampling CI)
    rb = g2["rounding_only_gender_gaps_min"]

    # ------------------------------------------------- verbatim official notes
    quotes: dict = {}
    texts: dict = {}
    for fname, url in NBS_URLS.items():
        p = ROOT / "evidence" / "nbs" / fname
        if not p.exists():
            fail(f"missing NBS snapshot: {p}")
        texts[fname] = html_text(p.read_bytes())

    def grab(key: str, fname: str, pattern: str, what: str) -> None:
        quotes[key] = {
            "text": extract(texts[fname], pattern, what),
            "source_file": f"evidence/nbs/{fname}",
            "source_url": NBS_URLS[fname],
            "source_label": NBS_LABELS[fname],
            "source_sha256": sha(ROOT / "evidence" / "nbs" / fname),
            "snapshot_compiled": ds["compiled"],
        }

    grab("unpaid_definition", "nbs_1957216.html", r"\[8\]\s*无酬劳动领域包括[^。]*。",
         "official unpaid-labour domain definition")
    grab("paid_definition", "nbs_1957216.html", r"\[7\]\s*有酬劳动领域包括[^。]*。",
         "official paid-labour domain definition")
    grab("discretionary_definition", "nbs_1957216.html", r"\[9\]\s*个人自由支配活动领域包括[^。]*。",
         "official discretionary domain definition")
    grab("week_weighting", "nbs_1957216.html",
         r"在计算居民参与某类活动的时间时，[^。]*。", "5/7 + 2/7 weighting note")
    grab("six_domains", "nbs_1957217.html", r"\[2\]\s*居民主要活动领域包括[^。]*。",
         "six activity domains note")
    grab("sample_scope", "nbs_1957217.html",
         r"第三次全国时间利用调查的调查对象为抽中调查户和该户中[^。]*。",
         "sample & population note")
    grab("age_paid_caution", "nbs_1957215.html",
         r"\[1\]\s*在实际调查中，6—15周岁居民无有酬劳动领域活动。",
         "6-15 paid activity note")

    # --------------------------------------------------------------- literature
    lit_path = ROOT / "evidence" / "literature"
    landing = json.loads((lit_path / "landing_checks.json").read_text(encoding="utf-8"))
    land_by_doi = {c["doi"]: c for c in landing["checks"]}
    LIT_KEYS = {
        "crossref_10.1002_9781118663219.wbegss183.json": "eagly_wood_2016",
        "crossref_10.1177_0003122419859007.json": "daminger_2019",
        "crossref_10.1038_s41562-020-0920-z.json": "giurge_whillans_west_2020",
    }
    # --- publisher-authoritative article type -------------------------------------------
    # D1.1 labelled Giurge et al. "Review" on the strength of Semantic Scholar's
    # publicationTypes. The independent audit is right that the publisher's own article
    # category governs: nature.com renders "Perspective" above the title. We therefore
    # read the publisher page snapshot, keep the two secondary signals for traceability,
    # and never let the UI carry a hand-typed classification.
    PUBLISHER_TYPES = {"Perspective", "Review", "Comment", "Analysis", "Article",
                       "Brief Communication", "Correspondence", "Editorial",
                       "Book Review", "Research Highlight"}
    nature_path = lit_path / "nature_article_type.json"
    nature = json.loads(nature_path.read_text(encoding="utf-8")) if nature_path.exists() else None
    s2_giurge_path = lit_path / "s2_giurge.json"
    s2_giurge = json.loads(s2_giurge_path.read_text(encoding="utf-8")) if s2_giurge_path.exists() else None

    def publisher_article_type(doi: str):
        """(type, evidence dict) for a DOI, publisher page taking precedence."""
        if doi != "10.1038/s41562-020-0920-z":
            return None, None
        if not nature:
            fail("nature.com article-type snapshot missing — cannot classify Giurge et al. "
                 "without the publisher record")
        header = nature.get("headerBlock") or ""
        m = re.match(r"^([A-Za-z ]+?)\s+Published:", header)
        if not m:
            fail(f"could not parse the publisher article category from: {header[:80]}")
        ptype = m.group(1).strip()
        if ptype not in PUBLISHER_TYPES:
            fail(f"unexpected publisher article category {ptype!r}; refusing to guess")
        return ptype, {
            "authority": "publisher",
            "source": "evidence/literature/nature_article_type.json",
            "source_url": nature.get("url"),
            "http_status": nature.get("httpStatus"),
            "publisher_header_label": ptype,
            "publisher_meta_dc_type": (nature.get("dcType") or [None])[0],
            "secondary_semantic_scholar": (s2_giurge or {}).get("publicationTypes"),
            "note": ("出版商页面正文标题上方的栏目为权威分类；其 dc.type 元数据与 Semantic Scholar "
                     "的 publicationTypes 为二级信号，保留但不覆盖出版商栏目。"),
        }

    literature = []
    for fname, key in LIT_KEYS.items():
        p = lit_path / fname
        if not p.exists():
            fail(f"missing Crossref record: {p}")
        m = json.loads(p.read_text(encoding="utf-8"))["message"]
        doi = m["DOI"]
        year = (m.get("issued", {}).get("date-parts", [[None]])[0] or [None])[0]
        ld = land_by_doi.get(doi, {})
        atype, aevidence = publisher_article_type(doi)
        if not atype:
            atype = {"journal-article": "期刊论文（journal article）",
                     "other": "百科条目（encyclopedia entry）"}.get(m.get("type"), m.get("type"))
            aevidence = {"authority": "crossref", "crossref_type": m.get("type"),
                         "source": f"evidence/literature/{fname}"}
        literature.append({
            "key": key,
            "doi": doi,
            "article_type": atype,
            "article_type_evidence": aevidence,
            "title": (m.get("title") or [None])[0],
            "authors": [f"{a.get('given','')} {a.get('family','')}".strip() for a in m.get("author", [])],
            "venue": (m.get("container-title") or [None])[0],
            "year": year,
            "volume": m.get("volume"), "issue": m.get("issue"), "page": m.get("page"),
            "publisher": m.get("publisher"),
            "url": f"https://doi.org/{doi}",
            "landing_status": ld.get("http_status"), "landing_url": ld.get("final_url"),
            "record_file": f"evidence/literature/{fname}",
            "record_sha256": sha(p),
            "accessed": landing.get("accessed"),
        })
    for entry in literature:
        if not entry["title"] or not entry["authors"] or not entry["url"]:
            fail(f"incomplete literature record: {entry['key']}")
        if not entry["article_type"]:
            fail(f"literature record without an article type: {entry['key']}")
    g = next((e for e in literature if e["key"] == "giurge_whillans_west_2020"), None)
    if not g or g["article_type"] != "Perspective":
        fail(f"Giurge et al. must be classified by the publisher's own column "
             f"(got {g and g['article_type']!r}); D1.1's 'Review' label was an audit finding")

    # --------------------------------------------------------------- assemble
    data = {
        "meta": {
            "dataset_id": ds["dataset_id"],
            "dataset_version": ds["version"],
            "phase": "D1 five-act interactive research story",
            # NOTE: no timestamp inside the payload — the generated module must be
            # byte-reproducible from the inputs, so build metadata lives in
            # docs/DATA_LAYER_BUILD.txt instead.
            "built_by": "tools/build_data_layer.py",
            "survey": ds["survey"],
            "source_urls": {
                "bulletin_1_overview": ds["provenance"]["survey"],
                "bulletin_2_national": ds["provenance"]["national"],
                "bulletin_3_by_sex": NBS_URLS["nbs_1957215.html"],
                "group_tables": ds["provenance"]["groups"],
            },
            "source_labels": {
                "bulletin_1_overview": "公报第一号 · 调查主要结果（现场时间、样本、人口范围）",
                "bulletin_2_national": "公报第二号 · 全国居民分领域/分大类时间利用（含领域定义注释、5/7+2/7 加权说明）",
                "bulletin_3_by_sex": "公报第三号 · 分性别/城乡/年龄组参与者日均时间与活动参与率（本页分性别数值的原始来源）",
                "group_tables": "分组汇总表专题页 · 2025 年发布，用于补充核对",
            },
            "upstream_packages": {
                "research_package_zip_sha256":
                    "b8b96dd270f0da2f8c350cbc77d5866a991aaaa523e12ab6b96fc83d43134478",
                "prototype_baseline_d0_1_zip_sha256":
                    "f5be7023c3e352212d87bf3c61d67c8a819fd8044af0990832abcb6f7bbab29c",
                "note": "D0.1 的 PROVENANCE.md 曾把研究包哈希写成 D0 原型包的 7f6f8dc0…；D1 已更正并分列两包。",
            },
            "generated_from": {
                "origin": "bundled data/audited (see data/audited/PROVENANCE.md)",
                "files": ["dataset.json", "gate2_results.json"],
                "sha256": {"dataset.json": sha(ds_path), "gate2_results.json": sha(g2_path)},
                "evidence": {f"evidence/nbs/{f}": sha(ROOT / "evidence" / "nbs" / f)
                             for f in NBS_URLS},
                "literature": {f"evidence/literature/{f}": sha(lit_path / f)
                               for f in sorted(q.name for q in lit_path.glob("*.json"))},
            },
            "unit": "分钟/天（一周加权：工作日 5/7 + 周末 2/7）",
            "precision_note": (
                "participant_mean_min 与 participation_rate_pct 为公报公布值（参与者均值在公报中为整数分钟，"
                "参与率精确到 0.1 个百分点）；all_resident_mean_min 为由 p×t 还原的推导值，保留 3 位小数；"
                "展示层再四舍五入到 1 位小数。分项与合计分别按未舍入值计算，展示值之和可能与合计相差 0.1 分钟。"),
        },
        "scope": {
            "population": "全国 6 岁及以上常住居民（第三次全国时间利用调查，2024 年 5 月现场）",
            "not_adjusted": ["年龄", "就业", "婚育", "家庭结构"],
            "not_causal": True,
            "group_means_not_individuals": True,
            "weights": ds["survey"]["week_weights"],
        },
        "groups": groups,
        "totals": totals,
        "gaps": gaps,
        "decomposition": decomposition,
        "national_daily_minutes": ndm,
        "national_six_domain_sum_min": six_sum,
        "rounding_bounds": {
            "is_sampling_confidence_interval": False,
            "note": "仅由公报已公布数值的舍入边界推出，不是抽样置信区间，也不代表测量误差。",
            "values": rb,
        },
        "definitions": quotes,
        "literature": literature,
        "limits": g2["limits"],
        "validation": g2["validation"],
        "checks": {
            "bridge_identity": "paid_gap + unpaid_gap == total_gap (tol 1e-9)",
            "total_identity": "paid + unpaid == total_labor_min for both sexes (tol 5e-4)",
            "gate2_crosscheck": "all gaps match gate2_results.json contrasts (tol 5e-4)",
            "derived_crosscheck": "rate/100 * participant_mean == audited all_resident_mean (tol 1e-3)",
            "decomposition_crosscheck": "symmetric terms recomputed from p,t match gate2 decomposition (tol 1e-3)",
            "national_six_domain": f"published national six-domain sum = {six_sum} (tol 3 min)",
            "status": "PASS",
        },
    }

    out = ROOT / "data" / "time-use-data.js"
    js = (
        "// AUTO-GENERATED by tools/build_data_layer.py — DO NOT EDIT BY HAND.\n"
        "// Values: data/audited/{dataset,gate2_results}.json (hashes in meta.generated_from).\n"
        "// Official definitions: evidence/nbs/*.html snapshots (verbatim, hash recorded).\n"
        "// Citations: evidence/literature/crossref_*.json (Crossref records, hash recorded).\n"
        "// Regenerate: python tools/build_data_layer.py   (then: node tools/qa_data.mjs)\n"
        "export const DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
        "export default DATA;\n"
    )
    out.write_text(js, encoding="utf-8", newline="")   # LF on every platform

    # --------------------------------------- regenerate the no-JS fallback text
    def f1(v: float) -> str:
        s = f"{v:.1f}"
        return s.replace("-", "−")   # typographic minus, as everywhere else on the page

    nojs = (
        "<strong>此页面的交互图形需要启用 JavaScript。核心结论（静态文本）：</strong>"
        f"仅统计有酬劳动时，男性居民日均 {f1(armm('male','paid'))} 分钟、女性 {f1(armm('female','paid'))} 分钟，"
        f"差 {f1(gaps['paid'])} 分钟/天（男性更长）；纳入无酬劳动后，男性 {f1(totals['male_total'])} 分钟、"
        f"女性 {f1(totals['female_total'])} 分钟，差 +{f1(gaps['total'])} 分钟/天（女性更长）。"
        f"无酬劳动差异 {f1(gaps['unpaid'])} 分钟大于有酬劳动差异的绝对值 {f1(abs(gaps['paid']))} 分钟，"
        "因此合计差的方向随之反转。数据来自国家统计局第三次全国时间利用调查（2024 年 5 月现场，"
        "全国 6 岁及以上常住居民，按工作日 5/7、周末 2/7 加权的一周日平均），"
        "是未作年龄/就业/婚育构成调整的群体平均，非因果结论。"
        "本页无酬劳动的官方定义为公报第二号注释[8]；完整口径、公式与限制见第五幕与研究包文档。"
    )
    idx = ROOT / "index.html"
    if idx.exists():
        txt = idx.read_text(encoding="utf-8")
        pat = re.compile(r"(<!-- BEGIN:NOJS -->)(.*?)(<!-- END:NOJS -->)", re.S)
        if not pat.search(txt):
            fail("index.html is missing the <!-- BEGIN:NOJS --> markers")
        txt2 = pat.sub(lambda m: m.group(1) + "\n" + nojs + "\n      " + m.group(3), txt)
        idx.write_text(txt2, encoding="utf-8")
        print("OK  regenerated <noscript> fallback in index.html")
    else:
        print("NOTE index.html not present yet; skipping no-JS injection")

    build_log = chr(10).join([
        "DATA LAYER BUILD",
        f"built_at: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "built_by: tools/build_data_layer.py",
        f"dataset.json  sha256 {sha(ds_path)}",
        f"gate2_results.json  sha256 {sha(g2_path)}",
        f"payload sha256 (this build): {hashlib.sha256(js.encode('utf-8')).hexdigest()}",
        "note: the payload contains no timestamp, so rebuilding from the same inputs",
        "      reproduces data/time-use-data.js byte-for-byte.",
        "",
    ])
    (ROOT / "docs").mkdir(exist_ok=True)
    (ROOT / "docs" / "DATA_LAYER_BUILD.txt").write_text(build_log, encoding="utf-8", newline=chr(10))
    print(f"OK  wrote {out}")
    print(f"    gaps     paid {gaps['paid']}  unpaid {gaps['unpaid']}  "
          f"total {gaps['total']}  discretionary {gaps['discretionary']}")
    print(f"    totals   male {totals['male_total']}  female {totals['female_total']}")
    for aid in ACTIVITIES:
        d = decomposition[aid]
        print(f"    decomp   {aid}: participation {d['participation_term_min']} "
              f"+ duration {d['duration_term_min']} = {d['terms_sum_min']} (gap {d['gap_min']})")
    print(f"    quotes   {len(quotes)} verbatim official notes;  literature {len(literature)} entries")
    print("    all identity checks PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
