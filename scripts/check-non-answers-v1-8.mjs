import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Script } from 'node:vm';
import { chromium } from 'playwright';

const root=resolve('dist/non-answers/cases/youth-unemployment-2023');
const file=resolve(root,'index.html');
const evidenceFile=resolve(root,'evidence.json');
if(!existsSync(file)||!existsSync(evidenceFile))throw new Error('V1.8 build output missing');
const html=readFileSync(file,'utf8'), evidence=JSON.parse(readFileSync(evidenceFile,'utf8'));
if(!html.includes('noindex,nofollow'))throw new Error('Prototype must not be indexed');
if(evidence.status!=='RESEARCH_PROTOTYPE_NOT_RELEASE_APPROVED')throw new Error('Release status changed');
if(evidence.observations.length!==2)throw new Error('Unexpected observations');
if(evidence.comparison.directly_comparable!==false||evidence.comparison.chart_policy!=='TWO_DISCONNECTED_CARDS_NO_TREND_LINE')throw new Error('Comparison boundary failed');
if(evidence.observations[0].observation_month!=='2023-06'||evidence.observations[1].observation_month!=='2023-12')throw new Error('Observation dates incorrect');
if(evidence.sources.length!==6)throw new Error('Primary source manifest incomplete');
for(const src of evidence.sources){
 if(!src.url.startsWith('https://www.stats.gov.cn/'))throw new Error('Unexpected primary-source host');
 if(!html.includes(src.url))throw new Error('Primary source missing from HTML: '+src.id);
}
const m=html.match(/<script>([\s\S]*?)<\/script>/);
if(!m)throw new Error('Inline JS missing');
new Script(m[1],{filename:'nonanswers-v1-8-inline.js'});
const keyset=new Set([...html.matchAll(/\bdata-t="([^"]+)"/g)].map(m=>m[1]));
for(const lang of ['zh','en']){
 const segment=m[1].match(new RegExp('const '+lang+'=\\{([\\s\\S]*?)\\n\\};'));
 if(!segment)throw new Error('Missing locale dictionary: '+lang);
 const keys=new Set([...segment[1].matchAll(/(?:^|,)([A-Za-z][A-Za-z0-9]*):"/gm)].map(m=>m[1]));
 const missing=[...keyset].filter(k=>!keys.has(k));
 if(missing.length)throw new Error(lang+' missing translations: '+missing.join(', '));
}
const browser=await chromium.launch({headless:true});
try{
 for(const width of [320,375,390,768,1366,1440]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(file).toString(),{waitUntil:'load'});
  const bad=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  if(bad)throw new Error('Horizontal overflow at '+width);
  await page.locator('[data-answer="no"]').click();
  if(!(await page.locator('#answerReveal').isVisible()))throw new Error('Answer reveal failed '+width);
  await page.locator('[data-def="new"]').click();
  if(!((await page.locator('#defHeading').textContent())||'').includes('排除'))throw new Error('Definition toggle failed '+width);
  await page.locator('[data-lang="en"]').click();
  if(await page.locator('html').getAttribute('lang')!=='en')throw new Error('English switch failed '+width);
  if(!((await page.locator('h1').textContent())||'').includes('21.3%'))throw new Error('English title lost '+width);
  await page.locator('[data-lang="tw"]').click();
  if(await page.locator('html').getAttribute('lang')!=='zh-Hant')throw new Error('Traditional switch failed '+width);
  if(errors.length)throw new Error('Browser JS errors: '+errors.join(' | '));
  await page.close();
 }
 console.log('V1.8 evidence, locale, source, comparison and six viewport checks PASSED');
}finally{await browser.close()}
