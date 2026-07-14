# Phase 2: Content Enhancements for maxguo.dev

You are working on Max Guo's personal academic website at `/mnt/c/Users/gbx12/projects/maxguo.dev/`. It's Astro 5 + Tailwind CSS + TypeScript. Phase 1 (narrative rewrite) is already done on disk — do not revert it.

---

## Task 1: Add `## Research Program` to About page

**File:** `src/pages/about/index.astro`

Add a new section AFTER the existing `## Research Philosophy` (5-layer stack) and BEFORE the `## Methodological Approach` section. The new section should be:

```html
<!-- Research Program -->
<h2 class="text-[1.5rem] mb-6">Research Program</h2>
<div class="card-static mb-10">
  <p class="text-sm text-[var(--color-text-dim)] leading-relaxed mb-3">
    <strong class="text-[var(--color-ink)]">Core question:</strong> How do AI
    systems mislead through false precision, and how can we measure, fix, and
    prevent it?
  </p>
  <p class="text-sm text-[var(--color-text-dim)] leading-relaxed mb-3">
    I have produced: (1) a
    <strong class="text-[var(--color-ink)]">systematic taxonomy</strong> of how
    LLMs misrepresent uncertainty (Precision Illusion); (2) a
    <strong class="text-[var(--color-ink)]"
      >benchmark and measurement methodology</strong
    >
    that detects the precision illusion where standard accuracy metrics cannot
    (MaxFitCalib-Bench); (3) a
    <strong class="text-[var(--color-ink)]"
      >deployable correction pipeline</strong
    >
    that fixes miscalibrated outputs at ~$0.001/correction (CheckMyCoach); (4)
    an
    <strong class="text-[var(--color-ink)]"
      >adaptive intervention framework</strong
    >
    that personalises calibration strategies per user (CalTrust); and (5)
    <strong class="text-[var(--color-ink)]">research infrastructure</strong>
    that makes trust calibration experiments reproducible and mergeable across
    labs (Knowledge Compiler, InteractionKit).
  </p>
  <p class="text-sm text-[var(--color-text-dim)] leading-relaxed mb-3">
    I am seeking a PhD position (Fall 2027) in a lab working on
    <strong class="text-[var(--color-ink)]"
      >Human-AI Interaction, CSCW, or HCI + AI reliability</strong
    >. I bring a demonstrated ability to produce both theoretical contributions
    and deployable systems, and I am looking for an environment where I can
    extend the precision illusion framework to multi-domain settings (medicine,
    law) and test user-facing calibration interventions in controlled
    experiments.
  </p>
  <p class="text-sm text-[var(--color-text-dim)] leading-relaxed">
    <strong class="text-[var(--color-ink)]"
      >Specific questions I want to pursue in a PhD:</strong
    >
    (a) Does the precision illusion generalise across domains with different
    stakes and user populations? (b) What interaction designs most effectively
    shorten the feedback loop between AI output and user trust calibration? (c)
    Can we build evaluation standards for AI uncertainty communication that the
    HCI community adopts?
  </p>
</div>
```

**Important:** Insert this block after the closing `</div>` of the Research Philosophy section (which ends `</div>` followed by the Belief blockquote). The ordering should be:

1. About title + intro card (existing)
2. Research Philosophy (existing — 5 cards)
3. Belief blockquote (existing)
4. **NEW: Research Program** (insert here)
5. Methodological Approach (existing)
6. Why HCI (existing)
7. Background (existing)
8. For Prospective Advisors (existing)
9. Beyond the Lab (existing)
10. Research Interests (existing)

---

## Task 2: Add `hciRelevance` field to 3 project JSONs + render in template

### 2a. Add field to project JSONs

**File:** `src/content/project/fitcalib-bench.json`

Add after `"keyTakeaways": [...]` (before `"faq":`):

```json
  "hciRelevance": "Challenges the assumption that LLMs' primary risk is over-reliance — the bigger risk may be subtle misdirection through false precision that standard accuracy benchmarks cannot detect.",
```

**File:** `src/content/project/checkmycoach.json`

Add after `"keyTakeaways": [...]` (before `"faq":`):

```json
  "hciRelevance": "Tests whether calibration is a trainable skill — if trust can be repaired through automated correction, then calibration is a design problem, not a user education problem.",
```

**File:** `src/content/project/caltrust.json`

Add after `"keyTakeaways": [...]` (before `"faq":`):

```json
  "hciRelevance": "Shows that one-size-fits-all uncertainty presentation is suboptimal — different users and contexts require different calibration strategies, making personalisation an HCI design challenge.",
```

### 2b. Update Zod schema

**File:** `src/content/config.ts`

Add `hciRelevance: z.string().optional(),` to the `projectSchema` object, in the appropriate alphabetical position (after `faq` or near `keyTakeaways`).

### 2c. Render in project detail template

The project detail pages use `src/pages/research/**/[id]/index.astro` pattern — but actually the current project detail pages are individually written per project, not a dynamic [id] route. Let me check:

Look at `src/pages/research/measuring-ai-reliability/fitcalib-bench/index.astro`. If it's a single static page (not using `Astro.glob` to iterate projects), then you need to manually add the HCI relevance line to each of the 3 project detail pages.

