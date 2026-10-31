import fs from 'node:fs';
import path from 'node:path';

const ROOT='research/critical-inquiry/normalized';
const INPUT=path.join(ROOT,'source-ledgers');
const OUTPUT=path.join(ROOT,'three-case-ledger-registry-v02.json');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const isoEnd=date=>date+'T23:59:59+08:00';
const parseTime=(date,time)=>{
 if(!time)return null;
 const t=time.length===5?time+':00':time;
 return date+'T'+t+'+08:00';
};
const manifest=read(path.join(ROOT,'source-ledger-manifest-v02.json'));
const byRole=(caseId,role)=>manifest.inputs.find(x=>x.case_id===caseId&&x.role===role);
const inputPath=x=>path.resolve(x.local_path);
const li=read(inputPath(byRole('li-2020','primary_evidence_ledger')));
const liAccess=read(inputPath(byRole('li-2020','source_access_audit')));
const sh=read(inputPath(byRole('shanghai-2022','primary_evidence_ledger')));
const shAccess=read(inputPath(byRole('shanghai-2022','source_access_audit')));
const af=read(inputPath(byRole('ai-fen-2020','primary_source_and_claim_register')));
const cdx=read(inputPath(byRole('ai-fen-2020','archive_capture_index')));
const hist=read(inputPath(byRole('ai-fen-2020','archive_capture_audit')));
const cross=read(inputPath(byRole('ai-fen-2020','cross_site_text_comparison')));
const he=read(inputPath(byRole('ai-fen-2020','three_source_text_comparison')));

const accessMap=records=>new Map((records||[]).map(x=>[x.source_id,x]));
const liAccessById=accessMap(liAccess.records),shAccessById=accessMap(shAccess.records);
function lineageGroups(sources){
 const groups=new Map();
 for(const s of sources){
  const id=s.independence_group||'UNASSIGNED:'+s.id;
  if(!groups.has(id))groups.set(id,[]);
  groups.get(id).push(s.id);
 }
 return [...groups.entries()].map(([lineage_id,source_ids])=>({
  lineage_id,source_ids,
  interpretation:'Shared registered source lineage; multiple members are not automatically independent factual corroboration.'
 }));
}
function normalizeLiSource(s){
 const a=liAccessById.get(s.id)||null;
 return {
  source_id:s.id,url:s.url||null,publisher:s.publisher||null,
  source_role:s.role||null,publication_date:s.publication_date||null,
  published_time:s.published_time||null,published_at_local:parseTime(s.publication_date,s.published_time),
  independence_group:s.independence_group||null,
  historical_asof_eligible:s.excluded_from_historical_public_asof!==true&&a?.historical_public_asof_eligible!==false,
  access_status:a?.page_access||'NOT_REGISTERED_IN_ACCESS_AUDIT',
  access_checked_on:a?.read_checked_date||null,
  evidence_limit:s.caution||s.note||a?.evidence_limit||null,
  native_record_id:s.id,native_file:'source-ledgers/li-wenliang/evidence-v01.json'
 };
}
function normalizeShSource(s){
 const a=shAccessById.get(s.id)||null;
 return {
  source_id:s.id,legacy_source_id:s.legacy_source_id||null,url:s.url||null,
  publisher:s.publisher||null,source_role:s.source_type||null,
  publication_date:s.date||null,published_at_local:s.published_at_local||null,
  reported_publication_date:s.reported_publication_date||null,
  container_publication_date:s.container_publication_date||null,
  independence_group:s.independence_group||null,
  historical_asof_eligible:s.asof_eligible!==false,
  access_status:a?.access_status||'NOT_REGISTERED_IN_ACCESS_AUDIT',
  access_checked_on:a?.last_checked||null,
  content_claim_status:a?.content_claim_status||null,
  evidence_limit:s.note||a?.audit_note||null,
  native_record_id:s.id,native_file:'source-ledgers/shanghai/shanghai2022.json'
 };
}
function normalizeAfSource(s){
 return {
  source_id:s.id,url:s.url||null,publisher:null,source_role:s.type||null,
  access_status:s.status||null,publication_date:s.displayed_date||s.published_date||null,
  published_at_local:null,archive_capture_utc:s.wayback_capture_utc||null,
  independence_group:s.independence_group||null,historical_asof_eligible:false,
  evidence_observations:s.observations||[],evidence_limit:s.limitations||[],
  native_record_id:s.id,native_file:'source-ledgers/ai-fen/source-audit-v01.json'
 };
}
function liCutoff(x){
 const exact=x.cutoff_local||null;
 return {date:x.cutoff_date,local_datetime:exact,precision:exact?'exact_local_time':'calendar_day',
  ordering_boundary:exact?'exact':isoEnd(x.cutoff_date),
  boundary_note:exact?'Original ledger specifies an intraday local cutoff.':'Original ledger specifies date only; end-of-day is an ordering boundary, not a claimed exact observation time.'};
}
function shCutoff(x){
 const exact=x.cutoff_local||null;
 return {date:x.date,local_datetime:exact,precision:exact?'exact_local_time':'calendar_day',
  ordering_boundary:exact||isoEnd(x.date),
  boundary_note:exact?'Original Shanghai ledger specifies this local cutoff.':(sh.asOfConvention||'Date-only snapshot; no intraday precision claimed.')};
}
const liSources=li.sources.map(normalizeLiSource);
const shSources=sh.sources.map(normalizeShSource);
const afSources=af.sources.map(normalizeAfSource);
const liSourceIds=new Set(liSources.map(x=>x.source_id));
const shSourceIds=new Set(shSources.map(x=>x.source_id));
const afSourceIds=new Set(afSources.map(x=>x.source_id));

