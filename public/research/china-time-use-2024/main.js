/* main.js — story orchestration, shared verbatim by the Chinese and English pages.
 * Contains no statistics: every value is read from ./data/time-use-data.js and every
 * label from ./js/derive.js, so the browser and `node tools/qa_data.mjs` agree by
 * construction. Contains no display text either: the language is chosen by the page
 * (<html data-locale>) and every string is resolved through ./js/i18n.js.
 */
import { DATA } from "./data/time-use-data.js";
import { setLocale, detectLocale, T, L, isEN } from "./js/i18n.js";
setLocale(detectLocale());                      // must run before any view function
import * as D from "./js/derive.js";
import { makeBars, renderDayStrip } from "./js/bars.js";
import { makeBridge } from "./js/bridge.js";
import { renderComposition, renderDecompositionTable } from "./js/composition.js";
import { makeDecomposition } from "./js/decomposition.js";
import { renderLenses, wireLensCompareToggle } from "./js/lenses.js";
import * as DOSSIER from "./js/dossier.js";
import { wireActRail } from "./js/nav.js";

const $ = sel => document.querySelector(sel);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const DUR = 420;
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);

const state = { scope: "paid", t: 0, anim: null, bridgeStage: 0, compAid: "paid" };

/* ============================ 0. prose number slots ============================ */
/* Chinese prose quotes the sample size in 万; English quotes the published rounded
 * figure with a thousands separator. Same underlying number, different convention. */
const wan = (v, dp) => (isEN() ? v.toLocaleString("en-US") : (v / 10000).toFixed(dp) + " 万");
const NUM = {
  sampleHouseholds: () => wan(DATA.meta.survey.sample_households, 2),
  samplePeople: () => wan(DATA.meta.survey.sample_people, 1),
  malePaid: () => D.fmt1(DATA.groups.male.paid.all_resident_mean_min),
  femalePaid: () => D.fmt1(DATA.groups.female.paid.all_resident_mean_min),
  maleUnpaid: () => D.fmt1(DATA.groups.male.unpaid.all_resident_mean_min),
  femaleUnpaid: () => D.fmt1(DATA.groups.female.unpaid.all_resident_mean_min),
  maleTotal: () => D.fmt1(DATA.totals.male_total),
  femaleTotal: () => D.fmt1(DATA.totals.female_total),
  paidGapSigned: () => D.signed1(DATA.gaps.paid),
  unpaidGapSigned: () => D.signed1(DATA.gaps.unpaid),
  totalGapSigned: () => D.signed1(DATA.gaps.total),
  paidGapAbs: () => D.fmt1(Math.abs(DATA.gaps.paid)),
  discGapAbs: () => D.fmt1(Math.abs(DATA.gaps.discretionary)),
  maleDisc: () => D.fmt1(DATA.groups.male.discretionary.all_resident_mean_min),
  femaleDisc: () => D.fmt1(DATA.groups.female.discretionary.all_resident_mean_min),
  paidPartTerm: () => D.signed1(DATA.decomposition.paid.participation_term_min),
  paidDurTerm: () => D.signed1(DATA.decomposition.paid.duration_term_min),
  paidTermsSumText: () => D.signed1(
    Math.round(DATA.decomposition.paid.participation_term_min * 10) / 10
    + Math.round(DATA.decomposition.paid.duration_term_min * 10) / 10),
  totalBoundLo: () => D.signed1(DATA.rounding_bounds.values.total_labor.published_rounding_only_lower_min),
  totalBoundHi: () => D.signed1(DATA.rounding_bounds.values.total_labor.published_rounding_only_upper_min),
};
function fillSlots(root = document) {
  let empty = 0;
  root.querySelectorAll("[data-num]").forEach(el => {
    const f = NUM[el.dataset.num];
    if (f) { el.textContent = f(); } else { el.classList.add("slot-missing"); empty += 1; }
  });
  return empty;
}

/* ============================ 1. Act I — scope toggle ============================ */
const bars = makeBars({ host: $("#chart"), frame: $("#chart-frame"), tooltip: $("#tooltip") });
const srStatus = document.createElement("p");
srStatus.className = "visually-hidden";
srStatus.setAttribute("role", "status");
srStatus.setAttribute("aria-live", "polite");
$("#state-note").appendChild(srStatus);

