// qa_data.mjs — data/claim QA for the D1 story, run outside the browser.
// It exercises the SAME pure module the page renders from (js/derive.js), so a pass
// here means the numbers/labels every interactive state will show are correct.
//
//   node tools/qa_data.mjs            (exit 1 on any failure)
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { DATA } = await import(pathToFileURL(path.join(ROOT, "data/time-use-data.js")).href);
const D = await import(pathToFileURL(path.join(ROOT, "js/derive.js")).href);

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${detail ? "  -> " + detail : ""}`);
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* ---------------------------------- 1. traceability */
const sha = p => crypto.createHash("sha256").update(readFileSync(p)).digest("hex");
for (const [f, want] of Object.entries(DATA.meta.generated_from.sha256)) {
  const got = sha(path.join(ROOT, "data/audited", f));
  check(`input hash recorded & matches: ${f}`, got === want, got.slice(0, 16) + "…");
}
for (const [rel, want] of Object.entries(DATA.meta.generated_from.evidence || {})) {
  check(`evidence hash still valid: ${path.basename(rel)}`, sha(path.join(ROOT, rel)) === want);
}
for (const l of DATA.literature) {
  check(`literature record hash valid: ${l.key}`, sha(path.join(ROOT, l.record_file)) === l.record_sha256);
}

/* ---------------------------------- 2. identities (shared with the browser) */
const problems = D.consistencyReport(DATA);
check("all arithmetic identities hold (consistencyReport)", problems.length === 0, problems.join(" | "));

/* ---------------------------------- 3. audited values, field by field */
const audited = JSON.parse(readFileSync(path.join(ROOT, "data/audited/gate2_results.json"), "utf8"));
const ds = JSON.parse(readFileSync(path.join(ROOT, "data/audited/dataset.json"), "utf8"));
for (const g of audited.groups.filter(x => x.group_id === "male" || x.group_id === "female")) {
  const gid = g.group_id;
  for (const [k, field] of [["paid", "paid_min"], ["unpaid", "unpaid_min"], ["discretionary", "discretionary_min"]]) {
    check(`${gid}.${k} == gate2.${field}`,
      near(DATA.groups[gid][k].all_resident_mean_min, g[field], 5e-4),
      `${DATA.groups[gid][k].all_resident_mean_min} vs ${g[field]}`);
  }
  check(`${gid}.total_labor == gate2`, near(DATA.totals[`${gid}_total`], g.total_labor_min, 5e-4));
}
for (const [k, v] of Object.entries(audited.contrasts.female_minus_male)) {
  if (k in DATA.gaps) check(`gaps.${k} == gate2 contrast`, near(DATA.gaps[k], v, 5e-4), `${DATA.gaps[k]} vs ${v}`);
}
for (const aid of ["paid", "unpaid", "discretionary"]) {
  const a = audited.gender_gap_decomposition_noncausal[aid], b = DATA.decomposition[aid];
  check(`decomposition.${aid}.participation == gate2`, near(a.participation_margin_min, b.participation_term_min, 1e-9));
  check(`decomposition.${aid}.duration == gate2`, near(a.participant_duration_margin_min, b.duration_term_min, 1e-9));
}
// published precision: rates to 0.1pp, participant means to whole minutes — never invent extra precision
for (const gid of ["male", "female"]) for (const aid of ["paid", "unpaid", "discretionary"]) {
  const src = ds.records.find(r => r.group_id === gid && r.activity_id === aid);
  const ui = DATA.groups[gid][aid];
  check(`${gid}/${aid} rate & participant mean are the published values`,
    src.participation_rate_pct === ui.participation_rate_pct && src.participant_mean_min === ui.participant_mean_min,
    `${ui.participation_rate_pct}% / ${ui.participant_mean_min} min`);
  check(`${gid}/${aid} labelled as derived, not published`, ui.value_kind === "derived_from_published_p_and_t");
}

/* ---------------------------------- 4. every interactive state */
const states = D.stateManifest(DATA);
const expect = {
  "act1:paid":  { deltaText: D.signed1(DATA.gaps.paid), verdict: "▼ 男性更长" },
  "act1:both":  { deltaText: D.signed1(DATA.gaps.total), verdict: "▲ 女性更长" },
};
for (const [id, want] of Object.entries(expect)) {
  const s = states[id];
  check(`state ${id}: readout + verdict label`, s.deltaText === want.deltaText && s.verdict === want.verdict,
    `${s.deltaText} ${s.verdict}`);
}
check("state act1:paid bars exclude unpaid", states["act1:paid"] && D.scopeBars(DATA, D.scopeProgress("paid"))
  .every(r => r.segments[1].value === 0 && r.segments[1].included === false));
const barsBoth = D.scopeBars(DATA, D.scopeProgress("both"));
check("state act1:both bars include unpaid and total = paid+unpaid",
  barsBoth.every(r => near(r.total, r.segments[0].full + r.segments[1].full, 5e-4)));
check("Act I scale stays fixed 0..360 in both states",
  D.MAX_MIN === 360 && barsBoth.every(r => r.total <= D.MAX_MIN));

const bs = D.bridgeStages(DATA);
check("bridge stage 1 = paid gap", bs[0].to === DATA.gaps.paid && bs[0].valueText === D.signed1(DATA.gaps.paid));
check("bridge stage 2 spans paid -> total", bs[1].from === DATA.gaps.paid && bs[1].to === DATA.gaps.total);
check("bridge stage 3 shows the total with the reversal direction",
  bs[2].to === DATA.gaps.total && bs[2].direction === "女性更长" && bs[0].direction === "男性更长");
check("bridge segments sum to the total gap",
  near((bs[0].to - bs[0].from) + (bs[1].to - bs[1].from), DATA.gaps.total, 1e-9));
check("bridge fits its fixed diverging scale",
  bs.every(s => Math.abs(s.to) <= D.BRIDGE_EXTENT && Math.abs(s.from) <= D.BRIDGE_EXTENT));

for (const aid of ["paid", "unpaid", "discretionary"]) {
  const c = states[`act3:${aid}`], dv = states[`decomp:${aid}`];
  check(`act3:${aid} p×t formula renders and matches the derived mean`,
    c.rows.every(r => near(r.productCheck, r.all_resident_mean_min, 1e-3)));
  check(`act3:${aid} gap label agrees with the mean difference`,
    near(c.gap_min, DATA.groups.female[aid].all_resident_mean_min - DATA.groups.male[aid].all_resident_mean_min, 1e-9));
  check(`decomp:${aid} two terms are the only terms and carry signs`,
    dv.terms.length === 2 && dv.terms.every(t => typeof t.value === "number" && Math.abs(t.value) > 1e-9));
  check(`decomp:${aid} display sum note is honest (≤0.1 min)`, Math.abs(dv.displayRoundingDelta) <= 0.1,
    `${dv.termsSumText} vs ${dv.gapText}`);
  check(`decomp:${aid} terms fit the fixed term scale`,
    dv.terms.every(t => Math.abs(t.value) <= D.TERM_EXTENT) && Math.abs(dv.gap) <= D.TERM_EXTENT);
}

/* ---------------------------------- 5. official definitions & citations are verbatim from evidence */
const dfns = DATA.definitions;
check("unpaid definition is the bulletin note [8] sentence",
  dfns.unpaid_definition.text.startsWith("无酬劳动领域包括") ||
  /\[8\]\s*无酬劳动领域包括/.test(dfns.unpaid_definition.text));
for (const [k, v] of Object.entries(dfns)) {
  check(`definition ${k} carries url + snapshot hash`, /^https:\/\/www\.stats\.gov\.cn\//.test(v.source_url) && /^[0-9a-f]{64}$/.test(v.source_sha256));
}
check("unpaid definition is not reduced to housework (mentions 家务 AND 照料 AND 购买)",
  ["家务劳动", "陪伴照料家人", "购买商品或服务"].every(s => dfns.unpaid_definition.text.includes(s)));
check("unpaid definition includes 无酬实习 / 公益志愿",
  dfns.unpaid_definition.text.includes("无酬实习") && dfns.unpaid_definition.text.includes("公益志愿"));
check("paid definition excludes unpaid internship (official wording)",
  /除无酬实习/.test(dfns.paid_definition.text));
check("weighting note is the 5/7 + 2/7 sentence", dfns.week_weighting.text.includes("5/7") && dfns.week_weighting.text.includes("2/7"));
check("6—15 paid caution recorded", dfns.age_paid_caution.text.includes("6—15周岁居民无有酬劳动领域活动"));
check("three theory lenses all resolve a Crossref citation",
  ["eagly_wood_2016", "daminger_2019", "giurge_whillans_west_2020"]
    .every(k => { const l = D.lensView(DATA, k).citation; return l.title && l.authors && l.year && /^https:\/\/doi\.org\//.test(l.url); }));

/* ---------------------------------- 6. governance: UI must not hard-code core numbers */
const scan = ["index.html", "main.js", "js/bars.js", "js/bridge.js", "js/composition.js", "js/lenses.js",
              "js/dossier.js", "js/nav.js", "styles.css"];
const coreNumbers = ["243.2", "169.3", "75.6", "175.4", "318.8", "344.7", "73.9", "99.8", "25.9", "47.4", "26.4", "73.4", "26.3"];
let hard = [];
for (const f of scan) {
  const p = path.join(ROOT, f);
  try {
    const txt = readFileSync(p, "utf8");
    // numbers inside data-derived template strings are fine; literal occurrences in markup/logic are not,
    // except in the generated <noscript> block, which build_data_layer.py rewrites from the data layer.
    const stripped = txt.replace(/<!--\s*BEGIN:NOJS\s*-->([\s\S]*?)<!--\s*END:NOJS\s*-->/g, "");
    for (const n of coreNumbers) {
      const re = new RegExp(`(?<![0-9.\\-])${n.replace(".", "\\.")}(?![0-9])`);
      if (re.test(stripped)) hard.push(`${f}: ${n}`);
    }
  } catch { /* file may not exist yet in partial builds */ }
}
check("no core statistic is hard-coded in UI code (outside the generated no-JS block)",
  hard.length === 0, hard.join(", "));

/* ---------------------------------- 6b. D1.1 editorial & source-mapping gates */
{
  const read = f => { try { return readFileSync(path.join(ROOT, f), "utf8"); } catch { return ""; } };
  const pageRaw = read("index.html");
  // prose checks run on tag-stripped text: <strong> inside a sentence must not break a match
  const page = pageRaw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
  const pubMd = read("docs/RESEARCH_MANUSCRIPT_PUBLIC.md");
  const origMd = read("docs/internal/RESEARCH_MANUSCRIPT_ORIGINAL.md");
  const erratumMd = read("docs/ERRATA_AND_EDITS.md");
  const reportHtml = read("report/index.html");

  // D3: the upstream manuscript keeps its internal workflow note, so it is preserved
  // for the audit trail but NOT published; the public erratum replaces every link to it.
  check("D3 the upstream manuscript copy is NOT edited (still shows its own label)",
    /Research Director/.test(origMd) && origMd.length > 4000, "internal copy preserved, unedited");
  check("D3 the unpublished original is absent from the published docs tree",
    !existsSync(path.join(ROOT, "docs/RESEARCH_MANUSCRIPT_ORIGINAL.md")),
    "only docs/internal/ holds it");
  check("D3 the public erratum records both edits and the original hash",
    /不随站点发布/.test(erratumMd) && /[0-9a-f]{64}/.test(erratumMd)
    && /t20241031_1957215/.test(erratumMd) && !/Research Director/.test(erratumMd),
    `${erratumMd.length} bytes`);
  check("D3 no public file links to the unpublished manuscript",
    !pageRaw.includes("RESEARCH_MANUSCRIPT_ORIGINAL") && !reportHtml.includes("RESEARCH_MANUSCRIPT_ORIGINAL")
    && !pubMd.includes("RESEARCH_MANUSCRIPT_ORIGINAL"), "");

  // P0-1 第三号 must be paired with the bulletin page, and the 2025 topic page must be
  // a separate supplementary entry — in the markdown, the rendered report and the page.
  const B3 = "t20241031_1957215.html", TOPIC = "t20250127_1958534.html";
  // only reference-list lines carry a URL; prose that merely names 第三号 is not a mapping
  const thirdLines = pubMd.split("\n").filter(l => l.includes("第三号") && /https?:\/\//.test(l));
  check("P0-1 public report pairs 第三号 with the bulletin page",
    thirdLines.length > 0 && thirdLines.every(l => l.includes(B3)) &&
    !thirdLines.some(l => l.includes(TOPIC)), thirdLines.map(l => l.slice(-30)).join(" | "));
  check("P0-1 the 2025 topic page survives as a supplementary entry, mentioned once as such",
    pubMd.split(TOPIC).length - 1 === 1 && /补充核对入口/.test(pubMd),
    `occurrences=${pubMd.split(TOPIC).length - 1}`);
  check("P0-1 rendered report HTML carries the corrected link",
    reportHtml.includes(B3) && !new RegExp("第三号[^<]*</a>[^)]*" + TOPIC).test(reportHtml));
  check("P0-1 the upstream manuscript copy is NOT edited (still shows its own label)",
    origMd.includes(TOPIC) && origMd.includes("公报（第三号）"), "original preserved for the audit trail");

  // P0-2 the Act II caption must describe the axis the chart actually uses
  check("P0-2 Act II caption describes the horizontal difference axis",
    /横轴表示女性 − 男性的时间差/.test(page) && /纵向排列的是同一条加法的三个步骤/.test(page)
    && !/纵轴为差值方向/.test(page), "");
  check("P0-2 caption states the fixed scale and denies a time/causal reading",
    /−105 至 \+105 分钟\/天/.test(page) && /不是时间顺序/.test(page), "");

  // P0-3 no project-process language on the public pages
  for (const word of ["移交", "裁定", "审查者", "未并入正式网站", "未合并入", "内部流程", "工单",
                      "Agent", "执行侧", "本轮"]) {
    const hits = [...page.matchAll(new RegExp(word, "g"))].length
      + [...reportHtml.matchAll(new RegExp(word, "g"))].length;
    check(`P0-3 public pages never say "${word}"`, hits === 0, `${hits} occurrence(s)`);
  }
  check("P0-3 the governance record moved to docs instead",
    read("docs/CHANGELOG_FROM_D0_1.md").includes("7f6f8dc0")
    && read("docs/REPORT_BUILD_LOG.txt").includes("EDIT 2"), "");
  // the snapshot rows are rendered by js/dossier.js, so read that too
  const dossierJs = read("js/dossier.js");
  check("P0-3 provenance detail stays available to readers (snapshots + hashes)",
    /抓取快照/.test(page + dossierJs) && /SHA-256/.test(page + dossierJs), "");

  // P0-4 theory wording precision
  check("P0-4 cognitive labour is framed as a dimension of household labour",
    /家庭劳动的一个维度/.test(page) && !/另一类活动(?!,)/.test(page.replace(
      /不是与家务并列的另一类活动，而是家庭劳动的一个维度/, "")), "");
  check("P0-4 role theory is hedged and marked unverified by this survey",
    /可能与劳动分配相关/.test(page) && /不能把该理论当作已识别的因果解释/.test(page), "");
  check("D2 the perspective article is used only for the construct distinction",
    /Perspective（观点文章）/.test(page) && /未在本包内逐字核对/.test(page), "");
  check("D2 the superseded 'Review' classification is gone from the public page",
    !/综述（Review）/.test(page) && !/综述文章（Review）/.test(page)
    && !/Review（综述/.test(page), "");
  { // the publisher record governs; the two secondary signals stay on file
    let pub = null, s2 = null;
    try { pub = JSON.parse(readFileSync(path.join(ROOT, "evidence/literature/nature_article_type.json"), "utf8")); } catch { pub = null; }
    try { s2 = JSON.parse(readFileSync(path.join(ROOT, "evidence/literature/s2_giurge.json"), "utf8")); } catch { s2 = null; }
    check("D2 publisher snapshot shows the Perspective column above the title",
      !!pub && /^Perspective\s+Published:/.test(pub.headerBlock || "")
      && pub.httpStatus === 200 && (pub.dcType || [])[0] === "ReviewPaper",
      pub ? `${(pub.headerBlock || "").slice(0, 12)} / dc.type=${(pub.dcType || [])[0]}` : "missing");
    check("D2 Semantic Scholar's diverging 'Review' label is retained for traceability only",
      !!s2 && (s2.publicationTypes || []).includes("Review"), s2 ? (s2.publicationTypes || []).join(",") : "missing");
    const lit = DATA.literature.find(l => l.key === "giurge_whillans_west_2020");
    check("D2 data layer carries the publisher-authoritative article type",
      !!lit && lit.article_type === "Perspective"
      && lit.article_type_evidence.authority === "publisher"
      && lit.article_type_evidence.publisher_meta_dc_type === "ReviewPaper"
      && (lit.article_type_evidence.secondary_semantic_scholar || []).includes("Review"),
      lit ? lit.article_type : "missing");
    check("D2 the other two records keep Crossref-derived types",
      DATA.literature.filter(l => l.key !== "giurge_whillans_west_2020")
        .every(l => l.article_type && l.article_type_evidence.authority === "crossref"),
      DATA.literature.map(l => `${l.key}:${l.article_type}`).join(", "));
  }
  check("P0-4 Daminger sample described as 35 couples / 70 interviews",
    /35 对伴侣共 70 次深度访谈/.test(page) && !/35 名受访者/.test(page), "");
  check("P0-4 each theory separates four things",
    ["理论提出", "本次调查实际测到", "现有数据还不能证明", "如果要检验它"]
      .every(h => (page.match(new RegExp(h, "g")) || []).length >= 2), "");
}

/* ---------------------------------- 7. governance: prose must stay non-causal */
let idx = "";
try { idx = readFileSync(path.join(ROOT, "index.html"), "utf8"); } catch { idx = ""; }
if (idx) {
  const NEGATION = /不|无|没有|非|未|禁止|只能|仅|避免|而非/;
  // must never appear at all, even in negation
  for (const word of ["全部工作时间", "所有工作的时间", "证明了", "显著相关"]) {
    const hits = [...idx.matchAll(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))].length;
    check(`forbidden framing absent: "${word}"`, hits === 0, `${hits} occurrence(s)`);
  }
  { // any p-value notation at all would be an unsupported inference claim
    const pvals = [...idx.matchAll(/p\s*[<>=]\s*0?\.\d+/gi)];
    check("no p-values reported", pvals.length === 0, pvals.map(m => m[0]).join(", "));
    const stars = [...idx.matchAll(/\*\*?\s*(显著|p\s*[<>=])/g)];
    check("no significance stars", stars.length === 0, stars.map(m => m[0]).join(", "));
  }
  // causal / inferential vocabulary is only acceptable inside an explicit negation or a
  // quoted-then-refuted claim ("不能推断「性别本身造成了这一差异」")
  for (const word of ["造成了", "导致了", "置信区间", "显著"]) {
    const spots = [...idx.matchAll(new RegExp(word, "g"))]
      .map(m => idx.slice(Math.max(0, m.index - 90), m.index + 40));
    const unguarded = spots.filter(s => !NEGATION.test(s));
    check(`"${word}" only inside negations/quoted claims (${spots.length} total)`,
      unguarded.length === 0, unguarded[0] ? unguarded[0].replace(/\s+/g, " ").slice(-90) : "");
  }
  check("no-JS fallback numbers are generated from the data layer",
    idx.includes("BEGIN:NOJS") &&
    idx.match(/BEGIN:NOJS[\s\S]*?END:NOJS/)[0].includes(D.fmt1(DATA.groups.male.paid.all_resident_mean_min)));
} else {
  console.log("[SKIP] prose audit — index.html not built yet");
}

/* ---------------------------------- 7. official English renderings are faithful
 * Every line in locales/official-quotes-en.js is presented to readers as OUR TRANSLATION of a
 * quoted official Chinese footnote, so it has to carry the whole information content of that
 * footnote. An English rendering that quietly drops a clause (or adds a fact the original does
 * not state, e.g. a field date) is a misattribution to the National Bureau of Statistics.
 * The required-token lists below are read off the Chinese originals in DATA.definitions. */
{
  const { OFFICIAL_EN, TRANSLATION_NOTE } = await import(
    pathToFileURL(path.join(ROOT, "locales/official-quotes-en.js")).href);
  const REQ = {
    unpaid_definition: ["[8]", "housework", "caring for family", "buying goods or services",
      "unpaid internship", "voluntary work", "social interaction"],
    paid_definition: ["[7]", "employment activity", "except unpaid internship"],
    discretionary_definition: ["[9]", "exercise and fitness", "leisure and entertainment",
      "social interaction", "except voluntary work"],
    week_weighting: ["diary table 1", "diary table 2", "5/7", "2/7", "participants",
      "participation rate"],
    six_domains: ["six", "personal necessities", "paid work", "unpaid work", "discretionary",
      "education and training", "transport"],
    sample_scope: ["sampled households", "aged 6 and over", "38,500", "107,000", "53,000",
      "54,000", "64,000", "43,000", "urban", "rural"],
    age_paid_caution: ["[1]", "6-15", "no activities", "paid-work"],
  };
  const zhKeys = Object.keys(DATA.definitions);
  check("official English renderings exist for exactly the quoted Chinese originals",
    JSON.stringify(Object.keys(OFFICIAL_EN).sort()) === JSON.stringify(zhKeys.sort()),
    Object.keys(OFFICIAL_EN).join(", "));
  for (const [key, tokens] of Object.entries(REQ)) {
    const en = String(OFFICIAL_EN[key] || "");
    const missing = tokens.filter(t => !en.toLowerCase().includes(t.toLowerCase()));
    check(`English rendering carries the ${key} original's information (${tokens.length} tokens)`,
      en.length > 0 && missing.length === 0, missing.length ? "missing: " + missing.join(", ") : "");
  }
  // the sample-scope footnote states no dates; a date inside its translation would be
  // attributed to the bulletin. The field period still appears in our own prose (checked below).
  check("sample_scope translation states no survey date",
    !/20\d{2}|\bMay\b|\bJune\b|field period|11\s*[–-]\s*31/i.test(OFFICIAL_EN.sample_scope),
    OFFICIAL_EN.sample_scope.slice(0, 60) + "…");
  check("the field period is still stated in our own (non-quoted) copy",
    /11.31 May 2024|May 2024/.test(readFileSync(path.join(ROOT, "locales/en.js"), "utf8")), "");
  check("the Chinese originals keep the numbers the translation must carry",
    ["3.85", "10.7", "5.3", "5.4", "6.4", "4.3"].every(n => DATA.definitions.sample_scope.text.includes(n)),
    DATA.definitions.sample_scope.text.slice(0, 24) + "…");
  check("the translator-attribute note is present in both languages",
    /译文/.test(TRANSLATION_NOTE.zh) && /our translation/i.test(TRANSLATION_NOTE.en), "");
  // no build-time placeholder may be authored into a shipped page either
  for (const f of ["index.html", "en/index.html"]) {
    const t = existsSync(path.join(ROOT, f)) ? readFileSync(path.join(ROOT, f), "utf8") : "";
    if (f === "en/index.html") {
      check("en/index.html keeps the #pack-sha marker as a placeholder (injected at integration)",
        /id="pack-sha"/.test(t), "");
    }
  }
}

