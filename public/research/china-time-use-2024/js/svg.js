/* svg.js — minimal SVG helpers shared by every view. No library, no CDN. */
export const NS = "http://www.w3.org/2000/svg";

export function el(name, attrs = {}, parent) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    n.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(n);
  return n;
}

export function text(host, x, y, str, {
  fill = "#20262d", size = 12, weight = 600, anchor = "start", cls = "", mono = true, halo = false,
} = {}) {
  const t = el("text", {
    x, y, fill, "font-size": size, "font-weight": weight, "text-anchor": anchor,
    "font-family": mono ? "var(--font-num)" : "var(--font-body)",
    class: cls,
    style: "font-variant-numeric: tabular-nums"
      + (halo ? "; paint-order: stroke; stroke: var(--surface); stroke-width: 3px; stroke-linejoin: round" : ""),
  }, host);
  t.textContent = str;
  return t;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

/** Even tick values from 0..max (inclusive). */
export const ticksTo = (max, step) => {
  const out = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(v);
  return out;
};
