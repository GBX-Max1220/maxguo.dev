#!/usr/bin/env python3
"""recompute_statistics.py — Level A: offline reproduction of every published number.

    python tools/recompute_statistics.py        (exit 0 = all identities hold)

Standard library only. Reads the two frozen audited inputs in data/audited/ and
independently recomputes, from the published participation rates and
participant-only durations:

  1. all-resident mean  =  participation rate / 100 x participant mean          (per sex, per domain)
  2. female - male gaps for paid, unpaid, the two combined, and discretionary
  3. the symmetric decomposition of each gap into a participation term and a
     duration term (an exact algebraic identity, not a causal model)
  4. rounding-only bounds implied by the published precision (whole minutes, 0.1 pp)
  5. the six-domain sum against 1440 minutes

Nothing here is copied from the page: the same quantities are computed a second way
by tools/parity_check.mjs, which imports js/derive.js — the very module the browser
runs. Two independent implementations agreeing to 1e-9 is the anti-drift gate.

Output: out/statistics_python.json
"""
from __future__ import annotations

import itertools
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
for _s in (sys.stdout, sys.stderr):          # Windows consoles default to cp936/GBK
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
DOMAINS = ("paid", "unpaid", "discretionary")
TOL_EXACT = 1e-9
TOL_AUDITED = 5e-4      # audited tables store 3 dp
TOL_BOUND = 1e-3        # published bounds are rounded to 3 dp

failures: list[str] = []
checks = 0


def check(name: str, ok: bool, detail: str = "") -> None:
    global checks
    checks += 1
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f"  -> {detail}" if detail else ""))
    if not ok:
        failures.append(name)


