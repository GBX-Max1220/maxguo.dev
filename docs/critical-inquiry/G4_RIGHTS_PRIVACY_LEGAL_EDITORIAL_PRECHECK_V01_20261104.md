# G4 Prepublication Rights, Privacy, Legal-Language and Editorial Precheck v0.1

**Date:** 2026-11-04  
**Status:** AUTHOR-SIDE PRECHECK ONLY · NOT LEGAL ADVICE · NOT RIGHTS CLEARANCE · NOT PUBLICATION AUTHORIZATION  
**Scope:** Published bilingual *Six Clocks* essay; PR #29 full-ledger v0.2 and offline viewer; unpublished Ai Fen / Renwu draft v0.5.

## Executive finding

The existing public *Six Clocks* pages show several good safeguards: they contain no embedded images, link to source pages rather than reproducing source screenshots, disclose that the essay is author-reviewed rather than independently fact-audited, and explicitly warn against republishing an unredacted reprimand photograph containing personal identity/address fields. The Ai Fen draft does not reproduce the full interview and explicitly limits what can be inferred from archive captures.

However, **G4 is not complete**. Source links are not licenses; a preliminary 39-row quotation/title-text candidate register now exists, but it has not been reviewed or completed; Chinese-law terminology and the bilingual edition have not received independent specialist review; and public release of the full v2 viewer remains blocked pending a human rights/privacy/editorial review.

This memo is an author-side risk inventory based on the current repository files. It does not determine copyright exceptions, privacy-law compliance, defamation liability, or the legality of publication in any jurisdiction.

## 1. Scope and inspected assets

### 1.1 Already-public pages on `main`

- `src/pages/critical-inquiry/six-clocks/index.md`
- `src/pages/critical-inquiry/six-clocks/en/index.md`
- `src/layouts/SixClocksPreviewLayout.astro`

Observed in the current files:
- Chinese page: approximately 8,019 characters; 27 unique outbound source URLs.
- English page: approximately 17,140 characters; 28 unique outbound source URLs.
- 27 source URLs are shared. The English page additionally links to `https://sh.people.com.cn/n2/2022/0323/c134768-35188846.html`, identified there as an 18:10 same-source police republication; the Chinese edition does not currently include that link or the corresponding 18:10 timestamp.
- Neither Markdown page contains an embedded image.
- Both editions disclose that the essay is author-reviewed and not independently fact-audited / peer reviewed. The English disclosure also states that independent translation, legal-language and source verification have not occurred.
- The Chinese edition expressly says the interviewee-provided reprimand photograph may contain personal ID/address fields and should not be republished in full.

**Editorial action:** decide whether the English edition is an expanded adaptation or whether the missing 18:10 source and timestamp should be added to the Chinese edition. Do not imply strict translation parity until the source lists and legally material statements have been compared.

A preliminary quotation candidate inventory is available at `G4_QUOTATION_AND_SOURCE_RIGHTS_REGISTER_V01_20261104.csv` (39 occurrences across the two published pages and v2 registry). Its classification column is deliberately unresolved; these rows are candidates for author/reviewer disposition, not a finding that every item is a legally significant quotation.

### 1.2 PR #29 research branch

The v2 normalized registry and nine pinned source-ledger inputs were inspected for long source-text reproduction, personal identifiers, and media assets.

Observed:
- The registry primarily contains source metadata, claims, evidence limits, timestamps, lineage information, archive titles/anchor text, and short excerpts.
- No full article body, full interview, raw HTML page, screenshot, or image binary was identified in the inspected JSON source-ledger inputs.
- The Li interview comparison includes two short excerpts: `没有给我带来特别的影响` and `我也怕被拘留；当时担心单位会秋后算账`. These should remain short, attributed, contextualized and individually entered in a quotation register before any wider publication.
- Ai Fen title and homepage records preserve article-title / anchor-text fragments and archive metadata, not the full interview.
- The repository root has no `LICENSE` file on `main` at the time of this check. The license status of the project's own software and prose therefore needs an explicit decision; third-party content rights remain separate. A proposed ten-term bilingual legal-language checklist is available at `G4_CHINESE_LEGAL_TERMINOLOGY_REVIEW_REGISTER_V01_20261104.csv`; every entry remains `NOT_REVIEWED`.

