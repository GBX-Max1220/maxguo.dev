/* bars.js — FixedScaleGroupBars (Act I) and DayStrip (Act I detail).
 * Reused from D0.1 with the same fixed 0–360 axis, same colour semantics
 * (colour encodes the ACTIVITY, never the gender) and the same focus rules.
 * All display text comes from the active locale table.
 */
import { el, text, clear, ticksTo } from "./svg.js";
import { MAX_MIN, TICK_STEP, fmt1, scopeBars } from "./derive.js";
import { T, L } from "./i18n.js";

const ROW_H = 92, BAR_H = 34, LABEL_W = 46, PAD_R = 64, AXIS_H = 30;

export function makeBars({ host, frame, tooltip }) {
  const xs = (min, w) => LABEL_W + (min / MAX_MIN) * (w - LABEL_W - PAD_R);
  // Touch devices synthesise a mouseleave right after a tap, which used to dismiss the
  // tooltip the tap had just opened. A tap now "pins" the tooltip until the next tap
  // elsewhere; hover behaviour on pointer devices is unchanged.
  let pinned = false;
  document.addEventListener("click", () => { pinned = false; hide(tooltip); });

  let lastW = 0;
  function render(DATA, t, ctx, { skipIfSameSize = false } = {}) {
    const w = host.clientWidth || 560;
    // A ResizeObserver can fire for height-only changes; rebuilding the SVG then would
    // detach nodes a reader is hovering or focusing. Skip the rebuild when nothing moved.
    if (skipIfSameSize && w === lastW && host.firstChild) return;
    lastW = w;
    const h = 2 * ROW_H + AXIS_H;
    const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: "img" }, host);
    svg.setAttribute("aria-label", ariaSummary(DATA));

    for (const m of ticksTo(MAX_MIN, TICK_STEP)) {
      const x = xs(m, w);
      el("line", { x1: x, x2: x, y1: 6, y2: h - AXIS_H + 4,
        stroke: m === 0 ? "#c9c1b2" : "#efe8da", "stroke-width": m === 0 ? 1.2 : 1 }, svg);
      text(svg, x, h - 8, String(m), { cls: "axis-tick", size: 10.5, fill: "#6d6a63", anchor: "middle", weight: 400 });
    }
    text(svg, w, 10, T("units.axisPaidUnit"), { size: 10.5, fill: "#726e64", anchor: "end", weight: 400 });

    scopeBars(DATA, t).forEach((row, i) => {
      const yBar = i * ROW_H + 34;
      const paid = row.segments[0], unpaid = row.segments[1];
      const paidW = xs(paid.value, w) - LABEL_W;
      const unpaidW = xs(paid.value + unpaid.value, w) - xs(paid.value, w);

      text(svg, 0, yBar + BAR_H / 2 + 5, row.label, { size: 14, weight: 650, mono: false });

      const p = segment(svg, LABEL_W, yBar, paidW, BAR_H, "var(--paid)", row, paid, true, ctx, tooltip, frame);
      if (t > 0.5) inBarLabel(svg, LABEL_W, paidW, fmt1(paid.full), "#f4f1ea", "var(--paid)", yBar, BAR_H);
      const u = segment(svg, LABEL_W + paidW, yBar, Math.max(unpaidW, 0), BAR_H, "var(--unpaid)",
        row, unpaid, unpaidW > 2, ctx, tooltip, frame);
      if (unpaidW > 4) inBarLabel(svg, LABEL_W + paidW, unpaidW, fmt1(unpaid.value), "#fdf6f0", "var(--unpaid)", yBar, BAR_H);

      // total end-cap + label above it (keeps numbers off the gridlines on phones)
      const xEnd = xs(paid.value + unpaid.value, w);
      el("line", { x1: xEnd, x2: xEnd, y1: yBar - 5, y2: yBar + BAR_H + 5, stroke: "var(--ink)", "stroke-width": 1.6 }, svg);
      text(svg, xEnd + 14, yBar - 7, fmt1(paid.value + unpaid.value),
        { size: 13.5, anchor: "end", halo: true });
    });
    clear(host); host.appendChild(svg);
  }

  function ariaSummary(DATA) {
    const m = DATA.groups.male, f = DATA.groups.female;
    return T("act1.ariaChart", {
      max: MAX_MIN,
      mp: fmt1(m.paid.all_resident_mean_min), mu: fmt1(m.unpaid.all_resident_mean_min),
      fp: fmt1(f.paid.all_resident_mean_min), fu: fmt1(f.unpaid.all_resident_mean_min),
      tm: fmt1(DATA.totals.male_total), tf: fmt1(DATA.totals.female_total),
    });
  }

  function segment(svg, x, y, w, h, fill, row, seg, focusable, ctx, tooltip, frame) {
    const r = el("rect", { x, y, width: Math.max(w, 0), height: h, fill, rx: 1.5, class: "seg",
      role: "img", tabindex: focusable ? "0" : "-1" }, svg);
    r.setAttribute("aria-label", T("act1.segAria", {
      row: row.label, seg: seg.label, v: fmt1(seg.full),
      state: (seg.included || focusable) ? T("act1.counted") : T("act1.notCounted"),
    }));
    const show = ev => showTip(tooltip, frame, r, row, seg, ctx, ev);
    r.addEventListener("mouseenter", show);
    r.addEventListener("mousemove", ev => place(tooltip, frame, ev));
    r.addEventListener("mouseleave", () => { if (!pinned) hide(tooltip); });
    r.addEventListener("focus", () => showTip(tooltip, frame, r, row, seg, ctx, null));
    r.addEventListener("blur", () => { if (!pinned) hide(tooltip); });
    r.addEventListener("click", ev => {
      ev.stopPropagation();
      pinned = true;
      showTip(tooltip, frame, r, row, seg, ctx, ev);
    });
    return r;
  }

  function inBarLabel(svg, x0, w, str, insideFill, outsideFill, yBar, h) {
    const inside = w > 38;
    text(svg, inside ? x0 + w - 7 : x0 + w + 7, yBar + h / 2 + 4.5, str,
      { fill: inside ? insideFill : outsideFill, anchor: inside ? "end" : "start", size: 12, halo: !inside });
  }

  function showTip(tooltip, frame, rect, row, seg, ctx, ev) {
    if (!tooltip) return;
    const counted = seg.aid === "paid" ? T("act1.tipBoth")
      : (seg.included ? T("act1.counted") : `<span class="tip-excluded">${T("act1.tipExcluded")}</span>`);
    tooltip.innerHTML =
      `<b>${T("act1.tipTitle", { row: row.label, seg: seg.label })}</b><br>`
      + `${T("act1.tipLine1", { v: fmt1(seg.full) })}<br>`
      + `${T("act1.tipLine2", { p: seg.act.participation_rate_pct, t: seg.act.participant_mean_min })}<br>`
      + `${T("act1.tipScope", { state: counted })}<br><span style="opacity:.75">${T("act1.tipCurrent", { scope: ctx.scopeName })}</span>`;
    tooltip.hidden = false;
    place(tooltip, frame, ev, rect);
  }

  function place(tooltip, frame, ev, rect) {
    if (!tooltip || !frame) return;
    const box = frame.getBoundingClientRect();
    let x, y;
    if (ev && ev.clientX !== undefined) { x = ev.clientX - box.left + 14; y = ev.clientY - box.top - 10; }
    else { const rb = rect.getBoundingClientRect(); x = rb.right - box.left + 10; y = rb.top - box.top; }
    const maxX = box.width - tooltip.offsetWidth - 8;
    tooltip.style.left = Math.max(4, Math.min(x, maxX)) + "px";
    tooltip.style.top = Math.max(4, y) + "px";
  }

  const hide = tooltip => { if (tooltip) tooltip.hidden = true; };

  return { render, MAX_MIN };
}

