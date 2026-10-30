#!/usr/bin/env python3
"""Bounded Wayback audit of yyrw article-title history and homepage visibility.

Queries CDX for the exact article URL across 2020-2026 and plausible homepage
entry URLs in March-April 2020. Opens captures with the id_ modifier, records
only metadata/title/link indicators, and never republishes article body text.

A capture timestamp is when Wayback observed a representation, not the time
when the site edited or published it. Missing links in incomplete captures are
not evidence that the article was never promoted.
"""
import datetime
from datetime import timezone, timedelta
import hashlib
import json
import pathlib
import re
import time
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

CDX = "https://web.archive.org/cdx/search/cdx"
ARTICLE = "http://www.yyrw.org.cn/e/action/ShowInfo.php?classid=5&id=2256"
HOME_CANDIDATES = [
    "http://www.yyrw.org.cn/",
    "http://www.yyrw.org.cn",
    "https://www.yyrw.org.cn/",
    "https://www.yyrw.org.cn",
    "http://yyrw.org.cn/",
    "https://yyrw.org.cn/",
    "http://www.yyrw.org.cn/index.php",
    "https://www.yyrw.org.cn/index.php",
    "http://www.yyrw.org.cn/index.html",
]
ARTICLE_FROM = "20200301"
ARTICLE_TO = "20261231"
HOME_FROM = "20200301"
HOME_TO = "20200415"
MAX_ROWS_PER_QUERY = 250

session = requests.Session()
session.headers.update({
    "User-Agent": "AiFenHistoricalProvenanceAudit/1.1 (noncommercial research; metadata-only)"
})


def sha256(data):
    return hashlib.sha256(data).hexdigest()

def beijing_time(timestamp):
    try:
        dt = datetime.datetime.strptime(timestamp, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone(timedelta(hours=8))).isoformat()
    except (ValueError, TypeError):
        return None




def cdx(url, start, end):
    params = [
        ("url", url),
        ("matchType", "exact"),
        ("output", "json"),
        ("fl", "timestamp,original,statuscode,mimetype,digest,length"),
        ("from", start),
        ("to", end),
        ("limit", str(MAX_ROWS_PER_QUERY)),
    ]
    try:
        response = session.get(CDX, params=params, timeout=(10, 35))
        result = {
            "query_url": url,
            "window": [start, end],
            "http_status": response.status_code,
            "queried_endpoint": response.url,
        }
        if response.status_code != 200:
            result.update({
                "status": "CDX_UNAVAILABLE_NO_ABSENCE_INFERENCE",
                "error_excerpt": response.text[:180]
            })
            return result, []
        try:
            rows = response.json()
        except ValueError:
            result.update({
                "status": "CDX_NON_JSON_NO_ABSENCE_INFERENCE",
                "error_excerpt": response.text[:180]
            })
            return result, []
        if not isinstance(rows, list) or not rows:
            result.update({"status": "CDX_EMPTY_RESPONSE_UNVERIFIED"})
            return result, []
        header = rows[0]
        records = []
        for row in rows[1:]:
            if len(row) != len(header):
                continue
            records.append(dict(zip(header, row)))
        result.update({
            "status": "CDX_RESPONSE_PARSED",
            "records_returned": len(records),
            "possibly_truncated_at_limit": len(records) >= MAX_ROWS_PER_QUERY
        })
        return result, records
    except requests.RequestException as exc:
        return {
            "query_url": url, "window": [start, end],
            "status": "CDX_REQUEST_FAILED_NO_ABSENCE_INFERENCE",
            "error": type(exc).__name__, "details": str(exc)[:180]
        }, []


def capture_url(row):
    return "https://web.archive.org/web/" + row["timestamp"] + "id_/" + row["original"]


def title_class(title):
    if not title:
        return "TITLE_UNREADABLE"
    title = re.sub(r"\s+", "", title)
    if "吹哨子的人" in title:
        return "TITLE_BLOW_WHISTLE"
    if "发哨子的人" in title:
        return "TITLE_SEND_WHISTLE"
    return "OTHER_OR_UNCLEAR_TITLE"