### 1.3 Unpublished Ai Fen draft

`AI_FEN_ARCHIVAL_MICROHISTORY_REVIEW_DRAFT_V05_20261101.md` is marked research draft / not published / not independently human-reviewed. It:
- distinguishes original WeChat availability, derivative-copy readability, homepage discoverability, title state, archive captures, and later disclosure;
- does not reproduce the full *Renwu* interview;
- states that the original WeChat publication bytes were not obtained;
- treats the alleged management directive as a reported disclosure with unresolved issue date, authenticity, receipt and execution;
- explicitly rejects inference of a causal censorship mechanism from a missing homepage link alone.

Keep this draft unpublished until its archive evidence and quotation/rights use have been reviewed by a second human.

## 2. Rights and quotation register — HOLD

| Asset / use | Current observation | Risk | Required action |
|---|---|---|---|
| *Six Clocks* prose | Predominantly original synthesis with source links | Low-to-moderate, subject to source-specific passages | Preserve attribution and verify every direct quotation |
| Chinese source phrases | Short quoted labels and short snippets; no long block quotations identified | Moderate until itemized | Create a quote ledger with exact wording, character count, source, purpose, location, attribution and reviewer decision |
| English source phrases | Short quoted formulations; one additional source link compared with Chinese edition | Moderate until parity/rights review | Check whether each phrase is a direct quotation, a translated paraphrase, or the author's own framing |
| Li interview excerpts in v2 registry | Two short attributed excerpts in a comparison field | Moderate | Keep only what is analytically necessary; do not expand into interview transcript reproduction |
| Ai Fen / *Renwu* title captures | Headline/title strings and archive metadata | Low-to-moderate | Attribute the publisher and link to the capture; avoid reproducing article body or screenshots without permission/legal review |
| Wayback / derivative archive records | URLs, capture timestamps, metadata and limited text markers | Moderate | Link to captures; do not mirror complete WARC/HTML or entire third-party pages in the public viewer |
| Reprimand photograph | Existing article says the photo may contain personal ID/address fields | High if copied or displayed | Do not embed, mirror, crop or redistribute the unredacted photograph; if a document image is ever necessary, obtain a rights basis and perform irreversible redaction first |
| Third-party news images / screenshots | None embedded in the inspected essay pages | High if later added | Require asset-level provenance, rights status and permission/exception review before use |

**Important:** a source URL, public availability, or archive capture does not itself grant a license to reproduce the source text, photographs, page layout, or full HTML. No legal conclusion is made here about any quotation exception.

## 3. Privacy and data minimization — PARTIAL PASS

Positive controls observed:
- No embedded images in the current bilingual essay pages.
- No standalone personal email, phone number, or national ID number was detected in the normalized v2 registry during the automated pattern scan. Numeric matches were substrings of source URLs / article identifiers, not standalone contact details.
- The Shanghai investigation subjects remain unnamed in the current public essay and research model.
- The Li reprimand photograph is explicitly not to be republished in full.
- The Ai Fen draft says it did not collect private chats or identifiable individual information.

Required human checks:
1. Inspect every future screenshot, HTML export, PDF and attachment, not just JSON text, for names, phone numbers, addresses, account IDs, QR codes, faces, metadata and embedded document properties.
2. Do not attempt to identify the two Shanghai investigation subjects from indirect clues or third-party speculation.
3. Do not publish private family contact details, non-public medical records, private messages, or unnecessary personal details about Li Wenliang or Ai Fen.
4. Ensure the v2 viewer does not render raw source documents or unredacted images when it is eventually connected to a public route.
5. Record the public-interest rationale and data-minimization decision for every personal detail retained.

## 4. Defamation, attribution and causal language — HUMAN EDITORIAL REVIEW REQUIRED

The research's critical stance should remain intact. The requirement is not to neutralize the argument; it is to distinguish documented institutional acts from allegations, attributed claims, and causal inferences.

Keep the following distinctions explicit:
- “Police announced an investigation” is not “the individuals were convicted.”
- An official statement about motive, falsity or social harm remains an attributed institutional statement unless independently established.
- The later policy timeline does not establish that an earlier speaker had privileged knowledge or that every element of a forecast was accurate.
- A reported management directive is not an authenticated original directive; the date may be a leak/publication date rather than issue date.
- A missing homepage link or unavailable original URL does not by itself identify censorship, actor, motive, or continuous removal.
- A later webpage version does not prove who edited it or why.

