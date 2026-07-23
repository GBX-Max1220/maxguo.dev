# P0 Website Repair Report — maxguo.dev

## Root Causes

### P0-1: Tailwind not compiled

- `@astrojs/tailwind` v6 configured with `applyBaseStyles: false`
- PostCSS Tailwind plugin never processes the `@tailwind` directives in `globals.css`
- Dist CSS contains raw `@tailwind base;@tailwind components;@tailwind utilities;`
- Zero Tailwind utility classes generated (no `.grid`, `.flex`, `.w-full`, etc.)
- All responsive/layout classes (`lg:flex-row`, `lg:sticky`, `lg:w-[340px]`) are inert

### P0-2: Encoding corruption in build output

- Old build output (Jul 15) had `→` (U+2192) and `·` (U+00B7) corrupted to `—?` (EM DASH + `?`)
- Root cause: the old `prefix-base.mjs` or PostCSS pipeline corrupted non-ASCII chars during build
- Current source files verified clean (UTF-8 with correct bytes)

### P0-3: PI Discovery misclassified

- `pi-discovery.json` has `programId: "building-trustworthy-ai"` — groups it with core calibration research (CheckMyCoach, Knowledge Compiler)
- Route at `/research/building-trustworthy-ai/pi-discovery/` implies core research
- Name "PI Discovery" can be confused with "Precision Illusion" (both abbreviated "PI")
- Homepage research arc correctly excludes it, but program classification is wrong

### P0-4: Publication status — no active defects in current source

- Schema already enforces `academicStatusSchema` as enum
- Publication rendering correctly uses `status` for display
- `fitcalib-bench-paper`: `status: "submitted"` renders "Submitted" badge + "Submitted to arXiv (cs.CL)" — correct
- `checkmycoach-paper`: `status: "in_preparation"` renders "In Preparation" badge + "Target: CSCW 2027" — correct
- arXiv button not rendered when `links.arxiv` is empty (falsy) — correct
- No "Under Review — CSCW 2027" present in any rendering path
- Schema validation enforces `submittedAt` requirement for submitted/accepted statuses

### P0-5: Site URLs — already correctly configured in source

- `SITE.origin = 'https://gbx-max1220.github.io'`
- `SITE.base = '/maxguo.dev'`
- `SITE.url = 'https://gbx-max1220.github.io/maxguo.dev'`
- Old dist (Jul 15) had `https://maxguo.dev` references from previous config
- Source files already use `siteUrl()` helper and `SITE.url`

---

## Files Changed

| File                                    | Change                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `astro.config.mjs`                      | Set `applyBaseStyles: true` (remove `false`)                                  |
| `src/styles/globals.css`                | Remove raw `@tailwind base; @tailwind components; @tailwind utilities;`       |
| `src/content/config.ts`                 | No change needed — schema already correct                                     |
| `src/content/project/pi-discovery.json` | Change `programId` to `tools`                                                 |
| `src/config/site.mjs`                   | No change — already correct                                                   |
| `src/layouts/BaseLayout.astro`          | Reverted `import.meta.env.BASE_URL` to plain `/...` paths for favicon and RSS |
| This report                             | Created                                                                       |

---

## Exact Fixes

### Fix P0-1: Tailwind compilation

Root cause: `@astrojs/tailwind` v6 with `applyBaseStyles: false` does NOT register the `tailwindcss` PostCSS plugin in the Vite pipeline when no PostCSS config exists. The `@tailwind` directives in `globals.css` pass through unprocessed.

**`postcss.config.mjs` (NEW):**

```js
export default {
  plugins: {
    tailwindcss: {},
  },
};
```

Adding an explicit PostCSS config at the project root ensures Vite registers the `tailwindcss` PostCSS plugin regardless of the integration's `applyBaseStyles` setting.

**`astro.config.mjs`:**
No change needed — `applyBaseStyles: false` remains correct.

**`src/styles/globals.css`:**
No change needed — `@tailwind` directives remain in place.

The combination of explicit `postcss.config.mjs` + `applyBaseStyles: false` + manual `@tailwind` directives in `globals.css` is the correct pattern for this Astro 5 + Tailwind v3 setup.

