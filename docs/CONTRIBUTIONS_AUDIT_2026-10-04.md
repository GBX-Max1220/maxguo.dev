---
last_modified:
  agent: Codex
  model: gpt-6.1-sol
  timestamp: 2026-10-04T21:00:26+08:00
  task_id: SITE-CONTRIBUTIONS-20261004-001
base_commit: b73fee59afd1422a21f7e5ad1db079cdefc9c1f8
---

# Contributions audit and maintenance handoff

```text
TASK: SITE-CONTRIBUTIONS-20261004-001
AGENT: Codex
MODEL: gpt-6.1-sol
STATUS: COMPLETED — audited, implemented, validated and committed with this handoff
STARTED_AT: 2026-10-04T20:32:59+08:00
COMPLETED_AT: 2026-10-04T21:00:26+08:00
BASE_COMMIT: b73fee59afd1422a21f7e5ad1db079cdefc9c1f8
FINAL_COMMIT: the local commit containing this report; full SHA is returned in the final response and by git rev-parse HEAD
BRANCH: site/research-engineering-log-2026-10-04
```

## Objective and authority

Add a truthful, auditable public portfolio layer while preserving existing research framing. The owner explicitly approved a separate clean worktree from the verified remote main SHA. The old dirty worktree is protected in its entirety. No merge, push, PR, deployment or external issue/discussion mutation is authorized.

The clean worktree started with an empty status at the requested SHA. No repository state file, lock or task ownership declaration existed in that snapshot. The explicit owner-approved task is recorded in `.ai/tasks/research-engineering-log-20261004.json`; write scope is limited to the new contribution layer and required validation. The shared parent policy was read. Source files and scientific artifacts outside this scope remain protected.

## Public audit method

The public inventory was reconstructed on 2026-10-04 from current APIs and public records, rather than accepted from the seed list.

