#!/usr/bin/env node
/**
 * Validate a *fresh* Wayback audit against a frozen historical observation.
 * This never edits the evidence ledger or interprets archive failures as absence.
 *
 * Exit 0: required archived representations reproduced
 * Exit 2: incomplete/unavailable live observation (INCONCLUSIVE)
 * Exit 3: contradictory readable observation (DRIFT)
 */
import fs from 'node:fs';
import path from 'node:path';

const reportPath = process.argv[2] || '.astro/ai-fen-history/title-homepage-audit.json';
const frozenPath = 'research/critical-inquiry/ai-fen/title-homepage-cdx-v01.json';
const verdictPath = '.astro/ai-fen-history/reproduction-verdict.json';

function classify(run, frozen) {
  const inconclusive=[], drift=[], checked=[];
  const article = run?.article_title_history;
  const homepage = run?.homepage_history;
  if (!article || !homepage || !Array.isArray(article.captures) || !Array.isArray(homepage.captures ?? homepage.snapshots ?? [])) {
    inconclusive.push('Live output missing article or homepage capture arrays');
    return {status:'INCONCLUSIVE',checked,inconclusive,drift};
  }
  if (article.cdx_query?.status !== 'CDX_RESPONSE_PARSED') {
    inconclusive.push('Article CDX query was not parsed successfully');
  }
  const liveArticle = article.captures;
  const liveHomepage = homepage.captures ?? homepage.snapshots;
  const time = s => /^\d{14}$/.test(String(s||'')) ? String(s) : null;
  for(const [timestamp, , expected] of frozen.article_title_history.title_captures) {
    const live=liveArticle.find(c=>time(c.timestamp_utc)===timestamp);
    if(!live) {inconclusive.push('Article capture not recovered: '+timestamp);continue;}
    if(live.capture_fetch_status!==200 || !['ARTICLE_BODY_INDICATORS_PRESENT','TITLE_METADATA_READABLE_BODY_NOT_CONFIRMED'].includes(live.inspection_status)) {
      inconclusive.push('Article capture unreadable: '+timestamp);continue;
    }
    const observed=live.title_class==='TITLE_BLOW_WHISTLE'?'吹哨子的人':live.title_class==='TITLE_SEND_WHISTLE'?'发哨子的人':null;
    if(!observed){inconclusive.push('Article title class unreadable: '+timestamp);continue;}
    if(observed!==expected){drift.push('Article title changed for '+timestamp+': '+observed+' vs '+expected);}
    checked.push({kind:'article',timestamp,observed,expected});
  }
  // Frozen homepage captures have ISO UTC timestamps; dynamic output uses 14-digit UTC.
  const compact = iso => String(iso||'').replace(/[-:TZ]/g,'').slice(0,14);
  for(const expected of frozen.homepage_history.snapshots) {
    const timestamp=compact(expected.timestamp_utc);
    const live=liveHomepage.find(c=>time(c.timestamp_utc)===timestamp);
    if(!live){inconclusive.push('Homepage capture not recovered: '+timestamp);continue;}
    if(live.capture_fetch_status!==200 || live.body_present!==true ||
       !Number.isInteger(live.anchor_count) || live.anchor_count<1 ||
       !String(live.response_content_type||'').toLowerCase().includes('html')) {
      inconclusive.push('Homepage capture incomplete: '+timestamp);continue;
    }
    const observed=live.direct_article_link_present;
    if(typeof observed!=='boolean') {inconclusive.push('Homepage link state unreadable: '+timestamp);continue;}
    if(observed!==expected.direct_article_link_present) {
      drift.push('Homepage link state changed for '+timestamp+': '+observed+' vs '+expected.direct_article_link_present);
    }
    checked.push({kind:'homepage',timestamp,observed,expected:expected.direct_article_link_present,anchors:live.anchor_count});
  }
  // A failed or empty broad domain query is not "zero additional aliases".
  const aliasStatus=homepage.domain_level_homepage_query?.status || 'NOT_REPORTED';
  const limitations=[];
  if(aliasStatus!=='CDX_RESPONSE_PARSED') limitations.push('Domain alias search incomplete ('+aliasStatus+'); no absence inference');
  if((homepage.cdx_queries||[]).some(q=>q.status!=='CDX_RESPONSE_PARSED')) {
    limitations.push('One or more exact homepage-alias queries not fully parsed');
  }
  const status=drift.length?'DRIFT':inconclusive.length?'INCONCLUSIVE':'VERIFIED_BOUNDED';
  return {status,checked,inconclusive,drift,limitations,comparison_basis:'Captured representations only; no inferred edit times, intent, or command causation'};
}

function main(){
  let verdict;
  try {
    const run=JSON.parse(fs.readFileSync(reportPath,'utf8'));
    const frozen=JSON.parse(fs.readFileSync(frozenPath,'utf8'));
    verdict=classify(run,frozen);
  } catch(e) {
    verdict={status:'INCONCLUSIVE',checked:[],inconclusive:[e.message],drift:[]};
  }
  fs.mkdirSync(path.dirname(verdictPath),{recursive:true});
  fs.writeFileSync(verdictPath,JSON.stringify(verdict,null,2)+'\n');
  console.log(JSON.stringify({status:verdict.status,checked:verdict.checked.length,inconclusive:verdict.inconclusive,drift:verdict.drift,limitations:verdict.limitations},null,2));
  process.exitCode=verdict.status==='VERIFIED_BOUNDED'?0:verdict.status==='INCONCLUSIVE'?2:3;
}

if(process.argv.includes('--self-test')){
  const assert=(cond,msg)=>{if(!cond)throw Error(msg)};
  const f={article_title_history:{title_captures:[['20200310170954','', '吹哨子的人']]},
    homepage_history:{snapshots:[{timestamp_utc:'2020-03-10T19:06:34Z',direct_article_link_present:true}]}};
  const ok={article_title_history:{cdx_query:{status:'CDX_RESPONSE_PARSED'},captures:[{timestamp_utc:'20200310170954',capture_fetch_status:200,inspection_status:'ARTICLE_BODY_INDICATORS_PRESENT',title_class:'TITLE_BLOW_WHISTLE'}]},
    homepage_history:{captures:[{timestamp_utc:'20200310190634',capture_fetch_status:200,response_content_type:'text/html',body_present:true,anchor_count:125,direct_article_link_present:true}],cdx_queries:[]}};
  assert(classify(ok,f).status==='VERIFIED_BOUNDED','valid reproduction rejected');
  assert(classify({...ok,homepage_history:{...ok.homepage_history,captures:[]}},f).status==='INCONCLUSIVE','missing capture accepted');
  assert(classify({...ok,article_title_history:{...ok.article_title_history,captures:[{...ok.article_title_history.captures[0],title_class:'TITLE_SEND_WHISTLE'}]}},f).status==='DRIFT','title drift missed');
  assert(classify({...ok,homepage_history:{...ok.homepage_history,captures:[{...ok.homepage_history.captures[0],direct_article_link_present:false}]}},f).status==='DRIFT','link drift missed');
  assert(classify({...ok,article_title_history:{...ok.article_title_history,cdx_query:{status:'CDX_UNAVAILABLE_NO_ABSENCE_INFERENCE'}}},f).status==='INCONCLUSIVE','CDX outage accepted');
  console.log('Five live-audit regression scenarios passed.');
}else main();
