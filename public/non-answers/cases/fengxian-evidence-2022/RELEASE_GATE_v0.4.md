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

- [ ] Author checks this *specific* v0.4 candidate, including English figure and language switch.
- [ ] Independent native/proficient English and Traditional Chinese line edits; automated self-review is not independent review.
- [ ] Original institutional links for S01/S02 if available; if not, make precise reproduced-source disclosure prominent in release.
- [ ] Source snapshot archival and quote-by-quote editorial second pass.
- [ ] Keyboard, screen-reader and true local-file / branch-preview end-to-end test in an unrestricted browser.
- [ ] Determine production case slug and canonical, OG, robots/indexing, language deep links, link to main page and regression coverage.
- [ ] Before any GitHub Draft PR: explicit authorization to integrate to the repository. Approval of editorial direction does not alone authorize PR or merge.
- [ ] Before any merge or production deployment: separate explicit authorization for that final action.

## Recommendation

Do not add feature scope. After author review and independent language/provenance checks, propose a contained Draft PR to integrate this independent case without touching frozen V1.7 sample, V1.8, or P13 findings. No publication performance or reader-learning claims.
