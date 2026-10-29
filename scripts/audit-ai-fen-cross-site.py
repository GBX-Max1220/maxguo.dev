#!/usr/bin/env python3
"""Source-bound, non-republishing provenance comparison for Ai Fen archival copies.

Fetches only publicly accessible source documents. Outputs fingerprints, overlap
statistics and bounded difference classifications, never copyrighted full text.
Timestamp is a *fetch time*, NOT a claimed 2020 historical snapshot.
"""
import argparse
from datetime import datetime, timezone
import difflib
import hashlib
import json
from pathlib import Path
import re
import sys
import unicodedata

import requests
from bs4 import BeautifulSoup

TERMINUS_URL = (
    "https://raw.githubusercontent.com/Terminus2049/Terminus2049.github.io/"
    "8d630f148b0f2f0836c27add46f2a07987ac24ad/"
    "_posts/2020-03-10-fa-shao-zi-de-ren.md"
)
YYRW_URL = "https://yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256"
START = "接到武汉市中心医院急诊科主任艾芬同意采访的短信"

def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def normalize(s):
    # NFKC + spacing/punctuation normalization is an analytical transformation.
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("「", "“").replace("」", "”").replace("『", "‘").replace("』", "’")
    s = re.sub(r"\s+", "", s)
    return s

def fetch(session, url):
    response = session.get(url, timeout=(15, 45), headers={"User-Agent": "AiFenProvenanceAudit/1.0 (historical research; no redistribution)"})
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.content, response.text, response.url

def cut_main(raw, site):
    if site == "terminus":
        s = re.sub(r"^---[\s\S]*?---\s*", "", raw, count=1)
        s = re.sub(r"^!\[[^\n]*$", "", s, flags=re.MULTILINE)
        s = re.sub(r"(?m)^<[^>\n]+>\s*$", "", s)
        s = re.sub(r"(?m)^#{1,6}\s*", "", s)
        s = re.sub(r"(?m)^\s*\*\*([^*\n]+)\*\*\s*$", r"\1", s)
        preamble = raw.split(START, 1)[0]
        index = s.find(START)
        if index < 0: raise ValueError("Terminus main-text starting anchor missing")
        main = s[index:]
        metadata = {
            "title":"发哨子的人",
            "prefatory_line_present":False,
            "preamble_contains_role_credits":("摄影｜" in preamble or "**摄影｜**" in preamble),
            "source_type":"GitHub pinned archive markdown"
        }
        return main,metadata
    soup = BeautifulSoup(raw, "html.parser")
    for tag in soup(["script", "style", "noscript"]):tag.decompose()
    candidates = []
    for tag in soup.find_all(["article","section","div","td","body"]):
        text=tag.get_text("\n",strip=True)
        if START in normalize(text) and "活着就是好的" in normalize(text) and len(text)>3000:
            candidates.append((len(text),text))
    if not candidates: raise ValueError("No source article container containing expected beginning and section anchor")
    source=min(candidates,key=lambda x:x[0])[1]
    compact=normalize(source)
    marker=normalize(START)
    index=compact.find(marker)
    if index<0: raise ValueError("yyrw article marker absent after normalization")
    # Use the raw text at paragraph boundaries to avoid inventing content.
    line_candidates=source.splitlines()
    starts=[i for i,x in enumerate(line_candidates) if marker in normalize(x)]
    if not starts: raise ValueError("article start line not found")
    start_line=starts[0]
    main_lines=line_candidates[start_line:]
    # Remove only known source-attribution footer, not article paragraphs.
    ending=next((i for i,x in enumerate(main_lines) if "转载自《人物》" in x or "转载自《人物》" in normalize(x)),None)
    if ending is not None: main_lines=main_lines[:ending]
    main="\n".join(main_lines)
    meta={
        "title":"发哨子的人：如果这些医生都能够得到及时的提醒，或许就不会有这一天",
        "prefatory_line_present":"我爱我的祖国。" in source.split(START,1)[0]+source.split(START,1)[1][:20],
        "displayed_date":"2020-03-10",
        "source_type":"currently readable yyrw HTML page; no authenticated first edition"
    }
    return main,meta