Before any new public case page, an editor should verify that every sentence naming an identifiable person or organization is supported by a source and uses language proportionate to that source. Preserve the distinction between a factual correction, legal/administrative correction, policy update and webpage-version change.

## 5. Chinese-law and legal-terminology review — NOT STARTED

The published *Six Clocks* essay discusses criminal procedure and legal elements in the Shanghai case, and administrative correction in the Li case. A qualified Chinese-law reviewer should check:
- the exact version and effective date of the cited four-agency judicial guidance;
- the relevant Shanghai High People's Court Q&A and whether it is guidance, an official interpretation, or another category of document;
- the elements and wording used for false-information offences, including objective consequences and subjective intent;
- the distinction between `立案侦查`, prosecution, adjudication and conviction;
- the distinction between `训诫`, statutory warning, fine, detention, `行政记过` and `行政警告`;
- whether the essay attributes each legal proposition to the correct issuing body and does not overstate its binding force;
- Chinese/English parity for every legally material term.

The review must not turn into an opinion on the guilt or innocence of the unnamed Shanghai individuals. The available project materials do not include their complete case files or a located final disposition.

## 6. Bilingual parity — NOT COMPLETE

The Chinese and English editions share 27 unique source URLs, but the English edition contains one additional police-republication URL and a corresponding 18:10 reference absent from the Chinese edition. The English edition also labels the March 26 *The Paper* source with an 11:01 time where the Chinese edition links to the same report without that displayed time.

This may be an intentional expanded adaptation rather than an error. The author must choose and label one of two policies:
- **Parallel editions:** align all material source links, dates, legal propositions, uncertainty statements and disclaimers; or
- **Expanded English adaptation:** explicitly label the English page as an expanded edition and maintain a change log.

A bilingual reviewer should compare claims, not merely grammar. Priority terms include “rumor”, “false information”, “investigation”, “reprimand”, “withdrawal”, “administrative discipline”, “public-order disturbance”, “archived capture”, “homepage discoverability” and “censorship”.

## 7. Public-repository disclosure and review integrity

PR #29 is a Draft PR in a **public** GitHub repository. “Draft”, “research-only”, and “not merged” do not mean private or confidential. The branch exposes the normalized registry, source ledgers, author claims, Phase II worksheets and reviewer materials to any visitor.

Consequences:
- The current Phase I process is an author-claim-withheld first pass, not an access-controlled blind review.
- Do not tell reviewers that the public Phase I files guarantee blinding.
- If an access-controlled first pass is required, create a separate private packet with only the assigned Phase I source index and blank worksheet, and do not send the public PR link.
- The public branch itself should not contain private personal data, unredacted images, or material the author is unwilling to make publicly accessible.

## 8. Release gates and action list

| Priority | Action | Owner / reviewer | Status |
|---|---|---|---|
| P0 | Keep PR #29 Draft; do not merge or deploy the full v2 viewer | Author | HOLD |
| P0 | Decide private vs public Phase I distribution; correct any “blind review” description | Author | Corrected in protocol v1.1; private packet not yet created |
| P0 | Do not publish the reprimand photo, full interview, full archived article, or raw source HTML | Author | Standing restriction |
| P1 | Build asset-level quotation and rights register for all public-facing text, titles, excerpts and media | Author + rights reviewer | NOT STARTED |
| P1 | Independent Chinese-law and legal-translation review | Chinese-law specialist | NOT STARTED |
| P1 | Bilingual factual/legal parity review | Qualified bilingual reviewer | NOT STARTED |
| P1 | Privacy and reputational-risk review of all future screenshots / viewer output | Independent editor | NOT STARTED |
| P2 | Decide license for original project code and original prose; distinguish these from third-party source rights | Author | NOT STARTED |
| P2 | Add a public correction / takedown contact route that does not expose private contact details | Author | NOT STARTED |

**Current gate state:** G4 = HOLD / incomplete. G6 = NOT AUTHORIZED. The published *Six Clocks* essay remains clearly labeled as author-reviewed and not independently fact-audited; this memo does not retroactively certify it. The full three-case viewer remains research-only.
