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
const main=readFileSync(resolve('dist/non-answers/index.html'),'utf8');
const route='/maxguo.dev/non-answers/cases/youth-unemployment-2023/';
if(!main.includes('id="v18-case-link"')||!main.includes('href="'+route+'"'))throw new Error('Case entrypoint not linked from main article');
if(!main.includes('data-ed-zh="21.3% 与 14.9%')||!main.includes('data-ed-en="21.3% and 14.9%'))throw new Error('Main article case navigation is not bilingual');
const canonical='https://gbx-max1220.github.io'+route;
for(const token of [
 '<meta property="og:title"','<meta property="og:description"','<meta name="twitter:card"','<meta property="og:image"',
 'content="https://gbx-max1220.github.io/maxguo.dev/non-answers/og-preview.png"',
 'href="'+canonical+'"'
])if(!html.includes(token))throw new Error('Case release metadata missing: '+token);
if(!main.includes('id="v18-case-locale-link"'))throw new Error('Locale-preserving link script missing');
if(!html.includes('房价走势')||!html.includes('housing-price trend')||!html.includes('房價走勢'))throw new Error('Reporter housing trend must be represented in all three locales');
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
for(const lang of ['zh','tw','en']){
 const segment=m[1].match(new RegExp('const '+lang+'=\\{([\\s\\S]*?)\\n\\};'));
 if(!segment)throw new Error('Missing locale dictionary: '+lang);
 const keys=new Set([...segment[1].matchAll(/(?:^|,)\s*"?([A-Za-z][A-Za-z0-9]*)"?\s*:\s*"/g)].map(m=>m[1]));
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
  if(!((await page.locator('[data-t="q3"]').textContent())||'').includes('trend'))throw new Error('English housing trend omitted '+width);
  await page.locator('[data-lang="tw"]').click();
  if(await page.locator('html').getAttribute('lang')!=='zh-Hant')throw new Error('Traditional switch failed '+width);
  if(!((await page.locator('h1').textContent())||'').includes('數字'))throw new Error('Traditional lexical localization failed '+width);
  if(!((await page.locator('[data-t="q3"]').textContent())||'').includes('走勢'))throw new Error('Traditional housing trend omitted '+width);
  if(!((await page.locator('.brand').textContent())||'').includes('正確的廢話'))throw new Error('Traditional brand not localized '+width);
  if(errors.length)throw new Error('Browser JS errors: '+errors.join(' | '));
  await page.close();
 }
 for(const [requested,expected] of [['?lang=en','en'],['?lang=zh-Hant','zh-Hant']]){
  const page=await browser.newPage({viewport:{width:390,height:820}});
  await page.goto(pathToFileURL(file).toString()+requested,{waitUntil:'load'});
  if(await page.locator('html').getAttribute('lang')!==expected)throw new Error('Deep-link locale not preserved: '+requested);
  await page.close();
 }
 console.log('V1.8 evidence, locale, source, comparison and six viewport checks PASSED');
}finally{await browser.close()}
