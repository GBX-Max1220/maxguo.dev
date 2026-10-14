# 《正确的废话》｜F01 Gate 4 Editorial Release Candidate v0.4

**Status:** `EDITORIAL_RC_V0_4 / AUTOMATED_QA_PASS / PUBLICATION_HOLD`

This is a **draft-only** trilingual artifact by Baixin Guo (Max) staged in GitHub PR #15, not a public release.

## Files

- `index.html`: six-section trilingual essay and six-stage Evidence Time Machine.
- `assets/figure-01-{zh,tw,en}.svg`: localized six-stage timeline diagrams.
- `assets/figure-02-{zh,tw,en}.svg`: localized claim/evidence-boundary diagrams.
- `manuscript_zh.md`, `manuscript_tw.md`, `manuscript_en.md`: text editions and localized source labels.
- `evidence_register.json`: seven source records, dates, carriers, audit qualifiers.
- `SOURCE_CLAIM_AUDIT_v0.4.md`: evidence-to-claim reasoning matrix.
- `RELEASE_GATE_v0.4.md`: release decision and remaining blockers.
- `QA_RESULTS_v0.4.json`: original offline test receipt; current automated checks are in the repository `scripts/` directory.
- Review screenshots and HTTP test receipts are distributed as GitHub Actions artifacts, not in this source directory.

## How to view

Extract all contents and open `index.html` in a local browser (do not detach it from `assets/`). The page has no external JavaScript, tracking or form submission. Source links require internet to open. **Note:** local-file browser navigation was blocked in this test environment; use your own browser to verify native local-file behavior.

## Editorial constraints

All seven sources are public documents or publication carriers, not authenticated access to full official investigative records. In particular, S01/S02 are media reproductions, S03 a contemporaneous full-text media reproduction, S05 a government-hosted reproduction, and S07 a Xinhua report of a first-instance judgment. The project cannot infer intentional deceit or an unverified final appellate disposition. The first-instance ruling is not described as a verified final judgment.

**F01 remains in GitHub Draft PR #15; the GitHub Pages `main` branch has not merged or published this case.** Cloudflare previously deployed a Draft PR Worker version to production; on 2026-10-14 the account owner restored main-associated Worker version `9ff1169b-de17-40db-a33d-b8e56300f281` to 100% production traffic. Cloudflare Preview-branch builds were subsequently shown disabled, with `main` as the Production branch; these are point-in-time checks, not a permanent guarantee. No merge, indexing or public release is authorized.
