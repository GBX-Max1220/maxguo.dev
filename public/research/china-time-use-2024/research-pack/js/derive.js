/* derive.js — pure state/value logic shared by the Chinese page, the English page,
 * tools/qa_data.mjs and the published reproduction pack.
 * Rules:
 *   - No literal statistics here. Every value comes from data/time-use-data.js.
 *   - No display text here either: every sentence comes from the active locale table
 *     (js/i18n.js -> locales/zh-CN.js | locales/en.js). Both languages therefore run the
 *     identical arithmetic, the identical scales and the identical state logic.
 *   - Every function is pure: (DATA, state) -> view model, so a Node run can assert the
 *     same numbers and the same labels that the browser shows, for every state.
 *   - Colour names are semantic keys ("paid"/"unpaid"), resolved in CSS/custom props.
 * Strings shown only as developer diagnostics (consistencyReport problem names) stay
 * language-neutral identifiers; they are never part of the reader-facing copy.
 */
import { T, L } from "./i18n.js";

export const MAX_MIN = 360;          // Act I fixed scale — never rescaled between scopes
export const TICK_STEP = 60;
export const PARTICIPANT_MAX = 420;  // participant-mean scale (404 is the largest published value)
export const PARTICIPANT_STEP = 60;
export const RATE_MAX = 100;         // participation-rate scale
export const BRIDGE_EXTENT = 105;    // diverging scale for the difference bridge (−105 … +105)
export const BRIDGE_STEP = 50;
export const TERM_EXTENT = 110;      // diverging scale for the decomposition terms
export const TERM_STEP = 25;

/* ------------------------------- formatting ------------------------------- */
export const fmt1 = v => (Math.round(v * 10) / 10).toFixed(1);
export const fmt3 = v => v.toFixed(3);
export const signed1 = v => (v < 0 ? "−" : "+") + fmt1(Math.abs(v));
export const pct1 = v => `${v.toFixed(1)}%`;

/* ======================= ACT I — scope toggle =========================== */
export const SCOPES = [{ id: "paid" }, { id: "both" }];
export const scopeLabel = mode => T(mode === "both" ? "act1.scopeBothName" : "act1.scopePaidName");
export const scopeSub = mode => T(mode === "both" ? "act1.scopeBothSub" : "act1.scopePaidSub");

/** Interpolation position of a discrete scope (0 = paid only, 1 = paid + unpaid). */
export const scopeProgress = mode => (mode === "both" ? 1 : 0);

/** Bar geometry for a scope. `t` is fractional only while the transition runs. */
export function scopeBars(DATA, t) {
  const lab = L().labels;
  return ["male", "female"].map(gid => {
    const g = DATA.groups[gid];
    const paid = g.paid.all_resident_mean_min;
    const unpaid = g.unpaid.all_resident_mean_min * t;
    return {
      gid,
      label: lab[gid],
      segments: [
        { aid: "paid", label: lab.paid, value: paid, full: g.paid.all_resident_mean_min,
          color: "paid", included: true, act: g.paid },
        { aid: "unpaid", label: lab.unpaid, value: unpaid,
          full: g.unpaid.all_resident_mean_min, color: "unpaid", included: t > 0.001, act: g.unpaid },
      ],
      total: paid + unpaid,
    };
  });
}

/** Headline readout + the sentences that must accompany each discrete state. */
export function scopeView(DATA, mode) {
  const G = DATA.gaps;
  const delta = mode === "both" ? G.total : G.paid;
  const femaleLonger = delta > 0;
  return {
    mode,
    scopeName: scopeLabel(mode),
    delta,
    deltaText: signed1(delta),
    verdict: femaleLonger ? T("act1.verdictFemale") : T("act1.verdictMale"),
    verdictClass: femaleLonger ? "female-longer" : "male-longer",
    noteMain: mode === "both"
      ? T("act1.noteBoth", { total: signed1(G.total) })
      : T("act1.notePaid", { paid: signed1(G.paid) }),
    noteSub: T("act1.noteSub"),
    srAnnouncement: mode === "both"
      ? T("act1.srBoth", { v: fmt1(G.total) })
      : T("act1.srPaid", { v: fmt1(Math.abs(G.paid)) }),
    legendUnpaidDimmed: mode !== "both",
    legendUnpaidState: mode === "both" ? T("act1.legendIncluded") : T("act1.legendExcluded"),
  };
}

