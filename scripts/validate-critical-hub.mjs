import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const text=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const published=[
  'src/pages/critical-inquiry/index.astro',
  'src/pages/critical-inquiry/en/index.astro',
  'src/styles/critical-inquiry.css'
];
published.forEach(p=>assert.ok(fs.existsSync(path.join(root,p)),'missing public asset: '+p));
assert.ok(!fs.existsSync(path.join(root,'src/pages/critical-inquiry/cases')),
 'unreviewed historical case must not have a public Astro route');
assert.ok(!fs.existsSync(path.join(root,'src/data/critical-inquiry/shanghai2022.json')),
 'unreviewed historical evidence must not enter the release branch');
assert.ok(!fs.existsSync(path.join(root,'docs/critical-inquiry/prototypes')),
 'unreviewed case prototypes must not enter the release branch');

const zh=text(published[0]);
const en=text(published[1]);
for(const source of [zh,en]){
 assert.match(source,/alternates=\{\[/,'bilingual alternate metadata missing');
 assert.match(source,/critical-inquiry\/en\//,'English language link missing');
 assert.match(source,/critical-inquiry\/'/,'Chinese language link missing');
}
assert.match(zh,/已发布 \/ PUBLISHED/);
assert.match(zh,/RESEARCH IN PROGRESS/);
assert.match(en,/RESEARCH IN PROGRESS/);
assert.match(text('src/pages/index.astro'),/critical-inquiry\//);
assert.match(text('src/pages/research.astro'),/critical-inquiry\//);
assert.match(text('src/components/Footer.astro'),/critical-inquiry\//);

const dist=path.join(root,'dist');
if(fs.existsSync(dist)){
 const html=(p)=>{const f=path.join(dist,p,'index.html');assert.ok(fs.existsSync(f),'missing build '+f);return fs.readFileSync(f,'utf8');};
 const z=html('critical-inquiry'), e=html('critical-inquiry/en');
 assert.match(z,/<html[^>]*lang="zh-CN"/i);
 assert.match(e,/<html[^>]*lang="en"/i);
 for(const doc of [z,e]){
  assert.match(doc,/hreflang="zh-CN"/);
  assert.match(doc,/hreflang="en"/);
  assert.match(doc,/hreflang="x-default"/);
  assert.match(doc,/https:\/\/gbx-max1220\.github\.io\/maxguo\.dev\/critical-inquiry\/en\//);
  assert.match(doc,/https:\/\/gbx-max1220\.github\.io\/maxguo\.dev\/critical-inquiry\//);
  assert.ok(!doc.includes('noindex,nofollow'),'public hub must not be noindex');
 }
 assert.ok(!fs.existsSync(path.join(dist,'critical-inquiry','cases')),
  'unreviewed cases must not be published by build');
 for(const p of ['index.html','research/index.html']){
   const page=fs.readFileSync(path.join(dist,p),'utf8');
   assert.ok(page.includes('/maxguo.dev/critical-inquiry/'),'public entry link missing base prefix in '+p);
 }
}
console.log('Critical Inquiry PUBLIC HUB PASS: bilingual discovery, base paths and draft isolation');