/* ---------------------------------- 8. no published file promises something undeliverable
 * A research page that names a data file the reader cannot download is a false claim about the
 * artifact, in the same family as an unreplaced build placeholder. Two checks:
 *   (a) the withdrawn CSV name may appear only in the erratum, and only where it is described
 *       as never delivered;
 *   (b) every file name quoted inside the two public manuscripts' verification sentence must
 *       exist either in this tree or in the reproduction pack that is built from it. */
{
  const withdrawn = "time_budget_by_group";
  const published = ["index.html", "en/index.html", "report/index.html", "en/report/index.html",
    "docs/RESEARCH_MANUSCRIPT_PUBLIC.md", "docs/RESEARCH_MANUSCRIPT_PUBLIC_EN.md",
    "docs/LITERATURE_EVIDENCE_MAP.md", "data/time-use-data.js", "main.js", "README.md"].filter(existsSync);
  for (const f of published) {
    const t = readFileSync(path.join(ROOT, f), "utf8");
    check(`published file never promises ${withdrawn}.csv  (${f})`, !t.includes(withdrawn), "");
  }
  if (existsSync(path.join(ROOT, "docs/ERRATA_AND_EDITS.md"))) {
    const err = readFileSync(path.join(ROOT, "docs/ERRATA_AND_EDITS.md"), "utf8");
    // the name may appear in the erratum, but only inside EDIT 4, which has to state plainly that
    // the file never existed. Anywhere else in the published tree it would be a live promise.
    const before = err.split("## 编辑 4")[0];
    const section = (err.split("## 编辑 4")[1] || "").split("\n## ")[0];
    check("the erratum confines the withdrawn CSV to the edit that revokes it",
      section.includes(withdrawn) && /从未存在/.test(section) && /不再承诺/.test(section)
      && !before.includes(withdrawn),
      `section=${section.includes(withdrawn)} never existed=${/从未存在/.test(section)} `
      + `revoked=${/不再承诺/.test(section)} elsewhere=${before.includes(withdrawn)}`);
  }
  // (b) the names quoted in the verification sentence must resolve
  const md = existsSync(path.join(ROOT, "docs/RESEARCH_MANUSCRIPT_PUBLIC.md"))
    ? readFileSync(path.join(ROOT, "docs/RESEARCH_MANUSCRIPT_PUBLIC.md"), "utf8") : "";
  const sentence = (md.split("\n").find(l => l.includes("为保证复核")) || "");
  const quoted = [...sentence.matchAll(/`([^`]+\.(?:json|js|mjs|py|csv|md|txt))`/g)].map(m => m[1]);
  const packRoot = path.join(ROOT, "..", "pack_staging", "research-pack");
  const resolves = (name) => {
    const c = name.replace(/^tools\//, "");
    return [path.join(ROOT, name), path.join(ROOT, "data", name),
      path.join(ROOT, "data", "audited", name), path.join(ROOT, "tools", c),
      path.join(packRoot, name), path.join(packRoot, "data", name),
      path.join(packRoot, "data", "audited", name), path.join(packRoot, "tools", c),
      path.join(packRoot, "tools", "maintainer", name.replace(/^tools\//, ""))]
      .some(p => existsSync(p));
  };
  check("the verification sentence quotes only files that exist",
    quoted.length >= 4 && quoted.every(resolves),
    quoted.filter(p => !resolves(p)).join(", ") || `${quoted.length} names`);
  check("no unreplaced build-time placeholder in published HTML",
    (() => {
      // In the story tree the marker is still a marker: integration fills it later, and the
      // integration script refuses to publish one that survived. What must hold HERE is that the
      // placeholder phrase can only ever occur inside the #pack-sha element - anywhere else on a
      // page it would be a reader-visible lie with nothing scheduled to replace it.
      const rx = /<span class="fine" id="pack-sha">[\s\S]*?<\/span>/g;
      for (const f of ["index.html", "en/index.html", "report/index.html", "en/report/index.html"]) {
        if (!existsSync(path.join(ROOT, f))) continue;
        const t = readFileSync(path.join(ROOT, f), "utf8");
        const allowed = (t.match(rx) || []).join("\n");
        const stripped = t.replace(rx, "");
        if (/injected at build time|由构建注入|待构建注入/.test(stripped)) return false;
        if (f === "en/index.html" && !/(injected at build time|由构建注入)/.test(allowed)) return false;
      }
      return true;
    })(),
    "the placeholder phrase may live only inside #pack-sha, and only before integration fills it");
}

/* ---------------------------------- 9. every path a public document points a reader at resolves
 * Extended from EDIT 4: a name inside backticks that looks like a repo path is a promise the
 * published tree has to keep. Scope is the four reader-facing documents plus the erratum -
 * deliberately NOT data/time-use-data.js, js/dossier.js and the study pages, where evidence/nbs/…
 * strings are provenance identifiers (the file a number was read from) and those pages already
 * disclose that the snapshots themselves are third-party content that is not distributed.
 * docs/internal/… is the one path a public document may name without shipping, and only where the
 * same sentence says it is not published - so that exemption is itself asserted, not assumed. */
{
  const PREFIX = "(?:data|docs|tools|js|locales|evidence|manifest|src|public)";
  const PATHRX = PREFIX + "/[A-Za-z0-9_.\\-/]+\\.(?:json|js|mjs|py|md|txt|html|csv)";
  const packRoot = path.join(ROOT, "..", "pack_staging", "research-pack");
  const resolves = (name) => {
    const collapsed = name.replace(/^tools\/maintainer\//, "tools/");   // story layout
    return [ROOT, packRoot].some(base => [name, collapsed]
      .some(n => existsSync(path.join(base, n))));
  };
  const docs = ["docs/ERRATA_AND_EDITS.md", "docs/RESEARCH_MANUSCRIPT_PUBLIC.md",
    "docs/RESEARCH_MANUSCRIPT_PUBLIC_EN.md", "report/index.html", "en/report/index.html"];
  const claims = [];
  for (const f of docs) {
    if (!existsSync(path.join(ROOT, f))) continue;
    const t = readFileSync(path.join(ROOT, f), "utf8");
    const rx = f.endsWith(".html")
      ? new RegExp("<code>(" + PATHRX + ")</code>", "g")
      : new RegExp("`(" + PATHRX + ")`", "g");
    for (const m of t.matchAll(rx)) {
      const name = m[1], i = m.index;
      // the sentence that carries the reference, not just the physical line: markdown wraps, and
      // an explanation may well sit on the line above the path it describes.
      const start = Math.max(0, t.lastIndexOf("\n", t.lastIndexOf("\n", i) - 1) + 1);
      const stop = t.indexOf("\n", i);
      const next = stop < 0 ? t.length : t.indexOf("\n", stop + 1);
      const ctx = t.slice(start, next < 0 ? t.length : next);
      if (name.startsWith("docs/internal/")) {
        check(`internal path named in ${f} is disclosed as unpublished`,
          /不随站点发布|not published with the site|不随站发布/.test(ctx), ctx.trim().slice(0, 70));
        continue;
      }
      claims.push([f, name, resolves(name)]);
    }
  }
  const missing = claims.filter(c => !c[2]);
  check("every pack path quoted in a public document resolves to a shipped file",
    claims.length >= 8 && missing.length === 0,
    missing.map(m => `${m[0]} -> ${m[1]}`).join(", ") || `${claims.length} path references checked`);
}

console.log(`\n${results.filter(r => r.ok).length}/${results.length} passed`);
const failed = results.filter(r => !r.ok);
if (failed.length) { console.log("FAILED: " + failed.map(f => f.name).join(" | ")); process.exit(1); }
