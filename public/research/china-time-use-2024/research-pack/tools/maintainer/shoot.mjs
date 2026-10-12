// shoot.mjs — real-browser QA + screenshot harness for the D1 story.
// Requires a static server:  python -m http.server 4173   (from this directory)
// Run:                        node tools/shoot.mjs
// Uses playwright-core + the locally installed chromium headless shell (no downloads).
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Browser discovery is environment-driven so this file carries no machine-specific paths.
//   D1_NODE_MODULE_DIR : a directory whose node_modules contains playwright-core
//   D1_CHROME_PATH     : path to a chromium / chrome-headless-shell executable
// With neither set, we fall back to a playwright-core resolvable from this project.
const PW_DIR = process.env.D1_NODE_MODULE_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXE = process.env.D1_CHROME_PATH || undefined;
let chromium;
try {
  chromium = createRequire(PW_DIR + "/")("playwright-core").chromium;
} catch {
  try { chromium = (await import("playwright")).chromium; }
  catch {
    console.error([
      "playwright-core not found.",
      "Set D1_NODE_MODULE_DIR to a directory whose node_modules contains playwright-core,",
      "and D1_CHROME_PATH to a chromium / chrome-headless-shell executable;",
      "or run `npm i -D playwright && npx playwright install chromium` in this folder.",
      "This round's browser evidence was produced with a locally managed",
      "chromium-headless-shell build - see docs/D1_VALIDATION_REPORT.md section 1.",
    ].join(" "));
    process.exit(2);
  }
}
const BASE = process.env.D1_URL || "http://127.0.0.1:4174/";
const OUT = process.env.D1_OUT_DIR
  ? path.resolve(process.env.D1_OUT_DIR)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "screenshots");
