/* dossier.js — Act V: SourceFootnote, EvidenceAccordion content, ClaimLimitPair support.
 * Everything here is assembled from the data layer: URLs, verbatim official notes,
 * hashes, precision table, rounding-only bounds, scope list and the file manifest.
 * Display text comes from the active locale table; the official quotations stay in the
 * original Chinese, and the English edition adds a clearly labelled translation.
 */
import { fmt1, fmt3, pct1, signed1, dossierSummary } from "./derive.js";
import { T, L, isEN } from "./i18n.js";
import { fmt } from "./i18n.js";
import OFFICIAL_EN, { TRANSLATION_NOTE } from "../locales/official-quotes-en.js";

/* ---------------- SourceFootnote: label → link, used inline and in the chain ------ */
export function sourceFootnote(DATA, key) {
  const a = document.createElement("a");
  a.href = DATA.meta.source_urls[key];
  a.rel = "noopener";
  a.target = "_blank";
  const label = L().act5.sourceLabels[key] || DATA.meta.source_labels?.[key] || key;
  a.textContent = label;
  a.dataset.sourceKey = key;
  return a;
}

export function fillInlineSources(DATA, root) {
  root.querySelectorAll("[data-source]").forEach(slot => {
    slot.replaceWith(sourceFootnote(DATA, slot.dataset.source));
  });
}

/* ---------------- evidence chain list ---------------- */
const SNAPSHOT_FOR = {
  bulletin_1_overview: "evidence/nbs/nbs_1957217.html",
  bulletin_2_national: "evidence/nbs/nbs_1957216.html",
  bulletin_3_by_sex: "evidence/nbs/nbs_1957215.html",
  group_tables: "evidence/nbs/nbs_1958534.html",
};

export function renderSourceChain(DATA, host) {
  const ev = DATA.meta.generated_from.evidence || {};
  const keys = ["bulletin_1_overview", "bulletin_2_national", "bulletin_3_by_sex", "group_tables"];
  const supplies = L().act5.supplies;
  host.innerHTML = keys.map(k => {
    const snap = SNAPSHOT_FOR[k];
    const hash = ev[snap];
    return `<div class="src-item">
      <p class="src-role">${L().act5.sourceLabels[k]}</p>
      <p class="src-supply">${supplies[k]}</p>
      <p class="src-meta"><a href="${DATA.meta.source_urls[k]}" rel="noopener" target="_blank">${DATA.meta.source_urls[k]}</a><br>
        ${T("act5.snapshot", { snap })}${hash ? T("act5.snapshotHash", { hash: hash.slice(0, 16) }) : T("act5.snapshotNone")}</p>
    </div>`;
  }).join("");
  return host.querySelectorAll(".src-item").length;
}

/* ---------------- precision / formula table ---------------- */
export function renderPrecisionTable(DATA, tbody) {
  const lab = L().labels;
  const rows = [];
  for (const aid of ["paid", "unpaid", "discretionary"]) {
    for (const gid of ["male", "female"]) {
      const a = DATA.groups[gid][aid];
      rows.push(`<tr><th scope="row">${T("act5.precisionRow", { activity: lab[aid], group: lab[gid] })}</th>
        <td>${pct1(a.participation_rate_pct)}</td>
        <td>${a.participant_mean_min} ${T("units.min")}</td>
        <td class="derived">${fmt3(a.all_resident_mean_min)}</td>
        <td>${fmt1(a.all_resident_mean_min)}</td></tr>`);
    }
  }
  tbody.innerHTML = rows.join("");
  return rows.length;
}

export function renderBoundsTable(DATA, tbody) {
  const V = DATA.rounding_bounds.values;
  const names = L().act5.boundsRows;
  const rows = ["paid", "unpaid", "total_labor", "discretionary"].map(k => {
    const label = names[k];
    const v = V[k];
    if (!v) return "";
    return `<tr><th scope="row">${label}</th><td>${signed1(v.point_estimate_min)}</td>
      <td>${signed1(v.published_rounding_only_lower_min)}</td>
      <td>${signed1(v.published_rounding_only_upper_min)}</td></tr>`;
  });
  tbody.innerHTML = rows.filter(Boolean).join("");
  return rows.filter(Boolean).length;
}

