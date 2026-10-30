import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const ledgerPath='research/critical-inquiry/ai-fen/source-audit-v01.json';
const memoPath='docs/critical-inquiry/AI_FEN_SOURCE_AUDIT_V01_20261030.md';
const ledger=JSON.parse(fs.readFileSync(path.join(root,ledgerPath),'utf8'));
const memo=fs.readFileSync(path.join(root,memoPath),'utf8');
const diffPath='research/critical-inquiry/ai-fen/terminus-version-diff-v01.json';
const diff=JSON.parse(fs.readFileSync(path.join(root,diffPath),'utf8'));
const crossSite=JSON.parse(fs.readFileSync(path.join(root,'research/critical-inquiry/ai-fen/cross-site-comparison-v01.json'),'utf8'));
assert.equal(crossSite.summary.equal_sentence_units,198);
assert.equal(crossSite.summary.both_copies_sentence_units,200);
assert.equal(crossSite.summary.unaligned_blocks,2);
assert.equal(crossSite.status,'COMPLETED_CURRENT_COPIES_NO_HISTORICAL_TIMESTAMP_AUTHENTICATION');
assert.equal(ledger.cross_site_comparison.exact_normalized_matches,198);
assert.ok(ledger.claims.find(c=>c.id==='AF-C11'&&c.status==='SUPPORTED_BY_REPRODUCIBLE_CURRENT_COPY_COMPARISON'));
assert.ok(ledger.claims.find(c=>c.id==='AF-C12'&&c.status==='SUPPORTED_BY_MINIMAL_CHANGED_SPAN_DIFF'));

