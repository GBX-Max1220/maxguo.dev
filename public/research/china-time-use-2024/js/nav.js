/* nav.js — ActNav: five-act progress rail. Pure information layer: it never
 * hijacks scrolling, never forces animation, and is decorative when unsupported.
 */
export function wireActRail({ rail, acts, progressBar, currentLabel }) {
  const links = [...rail.querySelectorAll("[data-rail]")];
  const byId = new Map(links.map(a => [a.dataset.rail, a]));
  const list = rail.querySelector(".rail-list");
  const index = new Map(acts.map((a, i) => [a.id, i]));

  function setCurrent(id) {
    links.forEach(a => a.removeAttribute("aria-current"));
    const a = byId.get(id);
    if (a) a.setAttribute("aria-current", "step");
    if (currentLabel) {
      const i = index.get(id);
      const title = a ? a.textContent.replace(/^[一二三四五]\s*/, "").trim() : "";
      currentLabel.innerHTML = `<span class="rail-count">${i + 1}/5</span>${title}`;
      currentLabel.dataset.current = id;
    }
    // keep the active chip visible inside the horizontally scrollable rail.
    // scrollLeft is set directly: scrollIntoView would also move the page vertically.
    if (a && list && list.scrollWidth > list.clientWidth) {
      const view = list.clientWidth;
      // centre it when it fits; otherwise at least bring its left edge into view
      const want = a.clientWidth >= view ? a.offsetLeft - 6
        : a.offsetLeft - (view - a.clientWidth) / 2;
      const max = list.scrollWidth - view;
      const clamped = Math.max(0, Math.min(max, want));
      if (Math.abs(list.scrollLeft - clamped) > 2) list.scrollTo({ left: clamped, behavior: "auto" });
    }
  }

  function setProgress(fraction) {
    if (progressBar) progressBar.style.width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
    if (rail) rail.style.setProperty("--rail-f", Math.round(fraction * 100) / 100);
  }

  // Geometric detection: the current act is the last one whose top has passed the
  // reading line (45% of the viewport). Robust at the very top of the page and while
  // scrolling fast, where an IntersectionObserver band can briefly match nothing.
  function syncCurrent() {
    const line = window.innerHeight * 0.45;
    let id = acts[0] && acts[0].id;
    for (const a of acts) if (a.getBoundingClientRect().top <= line) id = a.id;
    if (id) setCurrent(id);
    setProgress(scrollFraction());
  }
  const io = new IntersectionObserver(() => syncCurrent(),
    { rootMargin: "-20% 0px -55% 0px", threshold: [0, .25, .5, .75, 1] });
  acts.forEach(a => io.observe(a));
  document.addEventListener("visibilitychange", syncCurrent);

  function scrollFraction() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }
  window.addEventListener("scroll", syncCurrent, { passive: true });
  window.addEventListener("resize", syncCurrent);
  syncCurrent();

  // Deliberately NO opacity-based scroll reveal: content that a reader cannot see yet
  // must not depend on an observer firing, and a fade carries no statistical meaning.
  // The only motion on this page is state transition inside Acts I–III.
  return { setCurrent, setProgress };
}