/* ======================= ACT II — reversal bridge ======================= */
/**
 * Three readable steps of one arithmetic fact: the paid difference, the unpaid
 * difference added on top, and the resulting total. Waterfall geometry, so the
 * reader sees a single continuous sum — not "two conflicting datasets".
 */
export function bridgeStages(DATA) {
  const G = DATA.gaps;
  return [
    {
      id: 0,
      kicker: T("act2.kicker", { n: 1, what: T("act2.step1") }),
      from: 0, to: G.paid, color: "paid",
      term: T("act2.termPaid"),
      valueText: signed1(G.paid),
      direction: T("act2.directionMale"),
      running: G.paid,
      runningText: signed1(G.paid),
      note: T("act2.note1", { v: fmt1(Math.abs(G.paid)) }),
    },
    {
      id: 1,
      kicker: T("act2.kicker", { n: 2, what: T("act2.step2") }),
      from: G.paid, to: G.total, color: "unpaid",
      term: T("act2.termUnpaid"),
      valueText: signed1(G.unpaid),
      direction: T("act2.directionFemale"),
      running: G.total,
      runningText: signed1(G.total),
      note: T("act2.note2", { u: fmt1(G.unpaid), p: fmt1(Math.abs(G.paid)),
                              paid: signed1(G.paid), total: signed1(G.total) }),
    },
    {
      id: 2,
      kicker: T("act2.kicker", { n: 3, what: T("act2.step3") }),
      from: 0, to: G.total, color: "total",
      term: T("act2.termTotal"),
      valueText: signed1(G.total),
      direction: T("act2.directionFemale"),
      running: G.total,
      runningText: signed1(G.total),
      note: T("act2.note3", { m: fmt1(DATA.totals.male_total), f: fmt1(DATA.totals.female_total),
                              total: signed1(G.total) }),
    },
  ];
}

/** Bridge checks that must hold in every stage: the running sum is the total at the end. */
export function bridgeConsistency(DATA) {
  const G = DATA.gaps, st = bridgeStages(DATA);
  const problems = [];
  if (Math.abs(st[1].to - G.total) > 1e-9) problems.push("stage 2 does not end at the total gap");
  if (Math.abs((st[0].to - st[0].from) + (st[1].to - st[1].from) - G.total) > 1e-9) {
    problems.push("waterfall segments do not sum to the total gap");
  }
  if (st[2].to !== G.total) problems.push("stage 3 total mismatches gaps.total");
  if (Math.sign(G.paid) === Math.sign(G.total)) problems.push("no sign reversal between paid and total");
  return problems;
}

/* ==================== ACT III — composition of the average ============== */
export const COMPOSITION_TABS = [
  { aid: "paid" }, { aid: "unpaid" }, { aid: "discretionary", advanced: true },
];
export const compositionTabLabel = aid =>
  T(aid === "paid" ? "act3.tabPaid" : aid === "unpaid" ? "act3.tabUnpaid" : "act3.tabDisc");

export function compositionView(DATA, aid) {
  const lab = L().labels;
  const rows = ["male", "female"].map(gid => {
    const a = DATA.groups[gid][aid];
    const p = a.participation_rate_pct / 100;
    const product = p * a.participant_mean_min;
    return {
      gid, label: lab[gid],
      rate_pct: a.participation_rate_pct,
      participant_mean_min: a.participant_mean_min,
      all_resident_mean_min: a.all_resident_mean_min,
      formula: `${p.toFixed(3)} × ${a.participant_mean_min} = ${fmt1(product)}`,
      productCheck: product,
    };
  });
  const diff = rows[1].all_resident_mean_min - rows[0].all_resident_mean_min;
  return {
    aid,
    label: lab[aid],
    rows,
    gap_min: Math.round(diff * 1000) / 1000,
    gapText: signed1(diff),
    verdict: diff > 0 ? T("act3.verdictFemale") : T("act3.verdictMale"),
  };
}

