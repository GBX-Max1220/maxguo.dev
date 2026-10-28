import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root=process.cwd();
const evidence=JSON.parse(fs.readFileSync(path.join(root,'research/critical-inquiry/li-wenliang-2020/evidence-v01.json'),'utf8'));
assert.equal(evidence.status,'RESEARCH_DRAFT_HUMAN_REVIEW_PENDING');
const src=new Map(evidence.sources.map(s=>[s.id,s]));
assert.equal(src.size,evidence.sources.length,'unique source ids');
assert.ok(src.size>=9);
for(const s of evidence.sources){
 assert.match(s.publication_date,/^\d{4}-\d\d-\d\d$/);
 assert.ok(s.url.startsWith('https://'));
 assert.ok(s.publisher&&s.role&&s.independence_group);
}
const events=new Set();
for(const e of evidence.event_history){
 assert.ok(!events.has(e.id));events.add(e.id);
 for(const id of [...(e.contemporaneous_sources??[]),...(e.retrospectively_established_by??[])])
  assert.ok(src.has(id),'event cites missing source: '+id);
 if(e.retrospectively_established_by){
  for(const id of e.retrospectively_established_by)
   assert.ok(src.get(id).publication_date>e.event_time.slice(0,10),
    'later finding is incorrectly treated as contemporaneous publication');
 }
}
let last='';
for(const snap of evidence.public_asof){
 assert.ok(snap.cutoff_date>last,'as-of dates must increase');
 last=snap.cutoff_date;
 const actual=[...snap.public_sources].sort();
 const expected=evidence.sources.filter(s=>s.publication_date<=snap.cutoff_date).map(s=>s.id).sort();
 assert.deepEqual(actual,expected,'as-of contains future publication or misses dated source '+snap.id);
}
assert.equal(evidence.public_asof.at(-1).cutoff_date,'2020-03-19');
const jan=evidence.public_asof.find(x=>x.cutoff_date==='2020-01-03');
assert.ok(!jan.public_sources.includes('LW04')&&!jan.public_sources.includes('LW06'));
const allClaims=new Set();
for(const claim of evidence.atomic_claims){
 assert.ok(!allClaims.has(claim.id));allClaims.add(claim.id);
 assert.ok(claim.claim&&claim.kind&&claim.status&&claim.caution);
 for(const id of claim.source_ids)assert.ok(src.has(id),'unknown claim source');
}
const eight=evidence.atomic_claims.find(x=>x.id==='LWC02');
assert.match(eight.caution,/not individually authenticated/i);
const commentary=evidence.atomic_claims.find(x=>x.id==='LWC08');
assert.equal(commentary.kind,'legal_opinion_not_binding');
assert.match(commentary.caution,/Not a judgment/i);
const correction=evidence.atomic_claims.find(x=>x.id==='LWC06');
assert.equal(correction.status,'institutional_revocation_documented');
assert.ok(evidence.atomic_claims.length>=9);
const commissionIntent=evidence.atomic_claims.find(c=>c.id==='LWC09');
assert.equal(commissionIntent.kind,'official_retrospective_intent_finding');
assert.equal(commissionIntent.status,'attributed_commission_investigation_not_independently_reconstructed_intent');
assert.deepEqual(commissionIntent.source_ids,['LW08']);
assert.equal(evidence.correction_dimensions.length,5);
for (const dim of evidence.correction_dimensions) {
 assert.ok(dim.dimension && dim.status && dim.limit && dim.evidence_ids.length);
 for(const id of dim.evidence_ids) assert.ok(allClaims.has(id),'unknown correction dimension claim');
}

assert.equal(evidence.release_gates.G3_second_human_review,'HOLD');
console.log('Li Wenliang research validation PASS:',
 evidence.sources.length,'sources,',evidence.event_history.length,'events,',
 evidence.public_asof.length,'public-as-of snapshots,',
 evidence.atomic_claims.length,'claims');
