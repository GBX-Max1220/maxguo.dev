import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const file=resolve('.astro/critical-inquiry-research/three-case-full-ledger-v02.html');
const shots=resolve('.astro/critical-inquiry-research/full-ledger-screenshots');
assert.ok(existsSync(file),'build v2 prototype first');mkdirSync(shots,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(file).href,{waitUntil:'load'});
  assert.equal(await page.locator('#case option').count(),3);
  assert.equal(await page.locator('#view option').count(),13);
  assert.equal(await page.locator('#claim-select option').count(),14);

  await page.locator('#view').selectOption('LW_ASOF_0131_1200');
  assert.ok(!(await page.locator('#time-content').innerText()).includes('LW13'));
  assert.match(await page.locator('#time-content').innerText(),/LW12/);
  await page.locator('#view').selectOption('LW_ASOF_0131_2000');
  assert.match(await page.locator('#time-content').innerText(),/LW13/);
  await page.locator('#view').selectOption('LW_ASOF_0319_1910');
  assert.ok(!(await page.locator('#time-content').innerText()).includes('LW05'));
  await page.locator('#view').selectOption('LW_ASOF_0319_1920');
  assert.match(await page.locator('#time-content').innerText(),/LW05/);
  await page.screenshot({path:resolve(shots,'li-'+width+'.png'),fullPage:true});

  await page.locator('#case').selectOption('shanghai-2022');
  assert.equal(await page.locator('#view option').count(),11);
  assert.equal(await page.locator('#claim-select option').count(),11);
  await page.locator('#view').selectOption('mar23_1402');
  assert.match(await page.locator('#time-content').innerText(),/S09/);
  assert.ok(!(await page.locator('#time-content').innerText()).includes('S18'));
  await page.locator('#view').selectOption('mar23_1759');
  assert.match(await page.locator('#time-content').innerText(),/S18/);
  await page.locator('#view').selectOption('mar27');
  assert.match(await page.locator('#time-content').innerText(),/S03/);
  await page.locator('#view').selectOption('mar31');
  assert.match(await page.locator('#time-content').innerText(),/S10/);
  await page.screenshot({path:resolve(shots,'shanghai-'+width+'.png'),fullPage:true});

  await page.locator('#case').selectOption('ai-fen-2020');
  assert.equal(await page.locator('#view option').count(),30);
  assert.equal(await page.locator('#claim-select option').count(),29);
  assert.equal(await page.locator('#retrospective-section').isVisible(),true);
  await page.locator('#view').selectOption('AF_TITLE_20200310170954');
  assert.match(await page.locator('#time-content').innerText(),/吹哨子的人/);
  await page.locator('#view').selectOption('AF_TITLE_20200311041923');
  assert.match(await page.locator('#time-content').innerText(),/发哨子的人/);
  await page.locator('#view').selectOption('AF_HOME_20200310190634');
  assert.match(await page.locator('#time-content').innerText(),/首页直接链接：存在/);
  await page.locator('#view').selectOption('AF_HOME_20200312063101');
  assert.match(await page.locator('#time-content').innerText(),/首页直接链接：未在此份HTML中发现/);
  await page.locator('#view').selectOption('AF_ARCHIVE_AH03');
  assert.match(await page.locator('#time-content').innerText(),/此内容因违规无法查看/);
  assert.match(await page.locator('#retrospective-content').innerText(),/CDT DISCLOSURE/);
  await page.screenshot({path:resolve(shots,'aifen-'+width+'.png'),fullPage:true});

  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'horizontal overflow '+width);
  assert.deepEqual(requests,[],'offline viewer must not fetch external resources');
  assert.deepEqual(errors,[],'browser errors');
  await page.close();
 }
 console.log('FULL LEDGER VIEWER PASS: 13 Li views, 11 Shanghai views, 30 Ai Fen archive observations, 54 claims, mobile/desktop, zero network/overflow.');
}finally{await browser.close();}
