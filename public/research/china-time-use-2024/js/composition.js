/* composition.js — CompositionExplorer (Act III): population average = participation
 * rate × average among participants.
 * HTML bars (no canvas), with the two different denominators named on screen.
 * All display text comes from the active locale table; the numbers come from derive.js.
 */
import { fmt1, pct1, compositionView, PARTICIPANT_MAX, RATE_MAX, signed1 } from "./derive.js";
import { T, L } from "./i18n.js";

export function renderComposition(DATA, aid, host) {
  const v = compositionView(DATA, aid);
  const lab = L().labels;
  host.innerHTML = "";
  host.setAttribute("aria-label", T("act3.compAria", { label: v.label }));

  v.rows.forEach(r => {
    const row = document.createElement("div");
    row.className = "comp-row";
    row.innerHTML = `
      <p class="comp-who">${r.label}</p>
      <div class="comp-bars">
        ${miniBar(T("act3.rateLabel"), r.rate_pct, RATE_MAX, "%", "var(--paid-soft)",
          T("act3.rateAria", { v: pct1(r.rate_pct) }),
          T("act3.denomRate"))}
        ${miniBar(T("act3.durationLabel"), r.participant_mean_min, PARTICIPANT_MAX, " " + T("units.min"), "var(--unpaid-soft)",
          T("act3.durationAria", { v: r.participant_mean_min }),
          T("act3.denomDuration"))}
        <p class="comp-total">${T("act3.compTotal", { formula: r.formula })}
          <span class="fine">${T("act3.derivedNote")}</span></p>
      </div>`;
    host.appendChild(row);
  });

  const foot = document.createElement("p");
  foot.className = "comp-total";
  foot.innerHTML = T("act3.foot", { label: v.label, gap: v.gapText, verdict: v.verdict })
    + `<span class="fine">${T("act3.footNote", { rateMax: RATE_MAX, pMax: PARTICIPANT_MAX })}</span>`;
  host.appendChild(foot);
  host.dataset.aid = aid;
  host.dataset.gap = v.gap_min.toFixed(3);
  return v;
}

function miniBar(label, value, max, unit, color, ariaText, denom) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return `<div class="minibar" role="img" aria-label="${T("act3.miniAria", { label, text: ariaText })}">
    <div class="minibar-head"><span class="minibar-label">${label}</span>
      <span class="minibar-val">${unit === "%" ? pct1(value) : value + unit}</span></div>
    <div class="minibar-track"><span class="minibar-fill" style="width:${pct.toFixed(2)}%;background:${color}"></span></div>
    <div class="mini-axis"><span>0</span><span>${max}${unit === "%" ? "%" : " " + T("units.min")}</span></div>
    <p class="minibar-denom">${denom}</p>
  </div>`;
}

/* ---------------- decomposition table (all three activities) ---------------- */
export function renderDecompositionTable(DATA, tbody) {
  const lab = L().labels;
  const rows = ["paid", "unpaid", "discretionary"].map(aid => {
    const d = DATA.decomposition[aid];
    const sum = Math.round((d.participation_term_min + d.duration_term_min) * 10) / 10;
    return `<tr><th scope="row">${lab[aid]}</th>
      <td>${signed1(d.participation_term_min)}</td>
      <td>${signed1(d.duration_term_min)}</td>
      <td>${signed1(sum)}</td>
      <td class="derived">${signed1(d.gap_min)}</td></tr>`;
  });
  tbody.innerHTML = rows.join("");
  return rows.length;
}
