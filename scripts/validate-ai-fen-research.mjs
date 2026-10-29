import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = process.cwd();
const doc = JSON.parse(fs.readFileSync(
  root + '/research/critical-inquiry/ai-fen-2020/evidence-v01.json', 'utf8'));
const memo = fs.readFileSync(
  root + '/research/critical-inquiry/ai-fen-2020/RESEARCH_DECISION_V01.md','utf8');

assert.equal(doc.status,'RESEARCH_PILOT_NO_ORIGINAL_EDITION_AUTHENTICATION');
assert.equal(doc.sources.length,18,'expected 18 records including Wayback and bibliographic archive leads');
assert.equal(doc.atomic_claims.length,14,'expected 14 bounded claims after archive provenance audit');
assert.ok(doc.sources.every(s=>s.id && s.url.startsWith('https://') && s.role && s.group && s.access && s.limit));
assert.equal(new Set(doc.sources.map(s=>s.id)).size,doc.sources.length,'duplicate source IDs');
assert.equal(new Set(doc.atomic_claims.map(c=>c.id)).size,doc.atomic_claims.length,'duplicate claim IDs');
assert.equal(new Set(doc.observations.map(c=>c.id)).size,doc.observations.length,'duplicate observation IDs');
const ids=new Set(doc.sources.map(s=>s.id));
for(const collection of [doc.atomic_claims,doc.observations]){
  for(const item of collection){
    assert.ok(item.source_ids.length,'claims/observations need supporting sources');
    for(const sid of item.source_ids)assert.ok(ids.has(sid),'unknown source id: '+sid);
  }
}
for(const r of doc.source_relations){
  assert.ok(ids.has(r.from) && ids.has(r.to),'unknown provenance edge');
  assert.equal(r.independent_original_interview,false,'reprints are not independent interviews');
}
assert.ok(new Set(doc.sources.map(s=>s.group)).size<doc.sources.length,'expected dependent source groups');
for(const carrier of doc.original_carriers){
  assert.equal(carrier.original_edition_available,false,'unverified original carrier is not authenticated');
  assert.equal(carrier.known_minute,null,'do not invent first edition time');
}
const wx=doc.original_carriers.find(x=>x.id==='WX_ORIGINAL');
assert.equal(wx.original_url,'https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg');
assert.equal(wx.status,'ORIGINAL_URL_INDEXED_IN_NCOVMEMORY_CSV_NOT_DIRECTLY_AUTHENTICATED');
assert.equal(wx.archive_candidate_opened,false);
assert.equal(wx.archive_index_row_id,'3142');
assert.equal(doc.atomic_claims.find(x=>x.id==='AFC11').status,'ORIGINAL_URL_IDENTIFIED_ARCHIVE_CONTENT_NOT_AUTHENTICATED');
assert.ok(doc.sources.some(x=>x.id==='AF15'),'missing original-dated GitHub markdown archive');
const history=doc.historical_git_versions;
assert.equal(history.length,4,'must track original filename plus later three dated Git versions');
assert.deepEqual(history.map(x=>x.committer_utc),[
 '2020-03-10T05:23:09Z','2020-03-10T06:02:15Z',
 '2020-03-10T06:03:24Z','2020-03-10T06:13:34Z'
],'Git commit ordering must include pre-rename predecessor');
for(const [i,h] of history.entries()){
  assert.match(h.sha,/^[a-f0-9]{40}$/);
  assert.match(h.blob_sha,/^[a-f0-9]{40}$/);
  assert.equal(h.editorial_intro_eight_count,2,'duplicated editorial sentence is not two independent observations');
  assert.equal(h.interview_no_police_admonition_count,1);
  assert.equal(Date.parse(h.committer_utc),Date.parse(h.committer_local),
    'UTC to Beijing time conversion mismatch: '+i);
  if(i>0) assert.ok(h.committer_utc>history[i-1].committer_utc,'Git commit timestamps out of order');
}
assert.equal(history[0].path,'_posts/发哨子的人.md','follow renamed ancestral Git path');
assert.equal(doc.historical_git_comparison.normalized_paragraphs_identical,73);
assert.equal(doc.historical_git_comparison.same_original_publisher_edition_authenticated,false);
assert.equal(doc.historical_git_comparison.commit_timestamp_independent_notarization,false);
const archived=doc.sources.find(x=>x.id==='AF17');
assert.equal(archived.archive_capture_utc,'2020-03-10T13:50:52Z');
assert.equal(Date.parse(archived.archive_capture_local),Date.parse(archived.archive_capture_utc));
assert.equal(archived.access,'WAYBACK_CAPTURE_DIRECT_HTML_TEXT_READABLE');
const unverified=doc.sources.find(x=>x.id==='AF18');
assert.match(unverified.access,/ARCHIVE_TARGET_FAILED/);
assert.equal(doc.original_carriers.find(x=>x.id==='WX_ORIGINAL').archive_today_content_verified,false);
const frames=doc.version_frame_comparison;
assert.equal(frames.earlier.text_title,'发哨子的人');
assert.equal(frames.later.text_title_prefix,'吹哨子的人');
assert.equal(frames.earlier.added_patriotic_lead,false);
assert.equal(frames.later.added_patriotic_lead,true);
assert.equal(doc.atomic_claims.find(x=>x.id==='AFC13').status,'ARCHIVE_CAPTURE_OBSERVED_NOT_ORIGINAL_FIRST_EDITION');
assert.equal(doc.atomic_claims.find(x=>x.id==='AFC14').status,'SECONDARY_ARCHIVE_LEAD_NOT_DIRECTLY_READABLE');
assert.equal(doc.observations.find(x=>x.id==='EV06').evidence_level,
  'VERIFIED_READABLE_THIRD_PARTY_ARCHIVE_CAPTURE_OF_REPRINT');