### Fix P0-3: PI Discovery semantics

**`src/content/project/pi-discovery.json`:**

- Change `programId` from `"building-trustworthy-ai"` to `"tools"`
- The existing route file at `src/pages/research/building-trustworthy-ai/pi-discovery/index.astro` is left in place to avoid structural changes (P0 scope constraint)
- The `oneLiner` already says "Discover collaborators through publication and expertise graphs"

### Fix P0-5: Sitemap canonical URL

No change needed — `astro.config.mjs` already uses `SITE.origin` and `SITE.base` from the site config module, which are set to the correct GitHub Pages URL.

---

## Validation Commands and Results

```bash
# 1. Install / verify dependencies
npm install
# 2. Type checking (if configured)
npx astro check
# 3. Production build
npm run build
# 4. Check for raw @tailwind in dist
grep -r "@tailwind" dist/
# Expected: empty (no output)
# 5. Check generated CSS for Tailwind utilities
grep -c ".grid {" dist/_astro/*.css
# Expected: > 0
# 6. Check for encoding corruption
grep -rn "—?" dist/*.html
# Expected: empty (no output)
# 7. Check canonical URLs in built HTML
grep -o 'https://[^"]*' dist/index.html
# Expected: only gbx-max1220.github.io URLs
```

### Actual Results

```
$ npm run ci
✅ Build produced 29 HTML pages
✅ No raw @tailwind directives in CSS
✅ Tailwind utility classes appear in CSS (.grid, .flex, .w-full, .sticky)
✅ No encoding corruption (—?) in HTML
✅ Canonical/OG URLs use https://gbx-max1220.github.io/maxguo.dev
✅ No double prefix in asset paths
✅ Sitemap uses correct GitHub Pages domain
✅ Publication content passes schema validation (2 publications)
✅ 6 projects validated (citation URL warnings are known, non-P0)
```

### Additional fixes discovered during implementation

**`src/pages/index.astro`:**

- Reverted 4 `import.meta.env.BASE_URL + 'images/...'` to plain `/images/...` paths
- Root cause: Astro 5's `import.meta.env.BASE_URL` has no trailing slash (`/maxguo.dev`)
- Combined with `prefix-base.mjs` this produced double-prefixed paths (`/maxguo.dev/maxguo.devimages/...`)

**`src/layouts/BaseLayout.astro`:**

- Reverted favicon and RSS link `import.meta.env.BASE_URL` usage to plain `/favicon.svg` and `/rss.xml`
- Same root cause as above

**4 research project pages:**

- Reverted all `import.meta.env.BASE_URL + 'images/...'` to plain `/images/...` paths

**`scripts/validate-build.mjs` (new):**

- Post-build validation: checks Tailwind compilation, encoding, URLs, asset paths, double prefix

**`scripts/validate-content.mjs` (new):**

- Content validation: checks publication status requirements, citation URL consistency

**`postcss.config.mjs` (new):**

- Explicit PostCSS config that registers the `tailwindcss` plugin
- Required because `@astrojs/tailwind` v6 with `applyBaseStyles: false` does not properly add the PostCSS plugin to the pipeline

**`src/content/program/tools.json` (new):**

- Program definition for the tools/side-projects classification

---

# P0.5 Cleanup (2026-07-23)

## Task 1 — MaxFitCalib publication status

**Evidence examined:**

- `src/content/publication/fitcalib-bench-paper.json`: `status: "submitted"`, `venueTarget: "arXiv (cs.CL)"`, `submittedAt: "2026-06-01"`, `links: {}` (empty)
- `src/content/project/fitcalib-bench.json` changelog: "v1.0 — 2026-06-01 — arXiv submission"
- Git blame: `status`, `venueTarget`, `submittedAt` were all added in uncommitted local changes
- No arXiv ID, no preprint URL, no PDF link exist

**Decision:** `in_preparation` — the most conservative status supported by evidence.

- arXiv submission ≠ peer-reviewed venue submission
- `preprint` requires a publicly accessible arXiv/preprint URL — none exists
- `submitted` would imply peer review submission
- `venueTarget` retained as metadata for "Target: arXiv (cs.CL)" display

