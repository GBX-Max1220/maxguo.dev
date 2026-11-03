import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateRegistry} from './validate-critical-inquiry-ledger-registry.mjs';

const fixture=JSON.parse(fs.readFileSync('research/critical-inquiry/normalized/three-case-ledger-registry-v02.json','utf8'));
const clone=()=>structuredClone(fixture);
const c=(d,id)=>d.cases.find(x=>x.id===id);

test('complete registry preserves all original ledger record counts and pinned Git blobs',()=>{
 assert.deepEqual(validateRegistry(fixture),[]);
 assert.deepEqual(fixture.cases.map(x=>x.sources.length),[16,22,20]);
 assert.deepEqual(fixture.cases.map(x=>x.as_of_views.length),[13,11,0]);
 assert.deepEqual(fixture.cases.map(x=>x.claims.length),[14,11,29]);
 assert.equal(fixture.counts.archive_observations,30);
});

test('Li 2020 Jan 31 noon view cannot include the later 19:35 interview',()=>{
 const d=clone(),v=c(d,'li-2020').as_of_views.find(x=>x.view_id==='LW_ASOF_0131_1200');
 v.source_ids.push('LW13');
 assert.ok(validateRegistry(d).some(x=>x.includes('post-cutoff source LW13')));
});

test('retrospective municipal copy LW01 cannot enter Li public-as-of views',()=>{
 const d=clone(),v=c(d,'li-2020').as_of_views[0];
 v.source_ids.push('LW01');
 assert.ok(validateRegistry(d).some(x=>x.includes('ineligible source LW01')));
});

test('Shanghai March 23 14:02 snapshot cannot include 17:59 police notice',()=>{
 const d=clone(),v=c(d,'shanghai-2022').as_of_views.find(x=>x.view_id==='mar23_1402');
 v.source_ids.push('S18');
 assert.ok(validateRegistry(d).some(x=>x.includes('post-cutoff source S18')));
});

test('Shanghai current transcript S13 cannot be backfilled into a March 26 historical view',()=>{
 const d=clone(),v=c(d,'shanghai-2022').as_of_views.find(x=>x.view_id==='mar26');
 v.source_ids.push('S13');
 assert.ok(validateRegistry(d).some(x=>x.includes('ineligible source S13')));
});

test('date-only snapshots cannot be silently assigned invented intraday precision',()=>{
 const d=clone(),v=c(d,'li-2020').as_of_views.find(x=>x.view_id==='LW_ASOF_0101');
 v.cutoff.local_datetime='2020-01-01T12:00:00+08:00';
 v.cutoff.precision='exact_local_time';
 assert.ok(validateRegistry(d).some(x=>x.includes('date-only as-of precision')));
});

test('all claims must resolve to case-local source IDs',()=>{
 const d=clone();c(d,'ai-fen-2020').claims[0].source_ids.push('LW04');
 assert.ok(validateRegistry(d).some(x=>x.includes('claim AF-C01 references unknown source LW04')));
});

test('CDT bilingual pages cannot be split into independent disclosure lineages',()=>{
 const d=clone();c(d,'ai-fen-2020').sources.find(x=>x.source_id==='AF16').independence_group='independent_english_disclosure';
 assert.ok(validateRegistry(d).some(x=>x.includes('CDT English and Chinese disclosure incorrectly treated as independent')));
});

test('Ai Fen missing homepage state observation is detected',()=>{
 const d=clone();c(d,'ai-fen-2020').archive_observations=c(d,'ai-fen-2020').archive_observations.filter(x=>x.capture_id!=='AF_HOME_20200312063101');
 assert.ok(validateRegistry(d).some(x=>x.includes('unique archive observation count')));
});

test('publication and second-human review cannot be auto-promoted by CI',()=>{
 const d=clone();d.review_state.publication_authorization='AUTHORIZED';
 assert.ok(validateRegistry(d).some(x=>x.includes('publication authorization')));
 const d2=clone();d2.review_state.independent_second_human_review='COMPLETED';
 assert.ok(validateRegistry(d2).some(x=>x.includes('human review state')));
});

test('formal correction, bounded not-located outcome and non-applicable archive state stay distinct',()=>{
 const d=clone();
 assert.deepEqual(d.comparison_contract.correction_state_register.map(x=>x.state),['observed_formal_correction','searched_not_located','not_applicable']);
 d.comparison_contract.correction_state_register.find(x=>x.case_id==='shanghai-2022').state='no_disposition';
 assert.ok(validateRegistry(d).some(x=>x.includes('Shanghai bounded not-located state')));
});

test('voluntary self-deletion example remains a methodological counterexample, not case evidence',()=>{
 const d=clone(),x=d.methodological_counterexamples[0];
 assert.equal(x.case_evidence,false);
 assert.equal(x.counts_toward_case_source_totals,false);
 x.case_evidence=true;
 assert.ok(validateRegistry(d).some(s=>s.includes('outside case evidence')));
});
