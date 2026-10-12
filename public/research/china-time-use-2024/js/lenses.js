/* lenses.js — TheoryLens (Act IV). Cards hold the editorial framing; every citation
 * string and every number inside the cards is generated from the data layer, and all
 * display text comes from the active locale table.
 */
import { lensView, signed1, fmt1 } from "./derive.js";
import { T, L, isEN } from "./i18n.js";

/* punctuation follows the language of the page; the citation content itself is generated */
const P = () => (isEN() ? { o: "(", c: ")", colon: ": ", sep: ", " } : { o: "（", c: "）", colon: "：", sep: "、" });

const CHIPS = {
  eagly_wood_2016: [["act4.chipExternalTheory", "is-external"], ["act4.chipHypothesis", ""],
    ["act4.chipRoleUnmeasured", "is-not"]],
  daminger_2019: [["act4.chipExternalTheory", "is-external"],
    ["act4.chipDamingerSample", "is-external"], ["act4.chipCognitiveUnmeasured", "is-not"]],
  giurge_whillans_west_2020: [["act4.chipSubjectiveUnmeasured", "is-not"]],
};

const METRICS = {
  eagly_wood_2016: d => T("act4.metricRole",
    { paid: signed1(d.gaps.paid), unpaid: signed1(d.gaps.unpaid) }),
  daminger_2019: d => T("act4.metricCognitive",
    { f: fmt1(d.groups.female.unpaid.all_resident_mean_min),
      m: fmt1(d.groups.male.unpaid.all_resident_mean_min) }),
  giurge_whillans_west_2020: d => T("act4.metricTimePoverty", { v: signed1(d.gaps.discretionary) }),
};

export function renderLenses(DATA, root) {
  const out = [];
  root.querySelectorAll(".lens").forEach(card => {
    const key = card.dataset.lens;
    const v = lensView(DATA, key);
    const c = v.citation;
    const cite = card.querySelector(".lens-cite");
    const why = c.landing_status === "403" ? T("act4.citeLanding403") : T("act4.citeLandingOk");
    const p = P();
    cite.innerHTML = `<span class="cite-title">${c.title}</span><br>`
      + `${c.authors}${p.o}${c.year}${p.c} · <em>${c.venue}</em>`
      + `${c.volume ? ` ${c.volume}` : ""}${c.issue ? `${p.o}${c.issue}${p.c}` : ""}${c.page ? `${p.colon}${c.page}` : ""}<br>`
      + `${T("act4.citeDoi")}<a href="${c.url}" rel="noopener" target="_blank">${c.doi}</a>`
      + `<span class="fine">${T("act4.citeLanding", { status: c.landing_status, why,
          hash: c.record_sha256.slice(0, 12) })}</span>`;

    // the article-type chip is generated from the data layer (publisher-authoritative),
    // so no page or build step can silently restore the superseded "Review" label.
    // the type value itself is a bibliographic label; the English edition renders the
    // Chinese-typed encyclopedia/journal labels with their reviewed English equivalents
    const typeVal = (L().act4.articleType || {})[v.article_type] || v.article_type;
    const typeChip = v.article_type
      ? [[T("act4.typeChip", { type: typeVal }), "is-external"]] : [];
    const status = card.querySelector("[data-status-host]");
    status.innerHTML = [...typeChip, ...(CHIPS[key] || [])].map(([k, cls]) =>
      `<span class="status-chip ${cls}">${T(k)}</span>`).join("");

    const metric = card.querySelector(".lens-metric");
    if (metric && METRICS[key]) metric.textContent = METRICS[key](DATA);

    // the "what this survey measured" panel is generated too, so the boundary text and
    // the numbers can never drift apart between the two languages
    const meas = card.querySelector("[data-measure-host]");
    if (meas) {
      meas.innerHTML = v.measured.map(m =>
        `<p class="measure-line"><span class="status-chip is-not">${m.state}</span>${m.text}</p>`).join("");
    }

    out.push({ key, doi: c.doi, url: c.url, title: c.title });
  });
  return out;
}

/** Reading aid, not decoration: the boundary mode dims the theory text and highlights the
 *  two panels that state what this survey did and did not measure. Everything stays
 *  readable in both modes; nothing is hidden away.
 */
export function wireLensCompareToggle(grid, btn) {
  if (!grid || !btn) return;
  btn.addEventListener("click", () => {
    const on = grid.classList.toggle("compare");
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? T("act4.compareOn") : T("act4.compareOff");
  });
  return grid;
}
