#!/usr/bin/env python3
"""Check candidate historic captures without mistaking current page dates for archived time.
Only outputs URL/status/capture metadata. No article text is republished.
"""
import argparse, datetime, hashlib, json, pathlib, requests
from urllib.parse import urlparse
TARGETS={
 "yyrw_http":"http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256",
 "yyrw_https":"https://yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256",
 "renwu_wechat":"https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg",
 "terminus":"https://terminus2049.github.io/archive/2020/03/10/fa-shao-zi-de-ren.html",
 "he_media_original_link":"https://www.21join.com/index.php?a=show&c=index&catid=9&id=2703&m=content"
}
session=requests.Session()
session.headers.update({"User-Agent":"AiFenHistoricalSourceAudit/1.0 (noncommercial research)"})
results=[]
for key,url in TARGETS.items():
 item={"id":key,"target_url":url,"attempts":[]}
 for endpoint,base,params in [
  ("wayback_available","https://archive.org/wayback/available",{"url":url,"timestamp":"20200310"}),
  ("cdx_2020","https://web.archive.org/cdx/search/cdx",{
     "url":url,"output":"json","filter":"statuscode:200","fl":"timestamp,original,statuscode,mimetype,digest","from":"2020","to":"2020","collapse":"timestamp:6"})
 ]:
  try:
   r=session.get(base,params=params,timeout=(8,17))
   rec={"endpoint":endpoint,"http_status":r.status_code,"queried_url":r.url,
        "response_mime":r.headers.get("Content-Type","").split(";")[0]}
   if r.status_code==200:
    try:
     obj=r.json()
     if endpoint=="wayback_available":
      near=obj.get("archived_snapshots",{}).get("closest") or {}
      rec["reported_capture"]={k:near.get(k) for k in ("timestamp","url","status","available")} if near else None
     else:
      rec["records_after_header"]=max(0,len(obj)-1) if isinstance(obj,list) else None
      rec["records_first_10"]=obj[1:11] if isinstance(obj,list) else None
    except ValueError: rec["error"]="Non-JSON response; no capture conclusion"
   else:rec["error"]="Endpoint unavailable; no absence inference"
   item["attempts"].append(rec)
  except requests.RequestException as exc:
   item["attempts"].append({"endpoint":endpoint,"error":type(exc).__name__,"details":str(exc)[:180],
     "conclusion":"NO_RESULT_NOT_ZERO_CAPTURES"})
 results.append(item)

# CDT 404文库 labels a 21join URL as the "original" link. Treat that label
# as a lead only; inspect any archived 21join captures before assigning provenance.
he_media_capture_checks=[]
he_media_result=next((x for x in results if x["id"]=="he_media_original_link"),None)
if he_media_result:
 cdx=next((x for x in he_media_result["attempts"] if x["endpoint"]=="cdx_2020"),{})
 rows=cdx.get("records_first_10") or []
 for row in rows[:8]:
  if len(row)<2:
   continue
  timestamp,original=row[0],row[1]
  capture_url=f"https://web.archive.org/web/{timestamp}/{original}"
  check={"timestamp":timestamp,"original_url":original,"capture_url":capture_url,
         "status":"UNVERIFIED"}
  try:
   resp=session.get(capture_url,timeout=(8,22))
   check.update({"http_status":resp.status_code,"final_url":resp.url,
                 "response_sha256":hashlib.sha256(resp.content).hexdigest(),
                 "content_type":resp.headers.get("Content-Type","").split(";")[0]})
   if resp.status_code==200:
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(resp.text,"html.parser")
    page_text=soup.get_text(" ",strip=True)
    title=soup.title.get_text(" ",strip=True) if soup.title else ""
    check["page_title"]=title[:160]
    check["body_characters"]=len(page_text)
    check["indicators"]={
      "title_fa_shao_zi":"发哨子的人" in page_text or "发哨子的人" in title,
      "title_chui_shao_zi":"吹哨子的人" in page_text or "吹哨子的人" in title,
      "ai_fen_name":"艾芬" in page_text,
      "interview_opening":"接到武汉市中心医院急诊科主任艾芬同意采访" in page_text,
      "source_byline":"龚菁琦" in page_text,
      "editor_byline":"金石" in page_text,
      "mentions_he_media":"合传媒" in page_text
    }
    check["status"]="ARTICLE_BODY_INDICATORS_PRESENT" if (
      check["indicators"]["interview_opening"] and check["indicators"]["ai_fen_name"]
    ) else "CAPTURE_OPENED_BUT_ARTICLE_BODY_NOT_CONFIRMED"
   else:
    check["status"]="CAPTURE_UNAVAILABLE_NOT_DISPROVEN"
  except requests.RequestException as exc:
   check.update({"status":"CAPTURE_UNAVAILABLE_NOT_DISPROVEN","error":type(exc).__name__})
  he_media_capture_checks.append(check)

