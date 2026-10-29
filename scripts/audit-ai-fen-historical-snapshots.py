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
 "terminus":"https://terminus2049.github.io/archive/2020/03/10/fa-shao-zi-de-ren.html"
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

result={"schema_version":"1.0","checked_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "authority":"Internet Archive endpoints, queried live; archived captures not authenticated unless page body was readable",
 "results":results,"known_candidate_capture":attempt,"other_captured_pages":extra_checks,
 "limits":["A CDX match is indexed capture metadata and does not automatically establish article-body text without opening a capture.",
 "A blocked CDX/available endpoint is not a zero-captures result.",
 "No date displayed by today's source page is converted into a 2020 first-publication claim.",
 "The already-signed Terminus GitHub commit gives separate historical repository provenance."]}
p=pathlib.Path(".astro/ai-fen-history/wayback-check.json");p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print("WAYBACK_AUDIT_SUMMARY_BEGIN")
print(json.dumps({"known_candidate":attempt,
 "other_captures":[{"id":x["id"],"status":x["status"],"http_status":x.get("http_status"),"evidence_indicators":x.get("evidence_indicators")} for x in extra_checks],
 "queries":[{"id":a["id"],"results":[{"endpoint":z["endpoint"],"http_status":z.get("http_status"),
 "reported_capture":z.get("reported_capture"),"records_after_header":z.get("records_after_header"),
 "error":z.get("error")} for z in a["attempts"]]} for a in results]},ensure_ascii=False))
print("WAYBACK_AUDIT_SUMMARY_END")
