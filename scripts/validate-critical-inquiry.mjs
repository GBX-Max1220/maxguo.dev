import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('src/data/critical-inquiry/shanghai2022.json'));

assert.equal(data.status, 'DRAFT_REVIEW_REQUIRED', 'unreviewed exhibit must be marked draft');
assert.ok(data.sources.length >= 22);
assert.ok(data.snapshots.length >= 11);

const byId = new Map(data.sources.map(s => [s.id, s]));
assert.equal(byId.size, data.sources.length, 'duplicate source ID');
for (const source of data.sources) {
  assert.match(source.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(source.date)), source.id + ': bad date');
  assert.ok(source.url.startsWith('https://'), source.id + ': source URL must be HTTPS');
  assert.ok(source.independence_group, source.id + ': missing origin/independence group');
  if (source.published_at_local) assert.match(source.published_at_local, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
}
const dayEnd = (date) => date + 'T23:59:59+08:00';
const publicationCutoff = (source) => source.published_at_local ?? dayEnd(source.date);
let prevCutoff = '';
for (const snapshot of data.snapshots) {
  const cutoff = snapshot.cutoff_local ?? dayEnd(snapshot.date);
  assert.ok(cutoff > prevCutoff, 'as-of snapshots must be in strictly chronological order');
  prevCutoff = cutoff;
  assert.ok(snapshot.available_sources.length > 0);
  assert.equal(new Set(snapshot.available_sources).size, snapshot.available_sources.length);
  const expected = data.sources.filter(source => source.asof_eligible !== false && publicationCutoff(source) <= cutoff).map(source => source.id).sort();
  assert.deepEqual([...snapshot.available_sources].sort(), expected,
    snapshot.id + ': includes not-yet-public evidence or excludes already-public evidence');
  for (const id of snapshot.available_sources) {
    const source = byId.get(id);
    assert.ok(source, snapshot.id + ': nonexistent source ' + id);
    assert.ok(publicationCutoff(source) <= cutoff, snapshot.id + ': future source present ' + id);
  }
}
const interview = data.snapshots.find(s => s.id === 'mar23_1402');
assert.ok(interview, 'missing the March 23 intraday checkpoint');
assert.ok(interview.available_sources.includes('S09'), 'interview not visible at its publication time');
assert.ok(!interview.available_sources.includes('S11'), 'police 18:10 notice leaked into 14:02 state');
assert.ok(!interview.available_sources.includes('S02'), 'police 18:26 report leaked into 14:02 state');
const mar31 = data.snapshots.find(s => s.id === 'mar31');
assert.ok(mar31 && mar31.available_sources.includes('S10'), '3/31 22:51 policy notice missing');
assert.ok(!mar31.available_sources.includes('S06'), 'April 1 press Q&A leaked into March 31');
assert.equal(data.snapshots.at(-1).date,'2022-04-05');

const claimIds = new Set();
const observedTypes = new Set(['republication_of_viral_claim', 'police_attributed_circulating_claim', 'policy_announcement', 'attributed_interview_statement', 'attributed_press_conference_statement']);
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


