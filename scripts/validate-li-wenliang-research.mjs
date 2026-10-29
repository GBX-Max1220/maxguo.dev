import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const evidence=JSON.parse(fs.readFileSync(path.join(root,'research/critical-inquiry/li-wenliang-2020/evidence-v01.json'),'utf8'));
assert.equal(evidence.status,'RESEARCH_DRAFT_HUMAN_REVIEW_PENDING');
const src=new Map(evidence.sources.map(s=>[s.id,s]));
assert.equal(src.size,evidence.sources.length,'unique source ids');
assert.ok(src.size>=14);
for(const s of evidence.sources){
 assert.match(s.publication_date,/^\d{4}-\d\d-\d\d$/);
 assert.ok(s.url.startsWith('https://'));
 assert.ok(s.publisher&&s.role&&s.independence_group);
}
const events=new Set();
for(const e of evidence.event_history){
 assert.ok(!events.has(e.id));events.add(e.id);
 for(const id of [...(e.contemporaneous_sources??[]),...(e.early_public_reports??[]),...(e.retrospectively_established_by??[])])
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
const jan31noon=evidence.public_asof.find(x=>x.id==='LW_ASOF_0131_1200');
assert.ok(jan31noon && jan31noon.public_sources.includes('LW12'));
assert.ok(!jan31noon.public_sources.includes('LW13'),'19:35 interview/photo cannot appear at 12:00');
const feb7=evidence.public_asof.find(x=>x.id==='LW_ASOF_0207');
assert.ok(feb7.public_sources.includes('LW12')&&feb7.public_sources.includes('LW13'),
 'Jan31 public discussion of admonition must be known by Feb7');
const reprimand=evidence.event_history.find(x=>x.id==='LE04');
assert.equal(reprimand.first_publicly_established_date_in_this_register,'2020-01-31');
assert.deepEqual(reprimand.early_public_reports,['LW12','LW13']);
assert.ok(!reprimand.contemporaneous_sources,'Jan31 interview is not Jan3 police original record');
const jan1500=evidence.public_asof.find(x=>x.id==='LW_ASOF_0129_1500');
assert.ok(jan1500.public_sources.includes('LW10'),'14:45 Caixin report must be visible by 15:00');
assert.ok(!jan1500.public_sources.includes('LW02'),'16:32 Xinhua report must be excluded at 15:00');
const jan312000=evidence.public_asof.find(x=>x.id==='LW_ASOF_0131_2000');
assert.ok(jan312000 && jan312000.public_sources.includes('LW12') && jan312000.public_sources.includes('LW13'));
const interviewContrast=evidence.interview_frame_comparisons.find(x=>x.id==='I01');
assert.ok(interviewContrast && interviewContrast.source_ids.join(',')==='LW12,LW13');
assert.ok(interviewContrast.interpretation.includes('not a reliable longitudinal measurement'));
assert.ok(evidence.atomic_claims.some(c=>c.id==='LWC14'&&c.kind==='attributed_interview_frame_contrast'));
const march1910=evidence.public_asof.find(x=>x.id==='LW_ASOF_0319_1910');
assert.ok(march1910 && march1910.public_sources.includes('LW14'),'19:04 CLS bulletin visible by 19:10');
assert.ok(!march1910.public_sources.includes('LW05')&&!march1910.public_sources.includes('LW04'),'19:14 and 19:28 sources cannot appear by 19:10');
assert.equal(src.get('LW14').published_at_local,'2020-03-19T19:04:01+08:00');
const march1920=evidence.public_asof.find(x=>x.id==='LW_ASOF_0319_1920');
assert.ok(march1920.public_sources.includes('LW05'),'19:14 commission summary should be visible by 19:20');
assert.ok(!march1920.public_sources.includes('LW04'),'19:28 full text must not be backfilled into 19:20');
assert.equal(src.get('LW05').role,'contemporaneous editorially abridged news account of commission investigation');
const march2000=evidence.public_asof.find(x=>x.id==='LW_ASOF_0319_2000');
assert.ok(march2000.public_sources.includes('LW04'),'19:28 report visible at 20:00');
assert.ok(!march2000.public_sources.includes('LW08')&&!march2000.public_sources.includes('LW11'),'20:07 QA or 21:47 withdrawal leaked to 20:00');
const march2100=evidence.public_asof.find(x=>x.id==='LW_ASOF_0319_2100');
assert.ok(march2100 && march2100.public_sources.includes('LW15'),'20:55 police revocation reporting visible by 21:00');
assert.ok(!march2100.public_sources.includes('LW11') && !march2100.public_sources.includes('LW07'),'21:47 republication or 22:09 discipline must not enter 21:00');
assert.ok(!march2000.public_sources.includes('LW15'),'20:55 revocation cannot enter 20:00');
assert.equal(src.get('LW15').published_at_local,'2020-03-19T20:55:00+08:00');
assert.equal(src.get('LW15').independence_group,src.get('LW11').independence_group,'same police revocation cannot count as separate factual corroboration');
const policeWithdrawal=evidence.public_label_history.find(x=>x.id==='PL04');
assert.equal(policeWithdrawal.public_at,'2020-03-19T20:55:00+08:00');
assert.ok(policeWithdrawal.source_ids.includes('LW15'));
const march2150=evidence.public_asof.find(x=>x.id==='LW_ASOF_0319_2150');
assert.ok(march2150.public_sources.includes('LW11')&&march2150.public_sources.includes('LW15'),'20:55 and 21:47 withdrawal reports should be visible at 21:50');
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
assert.ok(evidence.atomic_claims.length>=13);
assert.equal(evidence.public_label_history.length,8);
const targetKinds=new Set(evidence.public_label_history.map(x=>x.target));
assert.ok(targetKinds.has('unnamed_eight') && targetKinds.has('li_admonition') && targetKinds.has('responsible_officers'));
for(const label of evidence.public_label_history){
 assert.ok(label.actor&&label.speech_act&&label.meaning_limit);
 const earliest=label.source_ids.map(id=>src.get(id)?.published_at_local||dayEnd(src.get(id)?.publication_date)).sort()[0];
 assert.ok(earliest<=label.public_at,'later source invoked for earlier label event: '+label.id);
}
assert.ok(evidence.source_relations.length>=5);
for(const edge of evidence.source_relations){
 assert.equal(edge.independent_factual_corroboration,false);
 assert.ok(src.has(edge.from)&&src.has(edge.to));
}

const commissionIntent=evidence.atomic_claims.find(c=>c.id==='LWC09');
assert.equal(commissionIntent.kind,'official_retrospective_intent_finding');
assert.equal(commissionIntent.status,'attributed_commission_investigation_not_independently_reconstructed_intent');
assert.deepEqual(commissionIntent.source_ids,['LW08']);
assert.equal(evidence.correction_dimensions.length,6);
for (const dim of evidence.correction_dimensions) {
 assert.ok(dim.dimension && dim.status && dim.limit && dim.evidence_ids.length);
 for(const id of dim.evidence_ids) assert.ok(allClaims.has(id),'unknown correction dimension claim');
}

const disruptionContrast=evidence.atomic_claims.find(x=>x.id==='LWC13');
assert.equal(disruptionContrast.kind,'institutional_evidence_contrast');
assert.ok(disruptionContrast.source_ids.includes('LW13')&&disruptionContrast.source_ids.includes('LW08'));
assert.match(disruptionContrast.caution,/Objective disturbance and subjective intent are distinct/);

assert.equal(evidence.release_gates.G3_second_human_review,'HOLD');

const sourceAudit=JSON.parse(fs.readFileSync(path.join(root,'research/critical-inquiry/li-wenliang-2020/SOURCE_ACCESS_AUDIT_V02.json'),'utf8'));
assert.equal(sourceAudit.records.length,evidence.sources.length);
assert.equal(sourceAudit.counts.readable,evidence.sources.length);
assert.equal(evidence.sources.length,16,'current documented evidence version has 16 source records');
assert.equal(evidence.public_asof.length,13,'current documented evidence version has 13 snapshots');
assert.equal(sourceAudit.counts.independence_groups,new Set(evidence.sources.map(s=>s.independence_group)).size);
for(const rec of sourceAudit.records){
 const source=src.get(rec.source_id);
 assert.ok(source,'unknown source audit ID');
 assert.equal(rec.url,source.url,'source audit URL drift');
 assert.equal(rec.claim_true_independently_established,false);
 assert.equal(rec.original_social_or_administrative_records_authenticated,false);
}
assert.match(sourceAudit.records.find(x=>x.source_id==='LW05').evidence_limit,/ABRIDGED/);
assert.match(sourceAudit.records.find(x=>x.source_id==='LW14').evidence_limit,/19:04:01/);
assert.match(sourceAudit.records.find(x=>x.source_id==='LW15').evidence_limit,/20:55/);
assert.match(sourceAudit.records.find(x=>x.source_id==='LW01').evidence_limit,/11:36/);
assert.ok(!src.get('LW01').published_at_local,'11:36 archive stamp must not be modeled as authenticated original police post time');
assert.equal(src.get('LW16').published_at_local,'2020-01-01T18:53:00+08:00');
const janLabel=evidence.public_label_history.find(x=>x.id==='PL01');
assert.equal(janLabel.public_at,'2020-01-01T18:53:00+08:00');
assert.deepEqual(janLabel.source_ids,['LW16']);

const protoPath=path.join(root,'research/critical-inquiry/prototypes/dual-asof-comparison-v01.html');
const proto=fs.readFileSync(protoPath,'utf8');
assert.match(proto,/<meta name="robots" content="noindex,nofollow">/);
assert.match(proto,/<html lang="zh-CN">/);
assert.match(proto,/2020-03-19 19:10/);
assert.match(proto,/2020-03-19 19:20/);
assert.match(proto,/2020-03-19 20:00/);
assert.match(proto,/2020-03-19 21:00/);
assert.match(proto,/2020-03-19 21:50/);
assert.match(proto,/2020-01-29 15:00/);
assert.match(proto,/2020-01-31 12:00/);
assert.match(proto,/2020-01-31 20:00/);
assert.match(proto,/1月31日媒体报道中已公开/);
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