def is_target_article(href, base):
    absolute = urljoin(base, href)
    parsed = urlparse(absolute)
    query = parse_qs(parsed.query)
    return (
        parsed.path.lower().endswith("/e/action/showinfo.php")
        and query.get("classid", [None])[0] == "5"
        and query.get("id", [None])[0] == "2256"
    )


def cdx_homepage_domain():
    params = [
        ("url", "yyrw.org.cn"),
        ("matchType", "domain"),
        ("output", "json"),
        ("fl", "timestamp,original,statuscode,mimetype,digest,length"),
        ("from", HOME_FROM),
        ("to", HOME_TO),
        ("filter", "statuscode:200"),
        ("filter", "mimetype:text/html"),
        ("filter", r"original:^https?://(www\.)?yyrw\.org\.cn/(?:index\.(?:php|html?|htm|asp|shtml)|default\.(?:php|html?|htm|asp|shtml))?/?(?:\?.*)?$"),
        ("limit", str(MAX_ROWS_PER_QUERY)),
    ]
    try:
        response = session.get(CDX, params=params, timeout=(10, 35))
        result = {
            "query_url": "yyrw.org.cn (domain match; homepage/index regex)",
            "window": [HOME_FROM, HOME_TO],
            "http_status": response.status_code,
            "queried_endpoint": response.url,
        }
        if response.status_code != 200:
            result.update({"status": "CDX_UNAVAILABLE_NO_ABSENCE_INFERENCE", "error_excerpt": response.text[:180]})
            return result, []
        try:
            rows = response.json()
        except ValueError:
            result.update({"status": "CDX_NON_JSON_NO_ABSENCE_INFERENCE", "error_excerpt": response.text[:180]})
            return result, []
        if not isinstance(rows, list) or not rows:
            result.update({"status": "CDX_EMPTY_RESPONSE_UNVERIFIED"})
            return result, []
        header = rows[0]
        records = [dict(zip(header, row)) for row in rows[1:] if len(row) == len(header)]
        result.update({
            "status": "CDX_RESPONSE_PARSED",
            "records_returned": len(records),
            "possibly_truncated_at_limit": len(records) >= MAX_ROWS_PER_QUERY
        })
        return result, records
    except requests.RequestException as exc:
        return {
            "query_url": "yyrw.org.cn (domain match; homepage/index regex)",
            "window": [HOME_FROM, HOME_TO],
            "status": "CDX_REQUEST_FAILED_NO_ABSENCE_INFERENCE",
            "error": type(exc).__name__,
            "details": str(exc)[:180]
        }, []