const liCase={
 id:'li-2020',title:li.title,scope:'2020-01-01—2020-03-19',
 source_ledger:{path:'source-ledgers/li-wenliang/evidence-v01.json',commit:byRole('li-2020','primary_evidence_ledger').source_commit,blob_sha:byRole('li-2020','primary_evidence_ledger').source_blob_sha,source_pr:23},
 access_audit:{path:'source-ledgers/li-wenliang/source-access-audit-v02.json',blob_sha:byRole('li-2020','source_access_audit').source_blob_sha},
 sources:liSources,
 as_of_views:li.public_asof.map(x=>({
  view_id:x.id,cutoff:liCutoff(x),label:x.label||x.id,
  source_ids:x.public_sources,publicly_documented:x.publicly_documented||null,
  not_publicly_documented:x.not_publicly_documented_in_registered_sources||null,
  native_record_id:x.id,native_file:'source-ledgers/li-wenliang/evidence-v01.json'
 })),
 claims:li.atomic_claims.map(x=>({
  claim_id:x.id,claim_type:x.kind,claim:x.claim,status:x.status,
  source_ids:x.source_ids,limitations:x.caution,native_record_id:x.id
 })),
 events:li.event_history.map(x=>({
  event_id:x.id,event_at:x.event_time,description:x.event,
  retrospectively_established_by:x.retrospectively_established_by,
  first_publicly_established_date:x.first_publicly_established_date_in_this_register,
  limitations:x.caution,native_record_id:x.id
 })),
 state_transitions:li.public_label_history.map(x=>({
  transition_id:x.id,observed_at:x.public_at,actor:x.actor,target:x.target,
  label:x.label,speech_act:x.speech_act,source_ids:x.source_ids,
  interpretation_limit:x.meaning_limit,native_record_id:x.id
 })),
 source_relations:li.source_relations,
 source_lineage_groups:lineageGroups(li.sources),
 interview_frame_comparisons:li.interview_frame_comparisons,
 unresolved_questions:li.unresolved,
 correction_dimensions:li.correction_dimensions,
 release_gates:li.release_gates,
 time_model:li.time_model,
 native_auxiliary:{source_rule:li.source_rule,revision:li.revision,status:li.status,timezone:li.timezone}
};

const shCase={
 id:'shanghai-2022',title:sh.title,scope:sh.scope,
 source_ledger:{path:'source-ledgers/shanghai/shanghai2022.json',commit:byRole('shanghai-2022','primary_evidence_ledger').source_commit,blob_sha:byRole('shanghai-2022','primary_evidence_ledger').source_blob_sha,source_pr:21},
 access_audit:{path:'source-ledgers/shanghai/source-access-audit-20261029.json',blob_sha:byRole('shanghai-2022','source_access_audit').source_blob_sha},
 sources:shSources,
 as_of_views:sh.snapshots.map(x=>({
  view_id:x.id,cutoff:shCutoff(x),label:x.label,heading:x.heading,
  source_ids:x.available_sources,publicly_documented:x.known,
  not_publicly_documented:x.not_known,analytical_question:x.question||null,
  native_record_id:x.id,native_file:'source-ledgers/shanghai/shanghai2022.json'
 })),
 claims:sh.claims.map(x=>({
  claim_id:x.id,claim_type:x.type||null,claim:x.claim,
  first_observed_date:x.date_first_observed,source_ids:x.source_ids,
  status_at_mar23:x.as_of_23||null,status_after_mar27:x.after_27||null,
  limitations:x.note,native_record_id:x.id
 })),
 state_transitions:sh.claim_status_history.map(x=>({
  claim_id:x.claim_id,observed_at_date:x.as_of,state:x.state,explanation:x.why,
  source_ids:x.source_ids,native_record_id:x.claim_id+'@'+x.as_of
 })),
 event_records:sh.circulation_trace,
 actor_role_register:sh.actor_role_register,
 source_relations:sh.source_relations,
 source_lineage_groups:lineageGroups(sh.sources),
 retrospective_audits:sh.retrospective_audits,
 legal_element_audit:sh.legal_element_audit,
 legal_comparison_register:sh.legal_comparison_register,
 press_transcript_comparison:sh.press_transcript_comparison,
 methodological_limits:sh.methodological_limits,
 evidence_lineage:sh.evidence_lineage,
 time_model:sh.time_model,
 native_auxiliary:{id:sh.id,revision:sh.revision,status:sh.status,asOfConvention:sh.asOfConvention}
};

