# G3 Independent Human Review Protocol v1.1

**Date:** 2026-11-04  
**Status:** RESEARCH ONLY · REVIEW MATERIAL · NOT PUBLICATION AUTHORIZATION  
**Parent work:** PR #29, full-ledger v0.2  
**Purpose:** independent source criticism and claim adjudication across three heterogeneous historical evidence collections.

## 1. What this review is — and is not

This is an independent audit of evidentiary claims, source provenance, historical timing and the limits of inference. It is **not** a request to endorse the project, confirm its political position, or produce a favorable review.

The reviewer is explicitly invited to reject claims, identify missing evidence, propose competing explanations, and recommend deleting or narrowing parts of the analysis. A negative or inconclusive result is a valid research outcome.

The first phase is an **author-claim-withheld first pass**, not a blind or access-controlled review: URLs and source content reveal the underlying events, and the repository is public. The reviewer is asked not to inspect the author's claim register, source-role classifications, lineage groupings, draft essay, or prior author-side review packs until the Phase I record has been frozen. This is a voluntary review sequence, not a preregistered experiment or a formal double-blind design.

**Public-access limitation:** PR #29 is hosted in the public repository `GBX-Max1220/maxguo.dev`. The same public branch contains the canonical registry, source-ledger mappings, author claims, and Phase II worksheets. Neutral IDs in the Phase I index do not provide access control; any visitor can navigate to the other files. Therefore the current packet cannot guarantee that a reviewer has not seen the author's claims. Do not describe this process as a blind review. If access-controlled withholding is required, create a separate private Phase I packet containing only the assigned module's source index and blank Phase I worksheet, distribute it through private storage, and do not send the public PR or registry links. Until that is done, record the process as `author_claim_withheld_at_handoff`, not `conclusion_blind`.

## 2. Independence and reviewer competence

The reviewer should:
- Have relevant research experience in historical source criticism, contemporary Chinese history, legal/administrative institutions, media history, digital archives, or web preservation, depending on the collection being reviewed.
- Not have helped compile the source ledgers, draft the claims, or make the original interpretations.
- Declare any prior collaboration, financial interest, institutional relationship, or other conflict that could affect independence.
- State which parts fall outside their expertise. No reviewer should be pressured to sign off on a domain they cannot assess.

**Recommended allocation:**  
- **Reviewer A:** Li Wenliang and Shanghai source chronology / institutional context — contemporary Chinese history, China pandemic governance, political communication, or historical source criticism.
- **Reviewer B:** Ai Fen / Renwu digital-archive collection — digital history, web archiving, digital preservation, archive replay behavior, or provenance analysis.

A separate Chinese-law specialist should review legal interpretation, legal terminology and translation parity under **G4**. G3 source verification does not itself constitute a legal opinion. If a G3 reviewer also has legal expertise, record source findings and legal interpretations as separate review outputs.

One person may cover both G3 collections only if they can explain their relevant competence. A technical CI run, a second AI model, or the author's own re-prompting does not count as a second human reviewer.

## 3. Phase I — author-claim-withheld first-pass source reconstruction

**What the reviewer receives:** this protocol and `G3_PHASE_I_SOURCE_INDEX_V01_20261104.md` plus the blank Phase I worksheet. The source index uses neutral `SRC-###` and `ARC-###` identifiers; the crosswalk to native ledger IDs and case groupings is withheld until Phase I is frozen. Do not initially send the full PR description, article drafts, claim register, source-role labels, source-lineage groupings, or prior review documents.

For every source or archive locator the reviewer actually checks, record:
1. Access date/time and timezone; final URL or archive locator; HTTP/status information where available.
2. The visible title, publisher/creator, byline or issuing body, and any displayed publication/capture time.
3. Whether the item is an original record, contemporaneous report, later republication, interview, official statement, archive capture, or another source type — classify independently and explain.
4. What the source directly shows, what it merely attributes to another party, and what it cannot establish.
5. Whether another item appears to share the same originating statement, text, archive chain, or editorial source. Infer source dependence from evidence; do not assume repeated URLs or matching wording are independent.
6. Any version, migration, redirection, archive replay, missing-content, or timestamp uncertainty.
7. A confidence level and a short reason.

