import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const ledgerPath='research/critical-inquiry/ai-fen/source-audit-v01.json';
const memoPath='docs/critical-inquiry/AI_FEN_SOURCE_AUDIT_V01_20261030.md';
const ledger=JSON.parse(fs.readFileSync(path.join(root,ledgerPath),'utf8'));
const memo=fs.readFileSync(path.join(root,memoPath),'utf8');
const knownStatuses=new Set([
 'DIRECTLY_READ_CURRENT_PAGE',
 'CONTEMPORANEOUS_REPORT',
 'PEER_REVIEWED_PRIOR_WORK',
 'LINK_IDENTIFIED_ACCESS_BLOCKED',
 'ORIGINAL_SOURCE_NOT_OBTAINED',
 'GITHUB_COMMIT_PROVENANCE'
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
assert.ok(ledger.sources.find(s=>s.id==='AF05'&&s.type==='PEER_REVIEWED_PRIOR_WORK'));
assert.ok(ledger.claims.find(c=>c.id==='AF-C04'&&c.status==='NOT_ESTABLISHED'),'must not infer historical availability from displayed date');
assert.ok(ledger.claims.find(c=>c.id==='AF-C05'&&c.status==='NOT_ESTABLISHED'),'must not infer exemption/intent from affiliation');
assert.ok(ledger.claims.find(c=>c.id==='AF-C06'&&c.status==='REJECTED_AS_NOVELTY_CLAIM'),'prior art must constrain novelty');
assert.ok(ledger.research_gates.some(g=>g.id==='G3'&&g.status==='OPEN_PARTIAL'));
assert.ok(ledger.research_gates.some(g=>g.id==='G6'&&g.status==='NOT_STARTED'));
for(const phrase of ['逐段、逐字符的完整差异分析','没有取得可认证的原始公众号发布记录','Sun 与 Wright','不新建公开文章页']){
 assert.ok(memo.includes(phrase),'audit memo missing required caution: '+phrase);
}
assert.ok(!fs.existsSync(path.join(root,'src/pages/critical-inquiry/ai-fen/index.astro')),'research-only audit must not create a public page');
assert.ok(!fs.existsSync(path.join(root,'src/pages/critical-inquiry/ai-fen/index.md')),'research-only audit must not create a public page');
assert.match(memo,/不构成正式文章/);
assert.match(memo,/不能把“发现网民将文章转成 emoji、摩斯码或其他形式”包装成原创发现/);
console.log('Ai Fen source audit ledger PASS: provenance, claim-source references, prior-art gate, uncertainty and no-public-page boundary.');