const EVID = process.env.D1_EVIDENCE_DIR
  ? path.resolve(process.env.D1_EVIDENCE_DIR)
  : path.join(OUT, "..", "docs");
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const note = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${detail ? "  -> " + detail : ""}`);
};
fs.mkdirSync(EVID, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, headless: true,
  args: ["--disable-gpu", "--no-sandbox"] });
console.log("browser:", EXE ? EXE.replace(/^.*[\/]/, "") : "playwright default", "| playwright-core from:", PW_DIR);

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1024, height: 800 },
  tablet: { width: 768, height: 1024 },
  phone375: { width: 375, height: 812 },
  phone390: { width: 390, height: 844 },
};

async function openPage(vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: opts.dsf ?? 2,
    reducedMotion: opts.reducedMotion || "no-preference", hasTouch: !!opts.hasTouch });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("requestfailed", r => errors.push("requestfailed: " + r.url()));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__D1__, null, { timeout: 10000 });
  page.__errors = errors;
  return { ctx, page, errors };
}

const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, name), ...opts });

async function overflow(page, label) {
  const o = await page.evaluate(() => {
    const doc = document.documentElement;
    const wide = [...document.querySelectorAll("body *")]
      .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1.5 && getComputedStyle(e).position !== "fixed")
      .slice(0, 4).map(e => `${e.tagName}.${(e.className || "").toString().split(" ")[0]}@${Math.round(e.getBoundingClientRect().right)}`);
    return { sw: doc.scrollWidth, iw: window.innerWidth, wide };
  });
  note(`no horizontal overflow @ ${label}`, o.sw <= o.iw + 1, `sw=${o.sw} iw=${o.iw}${o.wide.length ? " worst: " + o.wide.join(", ") : ""}`);
}

async function setScope(page, value) {
  await page.check(`input[name="scope"][value="${value}"]`, { force: true });
  await page.waitForFunction(v => {
    const s = window.__D1__.state;
    return s.scope === v && Math.abs(s.t - (v === "both" ? 1 : 0)) < 1e-6;
  }, value, { timeout: 5000 });
}

/* ============================ 1. desktop functional pass ============================ */
{
  const { ctx, page, errors } = await openPage(VIEWPORTS.desktop);
  note("page loads with no console/request errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  const snap = await page.evaluate(() => window.__D1__.snapshot());
  note("runtime identity checks pass (0 problems)", snap.consistencyProblems.length === 0,
    snap.consistencyProblems.join(" | "));
  note("all prose number slots filled by the data layer", snap.emptySlots === 0 && snap.missingSlots === 0,
    `empty=${snap.emptySlots} missing=${snap.missingSlots}`);
  note("Act I default state reads the paid gap with the male-longer verdict",
    snap.scopeView.deltaText === "−73.9" && snap.scopeView.verdict === "▼ 男性更长",
    `${snap.scopeView.deltaText} ${snap.scopeView.verdict}`);

  const auditTxt = await page.textContent("#audit-line");
  note("Act V audit line reports internal consistency", auditTxt.includes("✔") && auditTxt.includes("内部算术一致性"),
    auditTxt.slice(0, 60) + "…");

  // ---- hero: the entry point reaches the control, and the evidence is near the top
  const hero = await page.evaluate(() => {
    const cta = document.getElementById("start-explore");
    const chart = document.getElementById("chart-frame").getBoundingClientRect();
    return { cta: !!cta, ctaText: cta?.textContent.trim(),
      chartTopFromViewport: Math.round(chart.top + window.scrollY - window.innerHeight) };
  });
  note("hero offers an explicit 开始探索 entry point", hero.cta && /开始探索/.test(hero.ctaText),
    hero.ctaText || "missing");
  note("Act I chart is reachable within one screenful of the hero", hero.chartTopFromViewport < 0,
    `chart bottom sits ${hero.chartTopFromViewport}px below the first viewport`);
  await shot(page, "00-hero-1440.png");                      // the first screen, before any jump
  await page.click("#start-explore");
  await page.waitForFunction(() => document.activeElement?.name === "scope", null, { timeout: 4000 });
  const focused = await page.evaluate(() => ({
    tag: document.activeElement?.tagName, name: document.activeElement?.name,
    toggleInView: document.getElementById("scope-toggle").getBoundingClientRect().top > 0
      && document.getElementById("scope-toggle").getBoundingClientRect().bottom < window.innerHeight,
  }));
  note("开始探索 moves focus to the scope control and brings it into view",
    focused.tag === "INPUT" && focused.name === "scope" && focused.toggleInView, JSON.stringify(focused));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);

  // ---- Act I: fixed axis in both states + legend state + focusability
  const ticksPaid = await page.$$eval("#chart svg .axis-tick", els => els.map(e => e.textContent));
  const tabindexPaid = await page.$$eval('#chart rect[aria-label*="无酬"]', els => els.map(e => e.getAttribute("tabindex")));
  note("Act I axis is fixed 0…360 in the paid state",
    ticksPaid[0] === "0" && ticksPaid[ticksPaid.length - 1] === "360", ticksPaid.join(","));
  note("Act I unpaid segments are not focusable when excluded",
    tabindexPaid.length > 0 && tabindexPaid.every(t => t === "-1"), tabindexPaid.join(","));
  await shot(page, "01-act1-paid-1440.png");

  await setScope(page, "both");
  const sBoth = await page.evaluate(() => window.__D1__.snapshot());
  const ticksBoth = await page.$$eval("#chart svg .axis-tick", els => els.map(e => e.textContent));
  note("Act I switches to the total gap with the female-longer verdict",
    sBoth.scopeView.deltaText === "+25.9" && sBoth.scopeView.verdict === "▲ 女性更长",
    `${sBoth.scopeView.deltaText} ${sBoth.scopeView.verdict}`);
  note("Act I keeps the same 0…360 axis after the switch",
    JSON.stringify(ticksBoth) === JSON.stringify(ticksPaid), ticksBoth.join(","));
  note("Act I bars show both segments in the combined scope",
    sBoth.bars.every(b => b.segments[1].value > 1 && b.segments[1].included));
  const legendState = await page.evaluate(() => ({
    text: document.getElementById("lg-unpaid-state").textContent,
    excluded: document.querySelector(".lg-unpaid").classList.contains("is-excluded"),
    opacity: getComputedStyle(document.querySelector(".lg-unpaid")).opacity,
  }));
  note("legend states the scope in words (not by dimming text) and stays fully opaque",
    legendState.text.includes("已计入") && !legendState.excluded && legendState.opacity === "1",
    JSON.stringify(legendState));
  const unpaidFocusable = await page.$$eval('#chart rect[aria-label*="无酬"]', els =>
    els.filter(e => e.getAttribute("tabindex") === "0").length);
  note("Act I unpaid segments become focusable when included", unpaidFocusable === 2, String(unpaidFocusable));
  await shot(page, "02-act1-both-1440.png");

  // ---- tooltip on hover, and it must stay inside the frame
  await page.hover('#chart rect[aria-label*="男性"]');
  await page.waitForTimeout(150);
  const tip = await page.evaluate(() => {
    const t = document.getElementById("tooltip");
    const f = document.getElementById("chart-frame").getBoundingClientRect();
    const r = t.getBoundingClientRect();
    return { hidden: t.hidden, text: t.textContent, inside: r.right <= f.right + 2 && r.left >= f.left - 2 && r.width > 0 };
  });
  note("tooltip appears on hover and stays inside the chart frame",
    !tip.hidden && tip.inside && /参与率/.test(tip.text), tip.text.slice(0, 40));
  await shot(page, "03-act1-tooltip-1440.png");

  // ---- keyboard: radio group arrow switching + visible focus ring
  await page.focus('input[name="scope"][value="both"]');
  await page.keyboard.press("ArrowLeft");
  await page.waitForFunction(() => window.__D1__.state.scope === "paid", null, { timeout: 4000 });
  note("keyboard ArrowLeft returns to the paid scope", true);
  const liveTxt = await page.textContent("#state-note p[role=status]").catch(() => "");
  note("screen-reader live region announces the current scope",
    (await page.$eval("#state-note", n => n.textContent)).includes("当前口径"), "role=status inside #state-note");

  // ---- Act II bridge stages
  for (const [i, expect] of [["0", "−73.9"], ["1", "+25.9"], ["2", "+25.9"]]) {
    await page.click(`.step-btn[data-stage="${i}"]`);
    await page.waitForTimeout(120);
    const r = await page.evaluate(() => {
      const ro = document.getElementById("bridge-readout");
      return { value: ro.querySelector("#br-value").textContent, stage: ro.dataset.stage,
        kicker: ro.querySelector("#br-kicker").textContent, bars: document.querySelectorAll("#bridge svg rect").length };
    });
    note(`Act II stage ${i} readout = ${expect} with bars drawn`,
      r.value === expect && r.stage === i && r.bars >= 2, `${r.value} / ${r.kicker}`);
    if (i !== "2") await shot(page, `04-act2-stage${i}-1440.png`);
  }
  await page.click("#bridge-next");
  note("Act II “下一步” advances the stage",
    (await page.getAttribute("#bridge-readout", "data-stage")) === "0");
  await page.click('.step-btn[data-stage="2"]');
  await page.waitForTimeout(120);
  await shot(page, "05-act2-total-1440.png");
  const unpaidQuote = await page.textContent("#unpaid-def-quote");
  note("Act II shows the verbatim official unpaid-labour definition",
    unpaidQuote.includes("无酬劳动领域包括") && unpaidQuote.includes("公益志愿")
    && unpaidQuote.includes("购买商品或服务"), unpaidQuote.slice(0, 40) + "…");

  // ---- Act III tabs + decomposition
  for (const aid of ["unpaid", "discretionary", "paid"]) {
    await page.click(`#comp-tabs [data-aid="${aid}"]`);
    await page.waitForTimeout(150);
    const c = await page.evaluate(() => window.__D1__.snapshot());
    note(`Act III tab ${aid}: composition and decomposition agree on the same gap`,
      c.compAid === aid && Math.abs(c.composition.gap_min - c.decomposition.gap) < 1e-9
      && c.composition.rows.length === 2,
      `${c.composition.gap_min} vs ${c.decomposition.gap}`);
  }
  const compTxt = await page.textContent("#comp-panel");
  note("Act III composition panel names both denominators",
    compTxt.includes("该性别全体") && compTxt.includes("参与者"), compTxt.slice(0, 50).replace(/\s+/g, " "));
  await page.click("#decomp-details summary");
  await page.waitForTimeout(200);
  const decomp = await page.evaluate(() => {
    const host = document.getElementById("decomp-host");
    return { open: document.getElementById("decomp-details").open,
      dashed: host.querySelectorAll('line[stroke-dasharray]').length,
      caps: host.querySelectorAll("line").length,
      gap: host.dataset.gap, terms: host.dataset.terms,
      rows: document.querySelectorAll("#decomp-table-body tr").length,
      text: host.textContent };
  });
  note("Act III decomposition view opens with a scoped dashed reference line",
    decomp.open && decomp.dashed === 1 && decomp.rows === 3, `dashed=${decomp.dashed} rows=${decomp.rows}`);
  note("Act III decomposition terms match the audited gate2 values",
    decomp.terms === "-47.437,-26.435" && decomp.gap === "-73.873", `${decomp.terms} / ${decomp.gap}`);
  note("Act III decomposition caption states it is not an error bar",
    decomp.text.includes("不是误差棒"), "");
  const tbl = await page.evaluate(() => {
    const t = document.querySelector("#decomp-table"), box = t.closest(".table-scroll");
    const last = t.querySelector("thead tr").lastElementChild.getBoundingClientRect();
    const host = box.getBoundingClientRect();
    return { tableW: t.scrollWidth, boxW: Math.round(box.clientWidth),
      lastColRight: Math.round(last.right), boxRight: Math.round(host.right),
      lastColText: t.querySelector("thead tr").lastElementChild.textContent.trim() };
  });
  note("Act III decomposition table shows its last column without clipping (desktop)",
    tbl.tableW <= tbl.boxW + 1 && tbl.lastColRight <= tbl.boxRight + 1 && /原始差额/.test(tbl.lastColText),
    JSON.stringify(tbl));
  await shot(page, "06-act3-decomposition-1440.png");
  await page.click('#comp-tabs [data-aid="unpaid"]');
  await page.waitForTimeout(150);
  const decompU = await page.evaluate(() => document.getElementById("decomp-host").dataset.terms);
  note("Act III decomposition follows the selected activity",
    decompU === "26.322,73.429", decompU);
  await shot(page, "07-act3-unpaid-1440.png");
  // keyboard tablist
  await page.focus('#comp-tabs [data-aid="unpaid"]');
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  note("Act III tabs support arrow-key navigation",
    (await page.evaluate(() => window.__D1__.state.compAid)) === "discretionary");

  // ---- Act IV lenses
  const lens = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".lens")];
    return cards.map(c => ({
      key: c.dataset.lens,
      oneline: c.querySelector(".lens-oneline")?.textContent.replace(/\s+/g, " ").trim(),
      doi: c.querySelector(".lens-cite a")?.getAttribute("href"),
      cite: c.querySelector(".lens-cite")?.textContent.replace(/\s+/g, " ").trim(),
      chips: [...c.querySelectorAll(".status-chip")].map(s => s.textContent),
      metric: c.querySelector(".lens-metric")?.textContent,
      boundaryHeads: [...c.querySelectorAll(".lens-boundary .lens-sec h4")].map(h => h.textContent),
      boundaryVisible: !!c.querySelector(".lens-boundary")
        && c.querySelector(".lens-boundary").offsetParent !== null,
      reads: [...c.querySelectorAll("details.lens-read")].map(d => ({
        head: d.querySelector("summary").textContent.trim(), open: d.open })),
    }));
  });
  note("Act IV: three lenses, each with a one-line takeaway and a visible evidence boundary",
    lens.length === 3 && lens.every(l => l.oneline && l.boundaryVisible
      && l.boundaryHeads.length === 2 && /本次调查实际测到/.test(l.boundaryHeads[0])
      && /不能证明/.test(l.boundaryHeads[1])),
    lens.map(l => `${l.key}:${l.boundaryHeads.length}`).join(" "));
  note("Act IV: framework and future-test layers are opt-in (collapsed by default)",
    lens.every(l => l.reads.length === 2 && l.reads.every(r => !r.open)),
    lens.map(l => l.reads.map(r => r.open).join(",")).join(" | "));
  const doiOk = lens.map(l => l.doi);
  note("Act IV DOI links point at the three verified records",
    doiOk.includes("https://doi.org/10.1002/9781118663219.wbegss183")
    && doiOk.includes("https://doi.org/10.1177/0003122419859007")
    && doiOk.includes("https://doi.org/10.1038/s41562-020-0920-z"), doiOk.join(" "));
  note("Act IV citations carry author, year, title and venue from Crossref",
    lens.every(l => /（20\d\d）/.test(l.cite) && l.cite.length > 60), lens[1].cite.slice(0, 70));
  note("Act IV every card states what is NOT measured",
    lens.every(l => l.chips.some(c => /未测量/.test(c))), "");
  note("Act IV metric lines are generated from the data layer",
    lens.every(l => l.metric && /分钟\/天/.test(l.metric)), "");
  const bodyTxt = await page.textContent("#act-4");
  note("Act IV wording: cognitive labour framed as a dimension, not a separate category",
    /家庭劳动的一个维度/.test(bodyTxt) && !/另一类活动/.test(bodyTxt.replace(/不是与家务并列的另一类活动/g, "")),
    "");
  note("Act IV wording: role theory kept non-essentialist and explicitly unverified",
    /可能与劳动分配相关/.test(bodyTxt) && /不能把该理论当作已识别的因果解释/.test(bodyTxt), "");
  note("Act IV wording: the Perspective article is used only for the objective/subjective distinction",
    /未在本包内逐字核对/.test(bodyTxt) && /Perspective（观点文章）/.test(bodyTxt), "");
  const typeChip = await page.evaluate(() => {
    const c = document.querySelector('[data-lens="giurge_whillans_west_2020"]');
    return { chips: [...c.querySelectorAll(".status-chip")].map(x => x.textContent.trim()),
      data: window.__D1__.DATA.literature.find(l => l.key === "giurge_whillans_west_2020").article_type };
  });
  note("Act IV renders the publisher article type from the data layer (Perspective, not Review)",
    typeChip.data === "Perspective"
    && typeChip.chips.some(x => /文献类型：Perspective/.test(x))
    && !typeChip.chips.some(x => /Review/.test(x)), JSON.stringify(typeChip));
  note("public copy no longer calls the page a prototype",
    !/研究原型/.test(await page.textContent("body")), "");
  await page.locator("#lens-grid").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, "08-act4-lenses-1440.png", { fullPage: false });
  await page.locator("#act-4").scrollIntoViewIfNeeded();
  await shot(page, "08b-act4-full-1440.png");
  await page.click("#lens-compare");
  await page.waitForTimeout(150);
  const cmp = await page.evaluate(() => ({
    pressed: document.getElementById("lens-compare").getAttribute("aria-pressed"),
    on: document.getElementById("lens-grid").classList.contains("compare"),
    readOpacity: getComputedStyle(document.querySelector(".lens-read")).opacity,
    btnText: document.getElementById("lens-compare").textContent.trim(),
  }));
  note("Act IV control label and helper text agree (no stale 提亮 wording)",
    /只看证据边界|退出边界模式/.test(cmp.btnText)
    && await page.evaluate(() => /不压暗/.test(document.querySelector(".lens-toolbar .fine").textContent)),
    cmp.btnText);
  note("Act IV boundary mode toggles, is announced, and never dims text to signal state",
    cmp.pressed === "true" && cmp.on && cmp.readOpacity === "1" && /退出/.test(cmp.btnText),
    JSON.stringify(cmp));
  await shot(page, "09-act4-compare-1440.png");
  await page.click("#lens-compare");

  // ---- Act V dossier
  const dossier = await page.evaluate(() => ({
    sources: [...document.querySelectorAll("#source-chain .src-item")].map(n => ({
      role: n.querySelector(".src-role").textContent,
      url: n.querySelector("a").getAttribute("href"),
      hash: (n.querySelector(".src-meta").textContent.match(/SHA-256 ([0-9a-f]{16})/) || [])[1],
    })),
    precisionRows: document.querySelectorAll("#precision-body tr").length,
    boundsRows: document.querySelectorAll("#bounds-body tr").length,
    scopeItems: document.querySelectorAll("#scope-list li").length,
    files: document.querySelectorAll("#file-list li").length,
    checks: document.querySelectorAll("#check-list li").length,
    canItems: document.querySelectorAll(".claim.yes li").length,
    cannotItems: document.querySelectorAll(".claim.no li").length,
    summary: document.getElementById("dossier-summary").textContent,
    weight: document.getElementById("weight-quote").textContent,
    sample: document.getElementById("sample-quote").textContent,
  }));
  const urlOf = k => (dossier.sources.find(s => s.role.includes(k)) || {}).url || "";
  note("Act V source chain labels the three bulletins correctly",
    urlOf("第一号").includes("1957217") && urlOf("第二号").includes("1957216")
    && urlOf("第三号").includes("1957215") && urlOf("分性别").includes("1957215"),
    dossier.sources.map(s => s.url.slice(-22)).join(" "));
  note("Act V source chain has 4 entries with snapshot hashes",
    dossier.sources.length === 4 && dossier.sources.every(s => s.hash),
    dossier.sources.map(s => s.hash).join(","));
  note("Act V precision table lists 6 published→derived chains", dossier.precisionRows === 6, String(dossier.precisionRows));
  note("Act V rounding-only bounds table lists 4 rows", dossier.boundsRows === 4, String(dossier.boundsRows));
  note("Act V can/cannot columns are both populated", dossier.canItems >= 3 && dossier.cannotItems >= 4,
    `${dossier.canItems}/${dossier.cannotItems}`);
  note("Act V quotes the weighting and sample notes verbatim",
    dossier.weight.includes("5/7") && dossier.weight.includes("2/7") && dossier.sample.includes("6 周岁及以上"));
  note("Act V summary sentence carries the three headline differences",
    /−73\.9/.test(dossier.summary) && /\+99\.8/.test(dossier.summary) && /\+25\.9/.test(dossier.summary),
    dossier.summary.slice(0, 60) + "…");
  await page.locator("#act-5").scrollIntoViewIfNeeded();
  await shot(page, "10-act5-dossier-1440.png");

  // ---- rail navigation + progress
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
  const rail0 = await page.evaluate(() => document.querySelector('[data-rail][aria-current="step"]')?.dataset.rail);
  await page.locator("#act-3").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const rail = await page.evaluate(() => ({
    current: document.querySelector('[data-rail][aria-current="step"]')?.dataset.rail,
    width: document.getElementById("rail-progress-bar").style.width,
  }));
  note("act rail tracks the current section and shows progress",
    rail0 === "act-1" && rail.current === "act-3" && rail.width !== "" && rail.width !== "0%",
    `${rail0} -> ${rail.current} @ ${rail.width}`);
  await page.click('[data-rail="act-5"]');
  await page.waitForTimeout(600);
  const clearance = await page.evaluate(() => {
    const rail = document.getElementById("act-rail").getBoundingClientRect();
    const head = document.querySelector("#act-5 .act-num").getBoundingClientRect();
    return { railBottom: Math.round(rail.bottom), headTop: Math.round(head.top) };
  });
  note("anchored jumps do not hide the act label behind the sticky rail",
    clearance.headTop >= clearance.railBottom, JSON.stringify(clearance));
  note("rail links jump to the target act",
    await page.evaluate(() => {
      const r = document.getElementById("act-5").getBoundingClientRect();
      return Math.abs(r.top) < window.innerHeight * 0.6;
    }));

  // ---- links audit
  const links = await page.$$eval("a[href]", as => as.map(a => a.getAttribute("href")));
  const external = links.filter(h => /^https?:/.test(h));
  note("all external links are https and on allowed hosts",
    external.every(h => /^(https):\/\/[^"]+$/.test(h))
    && external.every(h => /stats\.gov\.cn|doi\.org|nature\.com|wiley\.com|sage/.test(h) || h.startsWith("https://www.stats"))
    && !links.some(h => h === "#" || h === ""), `${external.length} external`);
  const dead = links.filter(h => !/^https?:/.test(h) && !h.startsWith("#") && !/^mailto:/.test(h));
  const deadMissing = [];
  for (const h of new Set(dead)) {
    const url = new URL(h, BASE).href;
    const res = await page.request.get(url).catch(() => null);
    if (!res || !res.ok()) deadMissing.push(`${h} -> ${res ? res.status() : "ERR"}`);
  }
  note("all internal relative links resolve", deadMissing.length === 0, deadMissing.join(" | "));
  await ctx.close();
}

/* ============================ 2. responsive pass ============================ */
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const { ctx, page } = await openPage(vp);
  await overflow(page, `${name}/paid`);
  await shot(page, `r-${name}-paid.png`);
  await setScope(page, "both");
  await overflow(page, `${name}/both`);
  await shot(page, `r-${name}-both.png`);
  const ok = await page.evaluate(() => window.__D1__.snapshot().scopeView.deltaText === "+25.9");
  note(`${name}: combined scope reachable`, ok);
  // numbers must never collide with the frame edge
  const clip = await page.evaluate(() => {
    const svg = document.querySelector("#chart svg");
    const r = svg.getBoundingClientRect();
    const host = svg.parentElement.getBoundingClientRect();
    return { svgW: Math.round(r.width), hostW: Math.round(host.width), vb: svg.getAttribute("viewBox") };
  });
  note(`${name}: chart fits its column without clipping`,
    clip.svgW <= clip.hostW + 1 && clip.vb.startsWith("0 0"), `${clip.svgW}/${clip.hostW}`);
  if (name === "phone375" || name === "phone390") {
    // mobile reading order: the chart must sit directly under the control + readout
    const order = await page.evaluate(() => {
      const y = sel => Math.round(document.querySelector(sel).getBoundingClientRect().top + window.scrollY);
      return { q: y(".question"), t: y("#scope-toggle"), d: y("#delta-box"), c: y("#chart-frame"), n: y("#state-note") };
    });
    note("mobile reading order is question → choice → readout → chart → note",
      order.q < order.t && order.t < order.d && order.d < order.c && order.c < order.n,
      JSON.stringify(order));
    const tap = 44;
    const chipH = await page.$eval(".scope-chip", e => e.getBoundingClientRect().height);
    note("mobile toggle chips offer a ≥44px touch target", chipH >= tap, `${Math.round(chipH)}px`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    for (const [anchor, file] of [["#act-1", "act1"], ["#act-2", "act2"], ["#act-3", "act3"],
      ["#act-4", "act4"], ["#act-5", "act5"]]) {
      await page.locator(anchor).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await shot(page, `m-${name}-${file}.png`);
    }
    // current-section readout must follow the reader, and the active chip must be revealed
    await page.locator("#act-4").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const cur = await page.evaluate(() => {
      const list = document.querySelector(".rail-list");
      const a = document.querySelector('[data-rail][aria-current="step"]');
      const lbl = document.getElementById("rail-current");
      return { label: lbl.textContent.trim(), data: lbl.dataset.current,
        shown: getComputedStyle(lbl).display !== "none",
        scrollLeft: Math.round(list.scrollLeft),
        chipVisible: a ? (a.getBoundingClientRect().left >= list.getBoundingClientRect().left - 1
          && a.getBoundingClientRect().right <= list.getBoundingClientRect().right + 1) : false };
    });
    note(`${name}: the rail names the current act and reveals its chip`,
      cur.shown && cur.data === "act-4" && /4\/5/.test(cur.label) && cur.scrollLeft > 0 && cur.chipVisible,
      JSON.stringify(cur));
    await shot(page, `m-${name}-nav-act4.png`);
    await page.locator("#act-2").scrollIntoViewIfNeeded();
    await page.locator("#act-4").scrollIntoViewIfNeeded();
    await shot(page, `m-${name}-act4.png`);
    await page.locator("#act-5").scrollIntoViewIfNeeded();
    await shot(page, `m-${name}-act5.png`);
  }
  await ctx.close();
}

/* ============================ 2a. between-act pagers ============================ */
{
  const { ctx, page } = await openPage(VIEWPORTS.desktop);
  const pagers = await page.evaluate(() => [...document.querySelectorAll(".act-pager")].map(n => ({
    prev: n.querySelector(".pager.prev")?.getAttribute("href") || null,
    next: n.querySelector(".pager.next")?.getAttribute("href") || null,
    end: !!n.querySelector(".pager.end"),
  })));
  const want = [
    { prev: null, next: "#act-2" }, { prev: "#act-1", next: "#act-3" },
    { prev: "#act-2", next: "#act-4" }, { prev: "#act-3", next: "#act-5" },
    { prev: "#act-4", next: null },
  ];
  note("every act carries a pager to the previous/next act",
    pagers.length === 5 && pagers.every((x, i) => x.next === want[i].next
      && x.prev === want[i].prev && x.end === (i === 4)), JSON.stringify(pagers));
  await ctx.close();
}

/* ============================ 2b. full-page overview pass (1x) ============================ */
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const { ctx, page } = await openPage(vp, { dsf: 1 });
  await shot(page, `full-${name}-paid.png`, { fullPage: true });
  await setScope(page, "both");
  await shot(page, `full-${name}-both.png`, { fullPage: true });
  await ctx.close();
}

