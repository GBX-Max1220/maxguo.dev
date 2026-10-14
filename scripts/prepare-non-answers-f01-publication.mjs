/**
 * F01 stage-2 PUBLICATION PREPARATION ONLY.
 * Produces a release-shaped local artifact, NEVER writes to public/ or src/.
 * A separate owner-authorized commit is required to actually publish.
 */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

assert.deepEqual(process.argv.slice(2),['--preview'],'This tool only supports --preview; it has no publish/deploy/apply mode');
const sourceDir=resolve('dist/non-answers/cases/fengxian-evidence-2022');
const sourceIndex=resolve('dist/non-answers/index.html');
const root=resolve('.astro/f01-publication-preparation');
const caseDir=join(root,'non-answers/cases/fengxian-evidence-2022');
const caseUrl='https://gbx-max1220.github.io/maxguo.dev/non-answers/cases/fengxian-evidence-2022/';
const ogUrl=caseUrl+'assets/og-f01.png';
const relRoute='/maxguo.dev/non-answers/cases/fengxian-evidence-2022/';
const sources=[join(sourceDir,'index.html'),sourceIndex];
const before=sources.map(p=>readFileSync(p));
const caseHtml=before[0].toString('utf8');
const index=before[1].toString('utf8');
assert.match(caseHtml,/<meta name="robots" content="noindex,nofollow">/);
assert.ok(!caseHtml.includes('rel="canonical"'),'Draft must have no canonical');
assert.ok(!index.includes('id="f01-case-entry"'),'Draft main case list must not contain F01');
assert.ok(!index.includes(relRoute),'Draft main case list must be unlinked');
const basename=caseHtml.slice(0,caseHtml.indexOf('</head>'));
const legacyTitle='<title>一句“初步”，能断言多少？｜正确的废话 · F01 预发布版</title>';
const legacyDesc='<meta name="description" content="F01 丰县公开通报与后续证据的多语种可交互研究候选。尚未授权发布。">';
assert.ok(basename.includes(legacyTitle)&&basename.includes(legacyDesc));
const title='一句“初步”，能断言多少？｜正确的废话';
const desc='2022年丰县最初通报与后续调查、一审判决如何相互印证或冲突？按公开时点核对七组来源，区分当时所知与后来才公开的证据。';
const tags=[
  '<link rel="canonical" href="'+caseUrl+'">',
  '<meta name="author" content="Baixin Guo (Max)">',
  '<meta property="og:type" content="article">',
  '<meta property="og:site_name" content="正确的废话 · The Language of Non-Answers">',
  '<meta property="og:title" content="'+title+'">',
  '<meta property="og:description" content="'+desc+'">',
  '<meta property="og:url" content="'+caseUrl+'">',
  '<meta property="og:image" content="'+ogUrl+'">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta property="og:image:alt" content="F01 丰县公开通报与证据边界：独立研究封面">',
  '<meta property="og:locale" content="zh_CN">',
  '<meta property="og:locale:alternate" content="zh_TW">',
  '<meta property="og:locale:alternate" content="en_US">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:title" content="'+title+'">',
  '<meta name="twitter:description" content="'+desc+'">',
  '<meta name="twitter:image" content="'+ogUrl+'">'
].join('\n');
let prepared=caseHtml.replace(legacyTitle,'<title>'+title+'</title>')
 .replace(legacyDesc,'<meta name="description" content="'+desc+'">\n'+tags)
 .replace('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow,max-image-preview:large">');
assert.notEqual(prepared,caseHtml);
const dstart=prepared.indexOf('const D='),dend=prepared.indexOf(';\nlet lang=',dstart);
assert.ok(dstart>0&&dend>dstart);
const D=JSON.parse(prepared.slice(dstart+8,dend));
const published={
 zh:{badge:'F01 · 公开证据研究',status:'读者输入仅留在本页 · 不上传数据'},
 tw:{badge:'F01 · 公開證據研究',status:'讀者輸入只留在本頁 · 不上傳資料'},
 en:{badge:'F01 · Published evidence study',status:'Reader input stays on this page · No upload'}
};
for(const language of ['zh','tw','en'])Object.assign(D.labels[language],published[language]);
prepared=prepared.slice(0,dstart)+'const D='+JSON.stringify(D)+prepared.slice(dend);
prepared=prepared.replace('<span class="status" id="release-badge">F01 · 三语发布候选｜未上线</span>',
 '<span class="status" id="release-badge">F01 · 公开证据研究</span>');
