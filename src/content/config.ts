import { defineCollection, z } from 'astro:content';

const programSchema = z.object({
  id: z.string(),
  title: z.string(),
  scientificQuestion: z.string(),
  description: z.string(),
  order: z.number(),
});

const academicStatusSchema = z.enum([
  'draft',
  'in_preparation',
  'preprint',
  'submitted',
  'under_review',
  'accepted',
  'published',
  'archived',
]);

const workflowStateSchema = z.enum(['active', 'frozen', 'superseded', 'archived']);

const evidenceLevelSchema = z.enum([
  'concept',
  'prototype',
  'simulation_tested',
  'offline_evaluated',
  'human_pilot',
  'human_validated',
]);

const projectSchema = z.object({
  id: z.string(),
  programId: z.string(),
  title: z.string(),
  shortTitle: z.string(),
  oneLiner: z.string().optional(),
  workflowState: workflowStateSchema,
  evidenceLevel: evidenceLevelSchema,
  version: z.string(),
  updated: z.coerce.date(),
  lastVerified: z.coerce.date(),
  keyTakeaways: z.array(z.string()),
  hciRelevance: z.string().optional(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  links: z.object({
    paper: z.string().optional(),
    demo: z.string().optional(),
    code: z.string().optional(),
    dataset: z.string().optional(),
    slides: z.string().optional(),
    poster: z.string().optional(),
    video: z.string().optional(),
    colab: z.string().optional(),
    docker: z.string().optional(),
  }),
  citation: z.object({
    bibtex: z.string(),
    apa: z.string(),
    chicago: z.string(),
    mla: z.string(),
  }),
  reproducible: z.object({
    env: z.string().optional(),
    quickStart: z.string().optional(),
    badge: z.string().optional(),
  }),
  changelog: z.array(z.object({
    version: z.string(),
    date: z.coerce.date(),
    event: z.string(),
  })),
  relatedIds: z.array(z.string()),
  archived: z.object({
    reason: z.string(),
    lessonsLearned: z.string(),
  }).optional(),
  order: z.number(),
});

const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  venue: z.string().optional(),
  venueTarget: z.string().optional(),
  year: z.number(),
  status: academicStatusSchema,
  workflowState: workflowStateSchema,
  submittedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional(),
  lastVerified: z.coerce.date(),
  tags: z.array(z.string()),
  links: z.object({
    pdf: z.string().optional(),
    arxiv: z.string().optional(),
    preprint: z.string().optional(),
    doi: z.string().optional(),
    code: z.string().optional(),
    dataset: z.string().optional(),
    bibtex: z.string().optional(),
  }),
  citation: z.object({
    bibtex: z.string(),
    apa: z.string(),
    chicago: z.string(),
    mla: z.string(),
  }),
  abstract: z.string().optional(),
  featured: z.boolean(),
  projectId: z.string().optional(),
}).superRefine((publication, ctx) => {
  const publicPreprint = publication.links.arxiv || publication.links.preprint;

  if (publication.status === 'preprint' && !publicPreprint) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['links'],
      message: 'Preprint status requires an arXiv or preprint URL.',
    });
  }

  if (['submitted', 'under_review', 'accepted'].includes(publication.status) && !publication.submittedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['submittedAt'],
      message: `${publication.status} status requires submittedAt.`,
    });
  }

  if (publication.status === 'under_review' && !publication.venue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['venue'],
      message: 'Under-review status requires a confirmed venue.',
    });
  }

  if (publication.status === 'accepted' && (!publication.acceptedAt || !publication.venue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['acceptedAt'],
      message: 'Accepted status requires acceptedAt and a confirmed venue.',
    });
  }
});

const blogSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.coerce.date(),
  type: z.enum(['research-note', 'essay']),
  tags: z.array(z.string()),
  excerpt: z.string(),
  projectId: z.string().optional(),
  draft: z.boolean(),
});

const learningNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()),
  excerpt: z.string(),
  source: z.string().optional(),
  draft: z.boolean(),
});

export const collections = {
  program: defineCollection({ type: 'data', schema: programSchema }),
  project: defineCollection({ type: 'data', schema: projectSchema }),
  publication: defineCollection({ type: 'data', schema: publicationSchema }),
  blog: defineCollection({ type: 'content', schema: blogSchema }),
  'learning-note': defineCollection({ type: 'content', schema: learningNoteSchema }),
};