/* ============================ 3. touch + tooltip dismissal ============================ */
{
  const { ctx, page } = await openPage(VIEWPORTS.phone375, { hasTouch: true });
  await setScope(page, "both");
  // the SVG is replaced on every render, so a locator can go stale between resolution and
  // action; retry until the element survives long enough to be tapped
  const seg = page.locator('#chart rect[aria-label*="无酬"][tabindex="0"]').last();
  for (let i = 0; ; i++) {
    try { await seg.scrollIntoViewIfNeeded({ timeout: 2000 }); await seg.tap({ timeout: 2000 }); break; }
    catch (e) { if (i > 6) throw e; await page.waitForTimeout(250); }
  }
  await page.waitForTimeout(200);
  note("touch tap opens the segment tooltip", await page.$eval("#tooltip", t => !t.hidden));
  await shot(page, "11-mobile-tap-tooltip-375.png");
  await page.touchscreen.tap(10, 40);
  await page.waitForTimeout(200);
  note("tapping elsewhere closes the tooltip", await page.$eval("#tooltip", t => t.hidden));
  await ctx.close();
}

/* ============================ 4. reduced motion ============================ */
{
  const { ctx, page } = await openPage(VIEWPORTS.desktop, { reducedMotion: "reduce" });
  const t0 = Date.now();
  await page.check('input[name="scope"][value="both"]', { force: true });
  await page.waitForFunction(() => window.__D1__.snapshot().scopeView.deltaText === "+25.9", null, { timeout: 3000 });
  note("reduced motion: state lands instantly (no animation frames)", Date.now() - t0 < 400, `${Date.now() - t0}ms`);
  const dur = await page.$eval(".minibar-fill", e => getComputedStyle(e).transitionDuration);
  const anim = await page.evaluate(() => window.__D1__.state.anim);
  note("reduced motion: CSS transitions disabled", dur === "0s", dur);
  note("reduced motion: no pending animation frame handle", anim === null, String(anim));
  await ctx.close();
}

