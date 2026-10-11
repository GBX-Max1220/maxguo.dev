# 《正确的废话》 V1.8 · 青年失业率专题交互原型

**Status:** RESEARCH PROTOTYPE / DRAFT ONLY  
**Target path (after a separately approved release):** `/maxguo.dev/non-answers/cases/youth-unemployment-2023/`  
**Main branch:** unchanged by this work; **do not merge without explicit owner approval**.

## What was added

- A standalone static, responsive case study; V1.7 longform is preserved without edits.
- Simplified Chinese, English and initial Traditional Chinese localization; Traditional text uses a partial character-map conversion and **must undergo native-language editorial QA**.
- A comparison judgment that reveals why the 21.3% and 14.9% observations cannot form a same-definition trend.
- Chronology distinguishing observation month, publication day, disclosure interruption and definition change.
- A denominator/definition toggle that does **not** invent population microdata or synthetic rate estimates.
- An answer X-ray of three parts of the August 15, 2023 Bloomberg exchange; explicitly recognizes actual official answers.
- Both the strongest plausible methodological rationale and outstanding requests for bridge/backcast evidence.
- Six first-party NBS source URLs and a machine-readable `evidence.json` with interpretation boundaries.
- A regression script plus six viewport/three locale checks, wired into the existing read-only PR workflow.

## Explicit non-claims

1. Neither rate is a directly comparable continuation of the other.
2. The arithmetic 6.4 percentage point difference is **not** an observed same-definition improvement.
3. Suspension of age-specific rates is **not** suspension of all unemployment reporting.
4. The case **does not prove fabrication or intentional concealment**.
5. The page does not enter the V1.7 frozen 18-document / 139-slot corpus.

## Publication blockers

- [ ] GitHub Actions `Non-Answers PR verification` passes at exact PR head SHA, including the new Playwright script.
- [ ] Independent source check on full original 2023-08-15 question and response and the September follow-up.
- [ ] Native-language review of Traditional Chinese (partial glyph conversion is not publication quality).
- [ ] Browser review of all six viewport widths and 3 languages.
- [ ] Editorial sign-off for labels, potential overclaiming, and corrections link.
- [ ] Before release: decide whether to remove `noindex,nofollow` and add public navigation / share preview.
- [ ] **Explicit owner authorization** before converting draft or merging to `main`.

## Primary sources

S01 https://www.stats.gov.cn/sj/zxfb/202307/t20230715_1941271.html  
S02 https://www.stats.gov.cn/sj/sjjd/202308/t20230815_1942020.html  
S03 https://www.stats.gov.cn/sj/sjjd/202309/t20230915_1942890.html  
S04 https://www.stats.gov.cn/sj/xwfbh/fbhwd/202401/t20240117_1946624.html  
S05 https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202401/t20240117_1946644.html  
S06 https://www.stats.gov.cn/hd/lyzx/zxgk/202406/t20240619_1955075.html

**Research identity:** public-facing critique of information sufficiency, statistical definitions and the relationship between official language and observable reality. This prototype does not launch a new ML research project.