const knownStatuses=new Set([
 'DIRECTLY_READ_CURRENT_PAGE',
 'CONTEMPORANEOUS_REPORT',
 'PEER_REVIEWED_PRIOR_WORK',
 'LINK_IDENTIFIED_ACCESS_BLOCKED',
 'LINK_IDENTIFIED_NOT_YET_VERIFIED',
 'ORIGINAL_SOURCE_NOT_OBTAINED',
 'GITHUB_COMMIT_PROVENANCE',
 'HISTORICAL_BODY_CAPTURE',
 'HISTORICAL_UNAVAILABLE_NOTICE',
 'HISTORICAL_HOMEPAGE_CAPTURE',
 'RETROSPECTIVE_DIRECTIVE_DISCLOSURE'
]);
assert.equal(ledger.audit_id,'AI-FEN-VERSION-AUDIT-2026-10-30');
assert.equal(ledger.status,'RESEARCH_ONLY_FEASIBILITY_AUDIT');
assert.equal(ledger.publication_authorized,false);
assert.equal(ledger.main_base_commit,'bbd6dbe59a15ede8ac4af4891556b46cd8fe9bf8');
assert.ok(ledger.sources.length>=6);
assert.ok(ledger.claims.length>=6);
const sourceIds=new Set(ledger.sources.map(s=>s.id));
assert.equal(sourceIds.size,ledger.sources.length,'duplicate source IDs');
for(const s of ledger.sources){
 assert.ok(s.id&&s.title&&s.type&&s.status&&s.independence_group,'incomplete source metadata: '+s.id);
 assert.ok(knownStatuses.has(s.status)||s.status==='REPUBLISHED_FULL_TEXT'||s.status==='SITE_SELF_DESCRIPTION','unknown source status: '+s.status);
 assert.ok(Array.isArray(s.observations)&&s.observations.length>0,'source observations missing: '+s.id);
 assert.ok(Array.isArray(s.limitations)&&s.limitations.length>0,'source limitations missing: '+s.id);
 if(s.url)assert.match(s.url,/^https:\/\//,'non-HTTPS URL must be explicitly justified: '+s.id);
}
for(const c of ledger.claims){
 assert.ok(c.id&&c.claim&&c.status&&c.limit,'incomplete claim: '+c.id);
 assert.ok(c.source_ids.length>0,'claim has no sources: '+c.id);
 for(const id of c.source_ids)assert.ok(sourceIds.has(id),'unknown source '+id+' for '+c.id);
}
assert.ok(ledger.sources.find(s=>s.id==='AF06'&&s.status==='ORIGINAL_SOURCE_NOT_OBTAINED'));
assert.ok(ledger.sources.find(s=>s.id==='AF08'&&s.status==='GITHUB_COMMIT_PROVENANCE'&&s.github_signature_verified===true),'signed repository timestamp must be retained');
assert.ok(ledger.claims.find(c=>c.id==='AF-C08'&&c.status==='SUPPORTED_BY_SIGNED_GITHUB_COMMIT_METADATA'),'repository timestamp claim missing');
assert.ok(ledger.sources.find(s=>s.id==='AF09'&&s.type==='OFFICIAL_ORGANIZATIONAL_LIST'),'official NHC list source missing');


const homeAudit=JSON.parse(fs.readFileSync(path.join(root,'research/critical-inquiry/ai-fen/title-homepage-cdx-v01.json'),'utf8'));
assert.equal(homeAudit.article_title_history.cdx_records_returned,35);
assert.equal(homeAudit.article_title_history.html_captures_inspected,21);
assert.equal(homeAudit.article_title_history.observed_transition.old_title_captures,2);
assert.equal(homeAudit.article_title_history.observed_transition.new_title_captures,19);
assert.equal(homeAudit.article_title_history.observed_transition.observed_gap,'11h 09m 29s');
assert.equal(homeAudit.homepage_history.unique_html_captures_inspected,7);
assert.equal(homeAudit.homepage_history.snapshots.length,7);
assert.equal(homeAudit.homepage_history.observed_state_interval.later_no_link_captures,6);
assert.equal(homeAudit.homepage_history.observed_state_interval.latest_no_link_capture_beijing,'2020-11-25T22:05:20+08:00');
assert.equal(homeAudit.homepage_history.snapshots.filter(x=>x.direct_article_link_present).length,1);
assert.equal(homeAudit.homepage_history.snapshots.filter(x=>x.direct_article_link_present===false).length,6);
assert.equal(homeAudit.homepage_history.observed_state_interval.interval_length,'35h 24m 27s');
assert.equal(homeAudit.homepage_history.domain_level_alias_query.http_status,503);
assert.ok(homeAudit.homepage_history.domain_level_alias_query.limit.includes('not proof') || homeAudit.homepage_history.domain_level_alias_query.status==='CDX_UNAVAILABLE_NO_ABSENCE_INFERENCE');
assert.ok(ledger.claims.find(c=>c.id==='AF-C18'&&c.status==='SUPPORTED_BY_HOMEPAGE_HTML_CAPTURE'));
assert.ok(ledger.claims.find(c=>c.id==='AF-C19'&&c.status==='SUPPORTED_BY_SIX_LATER_HOMEPAGE_CAPTURES'));
assert.ok(ledger.claims.find(c=>c.id==='AF-C23'&&c.status==='OBSERVED_CROSS_SOURCE_TIMING_TENSION'));
assert.ok(ledger.sources.find(s=>s.id==='AF15'&&s.status==='RETROSPECTIVE_DIRECTIVE_DISCLOSURE'));
assert.ok(ledger.sources.find(s=>s.id==='AF13'&&s.status==='HISTORICAL_HOMEPAGE_CAPTURE'));
assert.ok(ledger.sources.find(s=>s.id==='AF17'&&s.status==='DIRECTLY_READ_CURRENT_PAGE'&&s.url==='https://chinadigitaltimes.net/chinese/637830.html'));
assert.ok(ledger.sources.find(s=>s.id==='AF18'&&s.status==='LINK_IDENTIFIED_NOT_YET_VERIFIED'&&s.url.includes('21join.com')));
assert.ok(ledger.claims.find(c=>c.id==='AF-C24'&&c.status==='SUPPORTED_BY_DIRECTLY_READ_CDT_REPRINT_PAGE'));
assert.ok(ledger.provenance_followup.status==='CDT_PAGE_DIRECTLY_READ; 21JOIN_DESTINATION_UNVERIFIED');
assert.equal(ledger.research_gates.find(g=>g.id==='G4').status,'PARTIAL_HOMEPAGE_VISIBILITY_VERIFIED_HOST_GOVERNANCE_OPEN');
const crossSiteScript=fs.readFileSync(path.join(root,'scripts/audit-ai-fen-cross-site.py'),'utf8');
assert.ok(crossSiteScript.includes('TWO_DERIVATIVE_TEXT_COMPARISON_CDT_REPRINT_NOT_FETCHABLE_IN_CI'));
assert.ok(crossSiteScript.includes('if optional_cdt_available else'));

const capture=JSON.parse(fs.readFileSync(path.join(root,'research/critical-inquiry/ai-fen/historical-captures-v01.json'),'utf8'));
const decisionV2=fs.readFileSync(path.join(root,'docs/critical-inquiry/AI_FEN_HISTORICAL_VERSION_DECISION_V02_20261030.md'),'utf8');
const decisionV3=fs.readFileSync(path.join(root,'docs/critical-inquiry/AI_FEN_VISIBILITY_RECONSTRUCTION_V03_20261030.md'),'utf8');
assert.equal(capture.records.length,4,'four distinct dated archive objects expected');
assert.equal(capture.records.find(s=>s.id==='AH01').wayback_capture_utc,'2020-03-10T13:50:52Z');
assert.equal(capture.records.find(s=>s.id==='AH03').body_status,'ARCHIVED_WECHAT_UNAVAILABLE_NOTICE');
assert.equal(capture.historic_yyrw_vs_current.equal_units,199);
assert.match(capture.historic_yyrw_vs_current.title_comparison.historic_wayback_html_title,/^吹哨子的人/);
assert.match(capture.historic_yyrw_vs_current.title_comparison.current_html_title,/^发哨子的人/);
assert.ok(ledger.claims.find(c=>c.id==='AF-C17'&&c.status==='SUPPORTED_BY_ARCHIVED_VS_CURRENT_HEADING_COMPARISON'));
assert.ok(ledger.research_gates.find(g=>g.id==='G2').status.startsWith('PARTIAL_2020'));
assert.ok(ledger.research_gates.find(g=>g.id==='G5').status==='CORE_METHOD_AND_FINDINGS_REVIEWED_NOT_REPRODUCED');
assert.ok(decisionV2.includes('2020-03-11 **06:58:25**'));
assert.ok(decisionV2.includes('未经独立')||decisionV2.includes('独立审校'));
assert.ok(decisionV3.includes('35小时24分27秒'));
assert.ok(decisionV3.includes('泄露日期'));
assert.ok(decisionV3.includes('不是“网站明确违抗命令”的证据'));

assert.ok(ledger.claims.find(c=>c.id==='AF-C10'&&c.status==='SUPPORTED_BY_OFFICIAL_2023_LIST'),'time-bounded NHC listing claim missing');
assert.equal(diff.status,'PRELIMINARY_REPRODUCIBLE_INTRA_REPOSITORY_DIFF');
assert.equal(diff.sources[0].line_count,201);
assert.equal(diff.sources[1].line_count,195);
assert.equal(diff.method.lcs_exact_matching_lines,179);
assert.ok(diff.inference_limits.some(x=>x.includes('does not compare Terminus against the yyrw.org.cn version')));
assert.ok(ledger.sources.find(s=>s.id==='AF05'&&s.type==='PEER_REVIEWED_PRIOR_WORK'));
assert.ok(ledger.claims.find(c=>c.id==='AF-C04'&&c.status==='NOT_ESTABLISHED'),'must not infer historical availability from displayed date');
assert.ok(ledger.claims.find(c=>c.id==='AF-C05'&&c.status==='NOT_ESTABLISHED'),'must not infer exemption/intent from affiliation');
assert.ok(ledger.claims.find(c=>c.id==='AF-C06'&&c.status==='REJECTED_AS_NOVELTY_CLAIM'),'prior art must constrain novelty');
assert.ok(ledger.research_gates.some(g=>g.id==='G3'&&g.status==='PASS_REPRODUCIBLE_CURRENT_AND_HISTORIC_DERIVATIVE_DIFFS'));
assert.ok(ledger.research_gates.some(g=>g.id==='G6'&&g.status==='NOT_STARTED'));
for(const phrase of ['逐段、逐字符的完整差异分析','没有取得可认证的原始公众号发布记录','Sun 与 Wright','不新建公开文章页']){
 assert.ok(memo.includes(phrase),'audit memo missing required caution: '+phrase);
}
assert.ok(!fs.existsSync(path.join(root,'src/pages/critical-inquiry/ai-fen/index.astro')),'research-only audit must not create a public page');
assert.ok(!fs.existsSync(path.join(root,'src/pages/critical-inquiry/ai-fen/index.md')),'research-only audit must not create a public page');
assert.match(memo,/不构成正式文章/);
assert.match(memo,/不能把“发现网民将文章转成 emoji、摩斯码或其他形式”包装成原创发现/);
console.log('Ai Fen source audit ledger PASS: provenance, claim-source references, prior-art gate, uncertainty and no-public-page boundary.');