The reviewer should independently reconstruct the main chronology for each collection, keeping separate:
- event time;
- time an institution or actor made a decision;
- displayed publication time;
- archive capture time;
- time a later account or disclosure became public;
- the time at which the reviewer personally accessed the record.

Do not convert a page's displayed date into a verified first-publication timestamp without supporting evidence. Do not infer a deletion, censorship action, author, motive, or continuous period of unavailability from a missing page or link alone.

### Phase I source status vocabulary

- `VERIFIED`: the specified record and the relevant observable detail were directly reproduced.
- `PARTIALLY_VERIFIED`: some details were reproduced, but a material part remains uncertain.
- `CONTRADICTED`: direct evidence conflicts with the registered locator or observable detail.
- `NOT_REPRODUCIBLE`: the locator cannot currently be reproduced; state the attempted route and error.
- `INCONCLUSIVE`: evidence is insufficient to decide.
- `NOT_CHECKED`: not examined; never silently treat as verified.

An inaccessible archive is not proof that the underlying record never existed. A live page today is not proof that the same bytes were present at the historical date.

### Module-specific packet assignment

A reviewer accepting only one module receives only that module's Phase I index and Phase I worksheet:
- Module A: `G3_MODULE_A_PHASE_I_SOURCE_INDEX_V01_20261104.md` and `G3_MODULE_A_PHASE_I_WORKSHEET_V01_20261104.csv`.
- Module B: `G3_MODULE_B_PHASE_I_SOURCE_INDEX_V01_20261104.md` and `G3_MODULE_B_PHASE_I_WORKSHEET_V01_20261104.csv`.

The corresponding module-specific Phase II worksheet is withheld until the Phase I record is frozen:
- Module A: `G3_MODULE_A_PHASE_II_WORKSHEET_V01_20261104.csv`.
- Module B: `G3_MODULE_B_PHASE_II_WORKSHEET_V01_20261104.csv`.

Do not send the all-project combined index when the reviewer has accepted only one module. The neutral IDs are module-local; the author retains the crosswalk to native ledger identifiers.

## 4. Freeze Phase I before revealing author claims

Before Phase II, the reviewer should send or commit a dated Phase I worksheet. Record the worksheet filename, date, reviewer identifier (public name or chosen pseudonym), and SHA-256 if practical. Preserve this first-pass record unchanged.

Only after that freeze should the author provide:
- the canonical registry `three-case-ledger-registry-v02.json`;
- the author-side atomic claim register;
- the 24 historical public-as-of views;
- the existing case-specific review documents and the current draft prose.

This sequence makes it possible to compare an independent reconstruction with the author's model rather than merely asking the reviewer to agree with it. If a claim requires legal interpretation beyond checking what a document says, flag it for G4 legal review rather than treating the G3 source audit as a legal determination.

## 5. Phase II — claim and time-view adjudication

The canonical registry contains **54 atomic claims**, **24 historical public-as-of views**, and **30 Ai Fen archive observations**. Phase II asks the reviewer to evaluate the author's registered proposition, not to repeat Phase I.

For every claim, choose one:
- `SUPPORTED`
- `PARTIALLY_SUPPORTED`
- `CONTRADICTED`
- `INCONCLUSIVE`
- `OUT_OF_SCOPE`

For every public-as-of view, choose one:
- `PASS`: each included source is eligible and no later than the stated cutoff under the native ledger's precision;
- `FAIL`: a future, retrospective-ineligible, or otherwise invalid source is included;
- `PARTIAL`: the cutoff is defensible but the available source set is incomplete or misdescribed;
- `INCONCLUSIVE`: the source's publication time or historical availability cannot be established.

For each decision, cite the exact source ID, page passage or archive observation, access date, and reason. Record counterevidence and proposed wording changes. Do not average disagreements into a score.

### Required case-specific checks