/** Symmetric two-term identity: Δm = (pF−pM)(tF+tM)/2 + (tF−tM)(pF+pM)/2. */
export function decompositionView(DATA, aid) {
  const d = DATA.decomposition[aid];
  const lab = L().labels;
  const terms = [
    { key: "participation", label: T("act3.termParticipation"), sub: T("act3.formulaParticipation"), value: d.participation_term_min },
    { key: "duration", label: T("act3.termDuration"), sub: T("act3.formulaDuration"), value: d.duration_term_min },
  ];
  return {
    aid,
    label: lab[aid],
    terms,
    gap: d.gap_min,
    gapText: signed1(d.gap_min),
    termsSum: terms.reduce((s, x) => s + x.value, 0),
    termsSumText: signed1(terms.reduce((s, x) => s + fmt1f(x.value), 0)),
    residual: d.residual_min,
    displayRoundingDelta: Math.round((d.gap_min - terms.reduce((s, x) => s + fmt1f(x.value), 0)) * 10) / 10,
  };
}
const fmt1f = v => Math.round(v * 10) / 10;   // display-rounded term, used for the 0.1-min note

/* ========================= ACT IV — theory lenses ======================= */
/**
 * Lens content is editorial text (from the locale table); the citation strings are
 * generated from evidence/literature/*.json, and every numeric mention is resolved
 * through the data layer. `measured` states what THIS survey can actually speak to.
 */
export function lensView(DATA, key) {
  const lit = DATA.literature.find(l => l.key === key);
  if (!lit) throw new Error(`no literature record for lens ${key}`);
  const G = DATA.gaps;
  const evidence = {
    eagly_wood_2016: [
      { text: T("act4.evidenceRole", { paid: signed1(G.paid), unpaid: signed1(G.unpaid) }),
        state: T("act4.stateNotMeasured") },
    ],
    daminger_2019: [
      { text: T("act4.evidenceCognitive"), state: T("act4.stateNotMeasured") },
    ],
    giurge_whillans_west_2020: [
      { text: T("act4.evidenceTimePoverty", { v: signed1(G.discretionary) }),
        state: T("act4.stateNotMeasured") },
    ],
  };
  return {
    key,
    article_type: lit.article_type,
    article_type_evidence: lit.article_type_evidence,
    citation: {
      authors: lit.authors.join(L().act4.authorsJoin),
      year: lit.year,
      title: lit.title,                       // publisher titles are never translated
      venue: lit.venue,
      page: lit.page,
      volume: lit.volume,
      issue: lit.issue,
      doi: lit.doi,
      url: lit.url,
      landing_status: lit.landing_status,
      record_sha256: lit.record_sha256,
    },
    measured: evidence[key] || [],
  };
}

/* ===================== ACT V — dossier / claim pairs ==================== */
export function dossierSummary(DATA) {
  const G = DATA.gaps;
  return T("act5.summary", { paid: signed1(G.paid), unpaid: signed1(G.unpaid), total: signed1(G.total) });
}

