import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=process.cwd();
const read=p=>fs.readFileSync(root+'/'+p,'utf8');
const z=read('research/critical-inquiry/editorial/six-clocks-zh-v03-freeze-candidate.md');
const e=read('research/critical-inquiry/editorial/six-clocks-en-v03-freeze-candidate.md');
const audit=read('research/critical-inquiry/editorial/SIX_CLOCKS_FINAL_EDITORIAL_ADJUDICATION_V03_20261030.md');
const evidence=JSON.parse(read('research/critical-inquiry/li-wenliang-2020/evidence-v01.json'));
const sixSections=(text,re)=>[...text.matchAll(re)].map(x=>x[1]);
assert.deepEqual(sixSections(z,/^## 第([一二三四五六])只时钟：/gm),['一','二','三','四','五','六']);
assert.deepEqual(sixSections(e,/^## ([1-6])\. The clock of/gm),['1','2','3','4','5','6']);

// Official 2022-03-27 notice states a two-hour overlap of nominal phases,
// with certain Puxi high-priority areas already controlled during phase one.
// This is a primary-source fact, not a guess at actual eventual release dates.
for(const [lang,body,start,end,overlap,prior] of [
  ['zh',z,'3月28日05:00','4月5日03:00','两小时重叠','浦西重点区域继续封控管理'],
  ['en',e,'March 28, 05:00','April 5, 03:00','overlapped by two hours','existing high-priority restricted areas']
]){
  assert.ok(body.includes(start),lang+' missing original March 27 planned phase-one start');
  assert.ok(body.includes(end),lang+' missing original March 27 planned phase-two end');
  assert.ok(body.includes(overlap),lang+' falsely implies disjoint phases');
  assert.ok(body.includes(prior),lang+' omits existing controls in Puxi before phase two');
}
assert.match(audit,/两批原定重叠2小时/,'editorial decision must register correction');

const pairedEvidence=[
 ['Shanghai early denial',/3月22日晚已出现媒体转述的权威辟谣/,/March 22, 23:21 press report/],
 ['Shanghai government statement',/08:10:40/,/08:10:40/],
 ['Shanghai police press time',/17:59:14/,/17:59:14/],
 ['January archive caveat',/11:36/,/11:36/],
 ['January first same-day republication',/18:53/,/18:53/],
 ['March 19 police revocation',/20:55/,/20:55/],
 ['March 19 officer discipline',/22:09/,/22:09/],
 ['Jiemian later edit',/19:58更新/,/19:58 update/],
];
for(const [name,zh,en] of pairedEvidence){
 assert.match(z,zh,'Chinese candidate missing: '+name);
 assert.match(e,en,'English candidate missing: '+name);
}
const links=text=>[...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(x=>x[1]);
const a=links(z),b=links(e);
for(const [lang,urls] of [['Chinese',a],['English',b]]){
 assert.ok(new Set(urls).size>=26,'insufficient public source anchors in '+lang);
 for(const url of urls) assert.ok(url.startsWith('https://'),'non-HTTPS source URL');
}
const essential=[
 'https://news.sina.com.cn/o/2022-03-22/doc-imcwipih9980616.shtml',
 'https://www.xinhuanet.com/politics/2022-03/23/c_1128494505.htm',
 'https://www.yicai.com/news/101358444.html',
 'https://www.shanghai.gov.cn/sjzccs/20220327/613eda924f814a4ab4b25642f0e668c5.html',
 'https://www.xinhuanet.com/local/2022-03/31/c_1128521854.htm',
 'https://www.shanghai.gov.cn/nw9820/20220326/62e454513fbf4b37a48d9b9d769887ef.html',
 'https://www.thepaper.cn/newsDetail_forward_17315665',
 'https://www.thepaper.cn/newsDetail_forward_5402905',
 'https://www.xinhuanet.com/politics/2020-03/19/c_1125737457.htm',
 'https://news.sina.cn/gn/2020-03-19/detail-iimxyqwa1770303.d.html',
 'https://www.xinhuanet.com/politics/2020-03/19/c_1125737967.htm'
];
for(const url of essential){
 assert.ok(a.includes(url),'missing key source in Chinese candidate: '+url);
 assert.ok(b.includes(url),'missing key source in English candidate: '+url);
}
assert.ok(!z.includes('官方开始公开定性的时间'),'known March22/23 ambiguity regressed');
assert.ok(!e.includes('first public denial on March 23'),'known March22/23 ambiguity regressed');
assert.match(z,/未经独立人类复核，未发布/);
assert.match(e,/not independently reviewed or published/);
assert.match(audit,/G3 INDEPENDENT HUMAN REVIEW:\*\* \*\*HOLD/);
assert.match(audit,/G4 RIGHTS\/PRIVACY\/TRANSLATION:\*\* \*\*HOLD/);
assert.match(audit,/G6 EDITORIAL APPROVAL:\*\* \*\*HOLD/);
const reviewPack=read('research/critical-inquiry/li-wenliang-2020/INDEPENDENT_REVIEW_PACK_V06_20261030.md');
// Human handoff must not reintroduce earlier archive-time and source-order mistakes.
for(const id of Array.from({length:16},(_,i)=>'LW'+String(i+1).padStart(2,'0')))
 assert.ok(reviewPack.includes('| '+id+' |'),'missing human review source row: '+id);
for(const id of ['SH-R1','SH-R2','SH-R3','SH-R4','SH-R5'])
 assert.ok(reviewPack.includes('| '+id+' |'),'missing Shanghai independent review item: '+id);
assert.ok(reviewPack.includes('原微博首发时刻未知'),'LW01 archive stamp falsely implies original release time');
assert.ok(reviewPack.includes('later than LW15 20:55'),'LW11 must not be called earliest revocation copy');
assert.ok(reviewPack.includes('两批**计划上重叠2小时**'),'Shanghai plans incorrectly presented as strictly disjoint');
assert.ok(reviewPack.includes('0/14 Li原子命题、0/5 上海问题'),'second-human signoffs must not be invented');
assert.ok(reviewPack.includes('G3 HOLD')&&reviewPack.includes('G4 HOLD')&&reviewPack.includes('G6 HOLD'));
const feb7=evidence.sources.find(x=>x.id==='LW03');
assert.equal(feb7.contemporaneous_crosscheck.url,
 'https://wenhui.whb.cn/zhuzhan/rd/20200207/321600.html');
assert.equal(feb7.contemporaneous_crosscheck.reported_official_website_time_local,
 '2020-02-07T03:57:55+08:00');
assert.match(feb7.contemporaneous_crosscheck.scope,/NOT authenticated archived first-edition/);
assert.ok(reviewPack.includes('2020-02-07 08:41:12'),'missing independent same-day publication crosscheck');
assert.ok(reviewPack.includes('不同于LW01'),'dangerous false equivalence between Feb7 and Jan1 archive pages');
assert.equal(evidence.sources.length,16);
assert.equal(new Set(evidence.sources.map(s=>s.independence_group)).size,9);
assert.equal(evidence.public_asof.length,13);
assert.equal(evidence.atomic_claims.length,14);
assert.equal(evidence.release_gates.G3_second_human_review,'HOLD');
assert.equal(evidence.release_gates.G6_editorial_approval,'HOLD');
assert.ok(!fs.existsSync(root+'/src/pages/critical-inquiry/six-clocks.astro'));
assert.ok(!fs.existsSync(root+'/src/pages/critical-inquiry/six-clocks/index.astro'));
console.log('Six Clocks v0.3 editorial freeze structure PASS (NOT historical fact certification nor publication approval).');
