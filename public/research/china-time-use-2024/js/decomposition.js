/* decomposition.js — NonCausalDecomposition (Act III advanced view).
 * Mirrors the frozen Figure 3 rules from the research package:
 *   - the two symmetric terms are the bars (colour = component, not gender)
 *   - the original difference is a DASHED reference line with end caps, scoped to
 *     its own activity's rows only — it is NOT an uncertainty interval and NOT a
 *     full-height axis line
 *   - caption repeats: arithmetic identity, not causal contribution
 * All display text comes from the active locale table.
 */
import { el, text, clear, ticksTo } from "./svg.js";
import { TERM_EXTENT, TERM_STEP, decompositionView, signed1 } from "./derive.js";
import { T } from "./i18n.js";

const ROW_H = 52, BAR_H = 22, PAD_L = 10, PAD_R = 10, AXIS_H = 26, HEAD = 30;

export function makeDecomposition({ host }) {
  const xs = (v, w) => PAD_L + ((v + TERM_EXTENT) / (2 * TERM_EXTENT)) * (w - PAD_L - PAD_R);

  function render(DATA, aid) {
    const d = decompositionView(DATA, aid);
    const w = host.clientWidth || 420;
    const H = HEAD + d.terms.length * ROW_H + AXIS_H + 16;
    const svg = el("svg", { viewBox: `0 0 ${w} ${H}`, width: w, height: H, role: "img" });
    svg.setAttribute("aria-label", T("act3.decompAria", {
      label: d.label, p: signed1(d.terms[0].value), t: signed1(d.terms[1].value),
      sum: signed1(d.termsSum), gap: signed1(d.gap) }));

    // fixed diverging grid
    for (const v of ticksTo(TERM_EXTENT, TERM_STEP).concat(ticksTo(TERM_EXTENT, TERM_STEP).map(x => -x).filter(x => x !== 0))) {
      const x = xs(v, w);
      const zero = v === 0;
      el("line", { x1: x, x2: x, y1: HEAD - 8, y2: H - AXIS_H,
        stroke: zero ? "#c9c1b2" : "#efe8da", "stroke-width": zero ? 1.4 : 1 }, svg);
      if (zero || Math.abs(v) % 50 === 0) {
        text(svg, x, H - 10, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v),
          { size: 10, fill: "#6d6a63", anchor: "middle", weight: 400 });
      }
    }
    const title = T("act3.decompTitle", { label: d.label });
    text(svg, PAD_L, 14, title, { size: 11.5, fill: "#20262d", weight: 600, mono: false });
    // the unit label is secondary: draw it only where it cannot touch the title
    // (the English title is longer than the Chinese one, so this guard is not cosmetic)
    if (w - PAD_L - title.length * 7.4 > T("act2.axisUnit").length * 6.4 + 16) {
      text(svg, w, 12, T("act2.axisUnit"), { size: 10, fill: "#726e64", anchor: "end", weight: 400 });
    }

    // term bars
    d.terms.forEach((t, i) => {
      const y = HEAD + i * ROW_H + 16;
      const x0 = xs(0, w), x1 = xs(t.value, w);
      text(svg, PAD_L, y - 7, t.label, { size: 11.5, fill: "#39444f", weight: 600, mono: false });
      el("rect", { x: Math.min(x0, x1), y, width: Math.abs(x1 - x0), height: BAR_H,
        fill: t.key === "participation" ? "var(--paid)" : "var(--unpaid)", rx: 2, class: "seg",
        role: "img", "tabindex": "0",
        "aria-label": T("act3.termAria", { label: d.label, term: t.label, v: signed1(t.value), formula: t.sub }) }, svg);
      const wide = Math.abs(x1 - x0) > 52;
      text(svg, wide ? (x0 + x1) / 2 : Math.max(x0, x1) + 6, y + BAR_H / 2 + 4, signed1(t.value),
        { size: 11.5, fill: wide ? "#f4f1ea" : "var(--ink)", anchor: wide ? "middle" : "start", halo: !wide });
    });

    // scoped reference line for the original difference (dashed + end caps)
    const xg = xs(d.gap, w);
    const yTop = HEAD + 16, yBot = HEAD + (d.terms.length - 1) * ROW_H + 16 + BAR_H;
    el("line", { x1: xg, x2: xg, y1: yTop, y2: yBot, stroke: "var(--ink)", "stroke-width": 1.4,
      "stroke-dasharray": "4 3" }, svg);
    el("line", { x1: xg - 5, x2: xg + 5, y1: yTop, y2: yTop, stroke: "var(--ink)", "stroke-width": 1.4 }, svg);
    el("line", { x1: xg - 5, x2: xg + 5, y1: yBot, y2: yBot, stroke: "var(--ink)", "stroke-width": 1.4 }, svg);
    text(svg, Math.min(Math.max(xg, 66), w - 66), yBot + 14, T("act3.refLine", { v: signed1(d.gap) }),
      { size: 10.5, fill: "var(--ink)", anchor: "middle", halo: true, mono: false });

    clear(host);
    host.appendChild(svg);
    const cap = document.createElement("p");
    cap.className = "fine";
    cap.textContent = T("act3.decompCaption", {
      label: d.label, gap: signed1(d.gap), sum: d.termsSumText, shown: d.gapText,
      delta: Math.abs(d.displayRoundingDelta).toFixed(1) });
    host.appendChild(cap);
    host.dataset.aid = aid;
    host.dataset.gap = d.gap.toFixed(3);
    host.dataset.terms = d.terms.map(t => t.value.toFixed(3)).join(",");
    return d;
  }

  return { render };
}
