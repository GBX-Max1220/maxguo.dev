# WEBSITE TRUTH SYNC — 2026-08-21

## Executive Verdict

The applicant-facing website (maxguo.dev) was audited against the canonical research-harness truth
layer and aligned with the current program state. The site was already substantially bounded by
prior claim-drift passes (through 2026-08-16), but **two accepted decisions made after the last
sync were not yet reflected**: (1) the Precision Illusion behavioral thread was KILLED/RETIRED on
2026-08-18, and (2) the M0 measurement schema v1 was canonically frozen on 2026-08-19 (M0 execution
NOT activated, human data collection NOT authorized). The pre-existing uncommitted working-tree
changes in this repo (dated 2026-08-16) predated those decisions and contained stale wording that
presented the PI behavioral experiment as the active research path; that wording was corrected to
the canonical state. All remaining surfaces were verified as already bounded and truthful.

Website repo: C:\Users\gbx12\projects\maxguo.dev (branch: main)
Starting status: DIRTY — pre-existing uncommitted changes (see below). No commit created.

## Website Repo

- **Path:** C:\Users\gbx12\projects\maxguo.dev
- **Branch:** main
- **Remote:** https://github.com/GBX-Max1220/maxguo.dev.git (unchanged; nothing pushed)
- **Framework/build:** Astro 5 (static), Tailwind v3, Cloudflare Workers deployment config
- **Content layer:** src/content (project/*.json, program/*.json, publication/*.json, blog/*.mdx) +
  src/pages/*.astro components rendering those collections
- **Starting status:** dirty
  - Pre-existing modified: src/content/publication/checkmycoach-paper.json,
    src/pages/projects/index.astro (dated 2026-08-16, uncommitted)
  - Pre-existing untracked: tmp/ (interactionkit brief PNGs, unrelated)
  - The checkmycoach-paper.json change was itself the recorded consequence of accepted decision
    decisions/2026-08-16--checkmycoach-publication-archived.md and was retained/verified, not
    overwritten.
  - Because the starting tree was dirty, per task Git policy NO COMMIT was created; the sync edits
    remain staged-able exact-path changes for owner review.

## Claims Audited

| Surface | Old claim | Authority | Verdict | Action |
|---|---|---|---|---|
| src/pages/index.astro (home) | "Current study: how displayed numerical precision and supporting-evidence resolution shape reliance on AI-generated advice. Study design in progress..." | decisions/2026-08-18--precision-illusion-behavioral-thread-killed.md ("No behavioral PI design is active/planned/current"); 2026-08-18 M0 pre-pilot approval ("NOT approved for human data collection"); 2026-08-19 M0 freeze ("M0_EXECUTION = NOT_ACTIVATED") | CONTRADICTED | Rewrote to current program: CMC human validation toward combined PI+CMC paper |
| src/pages/index.astro (home) | InteractionKit "Frozen methodological asset · pending human validation"; "planned causal test ... human study remains gated" | projects/interactionkit.yaml ("L2 construct validity study not run; deferred, not active"; "No accepted reactivation of L2 as an active priority") | STATUS_MISMATCH | Downgraded to "human study deferred"; "designed ... deferred ... materials not complete" |
| src/pages/projects/index.astro | "The active research path is the Precision Illusion behavioral experiment and CheckMyCoach human validation" (uncommitted 08-16 edit) | critical-path.md (active path = CMC human validation → combined paper); 2026-08-18 kill decision | CONTRADICTED | Rewrote to canonical active path; PI behavioral thread retired |
| src/pages/projects/index.astro | "A planned Study 2 ... design is frozen" | interactionkit.yaml ("designed but not executed; deferred, not an active priority") | STATUS_MISMATCH | "designed ... deferred and not an active priority" |
| src/pages/now/index.astro | InteractionKit listed under "Active — Hardening the typed interaction-specification artifact" | interactionkit.yaml (status frozen 2026-08-03; L2 deferred) | STATUS_MISMATCH | Label "Frozen"; description updated |
| src/pages/now/index.astro | "CheckMyCoach v2.2 Controlled Evaluation — Documenting the fixed 40-case offline comparison" | critical-path.md (active step = CMC human validation); checkmycoach.yaml (human validation IRB in progress, 1/5) | STATUS_MISMATCH | Retitled "CheckMyCoach Human Validation"; points to active path; v2.2 eval described as archived |
| src/content/blog/precision-illusion-intro.mdx + src/pages/blog/precision-illusion-intro.astro | "We are building toward controlled human experiments..." | 2026-08-18 kill decision (no behavioral PI design active/planned/current) | CONTRADICTED | Corrected; status note now records 08-18 retirement + 08-19 M0 v1 freeze with non-activation |
| src/content/project/interactionkit.json | "A planned Study 2 ... design is frozen" | interactionkit.yaml | STATUS_MISMATCH | "designed ... deferred and not an active priority" |
| src/pages/research/building-trustworthy-ai/interactionkit/index.astro | "A planned Study 2 ..."; "pending human validation" | interactionkit.yaml | STATUS_MISMATCH | "designed ... deferred"; "human study is deferred" |
| src/pages/research/building-trustworthy-ai/interactionkit/research-brief.astro | "A planned human-AI decision study tests..." | interactionkit.yaml | STATUS_MISMATCH | "designed ... would test ... deferred and not an active priority" |
| src/pages/cv/index.astro + src/pages/about/index.astro | "Developing two manuscripts..." | decisions/2026-08-16--checkmycoach-publication-archived.md (standalone trajectory archived); critical-path.md (one combined PI+CMC trajectory) | STALE | "Developing the combined Precision Illusion + CheckMyCoach manuscript" |
| src/pages/research/building-trustworthy-ai/interactionkit/index.astro + interactionkit.json | "independent-implementation convergence has not yet been evaluated" | research-harness interactionkit.yaml says "L1 validation complete (independent teams, 24-column schema match)"; interactionkit repo audits (INTERACTIONKIT_POST_L2_ALIGNMENT_REVIEW.md: "L1 has no test target in the current codebase"; CLAUDE_INTERACTIONKIT_FINAL_REVIEW.md: "L1 Readiness: NOT READY") | CONFLICT | LEFT UNCHANGED (conservative direction); OWNER_DECISION_REQUIRED |
| All CheckMyCoach surfaces (pages, json, paper json) | 15/40 routed, 12/40 removal, none passed, no validated-detection/superiority/equivalence claims | checkmycoach.yaml + 2026-08-16 scientific-identity-boundary decision (four estimands distinct) | SUPPORTED | NO_ACTION |
| MaxFitCalib-Bench surfaces | engineering-only, zero interpretable scientific outputs, direction closed | fitcalib-bench.yaml decision history; SUP-004 | SUPPORTED | NO_ACTION |
| CalTrust surfaces | frozen/simulation-only, metrics describe simulator | caltrust.yaml (paused; simulation-only; null diagnosis refused) | SUPPORTED | NO_ACTION (site "frozen" label consistent with its own workflow schema) |
| Knowledge Compiler page | 2,305 files / 2,294 IDs / 571 subset / no validity claims | knowledge-compiler.yaml (frozen; no evidence claims) + site's own artifact inventory; prior commit 80ea002 aligned scope | SUPPORTED | NO_ACTION |
| research.astro timeline | historical entries; InteractionKit frozen entries | critical-path + project yamls | SUPPORTED | NO_ACTION |
| Home stats (3 primitives, 2,305 files, M1-M4, 0 participants) | software/conservative facts | artifact + site data | SUPPORTED | NO_ACTION |
| demo/checkmycoach.astro | "Fixed illustrative fixtures; colors, tags, and scores are internal demo signals, not validated fitness advice or trust measurements" | software execution ≠ validation principle | SUPPORTED | NO_ACTION |

## Changes Applied

All edits are content/data-layer only; no CSS, component architecture, layout, routing, or design
changes were made.

- src/pages/index.astro — replaced "Current study ... Study design in progress" with the canonical
  current program (CMC human validation → combined PI+CMC paper; no human-participant findings
  claimed). Authority: 2026-08-18 PI kill + M0 decisions, critical-path.md.
- src/pages/index.astro — InteractionKit card: "pending human validation" → "human study deferred";
  "planned causal test ... remains gated" → "designed ... deferred ... materials not complete".
  Authority: interactionkit.yaml.
- src/pages/projects/index.astro — corrected the pre-existing uncommitted 08-16 paragraph that
  named the PI behavioral experiment as active; replaced with canonical active path + PI retirement.
  Authority: critical-path.md, 2026-08-18 decision.
- src/pages/projects/index.astro — Study 2 wording: "planned ... design is frozen" → "designed ...
  deferred and not an active priority". Authority: interactionkit.yaml.
- src/pages/now/index.astro — InteractionKit entry: Active → Frozen label; description updated to
  frozen v1.0.0 + deferred human study. Authority: interactionkit.yaml.
- src/pages/now/index.astro — CheckMyCoach entry retitled to "CheckMyCoach Human Validation" and
  pointed at the active critical path; v2.2 evaluation described as archived standalone. Authority:
  critical-path.md, checkmycoach.yaml, 08-16 publication-archived decision.
- src/content/blog/precision-illusion-intro.mdx + src/pages/blog/precision-illusion-intro.astro —
  "building toward controlled human experiments" removed; replaced with retirement statement;
  status note updated with 08-18 retirement + 08-19 M0 v1 canonical freeze (execution not
  activated, human data collection not authorized). Authority: 2026-08-18/2026-08-19 decisions.
- src/content/project/interactionkit.json — key takeaway Study 2 wording aligned ("designed ...
  deferred and not an active priority"). Authority: interactionkit.yaml.
- src/pages/research/building-trustworthy-ai/interactionkit/index.astro — "A planned Study 2" →
  "A designed Study 2 ... deferred and not an active priority"; "pending human validation" → "its
  human study is deferred and not an active priority". Authority: interactionkit.yaml.
- src/pages/research/building-trustworthy-ai/interactionkit/research-brief.astro — "planned
  human-AI decision study tests" → "designed ... would test ... deferred and not an active
  priority"; meta description "planned human study" → "deferred human study". Authority:
  interactionkit.yaml.
- src/pages/cv/index.astro + src/pages/about/index.astro — "two manuscripts" → "the combined
  Precision Illusion + CheckMyCoach manuscript". Authority: 08-16 publication-archived decision,
  critical-path.md.

## Claims Removed or Downgraded

- REMOVED: "Study design in progress" for the PI precision→reliance behavioral study (home page).
- REMOVED: "The active research path is the Precision Illusion behavioral experiment" (projects page).
- REMOVED: "We are building toward controlled human experiments that test whether unsupported
  numerical specificity affects trust and reliance" (blog) — the thread is retired, not pending.
- DOWNGRADED: InteractionKit human study from "pending" / "planned / gated" to "designed but
  deferred, not an active priority" (home, projects, now, interactionkit page, project json,
  research brief).
- DOWNGRADED: "two manuscripts" (about, cv) → one combined PI+CMC manuscript trajectory.
- DOWNGRADED: now-page InteractionKit from "Active — Hardening" to "Frozen".

## OWNER_DECISION_REQUIRED

1. **InteractionKit L1 status conflict.** research-harness projects/interactionkit.yaml states "L1
   validation complete (independent teams, 24-column schema match)". The interactionkit repository
   artifacts state the opposite (INTERACTIONKIT_POST_L2_ALIGNMENT_REVIEW.md: "L1 has no test
   target in the current codebase"; CLAUDE_INTERACTIONKIT_FINAL_REVIEW.md: "L1 Readiness: NOT
   READY"; CHI_LBW_PAPER_STRUCTURE.md: "No pilot run, no human-subject data, no L1/L2 results").
   The website currently takes the conservative direction ("independent-implementation convergence
   has not yet been evaluated") and was LEFT UNCHANGED. Owner should decide whether the canonical
   yaml or the repo audits are authoritative; if L1 is truly complete, the site is
   UNDERREPRESENTED and may be strengthened; if not, the yaml needs correction upstream (not a
   website edit). Sources: research-harness/projects/interactionkit.yaml:5,27;
   interactionkit/INTERACTIONKIT_POST_L2_ALIGNMENT_REVIEW.md:161;
   interactionkit/CLAUDE_INTERACTIONKIT_FINAL_REVIEW.md:311.
2. **"Frozen" vs "paused" for CalTrust.** research-harness caltrust.yaml status is "paused"
   (null diagnosis refused this quarter); the site uses "Frozen · Simulation Only" (its workflow
   schema only supports active/frozen/superseded/archived). Both communicate "not an active
   scientific claim"; no action taken. Owner may decide whether to map paused → a site-visible
   distinction later. Sources: research-harness/projects/caltrust.yaml.
3. **Empty Featured sections.** With both publication objects archived (featured=false), the home
   page "Featured Manuscripts" and publications page "Featured" sections render empty. This is a
   rendering consequence of correct archiving, not a claim defect. Owner may later add the combined
   PI+CMC paper object when drafted (per 08-16 decision "NOT now") or adjust the section. No
   engineering change was made in this task.

## Engineering Handoff

None required for this task's scope. (The empty Featured sections above are a content-model
consequence, not an engineering defect; no CSS/component change was made or needed.)

## Validation

- **Build:** npm run build — PASS (30 HTML pages; content synced; no errors).
- **Post-build validation:** npm run validate — ALL CHECKS PASSED (30 HTML pages, no raw
  @tailwind, utilities present, no encoding corruption, canonical URLs correct).
- **Content validation:** npm run validate:content — 2 publications + 6 projects ALL VALID
  (checkmycoach-paper archived status passes schema rules).
- **Diff scope:** only src/content/*.json, src/content/blog/*.mdx, and src/pages/*.astro content
  strings changed; no CSS, layout, component structure, routing, config, or deployment files.
- **Upstream repositories unchanged:** research-harness, interactionkit, FitCalib-Bench,
  CheckMyCoach, CalTrust were only READ during this audit. Their pre-existing dirty states
  (from other workstreams) were not modified. Verified via read-only git status inspection; no
  write commands were issued against them.
- **Failure classification:** no INTRODUCED_BY_THIS_TASK failures. The empty Featured sections are
  a pre-existing consequence of the 08-16 archiving change, classified UNKNOWN-OWNER (recorded
  above, not fixed).

## Final State

- Website claims now match the canonical research state as of 2026-08-19:
  - Active path: CheckMyCoach human validation → combined Precision Illusion + CheckMyCoach paper.
  - Precision Illusion: historical/formative only; behavioral thread retired (2026-08-18).
  - M0/Precision Measurement: bounded measurement schema v1 frozen (2026-08-19), execution not
    activated, human data collection not authorized (stated on the PI blog status note).
  - InteractionKit: frozen methodological asset, v1.0.0, human study deferred (not active).
  - CheckMyCoach: bounded intervention prototype; standalone publication archived; no validated-
    detection/effect claims.
  - MaxFitCalib-Bench: engineering-only audit, closed. CalTrust: simulation-only.
  - Knowledge Compiler: evidence-scoped artifact; no validity claims.
- NO COMMIT created (starting tree was dirty with pre-existing changes; task Git policy).
- NO PUSH, no remote changes.
- Report file: WEBSITE_TRUTH_SYNC_2026-08-21.md (this file).