def sentences(raw):
    s=normalize(raw)
    # Compare content after the first main-text anchor; split at Chinese sentence stops.
    # This is robust to different HTML paragraph wrappers, not an exact-text proof of origin.
    parts=[x for x in re.split(r"(?<=[。！？!?])",s) if x and len(x)>4]
    return parts

def run(out):
    session=requests.Session()
    blobs={}
    normalized={}
    for name,url in [("terminus",TERMINUS_URL),("yyrw",YYRW_URL)]:
        raw,txt,actual=fetch(session,url)
        if name=="yyrw" and "<html" not in txt.lower():
            raise ValueError("yyrw response is not HTML")
        main,meta=cut_main(txt,name)
        tokens=sentences(main)
        if len(tokens)<40: raise ValueError(f"Insufficient article text for {name}: only {len(tokens)} units")
        blobs[name]={"url":url,"actual_url":actual,"raw_sha256":hashlib.sha256(raw).hexdigest(),
          "raw_byte_count":len(raw),"article_normalized_sha256":sha(normalize(main)),
          "article_normalized_character_count":len(normalize(main)),
          "sentence_count":len(tokens),
          "metadata":meta}
        normalized[name]=tokens
    a,b=normalized["terminus"],normalized["yyrw"]
    sm=difflib.SequenceMatcher(a=a,b=b,autojunk=False)
    opcodes=sm.get_opcodes()
    blocks=[]
    for tag,i1,i2,j1,j2 in opcodes:
        if tag=="equal":continue
        blocks.append({
            "operation":tag,"terminus_unit_range":[i1,i2],"yyrw_unit_range":[j1,j2],
            "terminus_units":i2-i1,"yyrw_units":j2-j1,
            # Hashes rather than passages avoid republishing external copyright text.
            "terminus_block_sha256":sha("".join(a[i1:i2])),
            "yyrw_block_sha256":sha("".join(b[j1:j2]))
        })
    eq=sum(i2-i1 for tag,i1,i2,j1,j2 in opcodes if tag=="equal")
    r={"schema_version":"1.0","run_utc":datetime.now(timezone.utc).isoformat(),
       "status":"CURRENT_LIVE_SOURCE_COMPARISON_NOT_HISTORICAL_AUTHENTICATION",
       "sources":blobs,
       "method":{"unit":"NFKC-normalized, whitespace-removed Chinese sentence-like units",
           "algorithm":"difflib SequenceMatcher(autojunk=False)"},
       "comparison":{"terminus_units":len(a),"yyrw_units":len(b),
          "equal_units":eq,"matched_fraction_of_terminus":round(eq/len(a),6),
          "matched_fraction_of_yyrw":round(eq/len(b),6),
          "non_equal_blocks":len(blocks),
          "blocks":blocks},
       "limitations":[
         "This is a comparison of currently fetched derivative sources, NOT the original Renwu publication.",
         "Differences can reflect copy editing, HTML conversion, omissions, or later changes; no causal/editor attribution is inferred.",
         "HTML extraction is an analysis transform; fingerprint of normalized text is not raw source hash.",
         "A current fetch timestamp says nothing about first online availability in March 2020.",
         "The output contains no complete copyrighted article texts."
       ]}
    p=Path(out);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("CROSS_SITE_SUMMARY_JSON_START")
    print(json.dumps({**{k:v for k,v in r.items() if k not in ("comparison",)},
      "comparison":{k:v for k,v in r["comparison"].items() if k!="blocks"},
      "block_overview":[{"operation":d["operation"],"terminus_units":d["terminus_units"],"yyrw_units":d["yyrw_units"]} for d in blocks[:24]]},ensure_ascii=False))
    print("CROSS_SITE_SUMMARY_JSON_END")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",default=".astro/ai-fen-cross-site/summary.json")
    args=p.parse_args()
    try: run(args.out)
    except Exception as exc:
        print("CROSS_SITE_AUDIT_FAILED:",type(exc).__name__,str(exc)[:400],file=sys.stderr)
        raise
