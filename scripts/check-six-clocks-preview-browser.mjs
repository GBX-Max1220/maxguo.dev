import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const outdir=path.join(root,'.astro','six-clocks-preview');
fs.mkdirSync(outdir,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const base='/maxguo.dev/';
    if(!pathname.startsWith(base)){res.writeHead(404);res.end('Not Found');return;}
    let rel=pathname.slice(base.length);
    if(!rel||rel.endsWith('/'))rel+='index.html';
    const full=path.resolve(dist,rel);
    if(!full.startsWith(dist+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    const data=fs.readFileSync(full);
    res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream'});
    res.end(data);
  }catch{res.writeHead(404);res.end('Not Found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port+'/maxguo.dev';
const browser=await chromium.launch({headless:true});
try{
  for(const v of [
    {lang:'zh-CN',route:'/critical-inquiry/six-clocks/',name:'zh'},
    {lang:'en',route:'/critical-inquiry/six-clocks/en/',name:'en'}
  ]){
    for(const width of [320,390,1440]){
      const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      const response=await page.goto(base+v.route,{waitUntil:'networkidle',timeout:60000});
      assert.equal(response?.status(),200,'preview page not served: '+v.route);
      assert.equal(await page.locator('html').getAttribute('lang'),v.lang);
      assert.equal(await page.locator('head meta[name="robots"]').count(),0,'published essay must be indexable');
      assert.ok((await page.title()).includes(v.name==='zh'?'历史证据的六个时钟':'Six Clocks of Historical Evidence'));
      assert.ok((await page.locator('.sc-preview-banner').innerText()).includes(v.name==='zh'?'已发表':'PUBLIC CRITICAL ESSAY'));
      assert.ok(!(await page.locator('body').innerText()).includes('未发布 · 编辑预览'),'no unpublished banner after release');
      assert.equal(await page.locator('article.sc-article h1').count(),1,'missing essay title');
      assert.equal(await page.locator('.sc-article .sc-section-anchor').count(),7);
      assert.ok(await page.locator('.sc-article a[href^="https://"]').count()>=26,'source links lost');
      assert.equal(await page.locator('.sc-asof-panel:visible').count(),1,'one public-time snapshot must appear');
      const select=page.locator('[data-asof-select]');
      await select.selectOption('sh-0327');
      assert.ok(await page.locator('[data-panel="sh-0327"]').isVisible(),'phased-plan snapshot not visible');
      assert.equal(await page.locator('[data-panel="sh-0322"]').isVisible(),false,'previous panel incorrectly retained');
      const then=await page.locator('[data-panel="sh-0327"]').innerText();
      assert.ok(v.name==='zh'?then.includes('两小时重叠'):then.includes('overlapped by two hours'),'historical 2h overlap missing');
      await select.selectOption('li-0131');
      assert.ok(await page.locator('[data-panel="li-0131"]').isVisible(),'Li early interview not shown');
      await select.selectOption('li-0319');
      assert.ok(await page.locator('[data-panel="li-0319"]').isVisible(),'Li March correction not shown');
      if(width===320){
        const hub=await page.goto(base+(v.name==='zh'?'/critical-inquiry/':'/critical-inquiry/en/'),{waitUntil:'networkidle'});
        assert.equal(hub?.status(),200,'published hub broken');
        const target=page.locator('a[href*="/critical-inquiry/six-clocks/"]').filter({hasText:v.name==='zh'?'历史证据的六个时钟':'Six Clocks of Historical Evidence'});
        assert.ok(await target.count()>=1,'published hub must feature article');
        await page.goto(base+v.route,{waitUntil:'networkidle'});
      }
      const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert.ok(size.scroll<=size.client+1,'horizontal overflow on '+v.name+' '+width+': '+JSON.stringify(size));
      assert.deepEqual(errors,[],'browser runtime error: '+v.name);
      if(width===320||width===1440)await page.screenshot({path:path.join(outdir,v.name+'-'+width+'.png'),fullPage:true});
      console.log('Release browser PASS',v.name,width,then.slice(0,110).replace(/\s+/g,' '));
      await page.close();
    }
  }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
