import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const file=resolve('research/critical-inquiry/prototypes/dual-asof-comparison-v01.html');
assert.ok(existsSync(file),'missing offline research prototype');
const outDir=resolve('.astro/critical-inquiry-offline-review');
mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  const jsErrors=[];
  page.on('pageerror',err=>jsErrors.push(err.message));
  await page.goto(pathToFileURL(file).href,{waitUntil:'load'});
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  assert.equal(await page.locator('#heading').count(),1);
  assert.match(await page.locator('#heading').innerText(),/8人/);
  const cases=page.locator('#case'),checkpoint=page.locator('#checkpoint');
  async function choose(date){
   const options=await checkpoint.locator('option').allTextContents();
   assert.ok(options.includes(date),'missing checkpoint '+date);
   await checkpoint.selectOption({label:date});
  }
  const order=await checkpoint.locator('option').allTextContents();
  assert.ok(order.indexOf('2020-01-29 15:00')<order.indexOf('2020-01-29'),'intraday checkpoint must precede that date end');
  assert.match(await page.locator('.warning').innerText(),/现存页面又显示后来更新/,'edition-time caution must be visible');
  await choose('2020-01-31 12:00');
  assert.match(await page.locator('#heading').innerText(),/1月31|采访|训诫/);
  assert.ok((await page.locator('#sources a').allTextContents()).some(t=>t.includes('新京报')) ||
            (await page.locator('#known').innerText()).includes('1月31'));
  await checkpoint.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  assert.equal(await checkpoint.locator('option:checked').innerText(),'2020-01-31 20:00','native select must be keyboard-operable');
  assert.match(await page.locator('#heading').innerText(),/两篇个人采访/,'keyboard change must update view');
  await choose('2020-01-31 20:00');
  assert.ok((await page.locator('#sources a').count())>=2,'both Jan31 interviews must be available by 20:00');
  await choose('2020-03-19 19:10');
  assert.ok((await page.locator('#sources a').allTextContents()).some(t=>t.includes('财联社')));
  assert.ok(!(await page.locator('#sources').innerText()).includes('19:28'),'full report must be absent at 19:10');
  await choose('2020-03-19 19:20');
  assert.ok((await page.locator('#sources a').count())>0);
  await choose('2020-03-19 20:00');
  assert.ok((await page.locator('#sources').innerText()).includes('国家监委'));
  await choose('2020-03-19 21:00');
  assert.match(await page.locator('#known').innerText(),/20:55/,'police decision should be known by 21:00');
  assert.ok((await page.locator('#sources a').allTextContents()).some(t=>t.includes('新浪')));
  assert.ok(!(await page.locator('#sources').innerText()).includes('21:47'),'later repost cannot enter 21:00');
  await choose('2020-03-19 21:50');
  assert.ok((await page.locator('#known').innerText()).includes('撤销'));
  await checkpoint.selectOption({label:'2020-03-19'});
  await page.screenshot({path:resolve(outDir,'li-'+width+'.png'),fullPage:true});
  await cases.selectOption('sh');
  assert.match(await page.locator('#heading').innerText(),/传言|否认/);
  await choose('2022-03-23 14:02');
  assert.ok((await page.locator('#known').innerText()).includes('Y先生'));
  assert.ok(!(await page.locator('#sources').innerText()).includes('警方通报'));
  await choose('2022-03-23 17:59');
  assert.ok((await page.locator('#sources').innerText()).includes('警方'));
  await checkpoint.selectOption({label:'2022-04-04'});
  await page.screenshot({path:resolve(outDir,'shanghai-'+width+'.png'),fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  assert.equal(overflow,false,'offline research UI overflows viewport '+width);
  assert.deepEqual(jsErrors,[],'browser JS errors');
  await page.close();
 }
 console.log('Offline critical inquiry viewer PASS: two cases, historical checkpoints, source gates, mobile and desktop screenshots');
}finally{await browser.close()}