const titleCaptures=cdx.article_title_history.title_captures.map(([stamp,beijing,title])=>({
 capture_id:'AF_TITLE_'+stamp,archive_type:'article_title_capture',
 target_url:cdx.article_title_history.article_url,wayback_timestamp_utc:stamp,
 observed_at_beijing:beijing,title,direct_article_link_present:null,
 source_parent_ids:['AF03'],independence_group:'yyrw_interview_copy',
 native_record_path:'source-ledgers/ai-fen/title-homepage-cdx-v01.json',
 audit_record_ids:stamp==='20200310135052'?['AH01']:stamp==='20200311041923'?['AH04']:[]
}));
const homepageCaptures=cdx.homepage_history.snapshots.map((x,i)=>({
 capture_id:'AF_HOME_'+x.timestamp_utc.replace(/[-:TZ]/g,'').slice(0,14),
 archive_type:'homepage_capture',target_url:x.original_url||'http://www.yyrw.org.cn/',
 wayback_url:x.wayback_url||null,wayback_timestamp_utc:x.timestamp_utc,
 observed_at_beijing:x.timestamp_beijing,title:x.page_title,
 direct_article_link_present:x.direct_article_link_present,
 link:x.link||null,homepage_integrity_indicators:x.homepage_integrity_indicators,
 homepage_text_markers:x.homepage_text_markers,
 source_parent_ids:[i===0?'AF13':'AF14'],independence_group:'yyrw_homepage_archive',
 native_record_path:'source-ledgers/ai-fen/title-homepage-cdx-v01.json',
 audit_record_ids:[]
}));
const histExtra=hist.records.filter(x=>!['AH01','AH04'].includes(x.id)).map(x=>({
 capture_id:'AF_ARCHIVE_'+x.id,archive_type:'historical_capture_audit',
 target_url:x.target,snapshot_url:x.snapshot_url,
 wayback_timestamp_utc:x.wayback_capture_utc,
 observed_at_beijing:x.beijing_time,http_status:x.http_status,
 body_status:x.body_status,observed_notice:x.observed_notice||null,
 source_parent_ids:x.id==='AH02'?['AF12']:x.id==='AH03'?['AF11']:[],
 independence_group:x.id==='AH02'?'terminus_repository_history':'renwu_original_url_status',
 native_record_path:'source-ledgers/ai-fen/historical-captures-v01.json',
 audit_record_ids:[x.id],limitations:x.limits
}));
const aiArchive=[...titleCaptures,...homepageCaptures,...histExtra].sort((a,b)=>a.observed_at_beijing.localeCompare(b.observed_at_beijing));
const aiCase={
 id:'ai-fen-2020',title:'艾芬与《人物》采访｜历史可见性、版本与衍生副本',scope:'2020-03—2026-06 archive observations; retrospective disclosure',
 source_ledger:{path:'source-ledgers/ai-fen/source-audit-v01.json',commit:byRole('ai-fen-2020','primary_source_and_claim_register').source_commit,blob_sha:byRole('ai-fen-2020','primary_source_and_claim_register').source_blob_sha,source_pr:26},
 supplemental_ledgers:[
  {path:'source-ledgers/ai-fen/title-homepage-cdx-v01.json',blob_sha:byRole('ai-fen-2020','archive_capture_index').source_blob_sha,role:'archive capture index'},
  {path:'source-ledgers/ai-fen/historical-captures-v01.json',blob_sha:byRole('ai-fen-2020','archive_capture_audit').source_blob_sha,role:'four key archive capture audit records'},
  {path:'source-ledgers/ai-fen/cross-site-comparison-v01.json',blob_sha:byRole('ai-fen-2020','cross_site_text_comparison').source_blob_sha,role:'Terminus vs current yyrw text comparison'},
  {path:'source-ledgers/ai-fen/he-media-three-source-comparison-v01.json',blob_sha:byRole('ai-fen-2020','three_source_text_comparison').source_blob_sha,role:'three derivative-source comparison'}
 ],
 sources:afSources,
 as_of_views:[],
 claims:af.claims.map(x=>({
  claim_id:x.id,claim_type:'archival_visibility_or_provenance_claim',claim:x.claim,
  status:x.status,source_ids:x.source_ids,limitations:x.limit,
  native_record_id:x.id,native_file:'source-ledgers/ai-fen/source-audit-v01.json'
 })),
 archive_observations:aiArchive,
 archive_transition_intervals:{
  article_title:cdx.article_title_history.observed_transition,
  homepage_link:cdx.homepage_history.observed_state_interval
 },
 archive_capture_audit_links:[
  {audit_record_id:'AH01',capture_id:'AF_TITLE_20200310135052',relation:'same timestamp and yyrw article target'},
  {audit_record_id:'AH02',capture_id:'AF_ARCHIVE_AH02',relation:'distinct Terminus archive capture'},
  {audit_record_id:'AH03',capture_id:'AF_ARCHIVE_AH03',relation:'distinct original WeChat URL unavailable notice'},
  {audit_record_id:'AH04',capture_id:'AF_TITLE_20200311041923',relation:'same timestamp and yyrw article target'}
 ],
 source_lineage_groups:lineageGroups(af.sources),
 source_status_taxonomy:af.source_status_taxonomy,
 research_gates:af.research_gates,
 decision:af.decision,
 stop_condition:af.stop_condition,
 retrospective_directive_cross_reference:cdx.directive_cross_reference,
 cross_site_comparison:cross,
 three_source_comparison:he,
 historical_capture_summary:hist.historic_yyrw_vs_current,
 native_auxiliary:{schema_version:af.schema_version,audit_id:af.audit_id,checked_on:af.checked_on,status:af.status,publication_authorized:af.publication_authorized,scope:af.scope}
};