/* ============================ 5. keyboard walk + focus visibility ============================ */
{
  const { ctx, page } = await openPage(VIEWPORTS.desktop);
  const focusables = await page.evaluate(() => {
    const sel = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),summary';
    return [...document.querySelectorAll(sel)].length;
  });
  note("page exposes a reasonable number of tab stops", focusables > 20 && focusables < 200, String(focusables));
  const ring = await page.evaluate(() => {
    const b = document.querySelector('.step-btn[data-stage="1"]');
    b.focus();
    const s = getComputedStyle(b);
    return { w: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor };
  });
  note("focus ring is visible on buttons", ring.style !== "none" && parseFloat(ring.w) >= 2,
    `${ring.w} ${ring.style} ${ring.color}`);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  note("Enter activates the focused stage button",
    (await page.getAttribute("#bridge-readout", "data-stage")) === "1");
  // details/summary keyboard
  const sumOk = await page.evaluate(() => {
    const s = document.querySelector("#act1-detail summary");
    s.focus();
    return document.activeElement === s;
  });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  note("details/summary expand from the keyboard",
    sumOk && await page.$eval("#act1-detail", d => d.open));
  await ctx.close();
}

/* ============================ 6. contrast audit (WCAG AA) ============================ */
{
  const { ctx, page } = await openPage(VIEWPORTS.desktop);
  const pairs = await page.evaluate(() => {
    const lum = c => {
      const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = s => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
    const bgOf = el => {
      // stack translucent backgrounds over their parents, then over the page colour
      const stack = [];
      let n = el;
      while (n && n !== document.documentElement) {
        const c = getComputedStyle(n).backgroundColor;
        const m = (c.match(/[\d.]+/g) || []).map(Number);
        if (m.length >= 3 && !(m.length === 4 && m[3] === 0)) {
          stack.push(m.length === 4 ? m : [...m, 1]);
          if ((m.length < 4 || m[3] >= 0.999)) break;
        }
        n = n.parentElement;
      }
      let out = [250, 246, 239];                       // --page
      for (const c of stack.reverse()) {
        const a = c.length === 4 ? c[3] : 1;
        out = [0, 1, 2].map(i => c[i] * a + out[i] * (1 - a));
      }
      return out.map(Math.round);
    };
    const out = [];
    const targets = [
      ".standfirst", ".howto", ".act-findings", ".scope-sub", ".delta-label", ".state-note #state-note-sub",
      ".chart-caption", ".fine", ".context-chips li", ".verbatim", ".category-chips li", ".bridge-caveat",
      ".lens-sec p", ".lens-cite", ".status-chip", ".claim li", ".src-supply", ".src-meta", ".audience-list li",
      ".rail-list a", ".disc-limit", ".audit-line", ".minibar-label", ".mini-axis", ".comp-total",
      "#state-note-main", ".delta-value", ".br-note", ".tab-tag", ".foot", ".masthead-meta .dim",
      ".chart-caption a", ".delta-verdict", ".tooltip", ".lens-index", ".minibar-val", ".step-btn",
      ".verbatim cite", ".formula", ".code-block",
      ".lens-oneline", ".lens-boundary p", ".cta", ".cta-alt", ".rail-current",
      ".act-pager .pager", ".act-pager .end",
    ];
    // literal colour pairs used inside the SVG canvases (computed from the paint values, not
    // DOM text: they are attributes on <text>/<rect>, and each is duplicated in prose/tooltip)
    const lum2 = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const ratio2 = (f, g) => { const a1 = lum2(f), b1 = lum2(g); return Math.round(((Math.max(a1, b1) + 0.05) / (Math.min(a1, b1) + 0.05)) * 100) / 100; };
    const literal = [
      ["in-bar paid label", "#f4f1ea", "#183b56"],
      ["in-bar unpaid label", "#fdf6f0", "#a8522d"],
      ["axis tick on paper", "#6d6a63", "#faf6ef"],
      ["verdict navy", "#183b56", "#faf6ef"],
      ["verdict teal", "#2e6f63", "#faf6ef"],
      ["gold lens index", "#a67c2e", "#faf6ef"],
    ].map(([name, f, g]) => ({ name, ratio: ratio2(hex(f), hex(g)), fg: f, bg: g }));
    for (const sel of targets) {
      const el = document.querySelector(sel);
      if (!el) { out.push({ sel, missing: true }); continue; }
      const cs = getComputedStyle(el);
      const fg = parse(cs.color), bg = bgOf(el);
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const px = parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 700;
      const large = px >= 24 || (px >= 18.66 && bold);
      out.push({ sel, ratio: Math.round(ratio * 100) / 100, px, large, fg: cs.color, bg: `rgb(${bg.join(",")})`,
        text: el.textContent.trim().slice(0, 18) });
    }
    return { dom: out, literal };
  });
  const missing = pairs.dom.filter(p => p.missing);
  const below = pairs.dom.filter(p => !p.missing && p.ratio < (p.large ? 3 : 4.5));
  note("contrast probe covered the intended selectors", missing.length === 0, missing.map(m => m.sel).join(","));
  note("all sampled text meets WCAG AA (4.5:1 body / 3:1 large)", below.length === 0,
    below.map(b => `${b.sel} ${b.ratio}:1 (${b.text})`).join(" | "));
  const litBelow = pairs.literal.filter(l => l.ratio < 3);
  note("literal paint pairs inside SVG keep >=3:1 (and are duplicated in prose)",
    litBelow.length === 0, litBelow.map(l => `${l.name} ${l.ratio}:1`).join(" | "));
  console.log("literal pairs: " + pairs.literal.map(l => `${l.name} ${l.ratio}`).join(" | "));
  fs.writeFileSync(path.join(EVID, "contrast-audit.json"),
    JSON.stringify({ dom_measured: pairs.dom, literal_paint_pairs: pairs.literal }, null, 2));
  console.log(`contrast table written to docs/contrast-audit.json (${pairs.dom.length} DOM + ${pairs.literal.length} literal pairs)`);
  await ctx.close();
}

/* ============================ 7. a11y structure ============================ */
{
  const { ctx, page } = await openPage(VIEWPORTS.desktop);
  const a = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll("svg")];
    return {
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelectorAll("h1").length,
      h2: [...document.querySelectorAll("h2")].map(h => h.textContent.trim()),
      svgNoLabel: svgs.filter(s => !s.getAttribute("aria-label") && !s.getAttribute("aria-hidden")).length,
      imgNoAlt: [...document.querySelectorAll("img")].filter(i => !i.alt).length,
      tabs: document.querySelectorAll('[role="tab"]').length,
      selected: document.querySelectorAll('[role="tab"][aria-selected="true"]').length,
      tabpanel: document.querySelectorAll('[role="tabpanel"]').length,
      live: document.querySelectorAll('[role="status"]').length,
      landmarks: ["header", "nav", "main", "footer"].filter(t => document.querySelector(t)).length,
      tablesWithCaption: [...document.querySelectorAll("table")].every(t => !!t.querySelector("caption")),
      skip: !!document.querySelector(".skip-link"),
      buttonsUnnamed: [...document.querySelectorAll("button")].filter(b => !b.textContent.trim()
        && !b.getAttribute("aria-label")).length,
      linksUnnamed: [...document.querySelectorAll("a")].filter(x => !x.textContent.trim() && !x.getAttribute("aria-label")).length,
    };
  });
  note("lang, single h1 and five h2 act titles", a.lang === "zh-CN" && a.h1 === 1 && a.h2.length === 5,
    a.h2.join(" / "));
  note("every SVG carries an accessible name", a.svgNoLabel === 0, `${a.svgNoLabel} unnamed`);
  note("tablist has exactly one selected tab and a panel", a.tabs === 3 && a.selected === 1 && a.tabpanel === 1);
  note("landmarks, skip link and live region present", a.landmarks === 4 && a.skip && a.live >= 1);
  note("no unnamed buttons/links", a.buttonsUnnamed === 0 && a.linksUnnamed === 0);
  note("every data table has a caption", a.tablesWithCaption);
  await ctx.close();
}

