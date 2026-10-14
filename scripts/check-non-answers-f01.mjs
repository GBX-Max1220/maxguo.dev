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

function linear(c) { c /= 255; return c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4; }
function luminance(hex) {
  assert.match(hex,/^#[0-9a-f]{6}$/i);
  const ch=[1,3,5].map(p=>linear(parseInt(hex.slice(p,p+2),16)));
  return 0.2126*ch[0]+0.7152*ch[1]+0.0722*ch[2];
}
function contrastRatio(a,b) {
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}
// The 11px uppercase section eyebrow is ordinary text, not large text.
// Test the actual lightest card and background/hero colors; global --orange
// also serves as a focus indicator, whose minimum alone would be 3:1.
const accent=html.match(/--orange:(#[0-9a-f]{6})/i)?.[1];
assert.ok(accent,'F01 accessible accent token missing');
for(const bg of ['#f6f2e8','#fffdf7','#f4eee4','#e7eee5']) {
  assert.ok(contrastRatio(accent,bg)>=4.5,
    'F01 small text contrast below WCAG AA: '+accent+' on '+bg);
}

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

      assert.equal(await page.locator('.langs').getAttribute('aria-label'),{
        zh:'选择页面语言',tw:'選擇頁面語言',en:'Choose page language'
      }[lang],'Incorrect language-selector accessible name');
      const sourceLinks=page.locator('.src-card a[data-source-url]');
      assert.equal(await sourceLinks.count(),7);
      const sourceNames=[];
      for(const link of await sourceLinks.all()){
        const sid=await link.getAttribute('data-source-url');
        const title=await page.locator('#source-'+sid+' h3').innerText();
        const aria=await link.getAttribute('aria-label');
        assert.ok(aria?.includes(sid) && aria.includes(title.slice(title.indexOf(' · ',title.indexOf(' · ')+3)+3)),
          'External link missing distinct source title '+sid+'/'+lang);
        sourceNames.push(aria);
      }
      assert.equal(new Set(sourceNames).size,7,'Seven source links need distinct names');

      const labels = {
        zh: ['6 个公开时点','7 组公开来源','不上传数据','当前时点已公开的资料','读者笔记与编辑参考解释','引用来源'],
        tw: ['6 個公開時點','7 組公開來源','不會上傳資料','目前時點已公開的資料','讀者筆記與編輯參考解釋','引用來源'],
        en: ['6 public checkpoints','7 documented sources','No data uploads','Public record at selected date','Reader notes and editorial interpretation','Cited source'],
      }[lang];
      for (const [selector,expected] of [
        ['#kicker-checkpoints',labels[0]],['#kicker-sources-label',labels[1]],['#kicker-uploads',labels[2]],
      ]) assert.equal(await page.locator(selector).innerText(),expected,'Untranslated visible label: '+selector+'/'+lang);
      assert.equal(await page.locator('#timeline').getAttribute('aria-label'),{
        zh:'依公开日期切换的六个时点',tw:'依公開日期切換的六個時點',en:'Six publication-date checkpoints'
      }[lang],'Untranslated timeline label '+lang);
      assert.equal(await page.locator('#record-panel').getAttribute('aria-label'),labels[3]);
      assert.equal(await page.locator('#notes-panel').getAttribute('aria-label'),labels[4]);
      assert.equal(await page.locator('#skip-workspace').innerText(),{
        zh:'跳到证据交互',tw:'跳至證據互動',en:'Skip to evidence interaction'
      }[lang]);
      const citations=page.locator('.article-language:not([hidden]) a[href^="#source-"]');
      assert.ok(await citations.count()>0,'Missing visible citations');
      for(const a of await citations.all()){
        const sid=(await a.getAttribute('href')).match(/S\d\d/)?.[0];
        assert.equal(await a.getAttribute('aria-label'),labels[5]+' '+sid,'Untranslated citation aria-label');
      }

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
  const keyboardPage=await browser.newPage();
  await keyboardPage.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});
  await keyboardPage.keyboard.press('Tab');
  assert.equal(await keyboardPage.evaluate(()=>document.activeElement?.id),'skip-workspace','First Tab does not reach skip link');
  await keyboardPage.keyboard.press('Enter');
  assert.equal(await keyboardPage.evaluate(()=>document.activeElement?.id),'workspace','Skip link does not focus workspace');
  await keyboardPage.close();
  const page=await browser.newPage();
  for (const [query,language] of [['?lang=en','en'],['?lang=zh-Hant','zh-Hant']]) {
    await page.goto(pathToFileURL(htmlPath).href+query,{waitUntil:'load'});
    assert.equal(await page.locator('html').getAttribute('lang'),language,'Language deep-link failed: '+query);
  }
  await page.close();
  console.log('F01 PASS: '+checked+' viewport×language cases, six dated source gates, SVGs, notes, keyboard, deep links');
} finally { await browser.close(); }
