/* i18n.js — the single language layer shared by the page, the QA scripts and the
 * reproduction pack. Both locale tables are imported statically, so switching language
 * is synchronous and works in Node as well as in the browser (no fetch, no CORS,
 * no runtime translation of anything).
 *
 * Rule: derive.js and the renderers never contain display text of their own — they ask
 * for a key. Numbers always come from data/time-use-data.js. That is what keeps the
 * Chinese and English editions on identical data and identical logic.
 */
import ZH from "../locales/zh-CN.js";
import EN from "../locales/en.js";

const TABLES = { "zh-CN": ZH, en: EN };
export const SUPPORTED = Object.keys(TABLES);

export const i18n = { locale: "zh-CN", L: ZH };

export function setLocale(tag) {
  const use = Object.prototype.hasOwnProperty.call(TABLES, tag) ? tag : "zh-CN";
  i18n.locale = use;
  i18n.L = TABLES[use];
  return use;
}

/** The page declares its language with <html data-locale="en">; Node callers set it explicitly. */
export function detectLocale() {
  if (typeof document !== "undefined" && document.documentElement) {
    const declared = document.documentElement.dataset && document.documentElement.dataset.locale;
    if (declared && TABLES[declared]) return declared;
  }
  if (typeof location !== "undefined" && /\/en\/(report\/?)?$/.test(location.pathname)) return "en";
  return "zh-CN";
}

export function localeTable(tag) { return TABLES[tag] || ZH; }

function lookup(key) {
  return String(key).split(".").reduce((o, k) => (o == null ? undefined : o[k]), i18n.L);
}

/** T("act1.verdictFemale") / T("act1.noteBoth", {total: "+25.9"}) */
export function T(key, vars) {
  const s = lookup(key);
  if (typeof s === "string") return fmt(s, vars);
  if (s != null && typeof s !== "object") return String(s);
  return key;            // a missing key is visible in the UI and asserted by QA, never silent
}

export function fmt(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** live access to the current table (labels, source names, lists) */
export const L = () => i18n.L;
export const isEN = () => i18n.locale === "en";