/* ---------------- DayStrip: published national six-domain means ------------- */
/** Static context only: 全国居民公布值，不是分性别群体，也不构成 24 小时的分配建议。 */
export function renderDayStrip(DATA, host) {
  const N = DATA.national_daily_minutes;
  const lab = L().labels;
  const order = [["essential", lab.essential], ["paid", lab.paid], ["unpaid", lab.unpaid],
    ["discretionary", lab.discretionary], ["study", lab.study], ["transport", lab.transport]];
  const colors = ["#cfc6b6", "var(--paid)", "var(--unpaid)", "var(--female-longer)", "var(--gold)", "#8b98a5"];
  const W = 620, H = 46, total = 1440;
  clear(host);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H + 44}`, width: "100%", role: "img",
    "aria-label": T("act1.dayStripAria", {
      items: order.map(([k, l]) => T("act1.dayStripItem", { label: l, v: N[k] })).join(", "),
      sum: DATA.national_six_domain_sum_min }) }, host);
  let acc = 0;
  order.forEach(([k, label], i) => {
    const w = (N[k] / total) * W;
    el("rect", { x: acc, y: 0, width: w, height: H, fill: colors[i] }, svg);
    if (w > 46) text(svg, acc + w / 2, H / 2 + 4, label,
      { fill: i === 0 ? "#20262d" : "#fdf8f1", size: 10.5, anchor: "middle", mono: false });
    text(svg, acc + w / 2, H + 14, `${N[k]}`, { size: 10.5, anchor: "middle", fill: "#6d6a63" });
    acc += w;
  });
  const p = el("p", { class: "scale-note" });
  p.textContent = T("act1.dayStripNote", { sum: DATA.national_six_domain_sum_min, internet: N.internet });
  host.appendChild(p);
}