const cases=[liCase,shCase,aiCase];
const total=(key)=>cases.reduce((n,c)=>n+(c[key]?.length||0),0);
const out={
 schema_version:'2.0.0',status:'RESEARCH_ONLY_NOT_PUBLICATION_APPROVED',
 created_at:'2026-11-01',timezone:'Asia/Shanghai',
 normalization_method:'Lossless native input copies + typed cross-case projections. Native source ledgers remain authoritative for case-specific semantics; this registry does not adjudicate claims.',
 manifest_path:'source-ledger-manifest-v02.json',
 counts:{
  cases:cases.length,sources:total('sources'),as_of_views:total('as_of_views'),
  claims:total('claims'),archive_observations:total('archive_observations'),
  source_lineage_groups:cases.reduce((n,c)=>n+c.source_lineage_groups.length,0),
  li_events:liCase.events.length,li_public_label_transitions:liCase.state_transitions.length,
  shanghai_claim_status_transitions:shCase.state_transitions.length,
  shanghai_retrospective_audits:shCase.retrospective_audits.length,
  ai_fen_archive_title_captures:titleCaptures.length,
  ai_fen_homepage_captures:homepageCaptures.length,
  ai_fen_other_historical_captures:histExtra.length
 },
 cases,
 comparison_contract:{
  common_question:'How do public authority labels, publication/visibility states, enforcement or policy actions, and later corrections become observable over time, and what independent evidence supports each step?',
  common_dimensions:['source provenance and access','publication/observation time','claim target and type','official speech act or intervention','later correction or policy revision','source-lineage dependence','unresolved evidence and competing explanations'],
  case_specific_objects:{
   'li-2020':'Individual written admonition, public labeling of unnamed eight, later official investigation, withdrawal, apology and officer discipline.',
   'shanghai-2022':'Future policy forecasts, contemporaneous rebuttal, police investigation announcement, subsequent policy notices, and absence of located case-specific disposition within scoped search.',
   'ai-fen-2020':'Original WeChat URL state, derivative article versions, title captures, homepage link captures, and later directive disclosure; not a verified enforcement case.'
  },
  prohibited_equivalences:[
   'A police investigation announcement is not a conviction.',
   'A later policy revision is not proof that an earlier forecast was fully true or that its speaker had privileged knowledge.',
   'A current webpage version is not an authenticated historical first edition.',
   'A Wayback capture time is not the server-side edit or deletion time.',
   'A later disclosure is not proof that the public knew the disclosed information earlier.',
   'A missing homepage link is not proof of censorship; ordinary rotation remains a competing explanation.',
   'Repeated republications within one lineage are not independent corroboration.',
   'The three cases do not share one legal process or one causal treatment.'
  ]
 },
 review_state:{
  independent_second_human_review:'NOT_COMPLETED',
  editorial_rights_privacy_review:'NOT_COMPLETED',
  publication_authorization:'NOT_AUTHORIZED',
  note:'Automation verifies schema and time boundaries only; it cannot sign off historical truth, causal attribution, legal status or publication.'
 }
};
fs.writeFileSync(path.resolve(OUTPUT),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({output:OUTPUT,counts:out.counts},null,2));
