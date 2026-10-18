/**
 * F01 future-publication NAVIGATION SMOKE TEST — loopback-only.
 * Reads the .astro publication artifact; NEVER publishes or mutates site sources.
 */
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,join,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=resolve('dist');
const prefix='/maxguo.dev/';
const casePath='non-answers/cases/fengxian-evidence-2022/';
const fullCasePath=prefix+casePath;
const baseUrl='https://gbx-max1220.github.io/maxguo.dev/'+casePath;
const allowedMime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}
 catch {res.writeHead(400).end();return}
 if(req.method!=='GET'||!pathname.startsWith(prefix)){res.writeHead(404).end();return}
 const rel=pathname.slice(prefix.length);
 const requested=rel.endsWith('/')?rel+'index.html':rel;
 const path=resolve(root,requested);
 if(!path.startsWith(root+sep)){res.writeHead(403).end();return}
 try {
   if(!statSync(path).isFile())throw Error('not a file');
   res.writeHead(200,{
     'Content-Type':allowedMime[extname(path)]||'application/octet-stream',
     'X-Robots-Tag':'noindex, nofollow', // loopback reviewer route only; not production policy
     'Cache-Control':'no-store',
     'X-Content-Type-Options':'nosniff'
   });
   res.end(readFileSync(path));
 } catch {res.writeHead(404).end('Not found')}
});
await new Promise((accept,reject)=>server.listen(0,'127.0.0.1',err=>err?reject(err):accept()));
const base='http://127.0.0.1:'+server.address().port+'/maxguo.dev/';
const output=resolve('.astro/f01-release-source-qa');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={
 kind:'F01 actual release-source Draft branch, loopback-only navigation QA',
 source:'actual dist/ release-source candidate on unmerged Draft branch',
 production_deployment_executed:false,
 scenarios:[],failures:[]
};
try{
 const cases=[{button:null,html:'zh-CN',suffix:'',key:'zh'}, {button:'hantBtn',html:'zh-Hant',suffix:'?lang=zh-Hant',key:'tw'}, {button:'enBtn',html:'en',suffix:'?lang=en',key:'en'}];
 for(const test of cases){
   const page=await browser.newPage({viewport:{width:test.key==='zh'?390:1366,height:860}});
   const problems=[];
   page.on('pageerror',err=>problems.push(err.message));
   const indexResponse=await page.goto(base+'non-answers/',{waitUntil:'load'});
   assert.equal(indexResponse.status(),200,'Future case listing did not respond');
   if(test.button)await page.locator('#'+test.button).click();
   await page.waitForFunction((language)=>document.documentElement.lang===language,test.html,{timeout:6000});
   const visibleLinks=await page.locator('#f01-case-entry a.f01-locale').evaluateAll(
      nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none').map(n=>n.id)
   );
   assert.deepEqual(visibleLinks,['f01-link-'+test.key],'Wrong trilingual case entry after language switch');
   const navResponse=await Promise.all([
     page.waitForNavigation({waitUntil:'load'}),
     page.locator('#f01-link-'+test.key).click()
   ]).then(x=>x[0]);
   assert.equal(navResponse.status(),200,'Future F01 case navigation returned HTTP error');
   const path= new URL(page.url());
   assert.equal(path.pathname,fullCasePath);
   assert.equal(path.search,test.suffix,'Wrong locale query after card navigation');
   assert.equal(await page.locator('html').getAttribute('lang'),test.html);
   const meta=await page.locator('meta[name=robots]').getAttribute('content');
   assert.ok(meta.includes('index,follow'),'Generated release artifact missing publication robots metadata');
   assert.match(navResponse.headers()['x-robots-tag']||'',/noindex/,'Review-only loopback server must suppress indexing');
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),baseUrl);
   const ogLink=await page.locator('meta[property="og:image"]').getAttribute('content');
   assert.equal(ogLink,baseUrl+'assets/og-f01.png');
   const ogReq=await fetch(base+casePath+'assets/og-f01.png');
   assert.equal(ogReq.status,200);
   assert.match(ogReq.headers.get('content-type')||'',/image\/png/);
   for(const figure of ['01','02']){
     const img=page.locator('#figure'+figure+'-image');
     assert.ok((await img.getAttribute('src')).endsWith('-'+test.key+'.svg'));
     assert.ok(await img.evaluate(node=>node.complete&&node.naturalWidth>0),'Unloaded '+test.key+' SVG '+figure);
     const figureReq=await fetch(base+casePath+await img.getAttribute('src'));
     assert.equal(figureReq.status,200);
     assert.match(figureReq.headers.get('content-type')||'',/image\/svg\+xml/);
   }
   assert.equal(await page.locator('#timeline button').count(),6);
   assert.equal(await page.locator('.src-card a').count(),7);
   await page.locator('[data-stage="5"]').click();
   assert.equal(await page.locator('#stage-date').innerText(),'2023-04-07');
   await page.locator('[data-stage="0"]').click();
   assert.equal(await page.locator('#stage-date').innerText(),'2022-01-28');
   const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
   assert.ok(noOverflow,'Horizontal overflow');
   assert.deepEqual(problems,[],'Browser errors in staged release route');
   const screen='release-route-'+test.key+'.png';
   await page.screenshot({path:join(output,screen),fullPage:true,animations:'disabled'});
   report.scenarios.push({locale:test.key,index_status:indexResponse.status(),case_status:navResponse.status(),article_lang:test.html,source_count:7,stage_count:6,figures_loaded:2,og_http_ok:true,local_x_robots_tag:'noindex',status:'PASS',screenshot:screen});
   await page.close();
 }
 const sitemap=readFileSync(resolve('astro.config.mjs'),'utf8');
 assert.ok(sitemap.includes("'"+baseUrl+"'"));
 assert.ok(sitemap.includes("'"+baseUrl+"'"),'Tracked Astro release sitemap config missing');
 const generated=readFileSync(resolve('dist/sitemap-0.xml'),'utf8');
 assert.ok(generated.includes(baseUrl),'Built sitemap missing F01');
 console.log('F01 future-release NAVIGATION PASS: 3 locale entry→case HTTP routes, figures, OG, sitemap, never deployed.');
}catch(e){report.failures.push(String(e.stack||e));throw e}
finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
 writeFileSync(join(output,'route-report.json'),JSON.stringify(report,null,2)+'\n');
}
