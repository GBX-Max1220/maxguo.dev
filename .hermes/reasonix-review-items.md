# maxguo.dev — Pending Content Decisions for Review

## Context

Personal academic website of Max Guo (HCI researcher, applying for PhD Fall 2027). Astro + Tailwind + TypeScript. Already completed Phase 1 narrative rewrite (hero tagline, 5-layer research arc, nav pruning, Prospective Advisors paragraph, avatar+contacts layout, dark mode removed in favour of fixed warm beige).

## Items for Review

### P1: New "Research Statement" page

- Standalone page at `/research-statement/` (~600-800 words)
- Content: core research question → evidence so far (Precision Illusion, MaxFitCalib, CheckMyCoach, CalTrust, InteractionKit) → what kind of lab fit (HCI + AI reliability, trust calibration, evaluation methodology) → specific questions I want to pursue in a PhD
- Signal value: demonstrates academic writing ability, serious about placement
- Concern: overlap with About page's "For Prospective Advisors" section — should they merge or stay separate?

### P1: Now page → add research roadmap

- Current `/now/` page lists 4 ongoing items. Add a timeline/roadmap: milestones from now through Fall 2027 submission cycle
- e.g. InteractionKit pilot complete by Sep → Study 2 design Oct-Nov → multi-domain benchmark extension Q1 2027 → applications due etc.
- Concern: makes plans public that may change. Risky or expected?

### P2: "Why this matters for HCI" per project

- Each project detail page + project card on `/projects/` gets a one-liner framing the HCI relevance
- Example: "Why this matters for HCI: Precision Illusion challenges the assumption that LLM users' primary risk is over-reliance. Instead, the primary risk is subtle misdirection through plausible-sounding precision."
- Concern: adds noise if poorly written. Better to skip weak ones?

### P2: Stats → add impact summary sentence

- Under the 4 stats in homepage sidebar, add a one-line research impact statement
- Something like: "This work redefines how we evaluate AI advice in high-stakes domains — from accuracy alone to calibration."
- Concern: is this too self-promotional for an academic site?

### P3: Learning notes section (deferred)

- Future `/notes/` collection for study notes, reading summaries, technical notes
- Distinguish from blog (polished essays) and research-notes (dataset analyses)
- Question: worth setting up infrastructure now even with zero content?

### Not recommended (rejected)

- Dark mode toggle (settled on fixed warm beige)
- Multi-language (English only for PhD apps)
- Animations/interactive flourishes (no signal value for PI)
- Reading list page (empty until content exists)
- Open source portal (each project already links GitHub)

## Usage

This file was written by Hermes Agent for Max Guo. Reasonix should review each item and give:

1. Go / No-go / Modify
2. Priority relative to other items
3. Any missing concerns
