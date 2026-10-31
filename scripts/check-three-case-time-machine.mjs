import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const file=resolve('.astro/critical-inquiry-research/three-case-time-machine.html');
const imageDir=resolve('.astro/critical-inquiry-research/screenshots');
assert.ok(existsSync(file),'generated offline prototype absent; run builder first');
mkdirSync(imageDir,{recursive:true});

const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  const pageErrors=[],remoteRequests=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))remoteRequests.push(r.url())});
  await page.goto(pathToFileURL(file).href,{waitUntil:'load'});
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow,noarchive');
  assert.equal(await page.locator('#case-select option').count(),3);
  assert.equal(await page.locator('#time-select option').count(),6);

  await page.locator('#time-select').selectOption('L1');
  assert.match(await page.locator('#known-items').innerText(),/八名|八人/);
  assert.ok(!(await page.locator('#known-items').innerText()).includes('撤销李文亮书面训诫'));
  await page.locator('#time-select').selectOption('L1B');
  assert.equal(await page.locator('#retro-items .evidence').count(),1);
  await page.locator('#retro-checkbox').check();
  assert.equal(await page.locator('#retro-items').isVisible(),true);
  assert.match(await page.locator('#retro-items').innerText(),/1月3日收到书面训诫/);
  assert.equal(await page.locator('#known-items .evidence').count(),1);
  await page.locator('#time-select').selectOption('L3');
  assert.ok(!(await page.locator('#known-items').innerText()).includes('警方撤销李文亮书面训诫并道歉'));
  await page.locator('#time-select').selectOption('L4');
  assert.match(await page.locator('#known-items').innerText(),/撤销李文亮书面训诫/);
  assert.ok(!(await page.locator('#known-items').innerText()).includes('警务人员的处分决定'));
  await page.locator('#time-select').selectOption('L5');
  assert.match(await page.locator('#known-items').innerText(),/警务人员的处分决定/);
  await page.screenshot({path:resolve(imageDir,'li-'+width+'.png'),fullPage:true});

  await page.locator('#case-select').selectOption('shanghai-2022');
  await page.locator('#retro-checkbox').uncheck();
  await page.locator('#time-select').selectOption('S1');
  assert.ok(!(await page.locator('#known-items').innerText()).includes('立案侦查'));
  await page.locator('#time-select').selectOption('S2');
  assert.match(await page.locator('#known-items').innerText(),/立案侦查/);
  await page.locator('#time-select').selectOption('S3');
  assert.match(await page.locator('#known-items').innerText(),/两小时重叠/);
  await page.screenshot({path:resolve(imageDir,'shanghai-'+width+'.png'),fullPage:true});

  await page.locator('#case-select').selectOption('ai-fen-2020');
  await page.locator('#time-select').selectOption('A2');
  assert.equal(await page.locator('#known-items .evidence').count(),2);
  await page.locator('#time-select').selectOption('A5');
  assert.equal(await page.locator('#known-items .evidence').count(),6);
  assert.ok(!(await page.locator('#known-items').innerText()).includes('中国数字时代发表的指令汇编'));
  await page.locator('#time-select').selectOption('A6');
  assert.equal(await page.locator('#known-items .evidence').count(),7);
  assert.match(await page.locator('#known-items').innerText(),/中国数字时代发表的指令汇编/);
  await page.screenshot({path:resolve(imageDir,'ai-fen-'+width+'.png'),fullPage:true});

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  assert.equal(overflow,false,'horizontal overflow at width '+width);
  assert.deepEqual(remoteRequests,[],'offline prototype fetched network requests');
  assert.deepEqual(pageErrors,[],'browser JS errors');
  await page.close();
 }
 console.log('Three-case offline viewer PASS: mobile/desktop, 17 checkpoints, dual-clock isolation, no network/overflow');
}finally{await browser.close();}