# Known candidate discovered in earlier archival work; try it verbatim.
known="https://web.archive.org/web/20200310135052/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256"
attempt={"candidate_capture_url":known,"claimed_wayback_capture_utc":"2020-03-10T13:50:52Z",
         "status":"UNCHECKED"}
try:
 r=session.get(known,timeout=(8,22))
 attempt["http_status"]=r.status_code
 attempt["final_url"]=r.url
 attempt["content_type"]=r.headers.get("Content-Type","").split(";")[0]
 if r.status_code==200:
  txt=r.text
  attempt["contains_renwu_title"]="发哨子的人" in txt
  attempt["contains_article_opening"]="接到武汉市中心医院急诊科主任艾芬同意采访" in txt
  attempt["response_sha256"]=hashlib.sha256(r.content).hexdigest()
  attempt["status"]="PAGE_CONTENT_OBSERVED" if attempt["contains_renwu_title"] and attempt["contains_article_opening"] else "PAGE_200_BUT_EXPECTED_TEXT_NOT_SEEN"
 else:attempt["status"]="UNAVAILABLE_NOT_DISPROVEN"
except requests.RequestException as exc:
 attempt["status"]="UNAVAILABLE_NOT_DISPROVEN"
 attempt["error"]=type(exc).__name__

# Verify the previously indexed March 10 WeChat candidate and an early Terminus capture.
# A 200 status alone is insufficient: inspect article text, not just the toolbar.
extra_candidates=[
 ("renwu_wechat_20200310225825", "https://web.archive.org/web/20200310225825/https://mp.weixin.qq.com/s/nEy0jq5wjj-g6DQVZep1Wg"),
 ("terminus_20200310135935", "https://web.archive.org/web/20200310135935/https://terminus2049.github.io/archive/2020/03/10/fa-shao-zi-de-ren.html"),
 ("yyrw_20200311041923", "https://web.archive.org/web/20200311041923/http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256")
]
extra_checks=[]
for key,link in extra_candidates:
 item={"id":key,"candidate_capture_url":link,"status":"UNVERIFIED"}
 try:
  resp=session.get(link,timeout=(8,20))
  item.update({"http_status":resp.status_code,"final_url":resp.url,"response_sha256":hashlib.sha256(resp.content).hexdigest()})
  text=resp.text
  item["evidence_indicators"]={
   "title":"发哨子的人" in text,
   "long_opening":"接到武汉市中心医院急诊科主任艾芬同意采访" in text,
   "subject_self_description":"我不是吹哨人" in text,
   "narrative_heading":"前所未有的训斥" in text,
   "response_chars":len(text)
  }
  item["status"]="BODY_INDICATORS_PRESENT" if resp.status_code==200 and all(
   item["evidence_indicators"][k] for k in ["title","long_opening","subject_self_description","narrative_heading"]
  ) else "UNVERIFIED_OR_MISSING_BODY_INDICATORS"
 except requests.RequestException as exc:
  item.update({"status":"UNAVAILABLE_NOT_DISPROVEN","error":type(exc).__name__})
 extra_checks.append(item)


