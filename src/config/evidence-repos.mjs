/**
 * Evidence repository registry.
 *
 * Source repositories that evidence pages deep-link into. A repo is either
 * publicly fetchable (publicUrl set, publicationState "public") or a prepared
 * local public snapshot awaiting an owner publication decision
 * (publicUrl null, publicationState "publication_pending").
 *
 * EvidenceLink renders pending repos as non-clickable provenance text —
 * never a placeholder href, fake URL, or local filesystem path.
 */
export const EVIDENCE_REPOS = Object.freeze({
  checkmycoach: Object.freeze({
    id: 'checkmycoach',
    label: 'CheckMyCoach',
    publicUrl: 'https://github.com/GBX-Max1220/CheckMyCoach',
    publicationState: 'public',
  }),
  interactionkit: Object.freeze({
    id: 'interactionkit',
    label: 'InteractionKit',
    publicUrl: 'https://github.com/GBX-Max1220/InteractionKit',
    publicationState: 'public',
  }),
  'eval-runtime': Object.freeze({
    id: 'eval-runtime',
    label: 'Evaluation Runtime',
    publicUrl: 'https://github.com/GBX-Max1220/evaluation-runtime',
    publicationState: 'public',
  }),
});

export function getEvidenceRepo(repoId) {
  const repo = EVIDENCE_REPOS[repoId];
  if (!repo) {
    throw new Error(`Unknown evidence repoId: ${repoId}`);
  }
  return repo;
}
