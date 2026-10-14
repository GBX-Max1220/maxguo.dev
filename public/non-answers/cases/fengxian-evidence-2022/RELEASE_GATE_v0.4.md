# F01 v0.4｜Gate 4 发布决策

**Verdict: `EDITORIAL_RC_READY_FOR_OWNER_REVIEW / NOT_PUBLISHED / MERGE_NOT_AUTHORIZED`.**

## Passed internally (not independent human review)

- [x] Sources S01–S07 have clear provenance tiers; two later sources were promoted to more directly checkable carriers.
- [x] Simplified, Traditional and English manuscripts have localized source descriptions.
- [x] Two figures per language: six SVG assets (not just one Simplified Chinese picture).
- [x] Six-stage as-of public-disclosure timeline and unscored note interaction retained.
- [x] 4 viewport widths × 3 locales, and cross-locale note persistence: Chromium DOM QA 13 checks pass.
- [x] Figures visually inspected following layout corrections; responsive reading cards remain the accessible primary presentation.
- [x] Draft `noindex,nofollow`; not using a production canonical.

## Remaining before merge or launch

- [x] Author reviewed v0.4 reading experience; this does not authorize merge or public release.
- [ ] Independent native/proficient English and Traditional Chinese line edits; automated self-review is not independent review.
- [ ] Original institutional links for S01/S02 if available; if not, make precise reproduced-source disclosure prominent in release.
- [ ] Source snapshot archival and quote-by-quote editorial second pass.
- [ ] Keyboard, screen-reader and true local-file / branch-preview end-to-end test in an unrestricted browser.
- [ ] Determine production case slug and canonical, OG, robots/indexing, language deep links, link to main page and regression coverage.
- [x] User-authorized Draft PR #15 staged; previous HEAD d9391a0 passed CI #38310099019. Every new HEAD requires new CI.
- [ ] Before any merge or production deployment: separate explicit authorization for that final action.

## Recommendation

Do not add feature scope. Draft PR #15 is open and unmerged, noindex and not linked on the main page. Independent language/source sign-off and preview accessibility remain open. No measured reader-learning or publication-effect claims.