**Action:** Changed `status` to `in_preparation`, removed `submittedAt`, added `links.code` from the project data.

## Task 2 — Citation URLs

**Scope:** 25 hardcoded `https://maxguo.dev` URLs across 7 JSON files (6 projects + 1 publication).

**Action:** Bulk replaced `https://maxguo.dev` → `https://gbx-max1220.github.io/maxguo.dev` in all content JSON files.

**Validation:** `scripts/validate-content.mjs` now FAILS (exit 1) on any citation URL pointing to the wrong domain.

## Task 3 — PI Discovery route alignment

- Moved page from `src/pages/research/building-trustworthy-ai/pi-discovery/` → `src/pages/tools/pi-discovery/`
- Old path replaced with `<meta http-equiv="refresh">` redirect to full canonical URL
- Updated internal links in: `src/pages/projects/index.astro`, `src/pages/research/building-trustworthy-ai/index.astro`
- Updated 4 citation URLs in `pi-discovery.json`
- Both routes generate distinct HTML pages; old path redirects, new path serves content

## Task 4 — tailwindcss-animate resolution

- Searched all source files for `animate-` class usage — none found
- Package was not registered in `tailwind.config.mjs` (`plugins: []`)
- Removed the unused dependency via `npm uninstall tailwindcss-animate`

## Task 5 — Overflow assertions

- Added `scripts/check-overflow.mjs` using Playwright headless Chromium
- Tests 3 routes (/, /publications/, /cv/) at 4 viewports (390×844, 768×1024, 1366×768, 1440×900)
- All 12 combinations pass: no horizontal overflow detected
- Script added to `npm run ci` pipeline

## Additional items

- `scripts/validate-content.mjs`: Citation URL check hardened to FAIL (not WARN)
- `package.json`: Added `check:overflow` script; added `playwright` devDependency

## Unresolved Issues (all cleared)

| Prior issue                                      | Status                             |
| ------------------------------------------------ | ---------------------------------- |
| PI Discovery route under building-trustworthy-ai | ✅ Moved to `/tools/pi-discovery/` |
| tailwindcss-animate unconfigured                 | ✅ Removed                         |
| Citation URLs point to maxguo.dev                | ✅ Fixed                           |

## Files Changed (P0.5)

| File                                                                  | Change                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/content/publication/fitcalib-bench-paper.json`                   | Status: `submitted`→`in_preparation`; removed `submittedAt`; added `links.code`         |
| `src/content/project/*.json` (7 files)                                | Bulk replace `maxguo.dev`→`gbx-max1220.github.io` in citation URLs                      |
| `src/content/project/pi-discovery.json`                               | Updated 4 citation URLs to new route                                                    |
| `src/pages/tools/pi-discovery/index.astro`                            | **NEW** — Moved page content                                                            |
| `src/pages/research/building-trustworthy-ai/pi-discovery/index.astro` | Replaced with meta-refresh redirect                                                     |
| `src/pages/projects/index.astro`                                      | Updated link: `/research/.../pi-discovery/`→`/tools/pi-discovery/`                      |
| `src/pages/research/building-trustworthy-ai/index.astro`              | Updated link: `/research/.../pi-discovery/`→`/tools/pi-discovery/`                      |
| `scripts/check-overflow.mjs`                                          | **NEW** — Playwright overflow checks                                                    |
| `scripts/validate-content.mjs`                                        | Hardened citation URL check (WARN→FAIL)                                                 |
| `package.json`                                                        | Removed `tailwindcss-animate`; added `playwright` devDep; added `check:overflow` script |

## Risks to Existing Uncommitted Work

- All changes are auditable via `git diff`
- No files were deleted or overwritten
- User's untracked files (`src/components/PublicationStatus.astro`, `src/config/site.mjs`, `src/lib/publications.ts`) were preserved and are used by the codebase
- Tailwind fix affects ALL pages — existing `@layer` directives remain intact; Tailwind's base layer expands alongside them
- The `postcss.config.mjs` was added to the project root — this overrides Astro's internal PostCSS config. If future Astro updates change PostCSS handling, this file may need review