def inspect_capture(row, kind):
    archived = capture_url(row)
    item = {
        "timestamp_utc": row.get("timestamp"),
        "timestamp_beijing": beijing_time(row.get("timestamp")),
        "original_url": row.get("original"),
        "wayback_url": "https://web.archive.org/web/" + row.get("timestamp", "") + "/" + row.get("original", ""),
        "cdx_status": row.get("statuscode"),
        "cdx_mimetype": row.get("mimetype"),
        "cdx_digest": row.get("digest"),
        "cdx_length": row.get("length"),
        "capture_fetch_status": "NOT_FETCHED",
    }
    try:
        response = session.get(archived, timeout=(10, 25))
        item["capture_fetch_status"] = response.status_code
        item["response_content_type"] = response.headers.get("Content-Type", "").split(";")[0]
        item["response_sha256"] = sha256(response.content)
        if response.status_code != 200 or "html" not in item["response_content_type"].lower():
            item["inspection_status"] = "CAPTURE_NOT_READABLE_AS_HTML"
            return item
        soup = BeautifulSoup(response.content, "html.parser")
        title = soup.title.get_text(" ", strip=True) if soup.title else ""
        headings = []
        for tag in soup.find_all(["h1", "h2", "h3"]):
            text = tag.get_text(" ", strip=True)
            if text and ("哨" in text or "武汉医生" in text) and len(text) < 150:
                headings.append(text)
        item["page_title"] = title[:180] if title else None
        item["article_headline_candidates"] = list(dict.fromkeys(headings))[:8]
        item["title_class"] = title_class(title + " " + " ".join(headings))
        item["html_char_count"] = len(response.text)
        if kind == "article":
            item["article_opening_anchor_present"] = (
                "接到武汉市中心医院急诊科主任艾芬同意采访" in response.text
            )
            item["inspection_status"] = (
                "ARTICLE_BODY_INDICATORS_PRESENT"
                if item["article_opening_anchor_present"]
                else "TITLE_METADATA_READABLE_BODY_NOT_CONFIRMED"
            )
        else:
            links = []
            all_anchors = soup.find_all("a", href=True)
            for anchor_index, anchor in enumerate(all_anchors):
                if is_target_article(anchor["href"], response.url):
                    label = anchor.get_text(" ", strip=True)
                    if not label:
                        image = anchor.find("img")
                        label = (image.get("alt") or image.get("title") or "") if image else ""
                    ancestors = []
                    node = anchor.parent
                    for _ in range(4):
                        if node is None:
                            break
                        ancestors.append({
                            "tag": node.name,
                            "id": node.get("id"),
                            "class": node.get("class"),
                            "text_excerpt": node.get_text(" ", strip=True)[:220]
                        })
                        node = node.parent
                    links.append({
                        "anchor_index_zero_based": anchor_index,
                        "anchor_text": label[:160],
                        "href_path": urlparse(urljoin(response.url, anchor["href"])).path,
                        "ancestor_structure": ancestors
                    })
            body_text = soup.body.get_text(" ", strip=True) if soup.body else soup.get_text(" ", strip=True)
            item["direct_article_link_present"] = bool(links)
            item["article_link_indicators"] = links[:8]
            item["homepage_text_markers"] = {
                "contains_blow_title_phrase": "吹哨子的人" in body_text,
                "contains_send_title_phrase": "发哨子的人" in body_text,
                "contains_aifen_name": "艾芬" in body_text,
                "contains_article_opening_anchor": "接到武汉市中心医院急诊科主任艾芬同意采访" in body_text
            }
            item["anchor_count"] = len(all_anchors)
            item["script_count"] = len(soup.find_all("script"))
            item["body_present"] = soup.body is not None
            item["inspection_status"] = (
                "DIRECT_ARTICLE_LINK_OBSERVED"
                if links
                else "NO_DIRECT_LINK_IN_CAPTURED_HTML_NOT_PROOF_OF_NO_PROMOTION"
            )
        return item
    except requests.RequestException as exc:
        item.update({
            "capture_fetch_status": "REQUEST_FAILED",
            "inspection_status": "CAPTURE_UNAVAILABLE_NO_CONTENT_INFERENCE",
            "error": type(exc).__name__,
            "details": str(exc)[:180]
        })
        return item


