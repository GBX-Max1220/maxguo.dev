import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_DATA_PATH = 'research/critical-inquiry/normalized/three-case-observations-v01.json';
export const SCHEMA_VERSION = '1.0.0';
const TIME_RE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+08:00$/;
const ALLOWED_BASIS = new Set([
  'archive_capture','contemporaneous_report','official_notice','retrospective_disclosure'
]);
const ALLOWED_PRECISION = new Set(['second','day_end_bound']);
const ALLOWED_ROLES = new Set(['descriptive','attributed','analytical']);
const ARCHIVE_BASE = 'https://web.archive.org/web/';

export function parseLocalTime(t) {
  assert.equal(typeof t,'string','time must be string');
  assert.match(t,TIME_RE,'timestamp must have seconds and Beijing +08:00 zone: '+t);
  const d = Date.parse(t);
  assert.ok(Number.isFinite(d) && new Date(d).toISOString().slice(0,10).length===10,'bad timestamp: '+t);
  // Reject JS normalization of invalid local dates/times.
  assert.equal(new Date(d+8*3600*1000).toISOString().slice(0,19),t.slice(0,19),'nonexistent or malformed date: '+t);
  return d;
}

export function loadData(file=DEFAULT_DATA_PATH) {
  return JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
}

function err(errors,message) { errors.push(message); }
function matchArchivedTimestamp(url,observedAt) {
  if (!url.startsWith(ARCHIVE_BASE)) return false;
  const m=/\/web\/(\d{14})(?:id_)?\//.exec(url);
  if(!m) return false;
  const stamp=m[1];
  const iso=stamp.slice(0,4)+'-'+stamp.slice(4,6)+'-'+stamp.slice(6,8)+'T'+
    stamp.slice(8,10)+':'+stamp.slice(10,12)+':'+stamp.slice(12,14)+'Z';
  const parsed=Date.parse(iso);
  return Number.isFinite(parsed) && parsed===Date.parse(observedAt);
}
export function validateData(data) {
  const errors=[];
  if(!data || typeof data!=='object') return ['Document must be an object'];
  if(data.schema_version!==SCHEMA_VERSION) err(errors,'unsupported schema version');
  if(data.status!=='RESEARCH_ONLY_NOT_PUBLICATION_APPROVED')err(errors,'unapproved status marker missing');
  if(data.timezone!=='Asia/Shanghai')err(errors,'timezone must be Asia/Shanghai');
  if(!Array.isArray(data.parent_records)||data.parent_records.length!==3)err(errors,'expected three source provenance records');
  if(!Array.isArray(data.cases)||data.cases.length!==3) return [...errors,'expected exactly three research cases'];
  const caseIds=new Set(), observationIds=new Set(), checkpoints=new Set();
  const parents=new Map((data.parent_records||[]).map(x=>[x.case_id,x]));
  for(const c of data.cases){
    if(!c.id||caseIds.has(c.id))err(errors,'duplicate/missing case ID: '+c.id);
    caseIds.add(c.id);
    const parent=parents.get(c.id);
    if(!parent||!/^([a-f0-9]{40})$/.test(parent.branch_ref||'')||
       !/^[a-f0-9]{40}$/.test(parent.source_blob_sha||'')||!parent.path)
      err(errors,'case not pinned to immutable source: '+c.id);
    if(!Array.isArray(c.source_refs)||!Array.isArray(c.checkpoints)||!Array.isArray(c.observations)){
      err(errors,'missing case arrays: '+c.id);continue;
    }
    const srcIds=new Set(),sources=new Map();
    for(const s of c.source_refs){
      if(!s.id||srcIds.has(s.id))err(errors,'duplicate source: '+c.id+'/'+s.id);
      srcIds.add(s.id);sources.set(s.id,s);
      if(!/^https:\/\//.test(s.url||''))err(errors,'source URL must be https: '+s.id);
      if(!s.lineage_id)err(errors,'missing source lineage group: '+s.id);
    }
    let last=-Infinity;
    for(const k of c.checkpoints){
      if(!k.id||checkpoints.has(k.id))err(errors,'duplicate checkpoint: '+k.id);
      checkpoints.add(k.id);
      try{const t=parseLocalTime(k.at);if(t<=last)err(errors,'checkpoints out of order: '+c.id+'/'+k.id);last=t;}
      catch(e){err(errors,'bad checkpoint time '+k.id+': '+e.message);}
      if(!k.label)err(errors,'checkpoint without label: '+k.id);
    }
    last=-Infinity;
    for(const o of c.observations){
      if(!o.id||observationIds.has(o.id))err(errors,'duplicate observation: '+o.id);
      observationIds.add(o.id);
      let t;
      try{
        t=parseLocalTime(o.observed_at);
        if(t<last)err(errors,'observations out of order: '+o.id);
        last=t;
        if(o.event_at!==null && o.event_at!==undefined)parseLocalTime(o.event_at);
      }catch(e){err(errors,'invalid observation time '+o.id+': '+e.message);}
      if(!Array.isArray(o.source_ids)||o.source_ids.length===0)err(errors,'observation missing citations: '+o.id);
      for(const sid of o.source_ids||[])if(!sources.has(sid))err(errors,'unknown source '+sid+' for '+o.id);
      if(!ALLOWED_BASIS.has(o.observation_basis))err(errors,'unknown evidence basis: '+o.id);
      if(!ALLOWED_PRECISION.has(o.observed_time_precision))err(errors,'unknown precision: '+o.id);
      if(o.observed_time_precision==='day_end_bound'&&!o.observed_at.endsWith('23:59:59+08:00'))err(errors,'day-only records must use conservative day-end bound: '+o.id);
      if(o.event_time_precision==='day_end_bound'&&!(o.event_at||'').endsWith('23:59:59+08:00'))err(errors,'event date-only must use day-end bound: '+o.id);
      if(!ALLOWED_ROLES.has(o.claim_role))err(errors,'invalid claim role: '+o.id);
      if(!o.statement||!o.limits||!o.kind)err(errors,'incomplete evidence statement: '+o.id);
      if(o.observation_basis==='archive_capture' && o.source_ids?.length===1 && t!==undefined &&
        !matchArchivedTimestamp(sources.get(o.source_ids[0])?.url||'',o.observed_at))
        err(errors,'Wayback capture timestamp differs from observation: '+o.id);
    }
    for(const k of c.checkpoints){
      if(!c.observations.some(o=>{try{return parseLocalTime(o.observed_at)<=parseLocalTime(k.at)}catch{return false}}))
        err(errors,'empty historical checkpoint: '+k.id);
    }
  }
  if(parents.size!==3)err(errors,'parent provenance IDs mismatch');
  return errors;
}

export function selectAsOf(data,caseId,checkpoint,includeRetrospective=false) {
  const c=data.cases.find(x=>x.id===caseId);
  assert.ok(c,'unknown case '+caseId);
  const at=typeof checkpoint==='string'&&c.checkpoints.some(x=>x.id===checkpoint)
    ?c.checkpoints.find(x=>x.id===checkpoint).at:checkpoint;
  const cutoff=parseLocalTime(at);
  const known=c.observations.filter(o=>parseLocalTime(o.observed_at)<=cutoff);
  const retrospective=includeRetrospective?c.observations.filter(o=>
    o.event_at && parseLocalTime(o.event_at)<=cutoff && parseLocalTime(o.observed_at)>cutoff):[];
  const sourceById=new Map(c.source_refs.map(s=>[s.id,s]));
  const cited=new Map();
  for(const o of [...known,...retrospective])for(const sid of o.source_ids)cited.set(sid,sourceById.get(sid));
  const knownLineages=new Set(known.flatMap(o=>o.source_ids.map(sid=>sourceById.get(sid)?.lineage_id)));
  return {
    case_id:caseId,as_of:at,known,retrospective,
    source_refs:[...cited.values()],
    evidence_lineages_in_asof:knownLineages.size,
    temporal_policy:'An observation is visible only at or after its observed_at; retrospective facts remain separately marked.'
  };
}

if(import.meta.url===new URL('file://'+process.argv[1]).href) {
  const data=loadData();
  const errors=validateData(data);
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
  else console.log('Three-case evidence integrity PASS: 3 cases, '+data.cases.reduce((n,c)=>n+c.observations.length,0)+' observations');
}
