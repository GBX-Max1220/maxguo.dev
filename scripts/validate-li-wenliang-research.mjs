import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';

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
const dayEnd=(date)=>date+'T23:59:59+08:00';
const sourcePublication=(source)=>source.published_at_local??dayEnd(source.publication_date);
let last='';
for(const snap of evidence.public_asof){
 const cutoff=snap.cutoff_local??dayEnd(snap.cutoff_date);
 assert.ok(cutoff>last,'as-of cutoffs must increase strictly');
 last=cutoff;
 const actual=[...snap.public_sources].sort();
 const expected=evidence.sources.filter(s=>sourcePublication(s)<=cutoff).map(s=>s.id).sort();
 assert.deepEqual(actual,expected,'as-of contains future publication or misses dated source '+snap.id);
}
assert.equal(evidence.public_asof.at(-1).cutoff_date,'2020-03-19');
const jan1500=evidence.public_asof.find(x=>x.id==='LW_ASOF_0129_1500');
assert.ok(jan1500.public_sources.includes('LW10'),'14:45 Caixin report must be visible by 15:00');
assert.ok(!jan1500.public_sources.includes('LW02'),'16:32 Xinhua report must be excluded at 15:00');
const march2000=evidence.public_asof.find(x=>x.id==='LW_ASOF_0319_2000');
assert.ok(march2000.public_sources.includes('LW04'),'19:28 report visible at 20:00');
assert.ok(!march2000.public_sources.includes('LW08')&&!march2000.public_sources.includes('LW11'),'20:07 QA or 21:47 withdrawal leaked to 20:00');
const march2150=evidence.public_asof.find(x=>x.id==='LW_ASOF_0319_2150');
assert.ok(march2150.public_sources.includes('LW11'),'21:47 formal withdrawal should be visible at 21:50');
assert.ok(!march2150.public_sources.includes('LW07'),'22:09 officer sanctions must be excluded at 21:50');
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
assert.ok(evidence.atomic_claims.length>=10);
assert.equal(evidence.public_label_history.length,5);
const targetKinds=new Set(evidence.public_label_history.map(x=>x.target));
assert.ok(targetKinds.has('unnamed_eight') && targetKinds.has('li_admonition') && targetKinds.has('responsible_officers'));
for(const label of evidence.public_label_history){
 assert.ok(label.actor&&label.speech_act&&label.meaning_limit);
 const earliest=label.source_ids.map(id=>src.get(id)?.published_at_local||dayEnd(src.get(id)?.publication_date)).sort()[0];
 assert.ok(earliest<=label.public_at,'later source invoked for earlier label event: '+label.id);
}
assert.equal(evidence.source_relations.length,4);
for(const edge of evidence.source_relations){
 assert.equal(edge.independent_factual_corroboration,false);
 assert.ok(src.has(edge.from)&&src.has(edge.to));
}

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

const protoPath=path.join(root,'research/critical-inquiry/prototypes/dual-asof-comparison-v01.html');
const proto=fs.readFileSync(protoPath,'utf8');
assert.match(proto,/<meta name="robots" content="noindex,nofollow">/);
assert.match(proto,/<html lang="zh-CN">/);
assert.match(proto,/2020-03-19/);
assert.match(proto,/2022-03-23 14:02/);
assert.match(proto,/2022-03-23 17:59/);
assert.match(proto,/不能把2020年3月19日披露的训诫书/);
assert.match(proto,/不能把他此前的担忧归因于17:59/);
assert.ok(!fs.existsSync(path.join(root,'src/pages/critical-inquiry/cases/li-wenliang/index.astro')),
 'unreviewed Li case must not be accidentally published');
const scripts=[...proto.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,1,'offline prototype should have a single inline script');
new vm.Script(scripts[0],{filename:'dual-asof-comparison-v01.html:inline'});

console.log('Li Wenliang research validation PASS:',
 evidence.sources.length,'sources,',evidence.event_history.length,'events,',
 evidence.public_asof.length,'public-as-of snapshots,',
 evidence.atomic_claims.length,'claims');
