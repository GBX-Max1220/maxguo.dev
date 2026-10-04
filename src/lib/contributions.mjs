export const KIND_LABELS = Object.freeze({ issue: 'Issue', pr: 'PR', discussion: 'Discussion', release: 'Release', paper: 'Paper', artifact: 'Artifact' });
export const EVENT_LABELS = Object.freeze({ opened: 'Opened', submitted: 'Submitted', merged: 'Merged', closed: 'Closed', clarified: 'Clarified', released: 'Released', published: 'Published' });
const COMPACT_STATUSES = Object.freeze({
  issue: { open: 'Open', closed: 'Closed', fixed_upstream: 'Closed · fixed upstream' },
  pr: { open: 'Open', merged: 'Merged', closed: 'Closed' },
  discussion: { open: 'Open', answered: 'Answered', closed: 'Closed' },
  release: { released: 'Released' },
  paper: { preprint: 'Public preprint', published: 'Published' },
  artifact: { public: 'Public' },
});
const EVIDENCE_CTA_LABELS = Object.freeze({
  discussion: 'View discussion', issue: 'View issue', pr: 'View pull request',
  release: 'View release', paper: 'View preprint', artifact: 'View artifact',
});
export const STATUSES = Object.freeze({
  issue: { open: 'Open issue', closed: 'Closed issue', fixed_upstream: 'Closed · fixed upstream' },
  pr: { open: 'Open PR', merged: 'Merged', closed: 'Closed PR' },
  discussion: { open: 'Discussion open', answered: 'Answered', closed: 'Discussion closed' },
  release: { released: 'Released' },
  paper: { preprint: 'Public preprint', published: 'Published' },
  artifact: { public: 'Public artifact' },
});
const EVENTS = { issue: ['opened', 'closed'], pr: ['submitted', 'merged', 'closed'], discussion: ['opened', 'clarified', 'closed'], release: ['released'], paper: ['published'], artifact: ['published'] };

export function localDate(iso) {
  return new Date(Date.parse(iso) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function formatDay(day) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(new Date(`${day}T00:00:00+08:00`));
}

export function statusLabel(record) {
  return STATUSES[record.kind]?.[record.status] ?? record.status;
}

export function compactStatusLabel(record) {
  return COMPACT_STATUSES[record.kind]?.[record.status] ?? statusLabel(record);
}

export function contributionScopeLabel(record) {
  if (record.scope === 'external') return 'External';
  if (/\bcollaboration\b/i.test(record.project)) return 'Collaborative research';
  return 'Own research';
}

export function evidenceCta(record) {
  return `${EVIDENCE_CTA_LABELS[record.kind] ?? 'View artifact'} →`;
}

export function eventMaturity(event) {
  return ['merged', 'released', 'published'].includes(event.event) ? 'established' : 'developing';
}

export function newestFirst(records) {
  return [...records].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || a.id.localeCompare(b.id));
}

export function selectedContributions(records) {
  return records.filter(record => record.selected === true).sort((a, b) => a.selectedOrder - b.selectedOrder);
}

export function groupByDay(records) {
  const groups = new Map();
  for (const record of newestFirst(records)) {
    const day = localDate(record.occurredAt);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(record);
  }
  return [...groups].map(([day, entries]) => ({ day, entries }));
}

export function storyRoot(record, records) {
  const byId = new Map(records.map(entry => [entry.id, entry]));
  const seen = new Set();
  let current = record;
  while (current.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current.id;
}

export function storyEvents(record, records) {
  const root = storyRoot(record, records);
  return newestFirst(records.filter(entry => storyRoot(entry, records) === root)).reverse();
}

function validTimestamp(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59) return false;
  if (match[5] !== 'Z' && (Number(match[5].slice(1, 3)) > 23 || Number(match[5].slice(4)) > 59)) return false;
  const day = new Date(`${match[1]}T00:00:00Z`);
  return Number.isFinite(Date.parse(value)) && Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === match[1];
}

function publicUrl(value) {
  if (typeof value !== 'string' || value !== value.trim() || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && url.hostname.includes('.') &&
      !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.)/i.test(url.hostname) &&
      !/\.(local|localhost|internal|test|invalid)$/i.test(url.hostname) && !url.hostname.includes(':') && !/^\d+(\.\d+){3}$/.test(url.hostname);
  } catch { return false; }
}