**Option A (if each project has its own index.astro):** Add this block to each project's detail page, after the project title + tagline area, before the key takeaways card:

```html
<div class="card-static mb-6 border-l-2 border-[var(--color-primary)]">
  <p
    class="font-mono text-[0.6rem] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1"
  >
    Why this matters for HCI
  </p>
  <p class="text-sm text-[var(--color-text-dim)] leading-relaxed">
    [INSERT HCI RELEVANCE TEXT FROM JSON]
  </p>
</div>
```

**Option B (if they use a shared template):** Update the template to read `hciRelevance` from the project data and render conditionally.

Check which case applies and implement accordingly.

### 2d. Add to project cards on Projects page

**Do NOT** add the HCI relevance text to the project cards on `/projects/` — it's too long for card display. Only detail pages get it.

---

## Task 3: Add impact summary under homepage stats

**File:** `src/pages/index.astro`

In the homepage LEFT COLUMN sidebar, AFTER the closing `</div>` of the stats grid (the 4 stat items) and BEFORE the closing `</div>` of the left column (the main `lg:w-[340px]` div), add:

```html
<!-- Impact statement -->
<div class="mt-6 pt-5 border-t border-[var(--color-rule-light)]">
  <p
    class="font-sans text-[0.7rem] text-[var(--color-text-dim)] leading-relaxed italic"
  >
    This work proposes a shift in AI evaluation: from measuring accuracy alone,
    to measuring how uncertainty is communicated and trusted.
  </p>
</div>
```

---

## Task 4: Learning Notes infrastructure (content collection + list page)

### 4a. Add schema to content config

**File:** `src/content/config.ts`

Add AFTER the `blogSchema`:

```typescript
const learningNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()),
  excerpt: z.string(),
  source: z.string().optional(), // e.g. "Kahneman, 2011" or "CSCW 2025"
  draft: z.boolean(),
});
```

And add to the `collections` export:

```typescript
  'learning-note': defineCollection({ type: 'content', schema: learningNoteSchema }),
```

### 4b. Create a sample learning note (optional but recommended)

Create `src/content/learning-note/.gitkeep` (empty file).

### 4c. Create list page

**Create file:** `src/pages/notes/index.astro`

Content:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const notes = await getCollection('learning-note');
const published = notes.filter(n => !n.data.draft).sort((a, b) => b.data.date - a.data.date);
---
<BaseLayout title="Notes" description="Learning notes and reading summaries — Max Guo">
  <div class="container-content py-16">
    <div class="max-w-2xl">

      <span class="section-label mb-4">Notes</span>
      <h1 class="mb-4">Learning Notes</h1>
      <p class="text-sm text-[var(--color-text-dim)] mb-8 max-w-lg">
        Reading summaries, technical notes, and study records. Arranged newest first.
      </p>

      {published.length === 0 && (
        <div class="card-static text-center py-12">
          <p class="text-sm text-[var(--color-text-muted)]">No notes yet. Coming soon.</p>
        </div>
      )}

      {published.length > 0 && (
        <div class="space-y-3">
          {published.map((note) => (
            <a href={`/notes/${note.id}/`} class="card group block">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-[0.6rem] text-[var(--color-text-muted)]">{note.data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {note.data.source && <span class="badge text-[0.5rem]">{note.data.source}</span>}
              </div>
              <h3 class="text-[1.05rem] mb-1 group-hover:text-[var(--color-primary)] transition-colors">{note.data.title}</h3>
              <p class="text-sm text-[var(--color-text-dim)]">{note.data.excerpt}</p>
            </a>
          ))}
        </div>
      )}

    </div>
  </div>
</BaseLayout>
```

### 4d. Optionally: add Notes to footer site links

**File:** `src/components/Footer.astro`

The "Notes" link currently points to `/research-notes/`. If you want a separate `/notes/` for learning notes, add a new link. Or keep both — `/notes/` for learning notes and `/research-notes/` for dataset analyses.

---

## Verification

After all changes, run:

```bash
cd /mnt/c/Users/gbx12/projects/maxguo.dev && mv src/pages/blog/the-wrong-question.astro{,.bak} && npm run build
```

The `the-wrong-question.astro` blog has a pre-existing build issue (unrelated to these changes). After build, restore it with:

```bash
mv src/pages/blog/the-wrong-question.astro{.bak,}
```

---

## Files modified in Phase 1 (do not revert)

These files already have Phase 1 changes:

- `src/pages/index.astro` — hero tagline, 5-layer arc, stats anchors, avatar+contacts, ActivityLog bugfix, hideTopBar
- `src/components/Nav.astro` — 5 nav items
- `src/components/Footer.astro` — site links, iconified contact links
- `src/pages/research.astro` — 5-layer timeline
- `src/pages/about/index.astro` — 5-layer philosophy, Prospective Advisors
- `src/pages/projects/index.astro` — InteractionKit card, 5-layer big picture
- `src/layouts/BaseLayout.astro` — top contact bar with hideTopBar prop
- `src/styles/globals.css` — dark mode removed (fixed warm beige)
- `src/content/project/interactionkit.json` — new project entry

Do NOT revert these. Phase 2 builds on top of them.