def main() -> int:
    dataset = json.loads((ROOT / "data/audited/dataset.json").read_text(encoding="utf-8"))
    gate2 = json.loads((ROOT / "data/audited/gate2_results.json").read_text(encoding="utf-8"))

    rec = {(r["group_id"], r["activity_id"]): r for r in dataset["records"]
           if r["group_id"] in ("male", "female") and r["activity_id"] in DOMAINS}

    # ---- 1. the definition of an all-resident average -----------------------
    means: dict[tuple[str, str], float] = {}
    for (sex, dom), r in sorted(rec.items()):
        p, t = float(r["participation_rate_pct"]), float(r["participant_mean_min"])
        derived = p / 100.0 * t
        means[(sex, dom)] = derived
        check(f"{sex}/{dom}: rate x participant-mean reproduces the audited value",
              abs(derived - float(r["all_resident_mean_min_approx"])) < TOL_EXACT,
              f"{p}% x {t} min = {derived:.3f}")

    # ---- 2. gaps (female - male, always in that direction) ------------------
    gaps = {dom: means[("female", dom)] - means[("male", dom)] for dom in DOMAINS}
    totals = {sex: means[(sex, "paid")] + means[(sex, "unpaid")] for sex in ("male", "female")}
    gaps["total"] = totals["female"] - totals["male"]

    audited_gaps = gate2["contrasts"]["female_minus_male"]
    for dom in ("paid", "unpaid", "discretionary"):
        check(f"gap {dom} matches the audited contrast table",
              abs(gaps[dom] - float(audited_gaps[dom])) < TOL_AUDITED,
              f"{gaps[dom]:+.3f} min/day (audited {audited_gaps[dom]:+.3f})")
    check("reversal holds: |unpaid gap| > |paid gap|, so the combined direction flips",
          abs(gaps["unpaid"]) > abs(gaps["paid"]) and gaps["total"] > 0 > gaps["paid"],
          f"paid {gaps['paid']:+.3f} -> combined {gaps['total']:+.3f}")
    check("combined gap equals the sum of the two component gaps",
          abs(gaps["total"] - (gaps["paid"] + gaps["unpaid"])) < TOL_EXACT)
    check("male total = paid + unpaid", abs(totals["male"] - 318.808) < 1e-3, f"{totals['male']:.3f}")
    check("female total = paid + unpaid", abs(totals["female"] - 344.686) < 1e-3, f"{totals['female']:.3f}")

    # ---- 3. symmetric decomposition (exact identity) ------------------------
    # f·t_f − m·t_m = (p_f − p_m)(t_f + t_m)/2 + (t_f − t_m)(p_f + p_m)/2
    decomp = {}
    audited_decomp = gate2["gender_gap_decomposition_noncausal"]
    for dom in DOMAINS:
        pf, tf = rec[("female", dom)]["participation_rate_pct"] / 100.0, float(rec[("female", dom)]["participant_mean_min"])
        pm, tm = rec[("male", dom)]["participation_rate_pct"] / 100.0, float(rec[("male", dom)]["participant_mean_min"])
        part_term = (pf - pm) * (tf + tm) / 2.0
        dur_term = (tf - tm) * (pf + pm) / 2.0
        decomp[dom] = {"gap_min": gaps[dom], "participation_term_min": part_term,
                       "duration_term_min": dur_term, "terms_sum_min": part_term + dur_term,
                       "residual_min": gaps[dom] - (part_term + dur_term)}
        check(f"decomposition {dom}: the two terms close the gap exactly",
              abs(part_term + dur_term - gaps[dom]) < TOL_EXACT,
              f"{part_term:+.3f} {dur_term:+.3f} = {part_term + dur_term:+.3f}")
        a = audited_decomp.get(dom) or audited_decomp.get(f"{dom}_min") or {}
        if isinstance(a, dict) and a:
            check(f"decomposition {dom} matches the audited table",
                  abs(part_term - float(a.get("participation_term_min", part_term))) < 1e-3
                  and abs(dur_term - float(a.get("duration_term_min", dur_term))) < 1e-3,
                  f"audited {a.get('participation_term_min')} / {a.get('duration_term_min')}")

    # ---- 4. rounding-only bounds (NOT a sampling confidence interval) -------
    bounds = {}
    for dom in ("paid", "unpaid", "discretionary"):
        corners = []
        for sex in ("male", "female"):
            r = rec[(sex, dom)]
            p, t = float(r["participation_rate_pct"]), float(r["participant_mean_min"])
            corners.append((sex, p, t))
        vals = []
        deltas = [(-0.05, -0.5), (-0.05, 0.5), (0.05, -0.5), (0.05, 0.5)]
        for (dpf, dtf), (dpm, dtm) in itertools.product(deltas, deltas):
            f = (corners[1][1] + dpf) / 100 * (corners[1][2] + dtf)
            m = (corners[0][1] + dpm) / 100 * (corners[0][2] + dtm)
            vals.append(f - m)
        bounds[dom] = {"point_estimate_min": round(gaps[dom], 3),
                       "published_rounding_only_lower_min": round(min(vals), 3),
                       "published_rounding_only_upper_min": round(max(vals), 3)}
    paid_lo = bounds["paid"]["published_rounding_only_lower_min"]
    paid_hi = bounds["paid"]["published_rounding_only_upper_min"]
    unpaid_lo = bounds["unpaid"]["published_rounding_only_lower_min"]
    unpaid_hi = bounds["unpaid"]["published_rounding_only_upper_min"]
    bounds["total_labor"] = {"point_estimate_min": round(gaps["total"], 3),
                             "published_rounding_only_lower_min": round(paid_lo + unpaid_lo, 3),
                             "published_rounding_only_upper_min": round(paid_hi + unpaid_hi, 3)}
    audited_bounds = gate2["rounding_only_gender_gaps_min"]
    for key in ("paid", "unpaid", "discretionary", "total_labor"):
        a, b = audited_bounds[key], bounds[key]
        check(f"rounding-only bounds reproduce the audited table for {key}",
              abs(a["published_rounding_only_lower_min"] - b["published_rounding_only_lower_min"]) < TOL_BOUND
              and abs(a["published_rounding_only_upper_min"] - b["published_rounding_only_upper_min"]) < TOL_BOUND,
              f"[{b['published_rounding_only_lower_min']:+.3f}, {b['published_rounding_only_upper_min']:+.3f}] "
              f"(audited [{a['published_rounding_only_lower_min']:+.3f}, {a['published_rounding_only_upper_min']:+.3f}])")
    check("bounds are labelled as rounding-only, never as sampling uncertainty",
          gate2.get("rounding_only_gender_gaps_min") is not None
          and any("Rounding-only" in x for x in gate2.get("limits", [])))

    # ---- 5. six-domain sum against one day ---------------------------------
    for c in dataset["audit"]["six_domain_checks"]:
        check(f"six-domain sum within 3 min: {c['group']}",
              abs(float(c["difference_from_1440_min"])) <= 3.0,
              f"{c['six_domain_sum_min_approx']:.3f} min (deviation {c['difference_from_1440_min']:+.3f})")

    OUT.mkdir(exist_ok=True)
    payload = {
        "schema": "china-time-use-2024/statistics-python/v1",
        "direction": "female minus male, minutes per day",
        "inputs": {
            "dataset.json": hashlib_sha("data/audited/dataset.json"),
            "gate2_results.json": hashlib_sha("data/audited/gate2_results.json"),
        },
        "means": {f"{s}_{d}": means[(s, d)] for (s, d) in means},
        "totals": totals,
        "gaps": gaps,
        "decomposition": decomp,
        "rounding_only_bounds": bounds,
        "display_rounded_gaps": {k: round1(v) for k, v in gaps.items()},
    }
    (OUT / "statistics_python.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8", newline="")

    print(f"\n{checks - len(failures)}/{checks} passed")
    print("wrote out/statistics_python.json")
    print("display values: paid " + f"{round1(gaps['paid']):+.1f}"
          + " · unpaid " + f"{round1(gaps['unpaid']):+.1f}"
          + " · combined " + f"{round1(gaps['total']):+.1f}"
          + " · discretionary " + f"{round1(gaps['discretionary']):+.1f}")
    if failures:
        print("FATAL: reproduction failed -> " + ", ".join(failures[:5]))
        return 1
    print("Level A reproduction: OK — next run: node tools/parity_check.mjs")
    return 0


def round1(v: float) -> float:
    return float(f"{v:.1f}")


def hashlib_sha(rel: str) -> str:
    import hashlib
    return hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()


if __name__ == "__main__":
    sys.exit(main())
