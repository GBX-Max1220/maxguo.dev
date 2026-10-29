import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const variants=[
 {lang:'zh-CN',page:'src/pages/critical-inquiry/six-clocks/index.md',built:'dist/critical-inquiry/six-clocks/index.html',
   label:'当被称为“谣言”的消息预测未来政策'},
 {lang:'en',page:'src/pages/critical-inquiry/six-clocks/en/index.md',built:'dist/critical-inquiry/six-clocks/en/index.html',
   label:'When a “Rumor” Predicts Future Policy'}
];
const essentialSources=[
 'https://news.sina.com.cn/o/2022-03-22/doc-imcwipih9980616.shtml',
 'https://www.xinhuanet.com/politics/2022-03/23/c_1128494505.htm',
 'https://www.yicai.com/news/101358444.html',
 'https://www.shanghai.gov.cn/sjzccs/20220327/613eda924f814a4ab4b25642f0e668c5.html',
 'https://www.xinhuanet.com/local/2022-03/31/c_1128521854.htm',
 'https://www.shanghai.gov.cn/nw9820/20220326/62e454513fbf4b37a48d9b9d769887ef.html',
 'https://www.thepaper.cn/newsDetail_forward_17315665',
 'https://www.thepaper.cn/newsDetail_forward_5402905',
 'https://www.xinhuanet.com/politics/2020-03/19/c_1125737457.htm',
 'https://news.sina.cn/gn/2020-03-19/detail-iimxyqwa1770303.d.html'
];
const layout=read('src/layouts/SixClocksPreviewLayout.astro');
const widget=read('src/components/SixClocksTimeLens.astro');
const css=read('src/styles/six-clocks-preview.css');
assert.match(layout,/noindex=\{false\}/,'approved release must not be noindex');
assert.match(layout,/NOT PEER REVIEWED|Not peer reviewed/,'missing explicit independence disclosure');
assert.match(layout,/mailto:gbx1220max@gmail.com/,'correction mechanism missing');
assert.match(layout,/PUBLIC CRITICAL ESSAY/,'missing released status');
assert.match(widget,/data-sixclocks-widget/);
assert.match(widget,/data-asof-select/);
assert.match(widget,/data-panel=/);
assert.match(widget,/panel.hidden|panel\.hidden/);
assert.match(widget,/2022-03-22/);
assert.match(widget,/2020-03-19/);
assert.match(css,/max-width:540px/,'missing mobile breakpoint');

for(const v of variants){
 const md=read(v.page);
 assert.ok(md.startsWith('---\nlayout: '),'Astro Markdown must use safe layout');
 assert.ok(md.includes('lang: '+v.lang));
 assert.ok(md.includes(v.label),'title was rewritten');
 assert.equal((md.match(/class="sc-section-anchor" id="clock-[1-6]"/g)||[]).length,6);
 assert.ok(md.includes('id="comparison"'),'missing cross-case navigation anchor');
 assert.ok(md.includes('独立第二人事实审核')||md.includes('not independently fact-audited'),'publication must disclose incomplete independent audit');
 assert.ok(!md.includes('![','image embed prohibited without copyright review'));
 assert.ok(md.includes('17:59:14'));
 for(const url of essentialSources)assert.ok(md.includes(url),'missing evidence source '+url+' in '+v.lang);
 if(v.lang==='zh-CN'){
  assert.ok(md.includes('两小时重叠'));
  assert.ok(md.includes('浦西重点区域继续封控管理'));
 }else{
  assert.ok(md.includes('overlapped by two hours'));
  assert.ok(md.includes('high-priority restricted areas'));
 }
 if(fs.existsSync(v.built)){
  const html=read(v.built);
  assert.ok(!html.includes('noindex,nofollow'),'released article must be indexable');
  assert.ok(html.includes('hreflang="zh-CN"')&&html.includes('hreflang="en"'));
  assert.ok(html.includes('data-sixclocks-widget'));
  assert.ok(html.includes('data-asof-select'));
  assert.ok(html.includes('PUBLIC CRITICAL ESSAY')||html.includes('已发表 · 独立批判性研究评论'));
  assert.ok(html.includes('/maxguo.dev/critical-inquiry/six-clocks/'),'built relative links must use Pages base');
  assert.ok(html.includes(v.label.replaceAll('“','&ldquo;').replaceAll('”','&rdquo;'))||html.includes(v.label),
    'heading missing from built page');
  for(const url of essentialSources)assert.ok(html.includes(url),'built page missing source '+url);
 }
}
for(const forbidden of [
 'src/pages/critical-inquiry/cases',
 'src/data/critical-inquiry/shanghai2022.json',
 'research/critical-inquiry/li-wenliang-2020/evidence-v01.json',
 'research/critical-inquiry/prototypes/dual-asof-comparison-v01.html'
])assert.ok(!fs.existsSync(forbidden),'unreviewed research material leaked to public preview branch: '+forbidden);
const zhHub=read('src/pages/critical-inquiry/index.astro');
const enHub=read('src/pages/critical-inquiry/en/index.astro');
assert.ok(zhHub.includes("href: '/critical-inquiry/six-clocks/'"),'Chinese public hub missing article card');
assert.ok(enHub.includes("href: '/critical-inquiry/six-clocks/en/'"),'English public hub missing article card');
assert.ok(zhHub.includes('非独立同行评审'),'Chinese hub must disclose review status');
assert.ok(enHub.includes('not independently peer reviewed'),'English hub must disclose review status');
if(fs.existsSync('dist/critical-inquiry/index.html')) {
 assert.ok(read('dist/critical-inquiry/index.html').includes('/maxguo.dev/critical-inquiry/six-clocks/'),'Chinese deployed index not linked');
 assert.ok(read('dist/critical-inquiry/en/index.html').includes('/maxguo.dev/critical-inquiry/six-clocks/en/'),'English deployed index not linked');
}
console.log('Six Clocks RELEASE source, bilingual, review-disclosure, indexability and public hub PASS.');