function drawActI() {
  bars.render(DATA, state.t, { scopeName: D.scopeView(DATA, state.scope).scopeName });
}
function applyScopeText() {
  const v = D.scopeView(DATA, state.scope);
  $("#delta-num").textContent = v.deltaText;
  $("#delta-who").textContent = v.verdict;
  $("#delta-box").classList.toggle("female-longer", v.verdictClass === "female-longer");
  $("#state-note-main").textContent = v.noteMain;
  $("#state-note-sub").textContent = v.noteSub;
  const lg = document.querySelector(".lg-unpaid");
  // state is carried by a text label, not by dimming the words below AA contrast
  lg.classList.toggle("is-excluded", v.legendUnpaidDimmed);
  $("#lg-unpaid-state").textContent = v.legendUnpaidState;
  srStatus.textContent = v.srAnnouncement;
  $("#chart-frame").dataset.scope = state.scope;
}
function setScope(mode, { animate = true } = {}) {
  state.scope = mode;
  applyScopeText();
  const from = state.t, to = D.scopeProgress(mode);
  const dur = reduceMotion.matches || !animate ? 0 : DUR;
  if (state.anim) cancelAnimationFrame(state.anim);
  if (dur === 0 || Math.abs(to - from) < 1e-6) { state.t = to; drawActI(); return; }
  const t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / dur);
    state.t = from + (to - from) * easeOutCubic(p);
    drawActI();
    state.anim = p < 1 ? requestAnimationFrame(step) : null;
  };
  state.anim = requestAnimationFrame(step);
}
document.querySelectorAll('input[name="scope"]').forEach(r =>
  r.addEventListener("change", () => setScope(r.value)));

/* ============================ 2. Act II — bridge ============================ */
const bridge = makeBridge({ host: $("#bridge"), readout: $("#bridge-readout") });
function setStage(id) {
  state.bridgeStage = id;
  bridge.render(DATA, id);
  document.querySelectorAll(".step-btn[data-stage]").forEach(b =>
    b.setAttribute("aria-pressed", String(Number(b.dataset.stage) === id)));
}
document.querySelectorAll(".step-btn[data-stage]").forEach(b =>
  b.addEventListener("click", () => setStage(Number(b.dataset.stage))));
$("#bridge-next").addEventListener("click", () => setStage((state.bridgeStage + 1) % 3));

/* ============================ 3. Act III — composition + decomposition ============================ */
const decomp = makeDecomposition({ host: $("#decomp-host") });
const tabs = [...document.querySelectorAll("#comp-tabs [role=tab]")];
function selectTab(aid, { focus = false } = {}) {
  state.compAid = aid;
  tabs.forEach(t => {
    const on = t.dataset.aid === aid;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
  });
  $("#comp-panel").setAttribute("aria-labelledby", `tab-${aid}`);
  renderComposition(DATA, aid, $("#comp-panel"));
  decomp.render(DATA, aid);   // the advanced view follows the tab, open or closed
}
tabs.forEach((t, i) => {
  t.tabIndex = i === 0 ? 0 : -1;
  t.addEventListener("click", () => selectTab(t.dataset.aid));
  t.addEventListener("keydown", e => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    selectTab(tabs[(i + dir + tabs.length) % tabs.length].dataset.aid, { focus: true });
  });
});

/* ============================ 4. Act IV — theory lenses ============================ */
const lensOut = renderLenses(DATA, $("#lens-grid"));
wireLensCompareToggle($("#lens-grid"), $("#lens-compare"));

/* ============================ 5. Act V — dossier ============================ */
DOSSIER.fillInlineSources(DATA, document);
DOSSIER.renderSourceChain(DATA, $("#source-chain"));
DOSSIER.renderPrecisionTable(DATA, $("#precision-body"));
DOSSIER.renderBoundsTable(DATA, $("#bounds-body"));
DOSSIER.renderScopeList(DATA, $("#scope-list"));
DOSSIER.renderFileList(DATA, $("#file-list"));
DOSSIER.renderCheckList(DATA, $("#check-list"));
renderDecompositionTable(DATA, $("#decomp-table-body"));
DOSSIER.renderVerbatim(DATA, document);
DOSSIER.fillSummary(DATA, $("#dossier-summary"));
L().act5 ? ($("#precision-note").textContent = L().act5.precisionNote) : ($("#precision-note").textContent = DATA.meta.precision_note);

