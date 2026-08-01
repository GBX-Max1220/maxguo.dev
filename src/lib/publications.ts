export const PUBLICATION_STATUS = {
  draft: { label: 'Draft', shortLabel: 'draft', className: '' },
  in_preparation: { label: 'In Preparation', shortLabel: 'in prep', className: '' },
  preprint: { label: 'Preprint', shortLabel: 'preprint', className: 'badge-gold' },
  submitted: { label: 'Submitted', shortLabel: 'submitted', className: 'badge-under-review' },
  under_review: { label: 'Under Review', shortLabel: 'in review', className: 'badge-under-review' },
  accepted: { label: 'Accepted', shortLabel: 'accepted', className: 'badge-published' },
  published: { label: 'Published', shortLabel: 'published', className: 'badge-published' },
  archived: { label: 'Archived', shortLabel: 'archived', className: '' },
} as const;

export type PublicationStatus = keyof typeof PUBLICATION_STATUS;

export function publicationStatusMeta(status: PublicationStatus) {
  return PUBLICATION_STATUS[status];
}

const PROJECT_ROUTES: Record<string, string> = {
  'checkmycoach': '/research/building-trustworthy-ai/checkmycoach/',
  'fitcalib-bench': '/research/measuring-ai-reliability/fitcalib-bench/',
};

export function projectHref(projectId?: string) {
  return projectId ? PROJECT_ROUTES[projectId] : undefined;
}
