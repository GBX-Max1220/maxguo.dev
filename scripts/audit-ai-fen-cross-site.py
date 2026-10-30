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
CDT_REPRINT_URL = "https://chinadigitaltimes.net/chinese/637830.html"
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
    if site == "cdt_reprint":
        soup = BeautifulSoup(raw, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        candidates = []
        for tag in soup.find_all(["article", "section", "div", "td", "body"]):
            text = tag.get_text("\n", strip=True)
            compact = normalize(text)
            if START in compact and "活着就是好的" in compact and "不能达到的幸福" in compact and len(text) > 5000:
                candidates.append((len(text), text))
        if not candidates:
            raise ValueError("CDT He Media reprint container not found")
        source = min(candidates, key=lambda x: x[0])[1]
        lines = source.splitlines()
        marker = normalize(START)
        starts = [i for i, line in enumerate(lines) if marker in normalize(line)]
        if not starts:
            raise ValueError("CDT reprint article opening anchor missing")
        main_lines = lines[starts[0]:]
        footer = next((i for i, line in enumerate(main_lines) if "CDT编辑注" in line or "责任编辑" in line), None)
        if footer is not None:
            main_lines = main_lines[:footer]
        title = soup.title.get_text(" ", strip=True) if soup.title else ""
        metadata = {
            "title": title[:180] if title else "人物｜发哨子的人",
            "displayed_date": "2020-03-10",
            "editor_note_says_original_deleted": "该文原文已被删除" in source,
            "editor_note_attributes_backup_to_he_media": "由合传媒备份存档" in source,
            "source_type": "CDT 404文库 reprint; editor note attributes preserved copy to He Media; not original WeChat bytes"
        }
        return "\n".join(main_lines), metadata
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
    unavailable_sources={}
    for name,url in [("terminus",TERMINUS_URL),("yyrw",YYRW_URL),("cdt_reprint",CDT_REPRINT_URL)]:
        try:
            raw,txt,actual=fetch(session,url)
            if name=="yyrw" and "<html" not in txt.lower():
                raise ValueError("yyrw response is not HTML")
            main,meta=cut_main(txt,name)
            tokens=sentences(main)
            if len(tokens)<40: raise ValueError(f"Insufficient article text for {name}: only {len(tokens)} units")
            blobs[name]={"url":url,"actual_url":actual,"raw_sha256":hashlib.sha256(raw).hexdigest(),
              "raw_byte_count":len(raw),"article_normalized_sha256":sha(normalize(main)),
              "article_normalized_character_count":len(normalize(main)),
              "sentence_count":len(tokens),"metadata":meta}
            normalized[name]=tokens
        except (requests.RequestException, ValueError) as exc:
            if name!="cdt_reprint":
                raise
            unavailable_sources[name]={
                "url":url,"status":"LOCATED_BUT_NOT_FETCHABLE_IN_CI",
                "error_type":type(exc).__name__,"details":str(exc)[:240],
                "note":"Not included in text comparisons; no content or editorial note is inferred."
            }
    def compare_tokens(left_name, right_name):
        left = normalized[left_name]
        right = normalized[right_name]
        matcher = difflib.SequenceMatcher(a=left, b=right, autojunk=False)
        ops = matcher.get_opcodes()
        equal = sum(i2-i1 for tag,i1,i2,j1,j2 in ops if tag=="equal")
        changed = []
        for tag,i1,i2,j1,j2 in ops:
            if tag=="equal":
                continue
            old = "".join(left[i1:i2])
            new = "".join(right[j1:j2])
            changes = []
            for kind,u1,u2,v1,v2 in difflib.SequenceMatcher(a=old,b=new,autojunk=False).get_opcodes():
                if kind=="equal":
                    continue
                x,y=old[u1:u2],new[v1:v2]
                changes.append({
                    "operation":kind,
                    "left_changed_chars":len(x),"right_changed_chars":len(y),
                    "left_short_fragment":x if len(x)<=14 else None,
                    "right_short_fragment":y if len(y)<=14 else None,
                    "left_fragment_sha256":sha(x),"right_fragment_sha256":sha(y)
                })
            changed.append({
                "operation":tag,"left_unit_range":[i1,i2],"right_unit_range":[j1,j2],
                "left_units":i2-i1,"right_units":j2-j1,"changed_fragments_only":changes
            })
        return {
            "left_source":left_name,"right_source":right_name,
            "left_units":len(left),"right_units":len(right),
            "equal_units":equal,
            "matched_fraction_left":round(equal/len(left),6),
            "matched_fraction_right":round(equal/len(right),6),
            "non_equal_blocks":len(changed),
            "differences":changed
        }

    pairwise_comparisons = {
        "terminus_vs_yyrw": compare_tokens("terminus","yyrw")
    }
    if "cdt_reprint" in normalized:
        pairwise_comparisons["cdt_reprint_vs_yyrw"] = compare_tokens("cdt_reprint","yyrw")
        pairwise_comparisons["cdt_reprint_vs_terminus"] = compare_tokens("cdt_reprint","terminus")
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
    # Only record the *changed spans*, not surrounding copyrighted prose.
    micro_differences=[]
    for tag,i1,i2,j1,j2 in opcodes:
        if tag=="equal":continue
        old="".join(a[i1:i2]);new="".join(b[j1:j2])
        char_blocks=[]
        for chtag,u1,u2,v1,v2 in difflib.SequenceMatcher(a=old,b=new,autojunk=False).get_opcodes():
            if chtag=="equal":continue
            x,y=old[u1:u2],new[v1:v2]
            char_blocks.append({
               "operation":chtag,
               "old_changed_character_count":len(x),"new_changed_character_count":len(y),
               "old_changed_fragment":x[:14] if len(x)<=14 else None,
               "new_changed_fragment":y[:14] if len(y)<=14 else None,
               "old_fragment_sha256":sha(x),"new_fragment_sha256":sha(y)
            })
        micro_differences.append({"old_unit_range":[i1,i2],"new_unit_range":[j1,j2],"char_changes":char_blocks})
    eq=sum(i2-i1 for tag,i1,i2,j1,j2 in opcodes if tag=="equal")
    optional_cdt_available = "cdt_reprint" in normalized
    r={"schema_version":"1.0","run_utc":datetime.now(timezone.utc).isoformat(),
       "status":("THREE_DERIVATIVE_TEXT_COMPARISON_NOT_ORIGINAL_PLATFORM_BYTES"
                 if optional_cdt_available else
                 "TWO_DERIVATIVE_TEXT_COMPARISON_CDT_REPRINT_NOT_FETCHABLE_IN_CI"),
       "sources":blobs,
       "unavailable_sources":unavailable_sources,
       "method":{"unit":"NFKC-normalized, whitespace-removed Chinese sentence-like units beginning at the same interview-opening anchor",
           "algorithm":"difflib SequenceMatcher(autojunk=False)",
           "sources":(["Pinned Terminus GitHub markdown","current yyrw HTML"] +
             (["CDT 404文库 reprint page"] if optional_cdt_available else []))},
       "pairwise_comparisons":pairwise_comparisons,
       "comparison":{"terminus_units":len(a),"yyrw_units":len(b),
          "equal_units":eq,"matched_fraction_of_terminus":round(eq/len(a),6),
          "matched_fraction_of_yyrw":round(eq/len(b),6),
          "non_equal_blocks":len(blocks),
          "blocks":blocks,"changed_fragments_only":micro_differences},
       "limitations":[
         "This is a comparison of currently fetched derivative/reprint sources, NOT the original Renwu WeChat bytes.",
         "If the optional CDT reprint is blocked, it is recorded as unavailable and excluded from comparisons; the remaining two-source audit continues.",
         "The CDT 404文库 page states that the original was deleted and that the copy was archived by He Media; this is an attributed derivative source, not independent proof of the original file.",
         "The CDT source may be textually dependent on the He Media copy and must not be counted as an independent original edition.",
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
      "pairwise_comparisons":{k:{kk:vv for kk,vv in v.items() if kk!="differences"} for k,v in pairwise_comparisons.items()},
      "block_overview":[{"operation":d["operation"],"terminus_units":d["terminus_units"],"yyrw_units":d["yyrw_units"]} for d in blocks[:24]],"changed_fragments_only":micro_differences},ensure_ascii=False))
    print("CROSS_SITE_SUMMARY_JSON_END")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",default=".astro/ai-fen-cross-site/summary.json")
    args=p.parse_args()
    try: run(args.out)
    except Exception as exc:
        print("CROSS_SITE_AUDIT_FAILED:",type(exc).__name__,str(exc)[:400],file=sys.stderr)
        raise
