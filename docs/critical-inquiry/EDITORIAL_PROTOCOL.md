# 言说的边界 / The Boundaries of the Sayable
## Editorial and evidence protocol · Draft 2026-10-28

**Status:** INTERNAL DRAFT. This is a method and release gate, not an empirical result.

### Editorial identity

Independent, critical inquiry into information control, propaganda, historical memory, public knowledge, and power in China. This is an interest-driven public research project, not an admissions-oriented CS/ML portfolio project.

**Editorial position:** Public power and institutional truth claims are open to scrutiny. This is compatible with acknowledging verified facts, insufficient evidence, and mistaken accusations. Critical inquiry determines the questions; evidence constrains the conclusions.

### Evidence model

**Source:** a document, screenshot, report, interview, statement, or archived page. Log source identifier, publication/capture time, publisher, provenance, source type, URL, excerpt scope, reuse rights, and limitations.

**Atomic claim:** a precise, falsifiable or document-checkable proposition, with its speaker, temporal scope, and supporting/contradicting source IDs. Never silently collapse a claim of possibility with a claim of certainty.

**Interpretation:** a marked analytical inference, distinct from any historically observed statement.

**Correction:** a dated amendment retaining the previous version, new evidence, reasons for change, and affected pages.

A contemporaneous report quoting a social-media claim is NOT automatically the original post. Multiple copies of one press release are NOT independent reports.

### Evidence labels

- contemporaneous observation
- attributed institutional assertion
- circulating claim reported secondhand, original unavailable
- unverified prediction at date T
- later related policy change, not retroactive authentication
- corrected assertion with dated subsequent evidence
- analytical inference, not a historically observed post
- unresolved due to inadequate or conflicting evidence

Avoid binary event-wide "truth scores". State the precise proposition and evidence status.

### Historical as-of viewer

At T, display only information published no later than T. A public date does not establish the moment every reader could see, search or understand that document. A later policy can modify our evaluation of an old prediction but does not by itself prove the original speaker had an inside source. Separate *what happened*, *what was said publicly*, and *what an institution knew internally*.

### Inferring control or cognitive effects

**Restriction** requires evidence of an actual moderation act or platform mechanism, not merely the absence of a page. **Attribution** requires separate evidence connecting the actor to the act. **Impact on cognition or self-censorship** requires suitable independent human or observational data, not only changed wording.

### Publication gates

G0 — Source provenance and date integrity.  
G1 — Claim decomposition, competing evidence, status labels.  
G2 — Strict as-of review; no future evidence in earlier time windows.  
G3 — Independent human review of contested conclusions and quote fidelity. Re-prompting a model does not count.  
G4 — Privacy, copyright, translation parity and factual copy edit.  
G5 — Keyboard-accessible interaction, readable typography and six-viewpoint responsive QA.  
G6 — Explicit editorial release approval, change log and published archive snapshot.

A draft PR, a noindex meta tag, or a hidden link is NOT an access restriction. The Shanghai case page is archived under docs/critical-inquiry/prototypes/ and is not an Astro route. Its underlying research data remain in src/data for validation, but no case page is emitted by the build. Restore public routing only after an explicit editorial release.

### Editorial practice

- Scrutinize structural differences in power and responsibility; do not confuse "neutrality" with pretending those differences do not exist.
- Do not assume every state source is false or every citizen account is true.
- Keep an explicit distinction between allegation, police investigation, charge, judgment, and final disposition.
- Separate official findings from independent corroboration.
- Minimize personally identifying details, especially for ordinary social-media users.
- Avoid reproducing copyrighted full texts when linking and short extracts suffice.
- Publish versioned corrections; do not silently erase past mistaken judgments.
- Distinguish factual findings, interpretive hypotheses, and explicit normative criticism.

### Site map

Chinese hub: /critical-inquiry/  
English hub: /critical-inquiry/en/  
Existing research: /non-answers/ and /research/china-time-use-2024/  
Case drafts: not linked to public navigation until all release gates pass.

### Remaining epistemic gaps

Original social posts may no longer be independently recoverable. Public explanations do not directly expose internal decision-making. Differences between reports may arise from information timing, genre, length, editorial selection, or restrictions. Publicly visible narratives do not measure population belief or representativeness.