assert.equal(doc.atomic_claims.find(x=>x.id==='AFC12').status,'REPOSITORY_HISTORY_VERIFIED_METADATA_NOT_ORIGINAL_PUBLISHER');


assert.equal(doc.original_carriers.find(x=>x.id==='WEIBO_CANDIDATE').capture_authenticated,false);
assert.equal(doc.atomic_claims.find(x=>x.id==='AFC05').status,
  'TEXTUAL_CLAIM_PRESENT_NOT_INDEPENDENTLY_ESTABLISHED',
  'reporter intro and eight-person identities cannot be promoted to established fact');
assert.equal(doc.atomic_claims.find(x=>x.id==='AFC02').kind,'reported_platform_unavailability');
assert.equal(doc.atomic_claims.find(x=>x.id==='AFC06').status,'UNRESOLVED_IN_REGISTER');
const removal=doc.observations.find(x=>x.id==='EV02');
assert.equal(removal.time_precision,'approximate','11:40 is only an approximate editor report');
assert.match(removal.evidence_level,/ATTRIBUTED/);
assert.ok(!('cutoff_local' in removal),'do not fabricate time-indexed original-edition cutoff');
const studies=doc.sources.filter(s=>s.role.startsWith('peer-reviewed prior'));
assert.equal(studies.length,2,'directly relevant peer-reviewed previous research must be registered');
for(const word of ['10.1080/1369118X.2023.2205474','10.1177/01634437231219132'])
  assert.ok(memo.includes(word),'missing prior-art reference');
for(const key of ['original_first_edition','platform_unavailability_forensics','G3_second_human_review','G4_privacy_copyright','G6_publication'])
  assert.equal(doc.publication_gates[key],'HOLD');
assert.ok(!fs.existsSync(root+'/src/pages/critical-inquiry/cases/ai-fen/index.astro'),
  'unreviewed article must not be routed publicly');
assert.match(memo,/不在公开网站建立页面/);
console.log('Ai Fen research-only structural validation PASS:',doc.sources.length,
  'source records,',doc.atomic_claims.length,'claims,',
  doc.observations.length,'reported episodes,',
  studies.length,'prior peer-reviewed studies. G3/G4/G6 HOLD.');
