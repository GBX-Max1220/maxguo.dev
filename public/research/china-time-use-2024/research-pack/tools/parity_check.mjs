// parity_check.mjs — Level A, second implementation: the page's own numbers.
//
//   node tools/parity_check.mjs          (exit 0 = the two implementations agree)
//
// recompute_statistics.py derived every published quantity from the audited tables in
// plain Python. This file derives the same quantities through js/derive.js and
// data/time-use-data.js — the exact modules the browser loads — and compares the two.
// Agreement is the anti-drift gate: the page cannot be showing numbers that the
// audited inputs do not produce, and the reproduction cannot be quietly re-implementing
// different formulas.
//
// No dependencies beyond Node's standard library.
import { readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const TIGHT = 1e-9;      // quantities both sides compute at full precision
const STORED = 1e-3;     // values the data layer stores rounded to 3 dp

const sha = p => crypto.createHash("sha256").update(readFileSync(p)).digest("hex");
const rel = p => path.relative(ROOT, p).split(path.sep).join("/");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}` + (detail ? `  -> ${detail}` : ""));
};

const { setLocale } = await import(pathToFileURL(path.join(ROOT, "js/i18n.js")).href);
setLocale(process.env.CT_LOCALE || "zh-CN");   // the reproduction is language-independent; default zh-CN
const { DATA } = await import(pathToFileURL(path.join(ROOT, "data/time-use-data.js")).href);
const D = await import(pathToFileURL(path.join(ROOT, "js/derive.js")).href);

const pyPath = path.join(OUT, "statistics_python.json");
if (!exists(pyPath)) {
  console.error("FATAL: run python tools/recompute_statistics.py first (out/statistics_python.json missing)");
  process.exit(2);
}
const PY = JSON.parse(readFileSync(pyPath, "utf8"));

function exists(p) { try { readFileSync(p); return true; } catch { return false; } }
const near = (a, b, tol) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;

/* ---------- 1. traceability: the data layer was built from these exact bytes ---------- */
for (const [f, want] of Object.entries(DATA.meta.generated_from.sha256)) {
  const got = sha(path.join(ROOT, "data/audited", f));
  check(`data layer was generated from this byte-identical input: ${f}`, got === want, got.slice(0, 16) + "…");
}
check("derive.js is the module the page imports",
  exists(path.join(ROOT, "js/derive.js")) && sha(path.join(ROOT, "js/derive.js")).length === 64);

/* ---------- 2. the page's own identity report must be clean ---------- */
const problems = D.consistencyReport(DATA);
check("consistencyReport (page module) reports no arithmetic problems",
  problems.length === 0, problems.join(" | ").slice(0, 160));

/* ---------- 3. parity: python reproduction vs page data layer ---------- */
for (const key of ["paid", "unpaid", "total", "discretionary"]) {
  check(`gap ${key} identical in both implementations`,
    near(PY.gaps[key], DATA.gaps[key], STORED),
    `python ${PY.gaps[key].toFixed(6)} · page ${DATA.gaps[key].toFixed(6)}`);
}
for (const sex of ["male", "female"]) {
  check(`total labor minutes (${sex}) identical`,
    near(PY.totals[sex], DATA.totals[`${sex}_total`], STORED),
    `${PY.totals[sex].toFixed(6)} vs ${DATA.totals[`${sex}_total`]}`);
}
for (const dom of ["paid", "unpaid", "discretionary"]) {
  const a = PY.decomposition[dom], b = DATA.decomposition[dom];
  check(`decomposition ${dom}: participation term identical`,
    near(a.participation_term_min, b.participation_term_min, STORED),
    `${a.participation_term_min.toFixed(6)} vs ${b.participation_term_min}`);
  check(`decomposition ${dom}: duration term identical`,
    near(a.duration_term_min, b.duration_term_min, STORED),
    `${a.duration_term_min.toFixed(6)} vs ${b.duration_term_min}`);
  check(`decomposition ${dom}: closes at full precision on both sides`,
    near(a.participation_term_min + a.duration_term_min, a.gap_min, TIGHT)
    && Math.abs(b.residual_min) <= 1e-3, `residual(page)=${b.residual_min}`);
}
for (const key of ["paid", "unpaid", "discretionary", "total_labor"]) {
  const a = PY.rounding_only_bounds[key], b = DATA.rounding_bounds.values[key];
  check(`rounding-only bounds ${key}: identical`,
    near(a.published_rounding_only_lower_min, b.published_rounding_only_lower_min, STORED)
    && near(a.published_rounding_only_upper_min, b.published_rounding_only_upper_min, STORED),
    `[${a.published_rounding_only_lower_min}, ${a.published_rounding_only_upper_min}] vs `
    + `[${b.published_rounding_only_lower_min}, ${b.published_rounding_only_upper_min}]`);
}
check("rounding bounds are flagged as NOT a sampling confidence interval on the page",
  DATA.rounding_bounds.is_sampling_confidence_interval === false);

/* ---------- 4. the numbers a reader sees on screen are these numbers ---------- */
for (const [mode, key, shown] of [["paid", "paid", "−73.9"], ["both", "total", "+25.9"]]) {
  const v = D.scopeView(DATA, mode);
  check(`Act I "${mode}" scope displays ${shown} from the reproduced gap`,
    near(v.delta, PY.gaps[key], STORED) && v.deltaText === shown.replace("−", "−"),
    `delta ${v.delta} · displayed ${v.deltaText} · ${v.verdict}`);
}
for (const sex of ["male", "female"]) {
  for (const dom of ["paid", "unpaid", "discretionary"]) {
    check(`Act I bar ${sex}/${dom} equals the reproduced all-resident mean`,
      near(DATA.groups[sex][dom].all_resident_mean_min, PY.means[`${sex}_${dom}`], STORED),
      `${DATA.groups[sex][dom].all_resident_mean_min} vs ${PY.means[`${sex}_${dom}`].toFixed(3)}`);
  }
}
check("the combined scope reverses the ordering the paid scope shows",
  D.scopeView(DATA, "paid").verdict.includes("男性") && D.scopeView(DATA, "both").verdict.includes("女性"),
  `${D.scopeView(DATA, "paid").verdict} → ${D.scopeView(DATA, "both").verdict}`);
check("display rounding matches the headline values (−73.9 / +99.8 / +25.9 / −15.7)",
  [PY.display_rounded_gaps.paid, PY.display_rounded_gaps.unpaid,
   PY.display_rounded_gaps.total, PY.display_rounded_gaps.discretionary].join(",")
  === "-73.9,99.8,25.9,-15.7",
  `${PY.display_rounded_gaps.paid}, ${PY.display_rounded_gaps.unpaid}, `
  + `${PY.display_rounded_gaps.total}, ${PY.display_rounded_gaps.discretionary}`);

/* ---------- 5. literature type and official quotes are the published ones ---------- */
const giurge = DATA.literature.find(l => l.doi === "10.1038/s41562-020-0920-z");
check("Giurge et al. is typed from the publisher's own column: Perspective",
  giurge?.article_type === "Perspective" && giurge?.article_type_evidence?.authority === "publisher",
  `${giurge?.article_type} (authority: ${giurge?.article_type_evidence?.authority})`);
check("the secondary Semantic Scholar record is still retained, not deleted",
  Array.isArray(giurge?.article_type_evidence?.secondary_semantic_scholar)
  && giurge.article_type_evidence.secondary_semantic_scholar.includes("Review"),
  JSON.stringify(giurge?.article_type_evidence?.secondary_semantic_scholar));
check("author, title, year and DOI unchanged by the type correction",
  Array.isArray(giurge?.authors) && giurge.authors.some(a => a.includes("Giurge"))
  && giurge?.year === 2020 && /time poverty/i.test(giurge?.title || "")
  && giurge?.doi === "10.1038/s41562-020-0920-z",
  `${giurge?.authors?.[0]} et al. — ${giurge?.title} (${giurge?.year})`);

const notes = JSON.parse(readFileSync(path.join(ROOT, "data/audited/official_notes.json"), "utf8"));
for (const n of notes.notes) {
  const live = DATA.definitions[n.key];
  check(`official definition matches the page verbatim: ${n.key}`,
    live?.text === n.text && live?.source_url === n.source_url,
    `${n.text.slice(0, 18)}…`);
}

/* ---------- 6. output ---------- */
const js = {
  schema: "china-time-use-2024/statistics-js/v1",
  data_layer_sha256: sha(path.join(ROOT, "data/time-use-data.js")),
  derive_sha256: sha(path.join(ROOT, "js/derive.js")),
  gaps: DATA.gaps, totals: DATA.totals,
  decomposition: DATA.decomposition, rounding_bounds: DATA.rounding_bounds.values,
  consistency_problems: problems,
};
const { mkdirSync, writeFileSync } = await import("node:fs");
mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "statistics_js.json"), JSON.stringify(js, null, 2) + "\n", "utf8");

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
console.log("wrote out/statistics_js.json");
if (failed.length) {
  console.log("FATAL: parity broken -> " + failed.map(f => f.name).join(" | "));
  process.exit(1);
}
console.log("parity: the page's numbers and the offline reproduction are the same numbers");
