import test from 'node:test';
import assert from 'node:assert/strict';
import {loadData,selectAsOf,validateData} from './critical-visibility-core.mjs';

const data=loadData();
const clone=()=>structuredClone(data);
const byId=(d,id)=>d.cases.find(c=>c.id===id);

test('fixture passes exact provenance, timestamps, references, and completeness',()=>{
  assert.deepEqual(validateData(data),[]);
  assert.deepEqual(data.cases.map(c=>c.observations.length),[5,5,7]);
  assert.deepEqual(data.cases.map(c=>c.checkpoints.length),[6,5,6]);
});

test('Li Jan 1 cannot see Jan 31 interview, March 19 investigation or later correction',()=>{
  const v=selectAsOf(data,'li-2020','L1',true);
  assert.deepEqual(v.known.map(o=>o.id),['LI-O01']);
  assert.deepEqual(v.retrospective,[]);
  assert.equal(v.evidence_lineages_in_asof,1);
});

test('Li Jan 3 can see a later investigation only as retroactive layer, not historical knowledge',()=>{
  const a=selectAsOf(data,'li-2020','2020-01-03T23:59:59+08:00',false);
  const b=selectAsOf(data,'li-2020','2020-01-03T23:59:59+08:00',true);
  assert.deepEqual(a.known.map(o=>o.id),['LI-O01']);
  assert.deepEqual(b.retrospective.map(o=>o.id),['LI-O02']);
  assert.ok(!b.source_refs.some(s=>s.id==='LW04'));
});

test('Li formal investigation, withdrawal and discipline are separated by publication time',()=>{
  const v3=selectAsOf(data,'li-2020','L3');
  const v4=selectAsOf(data,'li-2020','L4');
  const v5=selectAsOf(data,'li-2020','L5');
  assert.ok(v3.known.some(o=>o.id==='LI-O03'));
  assert.ok(!v3.known.some(o=>o.id==='LI-O04'));
  assert.ok(v4.known.some(o=>o.id==='LI-O04'));
  assert.ok(!v4.known.some(o=>o.id==='LI-O05'));
  assert.ok(v5.known.some(o=>o.id==='LI-O05'));
});

test('Shanghai March 22 rebuttal cannot see March 23 police case or March 27 announced policy',()=>{
  const v=selectAsOf(data,'shanghai-2022','S1');
  assert.deepEqual(v.known.map(o=>o.id),['SH-O01']);
});
test('date-only Shanghai policy is not backdated to noon of March 27',()=>{
  const v=selectAsOf(data,'shanghai-2022','2022-03-27T12:00:00+08:00');
  assert.ok(!v.known.some(o=>o.id==='SH-O03'));
  assert.ok(selectAsOf(data,'shanghai-2022','S3').known.some(o=>o.id==='SH-O03'));
});

test('Ai Fen March 11 captures do not expose later title, homepage removal, or December disclosure',()=>{
  const early=selectAsOf(data,'ai-fen-2020','A2');
  const next=selectAsOf(data,'ai-fen-2020','A3');
  const later=selectAsOf(data,'ai-fen-2020','A5');
  assert.deepEqual(early.known.map(o=>o.id),['AF-O01','AF-O02']);
  assert.equal(next.known.at(-1).id,'AF-O03');
  assert.ok(!next.known.some(o=>['AF-O04','AF-O06','AF-O07'].includes(o.id)));
  assert.equal(later.known.at(-1).id,'AF-O06');
  assert.ok(!later.known.some(o=>o.id==='AF-O07'));
});

test('repeated archive source lineage counts only once when comparing old/new yyrw title captures',()=>{
  const v=selectAsOf(data,'ai-fen-2020','A4');
  const articleVersions=v.source_refs.filter(s=>s.lineage_id==='yyrw_article_history');
  assert.equal(articleVersions.length,2);
  assert.equal(new Set(articleVersions.map(s=>s.lineage_id)).size,1);
  assert.equal(v.evidence_lineages_in_asof,3);
});

test('reject forged source, duplicate claim, and missing source citation',()=>{
  const bad=clone();byId(bad,'li-2020').observations[0].source_ids=['NO_SUCH_SOURCE'];
  assert.ok(validateData(bad).some(s=>s.includes('unknown source')));
  const dup=clone();byId(dup,'shanghai-2022').observations[0].id='LI-O01';
  assert.ok(validateData(dup).some(s=>s.includes('duplicate observation')));
  const empty=clone();byId(empty,'li-2020').observations[0].source_ids=[];
  assert.ok(validateData(empty).some(s=>s.includes('missing citations')));
});

test('reject timestamps inconsistent with Wayback archive and ungrounded day precision',()=>{
  const bad=clone();byId(bad,'ai-fen-2020').observations[1].observed_at='2020-03-11T03:07:34+08:00';
  assert.ok(validateData(bad).some(s=>s.includes('Wayback capture timestamp differs')));
  const inaccurate=clone();byId(inaccurate,'shanghai-2022').observations[2].observed_at='2022-03-27T12:00:00+08:00';
  assert.ok(validateData(inaccurate).some(s=>s.includes('day-only records')));
});
test('reject out-of-order history, invented dates, and publication authorization drift',()=>{
  const wrong=clone();byId(wrong,'li-2020').checkpoints[1].at='2019-01-01T00:00:00+08:00';
  assert.ok(validateData(wrong).some(s=>s.includes('out of order')));
  const malformed=clone();byId(malformed,'li-2020').checkpoints[1].at='2020-02-31T00:00:00+08:00';
  assert.ok(validateData(malformed).some(s=>s.includes('invalid')||s.includes('nonexistent')||s.includes('bad checkpoint')));
  const published=clone();published.status='PUBLISHED';
  assert.ok(validateData(published).some(s=>s.includes('status marker')));
});
