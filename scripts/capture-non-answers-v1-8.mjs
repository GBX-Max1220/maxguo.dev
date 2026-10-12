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
  if(spec.selector){
    // Capture the actual viewport after hash navigation. Element screenshots
    // can composite a sticky header over the target and misrepresent what a reader sees.
    await page.evaluate(selector=>{
      // Disable smooth scrolling for the screenshot; hash navigation alone may
      // still be in-flight when the image is taken.
      document.documentElement.style.scrollBehavior='auto';
      const target=document.querySelector(selector);
      if(!target)throw new Error('Missing target '+selector);
      const desired=target.getBoundingClientRect().top+window.scrollY-80;
      window.scrollTo(0,desired);
    },spec.selector);
    await page.waitForTimeout(80);
    const top=await page.locator(spec.selector).evaluate(el=>el.getBoundingClientRect().top);
    if(top<65||top>105)throw new Error('Screenshot not aligned with target: '+spec.name+' top='+top);
  }
  await page.screenshot({path:resolve(out,spec.name+'.png'),animations:'disabled'});
  const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const title=await page.locator('h1').textContent();
  if(horizontal||errors.length)throw new Error(spec.name+' overflow='+horizontal+' errors='+errors.join(','));
  report.push({...spec,title:title.trim(),horizontal,errors});
  await page.close();
 }
 for(const width of [390,1366]){
   const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
   await page.goto(pathToFileURL(input).toString(),{waitUntil:'load'});
   await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:resolve(out,width===390?'mobile-zh-full.png':'desktop-zh-full.png'),animations:'disabled',fullPage:true});
   await page.close();
 }
 // The V1.7 main story now links to the V1.8 standalone case. Verify its
 // new card in both the source language and the translated navigation.
 const mainFile=resolve('dist/non-answers/index.html');
 for(const spec of [
   {name:'main-mobile-zh-case-entry',width:390,lang:'zh'},
   {name:'main-mobile-trad-case-entry',width:390,lang:'tw'},
   {name:'main-desktop-en-case-entry',width:1366,lang:'en'}
 ]){
   const page=await browser.newPage({viewport:{width:spec.width,height:844},deviceScaleFactor:1});
   await page.goto(pathToFileURL(mainFile).toString(),{waitUntil:'load'});
   if(spec.lang==='en')await page.locator('#enBtn').click();
   if(spec.lang==='tw')await page.locator('#hantBtn').click();
   await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>{
     document.documentElement.style.scrollBehavior='auto';
     const el=document.getElementById('v18-case');
     if(!el)throw new Error('New case-entry card missing from main article');
     window.scrollTo(0,el.getBoundingClientRect().top+scrollY-80);
   });
   await page.waitForTimeout(150);
   const top=await page.locator('#v18-case').evaluate(el=>el.getBoundingClientRect().top);
   if(top<65||top>105)throw new Error('Main case card not aligned: '+spec.name+' '+top);
   const label=await page.locator('#v18-case-title').innerText();
   if(spec.lang==='en'&&!label.includes('no valid downward line'))throw new Error('English main case card not translated');
   if(spec.lang==='tw'&&!label.includes('數字')&&!label.includes('一條下降線'))throw new Error('Traditional main case card not translated');
   if(spec.lang==='tw'&&label.includes('画'))throw new Error('Simplified-only glyph 画 leaked into Traditional case title');
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Main case entry overflows '+spec.name);
   await page.screenshot({path:resolve(out,spec.name+'.png'),animations:'disabled'});
   report.push({...spec,title:label,source:'V1.7 main story case entry',horizontal:false,errors:[]});
   await page.close();
 }
 writeFileSync(resolve(out,'review.json'),JSON.stringify({headless:true,source:'CI built dist HTML',captures:report},null,2));
 console.log('Captured '+captures.length+' QA screenshots; no page exceptions or overflow');
}finally{await browser.close()}