assert.ok(!prepared.includes('尚未授权发布'));
assert.match(prepared,/property="og:image"/);
assert.match(prepared,/robots" content="index,follow/);
const styles=['<style id="f01-release-entry-styles">',
 '.f01-entry{margin-top:-18px;background:#edf0e7;border-color:#b7c7b6}',
 '.f01-entry .v18-eyebrow{color:#265948}',
 '.f01-locale{display:none}',
 'html[lang="en"] .f01-locale-en{display:inline}',
 'html[lang="zh-Hant"] .f01-locale-tw{display:inline}',
 'html:not([lang="en"]):not([lang="zh-Hant"]) .f01-locale-zh{display:inline}',
 '</style>'].join('\n');
const card=['<aside class="v18-case-entry f01-entry" id="f01-case-entry" aria-labelledby="f01-entry-heading">',
  '<div><span class="v18-eyebrow">FLAGSHIP EVIDENCE CASE · 2022–2023 · F01</span>',
  '<h3 id="f01-entry-heading" class="serif">',
  '<span class="f01-locale f01-locale-zh" lang="zh-CN">一句“初步”，能断言多少？</span>',
  '<span class="f01-locale f01-locale-tw" lang="zh-Hant">一句「初步」，能斷言多少？</span>',
  '<span class="f01-locale f01-locale-en" lang="en">How Much Can a “Preliminary” Finding Establish?</span>',
  '</h3><p>',
  '<span class="f01-locale f01-locale-zh">2022年丰县公开通报的证据边界：六个公开时点、七组来源，以及后续纠正。一篇独立研究，不并入2025年冻结样本。</span>',
  '<span class="f01-locale f01-locale-tw">2022年豐縣公開通報的證據邊界：六個公開時點、七組來源及後續更正。獨立研究，不併入2025年凍結樣本。</span>',
  '<span class="f01-locale f01-locale-en">A six-checkpoint, seven-source investigation of the Feng County 2022 statements, later corrections, and the limits of public evidence. Separate from the frozen 2025 corpus.</span>',
  '</p></div><div>',
  '<a class="v18-action f01-locale f01-locale-zh" id="f01-link-zh" href="'+relRoute+'">进入证据案例 ↗</a>',
  '<a class="v18-action f01-locale f01-locale-tw" id="f01-link-tw" href="'+relRoute+'?lang=zh-Hant">進入證據案例 ↗</a>',
  '<a class="v18-action f01-locale f01-locale-en" id="f01-link-en" href="'+relRoute+'?lang=en">Explore the evidence ↗</a>',
  '</div></aside>'].join('\n');
const anchor='<aside class="v18-case-entry" id="v18-case"';
assert.ok(index.includes(anchor));
const withEntry=index.replace(anchor,card+'\n'+anchor).replace('</head>',styles+'\n</head>');
assert.ok(withEntry.includes('id="f01-case-entry"'));
mkdirSync(join(caseDir,'assets'),{recursive:true});
mkdirSync(join(root,'non-answers'),{recursive:true});
writeFileSync(join(caseDir,'index.html'),prepared,'utf8');
writeFileSync(join(root,'non-answers/index.html'),withEntry,'utf8');

