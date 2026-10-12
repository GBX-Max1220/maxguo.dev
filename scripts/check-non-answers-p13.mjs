import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Script } from 'node:vm';
import { chromium } from 'playwright';

const root=resolve('dist/non-answers/cases/question-compression-2024');
const caseFile=resolve(root,'index.html');
const evidenceFile=resolve(root,'evidence.json');
const mainFile=resolve('dist/non-answers/index.html');
for(const path of [caseFile,evidenceFile,mainFile])if(!existsSync(path))throw new Error('Missing build artifact: '+path);
const html=readFileSync(caseFile,'utf8');
const main=readFileSync(mainFile,'utf8');
const evidence=JSON.parse(readFileSync(evidenceFile,'utf8'));
const route='/maxguo.dev/non-answers/cases/question-compression-2024/';
const canonical='https://gbx-max1220.github.io'+route;
if(!html.includes('href="'+canonical+'"'))throw new Error('Case canonical path missing');
if(!html.includes('href="/maxguo.dev/non-answers/"'))throw new Error('Case back navigation missing');
if(!main.includes('id="v19-shortcase-link"')||!main.includes('href="'+route+'"'))throw new Error('Main article short-case link missing');
if(!main.includes('id="v18-case-link"'))throw new Error('Existing published case entry was lost');
if(!main.includes('data-ed-en="Two questions disappear.'))throw new Error('Main entry missing English translation');
if(evidence.case_id!=='question-compression-2024'||evidence.sources.length!==4||evidence.requests.length!==3)throw new Error('Source matrix malformed');
if(!['A','B','C'].every(id=>evidence.requests.some(x=>x.id===id)))throw new Error('Missing named information request');
if(!evidence.limits.some(x=>x.includes('editorial motive')))throw new Error('Editorial caution absent');
for(const source of evidence.sources){
  if(!source.url.startsWith('https://')||!html.includes('href="'+source.url+'"'))throw new Error('Primary URL missing/mismatch: '+source.id);
}
if(!html.includes('content="noindex,nofollow"')||!html.includes('编辑待审'))throw new Error('Draft must be noindex with editorial-review label');
if(evidence.status!=='NOT_PUBLISHED'||evidence.publication_gate?.main_merged!==false)throw new Error('Draft status corrupted');
const m=html.match(/<script>([\s\S]*?)<\/script>/);
if(!m)throw new Error('Inline script missing');
new Script(m[1],{filename:'nonanswers-p13-inline.js'});
const browser=await chromium.launch({headless:true});
const output=resolve('.astro/non-answers-p13-review');
mkdirSync(output,{recursive:true});
let checked=0;
try{
 for(const width of [320,390,768,1366,1440]){
  for(const locale of ['zh','tw','en']){
   const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(caseFile).toString(),{waitUntil:'load'});
   await page.locator('[data-lang="'+locale+'"]').click();
   const expected=locale==='zh'?'zh-CN':locale==='tw'?'zh-Hant':'en';
   if(await page.locator('html').getAttribute('lang')!==expected)throw new Error('Bad locale '+locale+' @'+width);
   const original=await page.locator('[data-i="title"]').textContent();
   if(!original||original.length<12)throw new Error('Title not translated '+locale);
   await page.locator('[data-initial="A"]').check();
   await page.locator('#revealBtn').click();
   if(!await page.locator('#full').isVisible())throw new Error('Reveal missing '+locale+' @'+width);
   if(!(await page.locator('#initialResult').textContent()).trim())throw new Error('Initial answer feedback missing');
   await page.locator('#ansA').selectOption('related');
   await page.locator('#ansB').selectOption('none');
   await page.locator('#ansC').selectOption('none');
   await page.locator('#assessBtn').click();
   if(!await page.locator('#eval').isVisible())throw new Error('Evaluation missing '+locale+' @'+width);
   const full=await page.locator('#score').textContent();
   await page.locator('#ansA').selectOption('none');
   const partial=await page.locator('#score').textContent();
   if(!full.includes('3')||!partial.includes('2')||full===partial)throw new Error('Score did not update '+locale+' @'+width+': '+full+' -> '+partial);
   await page.locator('#resetBtn').click();
   if(await page.locator('#eval').isVisible()||await page.locator('#ansA').inputValue())throw new Error('Reset invalid '+locale+' @'+width);
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Case horizontal overflow '+locale+' @'+width);
   if(errors.length)throw new Error('Page errors '+locale+' @'+width+': '+errors.join(' | '));
   if((width===390&&locale==='zh')||(width===1366&&locale==='en')){
    await page.screenshot({path:resolve(output,'case-'+width+'-'+locale+'.png'),animations:'disabled'});
   }
   checked++;
   await page.close();
  }
 }
 for(const locale of ['zh','tw','en']){
  const page=await browser.newPage({viewport:{width:locale==='en'?1366:390,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(mainFile).toString(),{waitUntil:'load'});
  if(locale==='en')await page.locator('#enBtn').click();
  if(locale==='tw')await page.locator('#hantBtn').click();
  const title=await page.locator('#v19-shortcase-title').innerText();
  if(locale==='en'&&!title.includes('Two questions'))throw new Error('Main case English missing');
  if(locale==='tw'&&!title.includes('問題少了兩個'))throw new Error('Main case Traditional Chinese missing: '+title);
  if(locale==='zh'&&!title.includes('问题少了两个'))throw new Error('Main case Simplified Chinese missing');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Main article overflow '+locale);
  if(errors.length)throw new Error('Main article JS errors '+locale+': '+errors.join(' | '));
  await page.locator('#v19-shortcase').screenshot({path:resolve(output,'main-'+locale+'.png'),animations:'disabled'});
  await page.close();
 }
 for(const [qs,expected] of [['?lang=en','en'],['?lang=zh-Hant','zh-Hant']]){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(pathToFileURL(caseFile).toString()+qs,{waitUntil:'load'});
  if(await page.locator('html').getAttribute('lang')!==expected)throw new Error('Locale deep link failed: '+qs);
  await page.close();
 }
 console.log('P13: '+checked+' locale × viewport interaction checks, 3 parent-card translations, source/metadata and 2 deep links PASS');
}finally{await browser.close()}