def title_interval(observations):
    readable = [
        x for x in observations
        if x.get("title_class") in ("TITLE_BLOW_WHISTLE", "TITLE_SEND_WHISTLE")
        and x.get("inspection_status") in (
            "ARTICLE_BODY_INDICATORS_PRESENT",
            "TITLE_METADATA_READABLE_BODY_NOT_CONFIRMED"
        )
    ]
    readable.sort(key=lambda x: x["timestamp_utc"])
    old = [x for x in readable if x["title_class"] == "TITLE_BLOW_WHISTLE"]
    new = [x for x in readable if x["title_class"] == "TITLE_SEND_WHISTLE"]
    if not old or not new:
        return {
            "status": "INSUFFICIENT_DISTINCT_TITLE_CAPTURES",
            "readable_title_captures": len(readable),
            "blow_title_captures": len(old),
            "send_title_captures": len(new),
            "inference": "No transition interval can be bounded from this capture set."
        }
    last_old = old[-1]
    first_new = new[0]
    last_dt = datetime.datetime.strptime(last_old["timestamp_utc"], "%Y%m%d%H%M%S")
    first_dt = datetime.datetime.strptime(first_new["timestamp_utc"], "%Y%m%d%H%M%S")
    interval_hours = (first_dt - last_dt).total_seconds() / 3600
    if last_old["timestamp_utc"] >= first_new["timestamp_utc"]:
        status = "NON_MONOTONIC_TITLE_OBSERVATIONS"
    else:
        status = "OBSERVED_TRANSITION_INTERVAL"
    return {
        "status": status,
        "last_observed_blow_title_capture_utc": last_old["timestamp_utc"],
        "last_observed_blow_title_capture_beijing": beijing_time(last_old["timestamp_utc"]),
        "first_observed_send_title_capture_utc": first_new["timestamp_utc"],
        "first_observed_send_title_capture_beijing": beijing_time(first_new["timestamp_utc"]),
        "observed_interval_hours": round(interval_hours, 4),
        "interval": (
            "after " + last_old["timestamp_utc"] + " and on/before " + first_new["timestamp_utc"]
            if status == "OBSERVED_TRANSITION_INTERVAL"
            else "conflicting title classes occur out of order; inspect every capture manually"
        ),
        "old_capture_count": len(old),
        "new_capture_count": len(new),
        "inference_limit": "This bounds observed archive states, not the actual edit timestamp, editor, or motive."
    }