/* ---------------- scope & limits list ---------------- */
export function renderScopeList(DATA, host) {
  const s = DATA.meta.survey;
  const [i0, i1, i2, i3, i4, i5, i6, i7] = L().act5.scopeItems;
  const joiner = L().act5.adjJoin;
  const items = [
    fmt(i0, { dates: s.field_dates }),
    fmt(i1, {
      age: s.age_scope,
      h: s.sample_households.toLocaleString("en-US"),
      p: s.sample_people.toLocaleString("en-US"),
      rounded: s.sample_counts_are_rounded_in_NBS_report ? T("act5.roundedYes") : "",
    }),
    fmt(i2, { days: s.diary_days, res: s.recording_resolution_minutes }),
    fmt(i3, { wd: s.week_weights.weekday, we: s.week_weights.weekend }),
    fmt(i4, { adj: DATA.scope.not_adjusted.map(x => ADJUSTMENT[x] || x).join(joiner) }),
    i5, i6, i7,
  ];
  host.innerHTML = items.map(t => `<li>${t}</li>`).join("");
  return items.length;
}

/* the survey's own "not adjusted for" list is Chinese in the data layer; the English
 * edition maps each term to its reviewed equivalent instead of leaving Chinese behind */
const ADJUSTMENT = {
  "年龄": "age", "就业": "employment status", "婚育": "marital and childbearing status",
  "家庭结构": "household structure",
};

export function renderFileList(DATA, host) {
  const g = DATA.meta.generated_from;
  const items = Object.entries(g.sha256).map(([f, h]) =>
    `<li><code>data/audited/${f}</code><br>SHA-256 <code>${h}</code></li>`);
  items.push(`<li>${T("act5.fileListData")}</li>`);
  items.push(`<li>${T("act5.fileListDocs")}</li>`);
  host.innerHTML = items.join("");
  return items.length;
}

export function renderCheckList(DATA, host) {
  const c = DATA.checks;
  const items = Object.entries(c).filter(([k]) => k !== "status").map(([k, v]) =>
    `<li><code>${k}</code> — ${CHECK_LABELS[isEN() ? "en" : "zh"][k] || v}</li>`);
  host.innerHTML = items.join("");
  return items.length;
}

/* the check names in the data layer are short Chinese descriptions; the English edition
 * ships a reviewed one-to-one rendering of the same six checks (keys are identical) */
const CHECK_LABELS = {
  zh: {},
  en: {
    bridge_identity: "paid gap + unpaid gap = combined gap (tol 1e-9)",
    total_identity: "paid + unpaid = total labour minutes for both sexes (tol 5e-4)",
    gate2_crosscheck: "all gaps match the audited contrast table (tol 5e-4)",
    derived_crosscheck: "rate/100 × participant mean = audited population average (tol 1e-3)",
    decomposition_crosscheck: "symmetric terms recomputed from p,t match the audited decomposition (tol 1e-3)",
    national_six_domain: "published national six-domain sum ≈ 1440 minutes (tol 3 min)",
  },
};

export function renderVerbatim(DATA, host) {
  const map = {
    "unpaid-def-quote": "unpaid_definition",
    "paid-def-quote": "paid_definition",
    "sample-quote": "sample_scope",
    "weight-quote": "week_weighting",
  };
  let n = 0;
  for (const [id, key] of Object.entries(map)) {
    const el = host.querySelector ? host.querySelector(`#${id}`) : document.getElementById(id);
    const q = DATA.definitions[key];
    if (!el || !q) continue;
    const cite = T("act5.verbatimCite", { label: q.source_label, url: q.source_url });
    if (isEN() && OFFICIAL_EN[key]) {
      el.innerHTML = `<span class="quote-original">${q.text}</span>`
        + `<cite class="fine">${cite}</cite>`
        + `<span class="quote-translation">${OFFICIAL_EN[key]}</span>`
        + `<span class="fine quote-note">${TRANSLATION_NOTE.en}</span>`;
      el.classList.add("has-translation");
    } else {
      el.innerHTML = `${q.text} <cite class="fine">${cite}</cite>`;
    }
    el.dataset.quoteKey = key;
    n += 1;
  }
  return n;
}

export function fillSummary(DATA, host) {
  host.textContent = dossierSummary(DATA);
  return host.textContent;
}