/** Every identity the page relies on. Used by the browser audit line and by qa_data. */
export function consistencyReport(DATA) {
  const problems = [];
  const add = (ok, name) => { if (!ok) problems.push(name); };
  const G = DATA.gaps, T_ = DATA.totals;

  add(Math.abs(G.paid + G.unpaid - G.total) < 1e-9, "bridge identity paid+unpaid=total");
  add(Math.abs(G.total - (T_.female_total - T_.male_total)) < 1e-9, "combined gap = female total - male total");

  for (const gid of ["male", "female"]) {
    const g = DATA.groups[gid];
    const s = g.paid.all_resident_mean_min + g.unpaid.all_resident_mean_min;
    const want = gid === "male" ? T_.male_total : T_.female_total;
    add(Math.abs(s - want) < 5e-4, `${gid} total ${fmt3(s)} = ${fmt3(want)}`);
    for (const aid of ["paid", "unpaid", "discretionary"]) {
      const a = g[aid];
      add(Math.abs((a.participation_rate_pct / 100) * a.participant_mean_min - a.all_resident_mean_min) < 1e-3,
          `${gid}/${aid} p x t reconstruction`);
    }
  }

  for (const aid of ["paid", "unpaid", "discretionary"]) {
    const d = DATA.decomposition[aid];
    const pF = DATA.groups.female[aid].participation_rate_pct / 100;
    const pM = DATA.groups.male[aid].participation_rate_pct / 100;
    const tF = DATA.groups.female[aid].participant_mean_min;
    const tM = DATA.groups.male[aid].participant_mean_min;
    // exact, full-precision recompute straight from the published p and t
    const partTerm = (pF - pM) * (tF + tM) / 2;
    const durTerm = (tF - tM) * (pF + pM) / 2;
    add(Math.abs(partTerm + durTerm - (pF * tF - pM * tM)) < 1e-9,
        `${aid} symmetric decomposition closes at full precision (identity)`);
    add(Math.abs(partTerm - d.participation_term_min) <= 5e-4 + 1e-9,
        `${aid} participation term = stored value (within 3 dp rounding)`);
    add(Math.abs(durTerm - d.duration_term_min) <= 5e-4 + 1e-9,
        `${aid} duration term = stored value (within 3 dp rounding)`);
    // stored values are each rounded to 3 dp, so their sum may sit 0.001 off the gap
    add(Math.abs(d.participation_term_min + d.duration_term_min - d.gap_min) <= 1e-3 + 1e-9,
        `${aid} stored terms sum within 0.001 of the gap (3 dp rounding)`);
  }

  // published rounding-only bounds must stay wider than the point estimate they bracket
  for (const [k, v] of Object.entries(DATA.rounding_bounds.values)) {
    add(v.published_rounding_only_lower_min <= v.point_estimate_min
      && v.point_estimate_min <= v.published_rounding_only_upper_min,
      `rounding-only bounds bracket the point estimate: ${k}`);
  }

  // the national six-domain context strip must not silently include the internet cut-across
  const N = DATA.national_daily_minutes;
  add(Math.abs(N.essential + N.paid + N.unpaid + N.discretionary + N.study + N.transport - 1440) <= 3,
      "national six-domain sum ~ 1440 minutes");
  add(typeof N.internet === "number" && N.internet > 0,
      "internet use exists as an overlapping measure (excluded from 1440)");

  // sign reversal is the story's core claim; assert it holds
  add(Math.sign(G.paid) !== Math.sign(G.total), "paid gap and combined gap have opposite signs (reversal holds)");
  add(Math.abs(G.unpaid) > Math.abs(G.paid), "|unpaid gap| > |paid gap| (arithmetic condition for the reversal)");

  problems.push(...bridgeConsistency(DATA));
  return problems;
}

/** Values the page must show for a given interactive state — asserted per state by QA. */
export function stateManifest(DATA) {
  return {
    "act1:paid": scopeView(DATA, "paid"),
    "act1:both": scopeView(DATA, "both"),
    "act2:0": bridgeStages(DATA)[0],
    "act2:1": bridgeStages(DATA)[1],
    "act2:2": bridgeStages(DATA)[2],
    "act3:paid": compositionView(DATA, "paid"),
    "act3:unpaid": compositionView(DATA, "unpaid"),
    "act3:discretionary": compositionView(DATA, "discretionary"),
    "decomp:paid": decompositionView(DATA, "paid"),
    "decomp:unpaid": decompositionView(DATA, "unpaid"),
    "decomp:discretionary": decompositionView(DATA, "discretionary"),
  };
}