- **Li Wenliang:** all 16 source records, 14 atomic claims, and the 13 registered public-as-of views. Pay particular attention to the distinction between the eight-person public notice and Li personally; the contemporaneous interview and the original admonition document; the March 19 sequence of distinct institutional acts; and Chinese/English legal terminology.
- **Shanghai:** all 22 source records, 11 atomic claims and 11 public-as-of views. Independently test the five critical questions SH-R1–SH-R5 in the existing review pack; distinguish reported predictions, institutional clarification, police investigation, policy plans and actual implementation. A police investigation announcement is not a judgment. A scoped search that did not locate a disposition is not proof that no disposition exists.
- **Ai Fen / Renwu:** all 20 source records and 29 atomic claims for a full review; independently reproduce the eight core checks R1–R8 in the existing protocol; review all 30 archive observations for a full-dataset release. Keep original WeChat availability, derivative-copy readability, homepage discoverability, title state and later disclosure as separate objects. A Wayback capture time is not a server-side edit, deletion, or first-publication time.

## 6. Two levels of G3 completion

To avoid treating a partial review as a full audit, record one of these explicitly:

**G3-CORE** — the material claims and high-risk boundaries have been independently reviewed:
- Li: 14 claims and six high-risk judgments in the v0.6 pack;
- Shanghai: SH-R1–SH-R5 and the identification/stop rules in v0.7;
- Ai Fen: R1–R8, source-dependence rules, and the title/homepage/URL distinctions in v0.4.

G3-CORE permits only a separately scoped publication of claims actually reviewed, after G4/G6. It does **not** certify every row in the 54-claim registry.

**G3-FULL** — all 54 claims, all 24 as-of views, all 30 archive observations, and material source-provenance issues have been reviewed. This is required before presenting the entire three-case registry or full interactive viewer as an independently reviewed research product.

If only one collection is reviewed, mark that collection's G3 status separately. Do not label the entire three-case project G3-complete.

## 7. Disagreement, revision and stop rules

- If a material claim is contradicted, remove it or rewrite it to match the evidence. Do not preserve it merely because it is central to the narrative.
- If a claim is partially supported, narrow its actor, time, location, modality, or causal language.
- If the source cannot be reproduced, preserve the frozen record but mark the claim inconclusive or not reproducible; do not invent a replacement source.
- If two sources share one origin, update the lineage model and remove the appearance of independent corroboration.
- If a date-only record is the best available evidence, retain date-level precision; do not invent intraday precision.
- If an archival state is observed only at two discrete captures, report an interval, not a continuous state or exact change time.
- If reviewers disagree on a material point, preserve the dissent and publish neither side as settled until it is resolved or explicitly presented as contested.
- Any newly discovered contradiction must be added to the registry with a versioned correction record; never silently rewrite the old finding.

## 8. Reviewer deliverables

1. Phase I source worksheet (including `NOT_CHECKED` rows).
2. Independent chronology for each collection, with event/publication/capture/retrospective times separated.
3. Phase II claim adjudication worksheet.
4. As-of boundary audit for all 24 views.
5. A short dissent/limitations memo identifying the three most consequential weaknesses, if any.
6. A signed scope statement: what was reviewed, what was not reviewed, relevant expertise, conflicts, tools used, and whether AI assistance was used.

A reviewer may choose a public name or pseudonym. Private contact details should not be published. The review is a research quality-control record, not a legal opinion, a guarantee of completeness, or an endorsement of the project's normative position.

## 9. Rights, privacy and publication gates remain separate

G3 does not clear:
- copyright and quotation rights;
- privacy and personal-data minimization;
- legal terminology and translation parity;
- accessibility and responsive interface checks;
- final editorial authorization.

G4 (rights/privacy/editorial review), G5 (accessibility), and G6 (explicit publication authorization) remain separate gates. A completed review must not automatically change any gate state.

## 10. Methodological references

- Kipping, M., Wadhwani, R. D., & Bucheli, M. (2014). “Analyzing and Interpreting Historical Sources: A Basic Methodology.” In *Organizations in Time: History, Theory, Methods*, pp. 305–329. Oxford University Press. https://doi.org/10.1093/acprof:oso/9780199646890.003.0013
- American Library Association, Reference and User Services Association. “Evaluating Primary Sources Online.” https://www.ala.org/rusa/sections/history/resources/primarysources/evaluating
- Heller, M. (2023). “Rethinking Historical Methods in Organization Studies: Organizational Source Criticism.” *Organization Studies*. https://doi.org/10.1177/01708406231156978

**Current status:** no independent human reviewer has signed any of the three collections. G3 remains HOLD. This protocol prepares a review; it does not claim that a review has occurred.