def main():
    article_query, article_rows = cdx(ARTICLE, ARTICLE_FROM, ARTICLE_TO)
    article_rows.sort(key=lambda x: x.get("timestamp", ""))
    article_obs = []
    seen = set()
    for row in article_rows:
        key = (row.get("timestamp"), row.get("original"))
        if key in seen:
            continue
        seen.add(key)
        if row.get("statuscode") != "200" or "html" not in row.get("mimetype", "").lower():
            continue
        article_obs.append(inspect_capture(row, "article"))
        time.sleep(0.2)

    homepage_queries = []
    homepage_rows = []
    for url in HOME_CANDIDATES:
        q, rows = cdx(url, HOME_FROM, HOME_TO)
        homepage_queries.append(q)
        homepage_rows.extend(rows)
        time.sleep(0.15)

    domain_query, domain_rows = cdx_homepage_domain()
    homepage_rows.extend(domain_rows)
    unique_home = {}
    for row in homepage_rows:
        key = (row.get("timestamp"), row.get("original"))
        unique_home[key] = row
    home_obs = []
    for row in sorted(unique_home.values(), key=lambda x: (x.get("timestamp", ""), x.get("original", ""))):
        if row.get("statuscode") != "200" or "html" not in row.get("mimetype", "").lower():
            continue
        home_obs.append(inspect_capture(row, "homepage"))
        time.sleep(0.2)

    direct_links = [x for x in home_obs if x.get("direct_article_link_present")]
    no_links = [x for x in home_obs if x.get("inspection_status") == "NO_DIRECT_LINK_IN_CAPTURED_HTML_NOT_PROOF_OF_NO_PROMOTION"]
    linked_sorted = sorted(direct_links, key=lambda x: x.get("timestamp_utc", ""))
    unlinked_sorted = sorted(no_links, key=lambda x: x.get("timestamp_utc", ""))
    if linked_sorted and unlinked_sorted and linked_sorted[-1]["timestamp_utc"] < unlinked_sorted[0]["timestamp_utc"]:
        homepage_state_interval = {
            "status": "OBSERVED_LINKED_THEN_UNLINKED_CAPTURE",
            "last_observed_homepage_link_capture_utc": linked_sorted[-1]["timestamp_utc"],
            "last_observed_homepage_link_capture_beijing": linked_sorted[-1].get("timestamp_beijing"),
            "first_observed_homepage_without_link_capture_utc": unlinked_sorted[0]["timestamp_utc"],
            "first_observed_homepage_without_link_capture_beijing": unlinked_sorted[0].get("timestamp_beijing"),
            "inference_limit": "The disappearance is bounded between two observed homepage representations; it does not identify the edit time, cause, editor, instruction recipient, or whether the missing link was a deliberate demotion."
        }
    else:
        homepage_state_interval = {
            "status": "INSUFFICIENT_OR_NON_MONOTONIC_HOME_SNAPSHOTS",
            "linked_captures": len(linked_sorted),
            "unlinked_captures": len(unlinked_sorted)
        }
    report = {
        "schema_version": "1.0",
        "checked_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "BOUNDED_CDX_AND_CAPTURE_INSPECTION",
        "scope": {
            "article_url": ARTICLE,
            "article_window": [ARTICLE_FROM, ARTICLE_TO],
            "homepage_candidates": HOME_CANDIDATES,
            "homepage_window": [HOME_FROM, HOME_TO],
            "max_rows_per_exact_query": MAX_ROWS_PER_QUERY
        },
        "article_title_history": {
            "cdx_query": article_query,
            "captures": article_obs,
            "observed_title_transition": title_interval(article_obs)
        },
        "homepage_history": {
            "cdx_queries": homepage_queries,
            "domain_level_homepage_query": domain_query,
            "unique_html_captures_inspected": len(home_obs),
            "observed_homepage_link_state_interval": homepage_state_interval,
            "captures_with_direct_article_link": len(direct_links),
            "captures_without_direct_article_link": len(no_links),
            "direct_link_observations": direct_links,
            "no_direct_link_observations": no_links,
            "inference_limit": "Homepage snapshots are only archived representations at individual capture times. A missing link may reflect incomplete capture, dynamic content, alternate homepage URL, or an actual absence; it does not by itself establish compliance or non-compliance with a homepage instruction."
        },
        "method_limits": [
            "CDX results can be incomplete, capped, or unavailable; a failed query is not zero captures.",
            "Wayback capture timestamps are archive observation times, not website edit times.",
            "Only exact candidate homepage URLs are queried; other homepage aliases may exist.",
            "A homepage capture does not prove continuous availability or the entire site's ranking state.",
            "No inference about who changed a title or why is made from temporal association.",
            "No full article text is stored in the report."
        ]
    }
    out = pathlib.Path(".astro/ai-fen-history/title-homepage-audit.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {
        "article_cdx_status": article_query.get("status"),
        "article_cdx_rows": article_query.get("records_returned"),
        "article_snapshots_inspected": len(article_obs),
        "article_titles": [{
            "timestamp_utc": x.get("timestamp_utc"),
            "title_class": x.get("title_class"),
            "page_title": x.get("page_title"),
            "inspection_status": x.get("inspection_status")
        } for x in article_obs],
        "observed_title_transition": report["article_title_history"]["observed_title_transition"],
        "homepage_queries": [{
            "query_url": x.get("query_url"),
            "status": x.get("status"),
            "records_returned": x.get("records_returned")
        } for x in homepage_queries],
        "homepage_domain_query": domain_query,
        "observed_homepage_link_state_interval": homepage_state_interval,
        "homepage_snapshots_inspected": len(home_obs),
        "homepage_direct_link_captures": [{
            "timestamp_utc": x.get("timestamp_utc"),
            "page_title": x.get("page_title"),
            "link_indicators": x.get("article_link_indicators")
        } for x in direct_links],
        "homepage_no_direct_link_count": len(no_links)
    }
    print("TITLE_HOMEPAGE_AUDIT_BEGIN")
    print(json.dumps(summary, ensure_ascii=False))
    print("TITLE_HOMEPAGE_AUDIT_END")


if __name__ == "__main__":
    main()