// Date-aware statement histories are editorial state transitions, not binary truth scores.
assert.ok(data.claim_status_history.length >= 16, 'missing claim status history');
const knownClaims = new Set(data.claims.map(c => c.id));
for (const h of data.claim_status_history) {
  assert.ok(knownClaims.has(h.claim_id), 'history points to unknown claim');
  assert.match(h.as_of, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(h.source_ids.length > 0, 'history needs direct evidence');
  for (const id of h.source_ids) {
    const src = byId.get(id);
    assert.ok(src, 'missing historical state source: '+id);
    assert.ok(src.date <= h.as_of, 'future evidence leaked into historical status: '+h.claim_id);
  }
}
assert.equal(data.snapshots.at(-1).date, '2022-04-05');
assert.ok(data.legal_element_audit.length >= 4);
for (const element of data.legal_element_audit) {
  assert.ok(element.independent_evidence_status && element.institutional_assertion);
  for (const id of element.source_ids) assert.ok(byId.has(id), 'invalid legal audit source');
}

assert.ok(Array.isArray(data.circulation_trace) && data.circulation_trace.length >= 4);
for(const record of data.circulation_trace){
  assert.ok(record.evidence_role && record.caveat);
  for (const id of record.source_ids) assert.ok(byId.has(id));
}
const yClaim = data.claims.find(c=>c.id === 'C07');
assert.ok(yClaim && yClaim.type === 'attributed_interview_statement');
assert.deepEqual(yClaim.source_ids,['S09']);
assert.match(yClaim.note,/不能将Y先生等同于警方通报的任何涉案人员/);

assert.equal(byId.get('S07').date, '2022-04-04');
assert.equal(byId.get('S07').container_publication_date, '2022-04-05');
assert.ok(data.sources.some(s => s.id === 'S06' && s.url.includes('shio.gov.cn')));
assert.equal(byId.get('S10').published_at_local, '2022-03-31T22:51:59+08:00');
assert.equal(byId.get('S09').published_at_local, '2022-03-23T14:02:36+08:00');
assert.equal(byId.get('S11').published_at_local, '2022-03-23T18:10:00+08:00');
assert.ok(data.claims.some(c=>c.id==='C09' && c.type==='analyst_temporal_inference' && c.date_first_observed===null));
assert.ok(data.time_model && data.time_model.date_timezone==='Asia/Shanghai');



// Source-dependence and actor-role audits prevent media copies from being
// counted as independent proof or anonymous interviewees as police suspects.
assert.ok(data.actor_role_register.length >= 6);
const actorIDs=new Set(data.actor_role_register.map(a=>a.id));
assert.equal(actorIDs.size,data.actor_role_register.length);
for (const a of data.actor_role_register) {
  assert.ok(a.role && a.not_established && a.source_ids.length>0);
  for (const id of a.source_ids) assert.ok(byId.has(id),'invalid actor source '+id);
}
const Y=data.actor_role_register.find(a=>a.id==='A03');
const suspects=data.actor_role_register.find(a=>a.id==='A02');
assert.ok(Y && suspects && Y.role!==suspects.role);
assert.match(Y.not_established,/link to two police investigation subjects/i);
assert.ok(!Y.source_ids.includes('S02') && !Y.source_ids.includes('S11'),
  'interview actor may not be silently assigned police material');
assert.ok(data.source_relations.length >= 6);
for (const edge of data.source_relations) {
  assert.ok(byId.has(edge.from) && byId.has(edge.to),'missing source in relation');
  assert.ok(edge.relation && edge.claim_scope && edge.limit);
}
assert.ok(data.source_relations.some(x=>x.from==='S11' && x.to==='S02'));
assert.ok(data.source_relations.some(x=>x.from==='S07' && x.to==='S12'));


assert.ok(!data.snapshots.find(s=>s.id==='mar26').available_sources.includes('S13'),
  'unverified 2022 version of present-day government transcript must be retrospective only');
assert.equal(byId.get('S13').asof_eligible,false);
assert.ok(data.press_transcript_comparison && data.press_transcript_comparison.govt_transcript_source==='S13');
assert.deepEqual([...data.press_transcript_comparison.journalistic_sources].sort(),['S14','S15','S16','S19','S20']);
assert.ok(Array.isArray(data.retrospective_audits) && data.retrospective_audits.length>=2);
assert.ok(!data.claim_status_history.some(h=>h.claim_id==='C10'),
  'today-observed text difference must not be represented as an event in March 2022');
for (const a of data.retrospective_audits){
  assert.ok(a.audited_on>='2026-10-29' && a.source_ids.length>0);
  for(const id of a.source_ids) assert.ok(byId.has(id),'invalid audit source '+id);
}
const mar23Early = data.snapshots.find(s=>s.id==='mar23_1402');
assert.ok(mar23Early && !mar23Early.available_sources.includes('S18'));
const mar23Police = data.snapshots.find(s=>s.id==='mar23_1759');
assert.ok(mar23Police && mar23Police.available_sources.includes('S18'));
assert.ok(!mar23Police.available_sources.includes('S11') && !mar23Police.available_sources.includes('S02'));
const mar26 = data.snapshots.find(s=>s.id==='mar26');
assert.ok(mar26 && ['S14','S15','S16'].every(id=>mar26.available_sources.includes(id)));


const accessAudit = JSON.parse(read('docs/critical-inquiry/SOURCE_ACCESS_AUDIT_20261029.json'));
assert.equal(accessAudit.records.length,data.sources.length,'all source links need an access audit entry');
assert.deepEqual(accessAudit.records.map(r=>r.source_id).sort(),[...byId.keys()].sort(),'source audit IDs must cover all registered sources');
const auditedStatuses=new Set(['DIRECT_OPEN_TEXT','DIRECT_OPEN_PARTIAL','DIRECT_OPEN_502']);
for(const rec of accessAudit.records){
  assert.ok(auditedStatuses.has(rec.access_status),'unrecognized access condition');
  assert.equal(rec.url,byId.get(rec.source_id).url,'URL in source audit is stale');
  assert.ok(typeof rec.historical_initial_edition_byte_authenticated === 'boolean');
}
assert.equal(accessAudit.records.filter(x=>x.access_status==='DIRECT_OPEN_502').length,2);
assert.ok(data.legal_comparison_register.length>=3);
const legalById=new Map(data.legal_comparison_register.map(x=>[x.id,x]));
assert.equal(legalById.get('L01').publication_observed,'2020-02-10');
assert.equal(legalById.get('L01').date,'2020-02-06');
assert.equal(legalById.get('L03').retrospective_only,true);
assert.equal(byId.get('S20').source_type,'video_news_page_not_full_recording_authenticated');
assert.equal(byId.get('S21').source_type,'official_police_weibo_syndication');
assert.ok(!data.legal_comparison_register.some(x=>x.role==='shanghai_case_judgment'),
  'a legal comparison must not be misrepresented as the target case verdict');

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
