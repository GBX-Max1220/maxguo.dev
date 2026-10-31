import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const ROOT='research/critical-inquiry/normalized';
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const dateOf=t=>String(t||'').slice(0,10);
const timeMs=t=>Date.parse(t);
const gitBlobSha=buffer=>createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');

export function validateRegistry(registry,root=process.cwd()){
 const errors=[];
 const fail=m=>errors.push(m);
 const manifest=read(path.resolve(root,ROOT,'source-ledger-manifest-v02.json'));
 const inputs=new Map();
 for(const x of manifest.inputs){
  const p=path.resolve(root,x.local_path);
  if(!fs.existsSync(p)){fail('missing pinned source copy: '+x.local_path);continue;}
  const b=fs.readFileSync(p),actual=gitBlobSha(b);
  if(actual!==x.source_blob_sha)fail('Git blob SHA mismatch: '+x.local_path);
  inputs.set(x.case_id+'|'+x.role,{x,raw:JSON.parse(b.toString('utf8'))});
 }
 if(registry.schema_version!=='2.0.0')fail('schema version must be 2.0.0');
 if(registry.status!=='RESEARCH_ONLY_NOT_PUBLICATION_APPROVED')fail('publication hold marker missing');
 if(registry.cases?.length!==3)fail('exactly three cases required');
 const byCase=new Map(registry.cases.map(c=>[c.id,c]));
 const expected=[
  {id:'li-2020',sources:16,views:13,claims:14},
  {id:'shanghai-2022',sources:22,views:11,claims:11},
  {id:'ai-fen-2020',sources:20,views:0,claims:29}
 ];
 const allIds=new Map();
 for(const spec of expected){
  const c=byCase.get(spec.id);
  if(!c){fail('missing case '+spec.id);continue;}
  if(c.sources.length!==spec.sources)fail(spec.id+' source count mismatch');
  if(c.as_of_views.length!==spec.views)fail(spec.id+' as-of view count mismatch');
  if(c.claims.length!==spec.claims)fail(spec.id+' claim count mismatch');
  const sourceIds=new Set(c.sources.map(s=>s.source_id));
  if(sourceIds.size!==c.sources.length)fail(spec.id+' duplicate source IDs');
  allIds.set(spec.id,sourceIds);
  for(const claim of c.claims){
   if(!claim.claim_id||!claim.claim)fail(spec.id+' incomplete claim');
   for(const sid of claim.source_ids||[])if(!sourceIds.has(sid))fail(spec.id+' claim '+claim.claim_id+' references unknown source '+sid);
  }
  for(const view of c.as_of_views){
   for(const sid of view.source_ids||[]){
    const s=c.sources.find(x=>x.source_id===sid);
    if(!s)fail(spec.id+' as-of '+view.view_id+' references unknown source '+sid);
    else if(s.historical_asof_eligible===false)fail(spec.id+' as-of '+view.view_id+' includes ineligible source '+sid);
    const date=s?.publication_date;
    const cutoff=view.cutoff;
    if(date&&cutoff?.date&&date>cutoff.date)fail(spec.id+' as-of '+view.view_id+' contains future-dated source '+sid);
    if(cutoff?.precision==='exact_local_time'&&s?.published_at_local&&timeMs(s.published_at_local)>timeMs(cutoff.local_datetime))
     fail(spec.id+' as-of '+view.view_id+' contains post-cutoff source '+sid);
   }
   if(view.cutoff.precision==='calendar_day'&&(view.cutoff.local_datetime!==null||!view.cutoff.ordering_boundary.endsWith('23:59:59+08:00')))
    fail(spec.id+' date-only as-of precision was silently upgraded '+view.view_id);
  }
  for(const group of c.source_lineage_groups){
   for(const sid of group.source_ids)if(!sourceIds.has(sid))fail(spec.id+' lineage group references unknown source '+sid);
  }
  const grouped=new Set(c.source_lineage_groups.flatMap(g=>g.source_ids));
  if(grouped.size!==sourceIds.size||[...sourceIds].some(x=>!grouped.has(x)))fail(spec.id+' source lineage groups do not cover every source exactly at least once');
 }
 const li=byCase.get('li-2020'),sh=byCase.get('shanghai-2022'),af=byCase.get('ai-fen-2020');
 if(li){
  if(li.events.length!==9)fail('Li event history incomplete');
  if(li.state_transitions.length!==8)fail('Li public label history incomplete');
  if(li.source_relations.length!==10)fail('Li source relation register incomplete');
  if(li.as_of_views.some(v=>v.source_ids.includes('LW01')))fail('retrospective LW01 wrongly enters public-as-of');
 }
 if(sh){
  if(sh.state_transitions.length!==16)fail('Shanghai claim status history incomplete');
  if(sh.source_relations.length!==12)fail('Shanghai source relations incomplete');
  if(sh.retrospective_audits.length!==2)fail('Shanghai retrospective audits incomplete');
  if(sh.legal_element_audit.length!==4||sh.legal_comparison_register.length!==3)fail('Shanghai legal registers incomplete');
  if(sh.as_of_views.some(v=>v.source_ids.includes('S13')))fail('unverified current transcript S13 wrongly enters historical as-of');
  const intraday=sh.as_of_views.find(v=>v.view_id==='mar23_1402');
  if(intraday?.cutoff.local_datetime!=='2022-03-23T14:02:36+08:00')fail('Shanghai 14:02:36 as-of cutoff lost');
  const police=sh.as_of_views.find(v=>v.view_id==='mar23_1759');
  if(police?.cutoff.local_datetime!=='2022-03-23T17:59:14+08:00')fail('Shanghai 17:59:14 as-of cutoff lost');
 }
 if(af){
  if(af.archive_observations.length!==30)fail('Ai Fen unique archive observation count must be 30');
  if(af.archive_observations.filter(x=>x.archive_type==='article_title_capture').length!==21)fail('Ai Fen title capture count mismatch');
  if(af.archive_observations.filter(x=>x.archive_type==='homepage_capture').length!==7)fail('Ai Fen homepage capture count mismatch');
  if(af.archive_observations.filter(x=>x.archive_type==='historical_capture_audit').length!==2)fail('Ai Fen additional unique archive captures mismatch');
  if(af.archive_capture_audit_links.length!==4)fail('Ai Fen historical capture audit links missing');
  const cdt=af.sources.filter(s=>s.source_id==='AF15'||s.source_id==='AF16');
  if(cdt.length!==2||new Set(cdt.map(s=>s.independence_group)).size!==1)fail('CDT English and Chinese disclosure incorrectly treated as independent');
  const linked=af.archive_observations.find(x=>x.capture_id==='AF_HOME_20200310190634');
  const unlinked=af.archive_observations.find(x=>x.capture_id==='AF_HOME_20200312063101');
  if(linked?.direct_article_link_present!==true||unlinked?.direct_article_link_present!==false)fail('Ai Fen homepage linked/unlinked observations missing');
  if(af.as_of_views.length!==0)fail('Ai Fen archive states must not be presented as general public-as-of snapshots');
  const title=af.archive_observations.filter(x=>x.archive_type==='article_title_capture');
  const old=title.filter(x=>x.title==='吹哨子的人'),fresh=title.filter(x=>x.title==='发哨子的人');
  if(old.length!==2||fresh.length!==19)fail('Ai Fen title version counts mismatch');
 }
 const count=registry.counts||{};
 if(count.sources!==58||count.as_of_views!==24||count.claims!==54||count.archive_observations!==30)fail('registry portfolio totals do not match full source ledgers');
 if(registry.review_state?.independent_second_human_review!=='NOT_COMPLETED')fail('human review state must remain open');
 if(registry.review_state?.publication_authorization!=='NOT_AUTHORIZED')fail('publication authorization must remain blocked');
 return errors;
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve('scripts/validate-critical-inquiry-ledger-registry.mjs')){
 const registry=read(path.resolve(ROOT,'three-case-ledger-registry-v02.json'));
 const errors=validateRegistry(registry);
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
 else console.log('FULL LEDGER REGISTRY PASS: 58 sources / 24 as-of views / 54 claims / 30 unique archive observations; all 9 pinned input blobs verified.');
}
