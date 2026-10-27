import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('src/data/critical-inquiry/shanghai2022.json'));

assert.equal(data.status, 'DRAFT_REVIEW_REQUIRED', 'unreviewed exhibit must be marked draft');
assert.ok(data.sources.length >= 6);
assert.ok(data.snapshots.length >= 4);

const byId = new Map(data.sources.map(s => [s.id, s]));
assert.equal(byId.size, data.sources.length, 'duplicate source ID');
for (const source of data.sources) {
  assert.match(source.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(source.date)), source.id + ': bad date');
  assert.ok(source.url.startsWith('https://'), source.id + ': source URL must be HTTPS');
  assert.ok(source.independence_group, source.id + ': missing origin/independence group');
  if (source.published_at_local) assert.match(source.published_at_local, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
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
const observedTypes = new Set(['republication_of_viral_claim', 'police_attributed_circulating_claim', 'policy_announcement']);
for (const claim of data.claims) {
  assert.ok(!claimIds.has(claim.id), 'duplicate claim ID');
  claimIds.add(claim.id);
  assert.ok(claim.source_ids.length, claim.id + ': missing sources');
  for (const id of claim.source_ids) assert.ok(byId.has(id), claim.id + ': missing source ' + id);
  if (observedTypes.has(claim.type)) {
    assert.ok(claim.date_first_observed, claim.id + ': historical claim needs earliest documented date');
    const earliest = claim.source_ids.map(id => byId.get(id).date).sort()[0];
    assert.equal(claim.date_first_observed, earliest, claim.id + ': first documented date must follow sources');
  } else {
    assert.equal(claim.date_first_observed, null, claim.id + ': inferred proposition must not pose as historical post');
  }
}

const zh = read('src/pages/critical-inquiry/index.astro');
const en = read('src/pages/critical-inquiry/en/index.astro');
const draft = read('docs/critical-inquiry/prototypes/shanghai_2022_case_page.astro.txt');
assert.match(zh, /lang="zh-CN"/);
assert.match(zh, /critical-inquiry\/en\//);
assert.match(en, /lang="en"/);
assert.match(en, /critical-inquiry\//);
assert.match(draft, /noindex=\{true\}/);
assert.match(draft, /data-asof-panel/);
assert.match(draft, /DRAFT|研究草稿/);
assert.match(draft, /NOT ROUTED \/ NOT BUILT INTO WEBSITE/);
assert.match(read('src/styles/critical-inquiry.css'), /ci-hero/);

assert.equal(data.snapshots[0].date, '2022-03-22', 'must retain earliest documented late-evening rebuttal');
assert.equal(data.snapshots[0].available_sources.length, 1, 'first as-of state must only use contemporaneous sources');
assert.equal(data.sources.find(s => s.id === 'S05').published_at_local, '2022-03-22T23:21:00+08:00');

const config = read('astro.config.mjs');
assert.match(config, /filter: \(page\) => !page\.includes\('\/critical-inquiry\/cases\/'\)/);
const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const findBuiltPage = (page) => {
    const file = path.join(dist, page, 'index.html');
    assert.ok(fs.existsSync(file), 'missing built page: ' + file);
    return fs.readFileSync(file, 'utf8');
  };
  const zhHtml = findBuiltPage('critical-inquiry');
  const enHtml = findBuiltPage('critical-inquiry/en');
  const draftFile = path.join(dist, 'critical-inquiry', 'cases', 'shanghai-lockdown-2022', 'index.html');
  assert.ok(!fs.existsSync(draftFile), 'unreviewed draft must not be emitted by Astro build');
  assert.match(zhHtml, /<html[^>]*lang="zh-CN"/i);
  assert.match(enHtml, /<html[^>]*lang="en"/i);

  for (const html of [zhHtml, enHtml]) {
    assert.match(html, /hreflang="zh-CN"/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="x-default"/);
    assert.match(html, /href="https:\/\/gbx-max1220\.github\.io\/maxguo\.dev\/critical-inquiry\/en\/"/);
    assert.match(html, /href="https:\/\/gbx-max1220\.github\.io\/maxguo\.dev\/critical-inquiry\/"/);
  }

  assert.match(draft, /noindex=\{true\}/);
  for (const sitemap of fs.readdirSync(dist).filter(x => /^sitemap.*\.xml$/.test(x))) {
    const xml = fs.readFileSync(path.join(dist, sitemap), 'utf8');
    assert.ok(!xml.includes('/critical-inquiry/cases/'), 'draft case leaked to sitemap ' + sitemap);
  }
}

console.log('Critical Inquiry: source chronology, claim types, draft controls, locales PASS');