/* ============================ 7b. report page (cross-page anchor target) ============================ */
{
  const { page, errors } = await openPage(VIEWPORTS.desktop, { dsf: 1 });
  const ctx = page.context();
  for (const [w, h, tag] of [[1440, 900, "1440"], [375, 812, "375"]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(BASE + "report/index.html", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth,
      tables: document.querySelectorAll("table").length,
      wrapped: [...document.querySelectorAll("table")].every(t => t.parentElement.classList.contains("table-scroll")),
      internalNote: !!document.querySelector("main").textContent.match(/Research Director/),
      quotesRemovedLine: document.body.textContent.includes("由图表修订流程") }));
    note(`report page @ ${tag}: no overflow, tables wrapped, internal process notes absent from body`,
      o.sw <= o.iw + 1 && o.tables === 3 && o.wrapped && !o.internalNote && !o.quotesRemovedLine,
      JSON.stringify(o));
    await page.screenshot({ path: path.join(OUT, `report-${tag}.png`), fullPage: true });
  }
  const back = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].map(x => x.getAttribute("href"));
    return a.filter(h => h && !/^https?:/.test(h));
  });
  note("report links back into the story", back.some(h => h.includes("../index.html")), back.join(" "));
  await ctx.close();
}

/* ============================ 8. axe (only if available locally) ============================ */
{
  let axePath = null;
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const c of [
    process.env.AXE_PATH,
    path.resolve(here, "..", "..", "devtools", "axe-core", "axe.min.js"),
    path.resolve(here, "..", "node_modules", "axe-core", "axe.min.js"),
  ].filter(Boolean)) if (fs.existsSync(c)) { axePath = c; break; }
  if (axePath) console.log("axe-core:", axePath, "version",
    JSON.parse(fs.readFileSync(path.join(path.dirname(axePath), "package.json"), "utf8")).version);
  if (!axePath) {
    console.log("[SKIP] axe-core not installed locally — automated a11y scan not run (declared in D1_VALIDATION_REPORT)");
  } else {
    const { ctx, page } = await openPage(VIEWPORTS.desktop);
    await page.addScriptTag({ path: axePath });
    const res = await page.evaluate(async () => await window.axe.run(document, {
      resultTypes: ["violations"], runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
    note("axe-core: 0 WCAG A/AA violations", res.violations.length === 0,
      res.violations.map(v => `${v.id}×${v.nodes.length}`).join(", "));
    fs.writeFileSync(path.join(EVID, "axe-violations.json"), JSON.stringify(res.violations, null, 2));
    await ctx.close();
  }
}

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(`\nbrowser validation: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log("FAILED ITEMS:");
  failed.forEach(f => console.log("  ✗ " + f.name + (f.detail ? "  -> " + f.detail : "")));
}
fs.writeFileSync(path.join(EVID, "browser-validation.json"),
  JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