# Compare the actual 2020 Wayback yyrw article body with today's live yyrw.
# Normalization can remove presentation differences; retain both raw SHA fingerprints.
historic_text_comparison={"status":"NOT_RUN"}
try:
 import runpy,difflib
 helpers=runpy.run_path("scripts/audit-ai-fen-cross-site.py")
 normalize=helpers["normalize"];cut_main=helpers["cut_main"];sentences=helpers["sentences"]
 historic=session.get(known,timeout=(8,22));historic.raise_for_status()
 current=session.get("https://yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256",timeout=(8,22));current.raise_for_status()
 h,hm=cut_main(historic.text,"yyrw");c,cm=cut_main(current.text,"yyrw")
 ht=sentences(h);ct=sentences(c)
 o=difflib.SequenceMatcher(a=ht,b=ct,autojunk=False).get_opcodes()
 same=sum(i2-i1 for tag,i1,i2,j1,j2 in o if tag=="equal")
 changes=[]
 for tag,i1,i2,j1,j2 in o:
  if tag=="equal":continue
  old="".join(ht[i1:i2]);new="".join(ct[j1:j2])
  for ctg,a1,a2,b1,b2 in difflib.SequenceMatcher(a=old,b=new,autojunk=False).get_opcodes():
   if ctg=="equal":continue
   fragment_old=old[a1:a2];fragment_new=new[b1:b2]
   changes.append({"kind":ctg,"historic_fragment":fragment_old if len(fragment_old)<16 else None,
     "current_fragment":fragment_new if len(fragment_new)<16 else None,
     "historic_chars":len(fragment_old),"current_chars":len(fragment_new),
     "historic_sha256":hashlib.sha256(fragment_old.encode()).hexdigest(),
     "current_sha256":hashlib.sha256(fragment_new.encode()).hexdigest()})
 from bs4 import BeautifulSoup
 def title_evidence(response):
  soup=BeautifulSoup(response.text,"html.parser")
  meta=soup.title.get_text(" ",strip=True) if soup.title else None
  headings=[]
  for tag in soup.find_all(["h1","h2","h3"]):
   t=tag.get_text(" ",strip=True)
   if ("哨" in t or "武汉医生" in t) and len(t)<135:
    headings.append(t)
  return {"html_title":meta[:130] if meta else None,"article_heading_candidates":list(dict.fromkeys(headings))[:7]}
 hist_title=title_evidence(historic);current_title=title_evidence(current)
 historic_text_comparison={
   "status":"SUCCESS","historic_wayback_url":known,
   "historic_title_metadata":hist_title,"current_title_metadata":current_title,
   "historic_body_sha256":hashlib.sha256(normalize(h).encode("utf-8")).hexdigest(),
   "current_body_sha256":hashlib.sha256(normalize(c).encode("utf-8")).hexdigest(),
   "historic_sentence_units":len(ht),"current_sentence_units":len(ct),
   "equal_units":same,"different_blocks":sum(tag!="equal" for tag,*_ in o),"changed_fragments_only":changes,
   "equal_normalized_bodies":normalize(h)==normalize(c),
   "limitation":"HTML extraction and normalisation, not raw source bit equality or original Renwu issue"
 }
except Exception as exc:
 historic_text_comparison={"status":"UNVERIFIED","error":type(exc).__name__+":"+str(exc)[:180]}
# Report a small non-copyright teaser from the archived original-URL page to classify
# access error vs actual interview. Do not dump original copyrighted article.
for item in extra_checks:
 if item["id"]=="renwu_wechat_20200310225825" and item.get("http_status")==200:
  try:
   from bs4 import BeautifulSoup
   resp=session.get(item["candidate_capture_url"],timeout=(8,20))
   soup=BeautifulSoup(resp.text,"html.parser")
   page_text=soup.get_text(" ",strip=True)
   for marker in ["内容已被删除","此内容已被发布者删除","该内容已被发布者删除","内容因违规无法查看","该内容已被删除","无法查看","文章已被删除"]:
    item.setdefault("marker_checks",{})[marker]=marker in page_text
   item["page_title"]=(soup.title.get_text(" ",strip=True) if soup.title else "")[:110]
   item["visible_page_text_head"]=page_text[:150]
  except requests.RequestException as exc:item["page_classification_error"]=type(exc).__name__

result={"schema_version":"1.0","checked_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "authority":"Internet Archive endpoints, queried live; archived captures not authenticated unless page body was readable",
 "results":results,"he_media_original_link_captures":he_media_capture_checks,
 "known_candidate_capture":attempt,"other_captured_pages":extra_checks,"historic_vs_current_yyrw":historic_text_comparison,
 "limits":["A CDX match is indexed capture metadata and does not automatically establish article-body text without opening a capture.",
 "A blocked CDX/available endpoint is not a zero-captures result.",
 "No date displayed by today's source page is converted into a 2020 first-publication claim.",
 "The already-signed Terminus GitHub commit gives separate historical repository provenance."]}
p=pathlib.Path(".astro/ai-fen-history/wayback-check.json");p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print("WAYBACK_AUDIT_SUMMARY_BEGIN")
print(json.dumps({"he_media_original_link_query":next((x for x in results if x["id"]=="he_media_original_link"),None),
 "he_media_original_link_captures":he_media_capture_checks,
 "known_candidate":attempt,
 "other_captures":[{"id":x["id"],"status":x["status"],"http_status":x.get("http_status"),"evidence_indicators":x.get("evidence_indicators"),"marker_checks":x.get("marker_checks"),"page_title":x.get("page_title"),"visible_page_text_head":x.get("visible_page_text_head")} for x in extra_checks],
 "historic_vs_current_yyrw":historic_text_comparison,
 "queries":[{"id":a["id"],"results":[{"endpoint":z["endpoint"],"http_status":z.get("http_status"),
 "reported_capture":z.get("reported_capture"),"records_after_header":z.get("records_after_header"),
 "error":z.get("error")} for z in a["attempts"]]} for a in results]},ensure_ascii=False))
print("WAYBACK_AUDIT_SUMMARY_END")
