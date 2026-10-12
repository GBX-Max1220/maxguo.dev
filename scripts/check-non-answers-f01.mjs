import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const dir = resolve('dist/non-answers/cases/fengxian-evidence-2022');
const htmlPath = resolve(dir, 'index.html');
const evidencePath = resolve(dir, 'evidence_register.json');
const indexPath = resolve('dist/non-answers/index.html');
const dates = ['2022-01-28','2022-01-30','2022-02-07','2022-02-10','2022-02-23','2023-04-07'];
const langs = { zh:'zh-CN', tw:'zh-Hant', en:'en' };
const route = '/maxguo.dev/non-answers/cases/fengxian-evidence-2022/';
for (const p of [htmlPath,evidencePath,indexPath]) assert.ok(existsSync(p),'Missing built artifact: '+p);
const html = readFileSync(htmlPath,'utf8');
const index = readFileSync(indexPath,'utf8');
const manifest = JSON.parse(readFileSync(evidencePath,'utf8'));
assert.match(html,/<meta name="robots" content="noindex,nofollow"/,'Unreleased F01 must remain noindex');
assert.ok(!index.includes(route),'Unpublished F01 must have no live main-article entry');
assert.equal(manifest.status,'PREPUBLICATION_REVIEW_ONLY');
assert.equal(manifest.case_id,'F01-fengxian');
assert.deepEqual(manifest.checkpoints.map(x=>x.date),dates);
assert.equal(manifest.sources.length,7);
for (const checkpoint of manifest.checkpoints) {
  const permitted = manifest.sources.filter(s=>s.published<=checkpoint.date).map(s=>s.id);
  assert.deepEqual(checkpoint.source_ids,permitted,'Future-source leak: '+checkpoint.date);
}
for (const source of manifest.sources) {
  assert.match(source.url,/^https:\/\//);
  assert.ok(html.includes('href="'+source.url+'"'),'Unlinked source '+source.id);
}
for (const lang of Object.keys(langs)) {
  const ms = resolve(dir,'manuscript_'+lang+'.md');
  assert.ok(existsSync(ms) && readFileSync(ms,'utf8').length>2000,'Missing manuscript '+lang);
  for (const figure of ['01','02']) {
    const p = resolve(dir,'assets/figure-'+figure+'-'+lang+'.svg');
    assert.ok(existsSync(p),'Missing SVG '+p);
    const s = readFileSync(p,'utf8');
    assert.ok(s.includes('<svg') && s.includes('</svg>') && s.length>3500,'Malformed SVG '+p);
  }
}
const out=resolve('.astro/non-answers-f01-review');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
let checked=0;
try {
  for (const width of [320,390,768,1366]) {
    for (const [lang,htmlLang] of Object.entries(langs)) {
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});
      await page.locator('[data-lang="'+lang+'"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'),htmlLang);
      assert.equal(await page.locator('.article-language:not([hidden])').count(),1);
      assert.equal(await page.locator('#timeline button').count(),6);
      for (const f of ['01','02']) {
        const image=page.locator('#figure'+f+'-image');
        assert.ok((await image.getAttribute('src')).endsWith('figure-'+f+'-'+lang+'.svg'));
        assert.equal(await image.evaluate(el=>el.complete && el.naturalWidth>0),true,'SVG not loaded '+f+'/'+lang);
      }
      for (let i=0;i<6;i++) {
        const stage=page.locator('[data-stage="'+i+'"]');
        if (i===1) {
          await stage.focus();
          await page.keyboard.press('Enter');
          assert.equal(await page.evaluate(()=>document.activeElement?.dataset.stage),String(i));
        } else await stage.click();
        assert.equal(await page.locator('#stage-date').innerText(),dates[i]);
        const actual=(await page.locator('#asof-list a').allTextContents()).map(s=>s.match(/S\d\d/)?.[0]);
        assert.deepEqual(actual,manifest.checkpoints[i].source_ids,'Wrong evidence at '+dates[i]);
        assert.equal(await page.locator('#feedback').isVisible(),false);
        assert.equal(await page.locator('#hindsight-content').isVisible(),false);
      }
      await page.locator('[data-stage="0"]').click();
      await page.locator('#reader-note').fill('private note');
      await page.locator('#reveal').click();
      assert.ok((await page.locator('#feedback').innerText()).includes('private note'));
      await page.locator('#hindsight').click();
      assert.equal(await page.locator('#hindsight-content').isVisible(),true);
      await page.locator('[data-stage="1"]').click();
      assert.equal(await page.locator('#reader-note').inputValue(),'');
      await page.locator('[data-stage="0"]').click();
      assert.equal(await page.locator('#reader-note').inputValue(),'private note');
      await page.locator('#clear').click();
      assert.equal(await page.locator('#reader-note').inputValue(),'');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'Overflow '+width+'/'+lang);
      assert.deepEqual(errors,[],'Browser errors '+width+'/'+lang);
      if ((width===390&&lang==='tw')||(width===1366&&lang==='en'))
        await page.screenshot({path:resolve(out,'f01-'+width+'-'+lang+'.png'),fullPage:true,animations:'disabled'});
      checked++;
      await page.close();
    }
  }
  const page=await browser.newPage();
  for (const [query,language] of [['?lang=en','en'],['?lang=zh-Hant','zh-Hant']]) {
    await page.goto(pathToFileURL(htmlPath).href+query,{waitUntil:'load'});
    assert.equal(await page.locator('html').getAttribute('lang'),language,'Language deep-link failed: '+query);
  }
  await page.close();
  console.log('F01 PASS: '+checked+' viewport×language cases, six dated source gates, SVGs, notes, keyboard, deep links');
} finally { await browser.close(); }
