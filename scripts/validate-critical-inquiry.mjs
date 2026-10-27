import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('src/data/critical-inquiry/shanghai2022.json'));

assert.equal(data.status, 'DRAFT_REVIEW_REQUIRED', 'unreviewed exhibit must be marked draft');
assert.ok(data.sources.length >= 4);
assert.ok(data.snapshots.length >= 3);

const byId = new Map(data.sources.map(s => [s.id, s]));
assert.equal(byId.size, data.sources.length, 'duplicate source ID');
for (const source of data.sources) {
  assert.match(source.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(source.date)), source.id + ': bad date');
  assert.ok(source.url.startsWith('https://'), source.id + ': source URL must be HTTPS');
}
let prevDate = '';
for (const snapshot of data.snapshots) {
  assert.ok(snapshot.date > prevDate, 'as-of snapshots must be chronological');
  prevDate = snapshot.date;
  assert.ok(snapshot.available_sources.length > 0);
  assert.equal(new Set(snapshot.available_sources).size, snapshot.available_sources.length);
  const expected = data.sources.filter(source => source.date <= snapshot.date).map(source => source.id).sort();
  assert.deepEqual([...snapshot.available_sources].sort(), expected,
    snapshot.id + ': as-of view includes future evidence or omits recorded public evidence');
  for (const id of snapshot.available_sources) {
    const source = byId.get(id);
    assert.ok(source, snapshot.id + ': nonexistent source ' + id);
    assert.ok(source.date <= snapshot.date, snapshot.id + ': future source present');
  }
}

const claimIds = new Set();
const observedTypes = new Set(['republication_of_viral_claim', 'policy_announcement']);
for (const claim of data.claims) {
  assert.ok(!claimIds.has(claim.id), 'duplicate claim ID');
  claimIds.add(claim.id);
  assert.ok(claim.source_ids.length, claim.id + ': missing sources');
  for (const id of claim.source_ids) assert.ok(byId.has(id), claim.id + ': missing source ' + id);
  if (!observedTypes.has(claim.type)) {
    assert.equal(claim.date_first_observed, null, claim.id + ': inferred proposition must not pose as historical post');
  }
}

const zh = read('src/pages/critical-inquiry/index.astro');
const en = read('src/pages/critical-inquiry/en/index.astro');
const draft = read('src/pages/critical-inquiry/cases/shanghai-lockdown-2022/index.astro');
assert.match(zh, /lang="zh-CN"/);
assert.match(zh, /critical-inquiry\/en\//);
assert.match(en, /lang="en"/);
assert.match(en, /critical-inquiry\//);
assert.match(draft, /noindex=\{true\}/);
assert.match(draft, /data-asof-panel/);
assert.match(draft, /DRAFT|研究草稿/);
assert.match(read('src/styles/critical-inquiry.css'), /ci-hero/);
console.log('Critical Inquiry: source chronology, claim types, draft controls, locales PASS');
