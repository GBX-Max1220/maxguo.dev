import {createServer} from 'node:http';
import {readFileSync,writeFileSync,statSync,mkdirSync} from 'node:fs';
import {resolve,join,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const prefix='/maxguo.dev/non-answers/cases/fengxian-evidence-2022/';
const root=resolve('dist/non-answers/cases/fengxian-evidence-2022');
const register=JSON.parse(readFileSync(join(root,'evidence_register.json'),'utf8'));
assert.equal(register.status,'PREPUBLICATION_REVIEW_ONLY');
const types={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(!path.startsWith(prefix)){res.writeHead(404).end();return}
  const file=resolve(root,decodeURIComponent(path.slice(prefix.length)||'index.html'));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  try{if(!statSync(file).isFile())throw Error('Non-file');
    res.writeHead(200,{'Content-Type':types[extname(file)]||'text/plain','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'});
    res.end(readFileSync(file));
  }catch{res.writeHead(404).end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+prefix;
const output=resolve('.astro/non-answers-f01-http-preview');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={scope:'PR standalone artifact / local HTTP / no external deployment',runs:[],errors:[]};
try{
  const response=await fetch(url);
  assert.equal(response.status,200);
  assert.match(response.headers.get('x-robots-tag'),/noindex/);
  for(const lang of ['zh','tw','en'])for(const width of [390,1366]){
    const page=await browser.newPage({viewport:{width,height:850}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)errors.push('HTTP '+r.status())});
    const goto=await page.goto(url+'?lang='+(lang==='tw'?'zh-Hant':lang),{waitUntil:'load'});
    assert.equal(goto.status(),200);
    assert.equal(await page.locator('html').getAttribute('lang'),lang==='zh'?'zh-CN':lang==='tw'?'zh-Hant':'en');
    assert.equal(await page.locator('.article-language:not([hidden])').count(),1);
    assert.equal(await page.locator('#timeline button').count(),6);
    const sourceNames=await page.locator('.src-card a').evaluateAll(ns=>ns.map(n=>n.getAttribute('aria-label')));
    assert.equal(sourceNames.length,7);assert.equal(new Set(sourceNames).size,7);
    for(const n of ['01','02']){
      const img=page.locator('#figure'+n+'-image');
      assert.equal(await img.evaluate(i=>i.complete&&i.naturalWidth>0),true);
      const r=await fetch(new URL(await img.getAttribute('src'),url));
      assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/svg/);
    }
    for(let i=0;i<6;i++){
      await page.locator('[data-stage="'+i+'"]').click();
      assert.equal(await page.locator('#stage-date').innerText(),register.checkpoints[i].date);
      const visible=(await page.locator('#asof-list a').allTextContents()).map(x=>x.match(/S\d\d/)?.[0]);
      assert.deepEqual(visible,register.checkpoints[i].source_ids);
    }
    await page.locator('[data-stage="0"]').click();
    await page.locator('#reader-note').fill('HTTP preview note');
    await page.locator('#reveal').click();
    assert.ok((await page.locator('#feedback').innerText()).includes('HTTP preview note'));
    await page.locator('#hindsight').click();
    assert.equal(await page.locator('#hindsight-content').isVisible(),true);
    await page.locator('[data-stage="1"]').click();
    assert.equal(await page.locator('#reader-note').inputValue(),'');
    await page.locator('[data-stage="0"]').click();
    assert.equal(await page.locator('#reader-note').inputValue(),'HTTP preview note');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    assert.deepEqual(errors,[]);
    const png='http-'+lang+'-'+width+'.png';
    await page.screenshot({path:join(output,png),fullPage:true,animations:'disabled'});
    report.runs.push({lang,width,status:'PASS',screenshot:png});
    await page.close();
  }
  const page=await browser.newPage();
  await page.goto(url);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'skip-workspace');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'workspace');
  await page.close();
  console.log('F01 HTTP preview PASS: 6 viewport/locale scenarios; keyboard, sources, SVG, notes');
}catch(e){report.errors.push(String(e.stack||e));throw e}
finally{await browser.close();await new Promise(ok=>server.close(ok));
  writeFileSync(join(output,'http-results.json'),JSON.stringify(report,null,2)+'\n');}