export function validateContributions(records) {
  if (!Array.isArray(records)) return ['Contributions must be an array'];
  const errors = [];
  const ids = new Set();
  const orders = new Set();
  const events = new Set();
  const byId = new Map();
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      errors.push(`Record ${index}: must be an object`);
      continue;
    }
    const prefix = record.id || `Record ${index}`;
    const error = message => errors.push(`${prefix}: ${message}`);
    if (typeof record.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(record.id)) error('Invalid id');
    if (ids.has(record.id)) error('Duplicate id');
    ids.add(record.id);
    byId.set(record.id, record);
    for (const field of ['project', 'title', 'contribution', 'whyItMatters']) {
      if (typeof record[field] !== 'string' || !record[field].trim()) error(`Missing ${field}`);
    }
    if (!Object.hasOwn(KIND_LABELS, record.kind)) error('Unsupported kind');
    if (!Object.hasOwn(STATUSES[record.kind] ?? {}, record.status)) error('Unsupported status for kind');
    if (!EVENTS[record.kind]?.includes(record.event)) error('Unsupported lifecycle event for kind');
    if (!['own', 'external'].includes(record.scope)) error('Unsupported scope');
    if (!validTimestamp(record.occurredAt)) error('Invalid occurredAt timestamp');
    else if (record.localDate !== localDate(record.occurredAt)) error('Invalid localDate: must match Asia/Shanghai event day');
    if (!publicUrl(record.url)) error('Missing or unusable public URL');
    if (typeof record.selected !== 'boolean') error('selected must be explicit true/false');
    if (record.selected === true) {
      if (!publicUrl(record.url)) error('Selected entry requires a usable public link');
      if (!Number.isInteger(record.selectedOrder) || record.selectedOrder < 1) error('Selected entry needs positive selectedOrder');
      if (orders.has(record.selectedOrder)) error('Duplicate selectedOrder');
      orders.add(record.selectedOrder);
    }
    if (record.event === 'merged' && record.status !== 'merged') error('Merged event requires merged status');
    if (record.event === 'closed' && record.status === 'open') error('Closed event cannot have open status');
    const eventKey = `${record.url}|${record.event}|${record.occurredAt}`;
    if (events.has(eventKey)) error('Duplicate dated event');
    events.add(eventKey);
    if (!record.source || !validTimestamp(record.source.verifiedAt) || !publicUrl(record.source.apiUrl)) error('Missing audit source or valid verifiedAt');
    if (record.source?.author && record.source.author !== 'GBX-Max1220') error('Contribution author must be GBX-Max1220');
    const sourceDate = { opened: 'createdAt', submitted: 'createdAt', merged: 'mergedAt', closed: 'closedAt' }[record.event];
    if (sourceDate && record.source?.[sourceDate] && record.occurredAt !== record.source[sourceDate]) error(`Event date must match source ${sourceDate}`);
  }
  for (const record of records.filter(entry => entry && typeof entry === 'object')) {
    if (!record.parentId) continue;
    const parent = byId.get(record.parentId);
    if (!parent) { errors.push(`${record.id}: Unknown parentId`); continue; }
    if (Date.parse(parent.occurredAt) > Date.parse(record.occurredAt)) errors.push(`${record.id}: Parent cannot occur after child`);
    if (parent.scope !== record.scope || parent.project !== record.project) errors.push(`${record.id}: Parent must belong to the same project and scope`);
    const seen = new Set([record.id]);
    let current = parent;
    while (current) {
      if (seen.has(current.id)) { errors.push(`${record.id}: Cyclic parentId`); break; }
      seen.add(current.id);
      current = byId.get(current.parentId);
    }
  }
  const selectedStories = new Set();
  for (const record of records.filter(entry => entry?.selected === true)) {
    const root = storyRoot(record, [...byId.values()]);
    if (selectedStories.has(root)) errors.push(`${record.id}: Select only one representative per contribution story`);
    selectedStories.add(root);
  }
  return errors;
}