const poster='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>'
+'*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}'
+'body{font-family:"Noto Sans CJK SC","Noto Sans SC","Microsoft YaHei",sans-serif;background:#f6f2e8;color:#20322b}'
+'.poster{position:relative;width:1200px;height:630px;background:linear-gradient(132deg,#f8f5ed 0%,#e4ede5 100%);overflow:hidden}'
+'.accent{height:13px;background:#235747}.detail{position:absolute;right:-110px;top:40px;width:620px;height:620px;border:80px solid rgba(35,87,71,.08);border-radius:50%}'
+'.body{position:relative;margin:63px 80px;height:500px}.eyebrow{font-size:19px;letter-spacing:.13em;font-weight:700;color:#92582e}'
+'h1{font-family:"Noto Serif CJK SC","Songti SC",serif;font-size:77px;letter-spacing:-.04em;line-height:1.3;margin:34px 0 18px}'
+'.english{font-family:Georgia,serif;font-size:32px;color:#265747;margin:12px 0 24px}.sub{font-size:22px;color:#52665b}'
+'.foot{position:absolute;bottom:0;left:0;right:0;border-top:1px solid #b6c8b9;padding-top:18px;display:flex;justify-content:space-between;color:#395347;font-size:17px}'
+'</style><body><div class="poster"><div class="accent"></div><div class="detail"></div><div class="body">'
+'<div class="eyebrow">正确的废话 · FLAGSHIP EVIDENCE CASE / F01</div><h1>一句“初步”，<br>能断言多少？</h1>'
+'<div class="english">How Much Can a “Preliminary” Finding Establish?</div>'
+'<div class="sub">六个公开时点 · 七组来源 · 证据与纠正</div>'
+'<div class="foot"><span>Baixin Guo (Max) · Independent research</span><span>2022—2023 / F01</span></div>'
+'</div></div></body></html>';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.setContent(poster,{waitUntil:'load'});
 await page.evaluate(async()=>document.fonts.ready);
 await page.screenshot({path:join(caseDir,'assets/og-f01.png'),animations:'disabled'});
}finally{await browser.close()}
const png=readFileSync(join(caseDir,'assets/og-f01.png'));
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16),1200);
assert.equal(png.readUInt32BE(20),630);
assert.equal((prepared.match(/rel="canonical"/g)||[]).length,1);
assert.ok(prepared.includes(ogUrl));
assert.equal((withEntry.match(/id="f01-case-entry"/g)||[]).length,1);
for(let i=0;i<before.length;i++)assert.ok(readFileSync(sources[i]).equals(before[i]),'Draft source accidentally modified');
const report={
 state:'PREPARATION_ONLY_NEVER_PUBLISHED',
 mode:'--preview only; no --apply, deploy, merge, or public-file changes',
 route:relRoute,
 canonical:caseUrl,
 og_image:ogUrl,
 og_size:'1200x630',
 title,
 locale_deep_links:{zh:caseUrl,tw:caseUrl+'?lang=zh-Hant',en:caseUrl+'?lang=en'},
 generated:['non-answers/index.html','non-answers/cases/fengxian-evidence-2022/index.html','non-answers/cases/fengxian-evidence-2022/assets/og-f01.png'],
 source_sha256:sources.map(p=>createHash('sha256').update(readFileSync(p)).digest('hex')),
 warnings:[
  'These are build-time release previews under .astro, NOT actual public source pages or a deployed site.',
  'Release requires explicit owner approval and a new actual source commit.',
  'Generated release preview has indexable metadata; do not serve it on a public URL before approval.',
  'A single dynamic trilingual page uses one canonical; separate SEO-indexable language routes are not claimed.',
  'Independent English/Traditional/source and hands-on screen-reader sign-offs are still pending.'
 ]
};
writeFileSync(join(root,'PUBLICATION_PREPARATION_RECEIPT.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(join(root,'README_FIRST.txt'),
'F01 RELEASE PREPARATION ONLY. Not published. Do NOT deploy this generated indexable HTML.\n'
+'Source code remains noindex and unlinked. This ZIP is for editor review of future metadata, image and main-case entry.\n'
+'Approved case URL: '+caseUrl+'\nSitemap proposal on publication: '+caseUrl+'\n');
console.log('F01 publication preparation PASS: canonical / OG 1200x630 / 3-language entry / source unchanged / not published');