/* runtime identity check: the same function tools/qa_data.mjs runs */
const problems = D.consistencyReport(DATA);
const audit = $("#audit-line");
audit.textContent = problems.length === 0
  ? T("act5.auditOk", { paid: D.signed1(DATA.gaps.paid), unpaid: D.signed1(DATA.gaps.unpaid),
                        total: D.signed1(DATA.gaps.total) })
  : T("act5.auditFail", { n: problems.length, list: problems.join(L().act5.joinList) });
audit.classList.toggle("is-fail", problems.length > 0);

/* ============================ 5b. language switch + share ==================== */
/* Both editions are complete, independently shareable pages. Switching keeps the act the
 * reader is in (the ids are identical in both languages); if the target has no such act
 * the browser simply lands at the top of the corresponding page. No redirect is ever
 * issued from the browser language — the reader chooses. */
function currentAct() {
  const cur = document.querySelector("#rail-current");
  return (cur && cur.dataset && cur.dataset.current) || (location.hash || "").replace("#", "");
}
function wireLangSwitch() {
  document.querySelectorAll("[data-lang-switch]").forEach(a => {
    const apply = () => {
      const base = a.dataset.langSwitch;                 // "../en/" or "../"
      a.href = base + (currentAct() ? "#" + currentAct() : "");
      a.setAttribute("aria-current", a.dataset.locale === i18nLocale() ? "true" : "false");
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    a.addEventListener("focus", apply);
  });
  document.querySelectorAll("[data-lang-home]").forEach(a => { a.href = a.dataset.langHome; });
}
function i18nLocale() { return document.documentElement.dataset.locale || "zh-CN"; }

function wireShare() {
  const btn = $("#share-btn");
  if (!btn) return;
  const status = document.createElement("span");
  status.className = "visually-hidden";
  status.setAttribute("role", "status");
  btn.insertAdjacentElement("afterend", status);
  btn.addEventListener("click", async () => {
    const canonical = document.querySelector('link[rel="canonical"]');
    const url = canonical ? canonical.href : location.href;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url); ok = true; }
    } catch { ok = false; }
    if (!ok && window.prompt) { ok = !!window.prompt(T("meta.share"), url); }
    status.textContent = ok ? T("meta.copied") : T("meta.copyFailed");
    btn.dataset.state = ok ? "copied" : "failed";
  });
}

/* ============================ 6. rail + resize ============================ */
wireActRail({ rail: $("#act-rail"), acts: [...document.querySelectorAll(".act")],
  progressBar: $("#rail-progress-bar"), currentLabel: $("#rail-current") });

/* The hero's entry point: bring the reader to the control and put the caret on it,
   so the first action is reachable from the first screen without hunting. */
$("#start-explore").addEventListener("click", () => {
  const behavior = reduceMotion.matches ? "auto" : "smooth";
  $("#scope-toggle").scrollIntoView({ behavior, block: "center" });
  const first = document.querySelector('input[name="scope"]');
  // focus after the scroll settles; smooth scroll + immediate focus would jump the page
  setTimeout(() => first.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 420);
});
renderDayStrip(DATA, $("#day-strip-host"));

const redraw = (opts = {}) => {
  bars.render(DATA, state.t, { scopeName: D.scopeView(DATA, state.scope).scopeName }, opts);
  bridge.render(DATA, state.bridgeStage);
  decomp.render(DATA, state.compAid);
};
const ro = new ResizeObserver(() => redraw({ skipIfSameSize: true }));
ro.observe($("#chart")); ro.observe($("#bridge")); ro.observe($("#decomp-host"));

/* ============================ 7. boot state ============================ */
fillSlots();
applyScopeText();
redraw();
selectTab("paid");
setStage(0);
setScope("paid", { animate: false });
wireLangSwitch();
wireShare();

// QA hook: the browser test asserts against these live values, not against screenshots.
window.__D1__ = {
  DATA, derive: D, state,
  snapshot() {
    return {
      scope: state.scope,
      scopeView: D.scopeView(DATA, state.scope),
      bars: D.scopeBars(DATA, state.t),
      bridgeStage: state.bridgeStage,
      bridge: D.bridgeStages(DATA)[state.bridgeStage],
      compAid: state.compAid,
      composition: D.compositionView(DATA, state.compAid),
      decomposition: D.decompositionView(DATA, state.compAid),
      consistencyProblems: problems,
      emptySlots: [...document.querySelectorAll("[data-num]")].filter(e => !e.textContent.trim()).length,
      missingSlots: [...document.querySelectorAll(".slot-missing")].length,
      lenses: lensOut,
    };
  },
};
