import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const input=resolve('dist/non-answers/cases/youth-unemployment-2023/index.html');
const out=resolve('.astro/non-answers-v1-8-review');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const captures=[
  {name:'mobile-zh-hero',width:390,height:844,lang:'zh',selector:null},
  {name:'mobile-zh-xray',width:390,height:844,lang:'zh',selector:'#xray'},
  {name:'mobile-tw-hero',width:390,height:844,lang:'tw',selector:null},
  {name:'mobile-tw-xray',width:390,height:844,lang:'tw',selector:'#xray'},
  {name:'mobile-en-hero',width:390,height:844,lang:'en',selector:null},
  {name:'desktop-zh-hero',width:1366,height:768,lang:'zh',selector:null},
  {name:'desktop-zh-compare',width:1366,height:768,lang:'zh',selector:'#compare'},
  {name:'desktop-zh-xray',width:1366,height:768,lang:'zh',selector:'#xray'},
  {name:'desktop-en-compare',width:1366,height:768,lang:'en',selector:'#compare'}
];
const report=[];
try{
 for (const spec of captures){
  const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(input).toString(),{waitUntil:'load'});
  await page.locator('[data-lang="'+spec.lang+'"]').click();
  await page.evaluate(()=>document.fonts.ready);
  if(spec.selector) await page.locator(spec.selector).screenshot({path:resolve(out,spec.name+'.png'),animations:'disabled'});
  else await page.screenshot({path:resolve(out,spec.name+'.png'),animations:'disabled'});
  const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const title=await page.locator('h1').textContent();
  if(horizontal||errors.length)throw new Error(spec.name+' overflow='+horizontal+' errors='+errors.join(','));
  report.push({...spec,title:title.trim(),horizontal,errors});
  await page.close();
 }
 writeFileSync(resolve(out,'review.json'),JSON.stringify({headless:true,source:'CI built dist HTML',captures:report},null,2));
 console.log('Captured '+captures.length+' QA screenshots; no page exceptions or overflow');
}finally{await browser.close()}
