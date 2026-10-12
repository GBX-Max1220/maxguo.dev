# 《正确的废话》 V1.8 · 青年失业率专题交互原型

**Status:** RESEARCH PROTOTYPE / DRAFT ONLY  
**Target path (after a separately approved release):** `/maxguo.dev/non-answers/cases/youth-unemployment-2023/`  
**Main branch:** unchanged by this work; **do not merge without explicit owner approval**.

## What was added

- A standalone static, responsive case study; V1.7 longform is preserved without edits.
- Simplified Chinese and English translations plus manually authored Traditional Chinese copy, replacing the initial incomplete character-map conversion; **native-reader editorial review remains required**.
- A comparison judgment that reveals why the 21.3% and 14.9% observations cannot form a same-definition trend.
- Chronology distinguishing observation month, publication day, disclosure interruption and definition change.
- A denominator/definition toggle that does **not** invent population microdata or synthetic rate estimates.
- An answer X-ray of the August 15, 2023 Bloomberg exchange, including the reporter's omitted housing-price trend sub-question; explicitly recognizes actual official answers and the unresolved portion.
- Both the strongest plausible methodological rationale and outstanding requests for bridge/backcast evidence.
- Six first-party NBS source URLs and a machine-readable `evidence.json` with interpretation boundaries.
- A regression script plus six viewport/three locale checks, wired into the existing read-only PR workflow.

## Explicit non-claims

1. Neither rate is a directly comparable continuation of the other.
2. The arithmetic 6.4 percentage point difference is **not** an observed same-definition improvement.
3. Suspension of age-specific rates is **not** suspension of all unemployment reporting.
4. The case **does not prove fabrication or intentional concealment**.
5. The page does not enter the V1.7 frozen 18-document / 139-slot corpus.

## Gate 4 — release-candidate integration (2026-10-12)

- **Prepared in Draft PR, NOT deployed:** add a responsive bilingual card in the V1.7 main story linking to this separately scoped 2023–2024 case. It is not counted in the V1.7 dataset.
- Added a canonical case permalink, case-specific Open Graph and Twitter title/description, explicit sharing image dimensions, alt text and locale metadata. The image currently **reuses the verified 1200×630 main project cover**; no dedicated case artwork is claimed.
- Language selection is carried from the main story to the case via optional `?lang=en` / `?lang=zh-Hant` deep links; the case may still be opened without a query.
- CI assertions now cover the case entrypoint, multilingual label, relevant social metadata, retained `noindex,nofollow`, and deep-link localization.
- **Noindex is deliberately retained until publication authorization.** After all editorial checks and explicit owner approval, remove `noindex,nofollow` in a final release patch, revise the prototype-only badge/footer, and rerun exact-head CI before any merge.
- Release risk: actual WeChat/social media cached thumbnail rendering cannot be guaranteed by build-time checks alone.

## Publication blockers

- [ ] GitHub Actions `Non-Answers PR verification` passes at the **latest** head SHA, including the new link and release metadata checks.
- [x] Cross-read the complete 2023-08-15 question and answer and September follow-up against official NBS transcripts; corrected a missing housing-trend request. Independent factual verification of the statistics remains outside current scope.
- [ ] Native-reader editorial review of Traditional Chinese, despite manual replacement of the character-map fallback.
- [x] Chromium visual QA at six viewport widths and three languages on the previous RC, with 11 captured PNGs; pending re-check of latest linked case entry.
- [ ] Editorial sign-off for labels, potential overclaiming, and corrections link.
- [x] Draft branch includes the public article's case navigation card and sharing metadata using the existing, verified project cover.
- [ ] Before approved release: remove `noindex,nofollow`, revise the prototype-status text, and validate published-domain social preview. No change to these controls is authorized yet.
- [ ] **Explicit owner authorization** before converting draft or merging to `main`.

## Primary sources

S01 https://www.stats.gov.cn/sj/zxfb/202307/t20230715_1941271.html  
S02 https://www.stats.gov.cn/sj/sjjd/202308/t20230815_1942020.html  
S03 https://www.stats.gov.cn/sj/sjjd/202309/t20230915_1942890.html  
S04 https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202401/t20240117_1946639.html  
S05 https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202401/t20240117_1946644.html  
S06 https://www.stats.gov.cn/hd/lyzx/zxgk/202406/t20240619_1955075.html

**Research identity:** public-facing critique of information sufficiency, statistical definitions and the relationship between official language and observable reality. This prototype does not launch a new ML research project.