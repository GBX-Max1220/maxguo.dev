/* bridge.js — ReversalBridge (Act II): a three-step arithmetic bridge on one fixed
 * diverging scale. Two lanes, always readable:
 *   lane A  parts — the waterfall: paid difference, then the unpaid difference added on top
 *   lane B  running total — the cumulative figure of whatever has been counted so far
 * Emphasis changes per step; geometry never changes. Nothing is re-scaled.
 * All display text comes from the active locale table.
 */
import { el, text, clear } from "./svg.js";
import { BRIDGE_EXTENT, bridgeStages, signed1 } from "./derive.js";
import { T } from "./i18n.js";

const AXIS_H = 24, PAD_L = 62, PAD_R = 12;   // left gutter holds the lane captions only
const LANE_A_Y = 44, LANE_B_Y = 96, LANE_H = 34;

export function makeBridge({ host, readout }) {
  const xs = (v, w) => PAD_L + ((v + BRIDGE_EXTENT) / (2 * BRIDGE_EXTENT)) * (w - PAD_L - PAD_R);

  function render(DATA, stageId) {
    const st = bridgeStages(DATA)[stageId];
    const G = DATA.gaps;
    const w = host.clientWidth || 560;
    const H = LANE_B_Y + LANE_H + 12 + AXIS_H;
    const svg = el("svg", { viewBox: `0 0 ${w} ${H}`, width: w, height: H, role: "img" });
    svg.setAttribute("aria-label", T("act2.aria", {
      n: stageId + 1, term: st.term, value: st.valueText, running: st.runningText,
      direction: st.direction }));

    // gridlines −100…+100 by 50; zero line heavier
    for (let v = -100; v <= 100; v += 50) {
      const x = xs(v, w);
      el("line", { x1: x, x2: x, y1: 22, y2: LANE_B_Y + LANE_H + 6,
        stroke: v === 0 ? "#c9c1b2" : "#efe8da", "stroke-width": v === 0 ? 1.4 : 1 }, svg);
      text(svg, x, H - 8, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v),
        { size: 10.5, fill: "#6d6a63", anchor: "middle", weight: 400 });
    }
    text(svg, w, 12, T("act2.axisUnit"), { size: 10.5, fill: "#726e64", anchor: "end", weight: 400 });

    // lane captions live in the left gutter, so no value label can ever overlap them
    text(svg, 0, LANE_A_Y + LANE_H / 2 + 4, T("act2.laneA"), { size: 11, fill: "#6d6a63", weight: 400, mono: false });
    text(svg, 0, LANE_B_Y + LANE_H / 2 - 3, T("act2.laneB"), { size: 11, fill: "#6d6a63", weight: 400, mono: false });
    text(svg, 0, LANE_B_Y + LANE_H / 2 + 11, T("act2.laneBsub"), { size: 10, fill: "#726e64", weight: 400, mono: false });

    // ---- lane A: waterfall of the two components
    bar(svg, xs(0, w), xs(G.paid, w), LANE_A_Y, "var(--paid)", stageId !== 2 ? 1 : .45);
    bar(svg, xs(G.paid, w), xs(G.total, w), LANE_A_Y, "var(--unpaid)", stageId === 0 ? .25 : stageId === 1 ? 1 : .45);
    // each component label sits at the OUTER end of its own segment, so the two can
    // never collide the way a shared midpoint would
    const paidWide = Math.abs(xs(0, w) - xs(G.paid, w)) > 52;
    const unpaidWide = Math.abs(xs(G.total, w) - xs(G.paid, w)) > 52;
    // a dimmed (out-of-focus) segment must not carry a light label: contrast would drop
    endLabel(svg, xs(G.paid, w) - 7, LANE_A_Y, signed1(G.paid), "end",
      stageId === 2 ? "#6d6a63" : "#f4f1ea", "#6d6a63", paidWide && stageId !== 2);
    endLabel(svg, xs(G.total, w) - 7, LANE_A_Y, signed1(G.unpaid), "end",
      stageId === 0 ? "#6d6a63" : "#fdf6f0", "#6d6a63", unpaidWide && stageId !== 0);
    if (stageId === 1) {
      text(svg, xs(G.total, w) + 6, LANE_A_Y + LANE_H / 2 + 4, T("act2.addArrow"),
        { size: 11, fill: "var(--unpaid)", anchor: "start", halo: true, mono: false });
    }

    // ---- lane B: the running total (what the scope currently counts)
    const running = st.running;
    const runningColor = running > 0 ? "var(--female-longer)" : "var(--paid)";
    bar(svg, xs(0, w), xs(running, w), LANE_B_Y, runningColor, 1);
    el("line", { x1: xs(running, w), x2: xs(running, w), y1: LANE_B_Y - 8, y2: LANE_B_Y + LANE_H + 8,
      stroke: "var(--ink)", "stroke-width": 1.6 }, svg);
    // keep the value inside the plot area; drop the direction word when the column is narrow
    const full = `${st.runningText} ${st.direction}`;
    const rightSide = running >= 0;
    const need = (rightSide ? w - xs(running, w) : xs(running, w) - PAD_L) - 10;
    const label = full.length * 7.2 <= need ? full
      : (st.runningText.length * 7.2 <= need ? st.runningText : "");
    if (label) {
      // a negative running total puts the label to the LEFT of the zero line, and its
      // box can then reach into the left gutter where the lane captions live. The
      // bilingual collision gate caught this at 768px: clamp by the label's own width
      // so its left edge always starts right of the gutter. No statistic is written
      // here — the width estimate uses the label string only.
      const width_est = label.length * 7.6;
      let lx = rightSide ? xs(running, w) + 9 : xs(running, w) - 9;
      let anchor = rightSide ? "start" : "end";
      if (!rightSide && lx - width_est < PAD_L + 6) { lx = PAD_L + 6; anchor = "start"; }
      text(svg, lx, LANE_B_Y + LANE_H / 2 + 4, label,
        { size: 12.5, anchor, halo: true, fill: runningColor, mono: false });
    } else {
      text(svg, PAD_L + 4, LANE_A_Y - 6, `${st.runningText} ${st.direction}`,
        { size: 12, anchor: "start", halo: true, fill: runningColor, mono: false });
    }

    clear(host);
    host.appendChild(svg);
    updateReadout(st, stageId);
    return st;
  }

  function bar(svg, x0, x1, y, fill, opacity) {
    return el("rect", { x: Math.min(x0, x1), y, width: Math.abs(x1 - x0), height: LANE_H,
      fill, rx: 2, opacity }, svg);
  }

  function endLabel(svg, x, y, str, anchor, insideFill, outsideFill, fits) {
    text(svg, x, y + LANE_H / 2 + 4, str,
      { size: 11.5, fill: fits ? insideFill : outsideFill, anchor, halo: !fits });
  }

  function updateReadout(st, stageId) {
    if (!readout) return;
    readout.querySelector("#br-kicker").textContent = st.kicker;
    readout.querySelector("#br-term").textContent = T("act2.termValue", { term: st.term, value: st.valueText });
    readout.querySelector("#br-cap").textContent = stageId === 2
      ? T("act2.capTotal") : T("act2.capRunning");
    const v = readout.querySelector("#br-value");
    v.textContent = st.runningText;
    v.dataset.color = st.color;
    v.style.color = st.running > 0 ? "var(--female-longer)" : "var(--paid)";
    readout.querySelector("#br-note").textContent = st.note;
    readout.dataset.stage = String(stageId);
    readout.dataset.running = st.running.toFixed(3);
  }

  return { render, LANE_A_Y, LANE_B_Y };
}
