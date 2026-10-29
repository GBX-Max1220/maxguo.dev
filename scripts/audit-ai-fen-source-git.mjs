#!/usr/bin/env node
// Optional, read-only reproduction of the 2020-03-10 Terminus2049 Git evidence.
// Usage: node scripts/audit-ai-fen-source-git.mjs --repo /path/to/Terminus2049.github.io
// The script never clones, fetches, writes, posts, or edits any external website.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const records=JSON.parse(readFileSync('research/critical-inquiry/ai-fen-2020/evidence-v01.json','utf8'));
const versions=records.historical_git_versions;
assert.equal(versions.length,4);
const idx=process.argv.indexOf('--repo');
if(idx<0 || !process.argv[idx+1]) {
  console.error('Source repository required: --repo /path/to/Terminus2049.github.io');
  process.exit(2);
}
const root=resolve(process.argv[idx+1]);
const git=(args,encoding='utf8')=>execFileSync('git',['-C',root,...args],{encoding,maxBuffer:2_000_000});
const all=[];
for(const v of versions){
  // git show returns raw file bytes; check the Git blob framing, not ordinary SHA1(text).
  const raw=git(['show',v.sha+':'+v.path],null);
  const prefix=Buffer.from('blob '+raw.length+'\0');
  const actual=createHash('sha1').update(prefix).update(raw).digest('hex');
  assert.equal(actual,v.blob_sha,'Git blob SHA mismatch at '+v.sha);
  const data=raw.toString('utf8');
  const eights=(data.match(/那\s*8\s*位被警方训诫的医生/g)||[]).length;
  const denial=(data.match(/我没有被公安局训诫/g)||[]).length;
  assert.equal(eights,v.editorial_intro_eight_count,'intro count mismatch');
  assert.equal(denial,v.interview_no_police_admonition_count,'first-person quote count mismatch');
  const gitTime=git(['show','-s','--format=%cI',v.sha]).trim();
  assert.equal(Date.parse(gitTime),Date.parse(v.committer_utc),'commit date mismatch');
  const normalizedParagraphs=data.split(/\n\s*\n/)
    .map(p=>p.replace(/\s+/gu,'')).filter(p=>p.length>40);
  all.push({sha:v.sha,blob:actual,committer_utc:v.committer_utc,
    line_count:data.split('\n').length,eights,first_person_denial:denial,
    paragraphs:normalizedParagraphs});
}
const first=all[0],last=all.at(-1);
const overlap=first.paragraphs.filter(x=>new Set(last.paragraphs).has(x)).length;
assert.equal(first.paragraphs.length,records.historical_git_comparison.normalized_paragraphs_first);
assert.equal(last.paragraphs.length,records.historical_git_comparison.normalized_paragraphs_last);
assert.equal(overlap,records.historical_git_comparison.normalized_paragraphs_identical,
  'the normalized-paragraph finding changed');
console.log(JSON.stringify({status:'PASS_LOCAL_GIT_SOURCE_REPLAY',
  versions:all.map(({paragraphs,...a})=>a),
  normalized_paragraph_overlap:{same:overlap,earlier:first.paragraphs.length,later:last.paragraphs.length},
  limitation:'Git committer timestamps are not original WeChat publisher timestamps; source is downstream republication.'
},null,2));