- GitHub searches: `author:GBX-Max1220 is:issue is:public` returned the seven authored issue candidates; `author:GBX-Max1220 is:pr is:public` returned twelve authored PR candidates. Public visibility was additionally checked before including owned repositories.
- REST issue and PR resources provided exact titles, author login, source creation times, current state, closure and merge times. Issue comments distinguish human confirmation from automated triage. Sources with zero comments do not receive a confirmation claim.
- GitHub GraphQL discussion search found four authored discussions. Individual Caura and PLUR discussions were read with their author, exact creation time, category/body and comments. Both are open and have no replies.
- Owned repository metadata, README content, release collections and tag references were inspected. Annotated tag objects supply release-event timestamps for InteractionKit and CheckMyCoach. Release-commit timestamps supply the PMD and Evaluation Runtime snapshot dates; these are not presented as independently measured public-visibility transition times.
- Zenodo API search and [record 22980060](https://zenodo.org/records/22980060) independently verified the exact paper title, both authors, open access, preprint resource type, publication day and version DOI [10.5281/zenodo.22980060](https://doi.org/10.5281/zenodo.22980060). The stored timestamp is the record's exact creation time; its publication day corroborates October 1. No peer-review or journal-acceptance claim is made.
- Existing homepage, research profile, research/project pages, public repository claim boundaries and CV sources were inspected. The CV and research claims were preserved.

Every record contains its evidence URL and audit source; `source.sourceTitle` retains the exact source release/tag/commit title when the display title is descriptive. `source.author` denotes the originating contribution author. For a later clarification, retain that originating author and add `source.eventAuthor` for the replying maintainer; verify the linked comment before claiming clarification.

## Canonical included inventory

The log contains **21 dated events**. There are 19 originating contribution/artifact records plus the separately dated Reef merge and issue-closure events. Four Reef records intentionally point to the same issue/PR pair; each represents a different lifecycle event and renders exactly once.

| UTC+8 day  | Exact source timestamp           | Project                         | Kind / event         | Public record                                                                                                                                                     | Current status          | Selected |
| ---------- | -------------------------------- | ------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------- |
| 2026-10-04 | 2026-10-04T10:56:14Z             | caura-ai/caura                  | discussion · opened  | [Is `recall_used_count` intended to mean verified use or caller-reported use?](https://github.com/caura-ai/caura/discussions/1822)                                | Discussion open         | No       |
| 2026-10-04 | 2026-10-04T10:16:31Z             | FerroxLabs/ijfw                 | issue · opened       | [profile.brief and profile.get bypass approval gating for learned preferences](https://github.com/FerroxLabs/ijfw/issues/48)                                      | Open issue              | Yes      |
| 2026-10-04 | 2026-10-04T09:18:41Z             | SourceShift/ContextNest         | issue · opened       | [Update API accepts content changes without re-embedding while docs present content mutation as supported](https://github.com/SourceShift/ContextNest/issues/205) | Open issue              | No       |
| 2026-10-04 | 2026-10-03T21:11:56Z             | Arc-Computer/atlas-sdk          | issue · opened       | [Review approval survives normal session completion and admits unreviewed final evidence](https://github.com/Arc-Computer/atlas-sdk/issues/147)                   | Open issue              | Yes      |
| 2026-10-04 | 2026-10-03T20:11:08Z             | future-agi/future-agi           | issue · opened       | [Feedback edits and deletes leave stale few-shot vectors active](https://github.com/future-agi/future-agi/issues/3278)                                            | Open issue              | Yes      |
| 2026-10-01 | 2026-10-01T23:15:20.841545+08:00 | Boundary Labs collaboration     | paper · published    | [What the Score Measured: Failure Attribution in an Agent Memory Evaluation](https://zenodo.org/records/22980060)                                                 | Public preprint         | Yes      |
| 2026-10-01 | 2026-09-30T16:13:28Z             | Human-Agent-Society/reef        | issue · closed       | [[Bug] Wait for steps triggered by passing reports in the evolve-your-harness runner](https://github.com/Human-Agent-Society/reef/issues/663)                     | Closed · fixed upstream | No       |
| 2026-10-01 | 2026-09-30T16:10:55Z             | Human-Agent-Society/reef        | pr · merged          | [fix(harness): wait for steps triggered by passing reports](https://github.com/Human-Agent-Society/reef/pull/677)                                                 | Merged                  | Yes      |
| 2026-09-29 | 2026-09-28T20:57:32Z             | Human-Agent-Society/reef        | pr · submitted       | [fix(harness): wait for steps triggered by passing reports](https://github.com/Human-Agent-Society/reef/pull/677)                                                 | Merged                  | No       |
| 2026-09-29 | 2026-09-28T20:39:14Z             | warpdotdev/oz-for-oss           | issue · opened       | [update-triage: distinguish missing feedback from GitHub API failures](https://github.com/warpdotdev/oz-for-oss/issues/504)                                       | Open issue              | No       |
| 2026-09-28 | 2026-09-27T21:10:14Z             | plur-ai/plur                    | discussion · opened  | [Evaluating how feedback reliability shapes future agent behavior](https://github.com/plur-ai/plur/discussions/1233)                                              | Discussion open         | No       |
| 2026-09-28 | 2026-09-27T20:38:56Z             | Human-Agent-Society/reef        | issue · opened       | [[Bug] Wait for steps triggered by passing reports in the evolve-your-harness runner](https://github.com/Human-Agent-Society/reef/issues/663)                     | Closed · fixed upstream | No       |
| 2026-09-28 | 2026-09-27T19:10:02Z             | Tencent/SkillHone               | pr · submitted       | [feat(examples): add Claude API model-retirement repair example](https://github.com/Tencent/SkillHone/pull/16)                                                    | Open PR                 | No       |
| 2026-09-27 | 2026-09-26T20:29:44Z             | Tencent/SkillHone               | pr · submitted       | [examples: add skill-creator description auth regression case](https://github.com/Tencent/SkillHone/pull/15)                                                      | Open PR                 | No       |
| 2026-09-27 | 2026-09-26T16:52:55Z             | Tencent/SkillHone               | pr · submitted       | [Add claude-api Files upload regression example](https://github.com/Tencent/SkillHone/pull/14)                                                                    | Open PR                 | No       |
| 2026-09-23 | 2026-09-23T06:17:39Z             | Causal Estimation Diagnostics   | release · released   | [Causal Estimation Diagnostics v1.0.0](https://github.com/GBX-Max1220/causal-estimation-diagnostics/releases/tag/v1.0.0)                                          | Released                | Yes      |
| 2026-09-22 | 2026-09-22T14:00:51Z             | Preference Modeling Diagnostics | artifact · published | [Preference Modeling Diagnostics public snapshot](https://github.com/GBX-Max1220/preference-modeling-diagnostics/tree/d232327047a206b8d4f16b5c6f7a5e508ad43146)   | Public artifact         | Yes      |
| 2026-09-18 | 2026-09-17T16:20:34Z             | Evaluation Runtime              | artifact · published | [Evaluation Runtime public snapshot](https://github.com/GBX-Max1220/evaluation-runtime/tree/8d1582b328791a8baa59ecfcdd2200c4fedc7294)                             | Public artifact         | No       |
| 2026-08-02 | 2026-08-01T20:50:40Z             | InteractionKit                  | release · released   | [InteractionKit v1.0.0](https://github.com/GBX-Max1220/InteractionKit/tree/interactionkit-v1.0.0)                                                                 | Released                | No       |
| 2026-07-28 | 2026-07-27T18:54:25Z             | CheckMyCoach                    | release · released   | [CheckMyCoach v2.2-frozen execution package](https://github.com/GBX-Max1220/CheckMyCoach/tree/v2.2-frozen)                                                        | Released                | No       |
| 2026-03-07 | 2026-03-06T19:15:33Z             | StanfordHCI/GPTCoach-CHI2025    | issue · opened       | [Suggestions for improving GPTCoach’s reproducibility, privacy compliance, and real-world usability](https://github.com/StanfordHCI/GPTCoach-CHI2025/issues/1)    | Open issue              | No       |

The full exact authored issue/PR titles are retained in the JSON data and above. No private audit, unpublished local precheck, private trace or raw research data appears in the contribution source.

## Homepage selection

Selection is an explicit editorial flag with a separate manual order. Newer entries cannot displace these items automatically.

1. **What the Score Measured** — verified co-authored public preprint with stable version DOI; stronger research output than an ordinary issue.
2. **Reef runner lifecycle fix** — merged upstream engineering contribution with regression coverage and an inspectable issue → submitted PR → merge → closure story.
3. **Causal Estimation Diagnostics v1.0.0** — concrete public release with frozen reproducibility artifacts and bounded diagnostic claims.
4. **Preference Modeling Diagnostics** — public frozen diagnostic study with prompt-disjoint evaluation and identity controls, preserving the small-effect and known-user boundaries.
5. **Future AGI #3278** — public reproduction of persistent stale evaluator feedback across edit/delete lifecycle changes; open and unconfirmed.
6. **Arc ATLAS #147** — public reproduction of approval/evidence lifecycle inconsistency; open and unconfirmed, without security framing.
7. **IJFW #48** — public reproduction of a specific learned-preference serving/approval mismatch; open and unconfirmed.

SkillHone, ContextNest, Oz, Caura, PLUR, GPTCoach and the remaining released/snapshot artifacts belong in the full log. They do not become homepage selections merely because of recency.

## Excluded candidates and reasons

| Candidate                                                       | Disposition and reason                                                                                                                                                                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plastic Labs / Honcho local precheck                            | Explicitly excluded: no authored public contribution artifact. No issue or contribution claim invented.                                                                                                                           |
| `GBX-Max1220/eval-runtime`                                      | Private repository. The public canonical evidence is `GBX-Max1220/evaluation-runtime`.                                                                                                                                            |
| CheckMyCoach live-demo website PR #6                            | Open, unmerged PR. Not evidence of a shipped live demo; existing demo behavior is untouched. The separately verified frozen CheckMyCoach tag is included.                                                                         |
| InteractionKit PR #1                                            | Open draft concerning Study 2 preparation. Not a shipped artifact or completed domain/human validation; include the verified v1.0.0 tag instead.                                                                                  |
| maxguo.dev PRs #2, #3, #4, #5, #7                               | Website/CV maintenance and duplicate presentation of existing work, rather than distinct shipped research artifacts.                                                                                                              |
| max-editorial PR #1                                             | Small editorial/layout maintenance, below this research-engineering inventory's inclusion threshold.                                                                                                                              |
| Reasonix discussion #6535; Colab/VS Code discussion #209        | General token-consumption/UI support questions, without a concrete research-method or engineering artifact contribution.                                                                                                          |
| Knowledge Compiler                                              | Public historical evidence infrastructure, inspected and preserved on its existing project page. No dated release/tag identified in the audited release/tag endpoints; no new release date invented.                              |
| MaxFitCalib-Bench / FitCalib-Bench                              | Public historical benchmark-development and engineering-audit material. No dated release/tag identified; retained on existing project pages with its scientific claim boundaries. `MaxFitCalib-Bench` is not the repository name. |
| CalTrust                                                        | Public frozen simulation prototype, not a newly verified dated release. Preserved on the existing project page; no human-validation claim.                                                                                        |
| PI Discovery                                                    | Existing site describes a local prototype with public release pending. No new public release artifact identified.                                                                                                                 |
| OptiFrontier, Jev × TIND and nonpublic collaboration deliveries | No independently verified public artifact URL/date supplied by the existing profile or found in this audit. Existing research framing is preserved; local deliveries do not become public activity events.                        |
| Unrelated owned repositories                                    | Not mechanically included; repository existence and creation time alone are insufficient evidence of a meaningful shipped research contribution.                                                                                  |

## Status and date corrections

- Reef #677 was submitted on **September 29 UTC+8**, merged at **2026-10-01T00:10:55+08:00**, and #663 closed at **2026-10-01T00:13:28+08:00**. The report opened on September 28. These remain separate dated records, with a single homepage story.
- SkillHone #14/#15 were created on **September 27 UTC+8**, and #16 on **September 28 UTC+8**. All three remain open and unmerged. The old homepage's hard-coded October 1 third-submission entry was removed. Existing research-profile status wording is still factually correct and was preserved.
- Future AGI and Arc ATLAS creation timestamps fall on **October 4 UTC+8**, although GitHub's UTC timestamp is October 3.
- GPTCoach #1 falls on **March 7 UTC+8**, although its UTC creation date is March 6.
- Evaluation Runtime's release-commit timestamp falls on **September 18 UTC+8**, correcting the old homepage's September 17 date. It remains a mock-based public engineering snapshot.
- Oz #504 authorship is verified as `GBX-Max1220`. Its only reply is automated triage with an explicit maintainer-verification caveat, so no human confirmation is claimed.
- Caura #1822 is an unanswered Q&A semantics discussion. ContextNest #205 is API/docs contract clarification around a documented implementation constraint.
- The co-authored paper is verified as a **public preprint**, not inferred from a private delivery date. Its appearance here does not rewrite the collaboration description.

## Changed / not changed / why

CHANGED: single contribution data source; shared date, curation, status and lifecycle helpers; selected contribution, dated log and status components; existing ActivityLog refactored to the same source; homepage Latest replaced; new contributions route; research/footer discovery links; content/build/browser validation and Node built-in tests; task/audit provenance.

NOT CHANGED: headline, research question, collaboration descriptions, CV, research-profile JSON, project scientific claims, raw/frozen research assets, dependencies/lockfile, demo/Worker behavior, existing dirty files, main branch.

WHY: contribution evidence must be independently linked and dated, with current-status labels separated from historical events. Explicit selection avoids recency-driven homepage churn. Native editorial cards preserve the site's typography and layout. The five-item navigation is already dense, so discovery uses homepage, research and footer links.

## Future maintenance

Add a record to `src/data/contributions.json`; do not edit three pages. Keep an exact timestamp with an explicit offset, derive `localDate` in UTC+8, record the source URL and verification time, choose an allowed kind/event/status, and set `selected` explicitly. `selectedOrder` is required only for selected entries.

For an existing story, add a new dated record with `parentId` pointing to the preceding event. Retain the originating event time; refresh its current status only if warranted by public evidence. Record merged/closed/released/clarification/version events on their own timestamps and link them to their public evidence. Do not turn a bot reply into maintainer confirmation. The renderer assembles the connected chain for a single selected story and exposes all dated events in the full log.

Before selecting a new representative lifecycle event, unselect the previous representative. Validation rejects two selected records from one story. Run `npm run ci` after edits. Public reachability and truthful summaries require a fresh source audit; local validation checks schema, date/link usability, lifecycle references and rendered coverage, not semantic correctness of an external report.

## Validation and known limitations

- `npm ci`: exit 0, 422 packages installed; no dependency changes.
- Initial `npm run ci`: exit 0, 35 HTML pages, content validation, 12/12 contribution tests, 60/60 route/viewport checks and 3/3 existing Worker tests.
- Final `npm run ci` with the 21-event inventory and duplicate-selected-story guard: exit 0; 35 HTML pages, 21 valid events, 13/13 contribution tests, 60/60 route/viewport checks, and 3/3 Worker tests. Full output is saved locally in ignored `.astro/contribution-review/final-ci.log`.
- Contribution tests include impossible calendar dates, missing/unsafe links, duplicate IDs/events, unsupported kinds/statuses, dangling/cyclic/backwards parents, explicit selection, later clarification/version fixtures and identical formatting under UTC, America/Los_Angeles and Asia/Shanghai.
- Built-route checks require exact page title, nonempty suitable meta description, canonical `https://gbx-max1220.github.io/maxguo.dev/contributions/`, sitemap inclusion, explicit homepage selection, once-only chronological event coverage and valid internal anchors.
- Browser checks cover ten routes at 320, 375, 390, 768, 1366 and 1440px. The contributions page additionally passes heading hierarchy, native link focusability, actual Tab navigation and visible focus.
- Desktop/mobile PNGs for homepage, research and contributions are saved locally in ignored `.astro/contribution-review/`. They were visually inspected; cards wrap normally, typography matches existing pages, and no clipping or horizontal overflow was found.
- `git diff --check`: exit 0. Protected-path diff against the base is empty. The original dirty worktree still has its original branch, HEAD and the same three untracked status entries.
- Pre-existing warnings: the empty `learning-note` collection; the legacy generic sitemap-domain test is inconclusive. The new exact contributions sitemap check passes independently. Neither warning requires changing unrelated content.
- Existing pre-commit bootstrap needed two local environment repairs: Git dependency fetches required the already configured system proxy, and nodeenv treated the repository's major-only `.node-version` value `20` as a nonexistent `v20` archive. The original hook cache was initialized from an ignored task-local bootstrap directory using official Node `v20.20.2`; the existing hook versions and repository/global configuration were preserved. This is a validation-tool cache repair, not a website dependency or runtime declaration change.
- Web search did not index the newly published paper; the authoritative Zenodo API verified it directly. Current statuses are a dated audit snapshot, not a live GitHub polling service. No live API dependency or API cost is introduced into site builds.

KNOWN ISSUES: no unresolved authorship, link or current-status uncertainty for included records. Release-commit/tag times are accurately identified as such; uncertain original publication timing for excluded historical repositories is not fabricated.

FOLLOW-UP SUGGESTIONS: review the local page and diff, then separately authorize any publication/PR/deployment if desired. In a separate maintenance task, consider making the major-only Node declaration compatible with fresh pre-commit/nodeenv bootstrap; it was preserved here.

## File inventory for this local change

- `src/data/contributions.json`
- `src/lib/contributions.mjs`
- `src/components/SelectedContributions.astro`
- `src/components/ContributionLog.astro`
- `src/components/ContributionStatus.astro`
- `src/components/ActivityLog.astro`
- `src/pages/contributions/index.astro`
- `src/pages/index.astro`
- `src/pages/research.astro`
- `src/components/Footer.astro`
- `scripts/contributions.test.mjs`
- `scripts/validate-content.mjs`
- `scripts/validate-build.mjs`
- `scripts/check-overflow.mjs`
- `package.json`
- `.ai/tasks/research-engineering-log-20261004.json`
- `.ai/ledger.jsonl`
- `docs/CONTRIBUTIONS_AUDIT_2026-10-04.md`

PROTECTED/FROZEN ARTIFACTS CONFIRMED UNCHANGED: original dirty worktree files; CV sources/assets; research-profile data; project/publication content; research scientific claims; existing demos/Worker and visual assets.
